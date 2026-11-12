import {DatabaseSync} from 'node:sqlite';
import {constants, closeSync, lstatSync, openSync, realpathSync} from 'node:fs';
import {isIP} from 'node:net';
import path from 'node:path';

// Anonymous, rate-limited aggregate counts and explicitly submitted messages;
// no IP or search text is stored.
// This endpoint does not authenticate callers as WeChat users. Its data is
// approximate event counts and can be affected by repeated or forged requests.
const CATEGORIES=new Set(['drama','video','office','content','education','other']);
const MAX_BODY=2048, DAY=86400000, RETENTION_DAYS=30;
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))}
function readBody(req){return new Promise((resolve,reject)=>{const chunks=[];let size=0,large=false;req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BODY)large=true;else chunks.push(chunk)});req.on('end',()=>{if(large)return reject(new Error('large'));try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('json'))}});req.on('error',reject);req.on('aborted',()=>reject(new Error('aborted')))});}
function openDb(filename){
  try{const fd=openSync(filename,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW||0),0o600);closeSync(fd)}catch(e){if(e.code!=='EEXIST')throw e}
  const info=lstatSync(filename);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||(info.mode&0o077)!==0)throw new Error('invalid_mini_feedback_db');
  const db=new DatabaseSync(filename);db.exec(`PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS daily_counts(day INTEGER NOT NULL, kind TEXT NOT NULL, value TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(day,kind,value));
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, message TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS mini_messages_created ON messages(created_at);`);return db;
}
export function createProductionMiniFeedbackApi({root,dbPath,publicOrigin}={}){
  if(!root||!path.isAbsolute(root)||!dbPath||!path.isAbsolute(dbPath))throw new Error('mini_feedback_paths_required');
  const origin=new URL(publicOrigin);if(origin.protocol!=='https:'||origin.origin!==publicOrigin||origin.username||origin.password)throw new Error('invalid_public_origin');
  const parent=realpathSync(path.dirname(dbPath)),dir=lstatSync(parent);
  if(!dir.isDirectory()||(dir.mode&0o077)!==0)throw new Error('db_directory_must_be_private');
  dbPath=path.join(parent,path.basename(dbPath));
  const relative=path.relative(realpathSync(root),dbPath);
  if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('db_must_be_outside_release');
  let db=null,timer=null,lastCleanup=0,totalStart=0,totalCount=0;const rates=new Map();
  function cleanup(force=false){if(!db)return;const now=Date.now();if(!force&&now-lastCleanup<300000)return;db.prepare('DELETE FROM daily_counts WHERE day < ?').run(Math.floor(now/DAY)-(RETENTION_DAYS-1));db.prepare('DELETE FROM messages WHERE created_at < ?').run(now-RETENTION_DAYS*DAY);lastCleanup=now}
  function database(){if(!db){db=openDb(dbPath);cleanup(true);timer=setInterval(()=>{try{cleanup()}catch{}},300000);timer.unref()}return db}
  try{lstatSync(dbPath);database()}catch(e){if(e.code!=='ENOENT')throw e}
  function rate(ip,kind){const now=Date.now();if(now-totalStart>=60000){totalStart=now;totalCount=0}if(kind==='request'&&++totalCount>500)return false;let slot=rates.get(ip);if(!slot||now-slot.start>=60000){if(rates.size>=10000){for(const [k,v] of rates)if(now-v.start>=60000)rates.delete(k);if(rates.size>=10000)return false}slot={start:now,request:0,search:0,feedback:0,message:0};rates.set(ip,slot)}return ++slot[kind]<=(kind==='feedback'||kind==='message'?5:kind==='search'?30:40)}
  async function handle(req,res){
    const peer=req.socket?.remoteAddress,requestOrigin=req.headers.origin,fetchSite=req.headers['sec-fetch-site'];
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)||req.headers.host!==origin.host||req.headers['x-forwarded-proto']!=='https'||(requestOrigin!==undefined&&!['https://servicewechat.com',publicOrigin].includes(requestOrigin))||(!['same-origin','none',undefined].includes(fetchSite)&&!(fetchSite==='cross-site'&&requestOrigin===undefined&&/^https:\/\/servicewechat\.com\/wx64bff577b112626f\/(?:devtools|[0-9]+)\/page-frame\.html$/.test(String(req.headers.referer||'')))))return send(res,403,{error:'trusted_proxy_required'});
    if(req.url!=='/api/mini-feedback')return send(res,400,{error:'invalid_request'});
    const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
    if(!rate(ip,'request'))return send(res,429,{error:'rate_limited'});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'method_not_allowed'})}
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
    const length=req.headers['content-length'];if(length!==undefined&&(!/^[0-9]+$/.test(String(length))||Number(length)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'})}
    let data;try{data=await readBody(req)}catch(e){return send(res,e.message==='large'?413:400,{error:e.message==='large'?'body_too_large':'invalid_json'})}
    if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==2||!['search','feedback','message'].includes(data.kind)||typeof data.value!=='string')return send(res,400,{error:'invalid_request'});
    if(data.kind==='search'&&!['hit','miss'].includes(data.value))return send(res,400,{error:'invalid_request'});
    if(data.kind==='feedback'&&!CATEGORIES.has(data.value))return send(res,400,{error:'invalid_request'});
    if(data.kind==='message'&&(!data.value.trim()||Array.from(data.value.trim()).length>200||Buffer.byteLength(data.value.trim(),'utf8')>1200||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.value)))return send(res,400,{error:'invalid_request'});
    if(!rate(ip,data.kind))return send(res,429,{error:'rate_limited'});
    const d=database();cleanup();
    if(data.kind==='message'){
      if(Number(d.prepare('SELECT COUNT(*) AS n FROM messages').get().n)>=10000)return send(res,503,{error:'feedback_full'});
      d.prepare('INSERT INTO messages(message,created_at) VALUES(?,?)').run(data.value.trim(),Date.now());
    }else d.prepare('INSERT INTO daily_counts(day,kind,value,count) VALUES(?,?,?,1) ON CONFLICT(day,kind,value) DO UPDATE SET count=count+1').run(Math.floor(Date.now()/DAY),data.kind,data.value);
    return send(res,202,{ok:true});
  }
  function summary(){
    try{if(!db)lstatSync(dbPath)}catch(e){if(e.code==='ENOENT')return null;throw e}
    const d=database();cleanup();const rows=d.prepare('SELECT kind,value,SUM(count) AS count FROM daily_counts WHERE day>=? GROUP BY kind,value').all(Math.floor(Date.now()/DAY)-(RETENTION_DAYS-1));
    const counts={hit:0,miss:0},categories={};for(const row of rows){if(row.kind==='search'&&Object.hasOwn(counts,row.value))counts[row.value]=Number(row.count);else if(row.kind==='feedback'&&CATEGORIES.has(row.value))categories[row.value]=Number(row.count)}
    return {retentionDays:RETENTION_DAYS,searches:counts,categories};
  }
  function listMessages(){
    try{if(!db)lstatSync(dbPath)}catch(e){if(e.code==='ENOENT')return [];throw e}
    const d=database();cleanup();return d.prepare('SELECT message,created_at FROM messages WHERE created_at>=? ORDER BY created_at DESC,id DESC LIMIT 100').all(Date.now()-RETENTION_DAYS*DAY).map(row=>({message:'【小程序意见】'+row.message,createdAt:new Date(row.created_at).toISOString()}));
  }
  return {middleware(req,res,next){if(String(req.url||'').split('?')[0]!=='/api/mini-feedback')return next();void handle(req,res).catch(()=>{if(!res.headersSent)send(res,503,{error:'feedback_unavailable'});else res.destroy()})},summary,listMessages,close(){if(timer)clearInterval(timer);if(db)db.close();rates.clear()}};
}
