import {DatabaseSync} from 'node:sqlite';
import {constants, closeSync, lstatSync, openSync, realpathSync} from 'node:fs';
import {isIP} from 'node:net';
import path from 'node:path';

// User-authored feedback is kept separately from anonymous analytics.
const MAX_BODY=2048, MAX_CHARS=200, RETENTION_MS=30*86400000;
function send(res,status,value){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(value));
}
function readBody(req){return new Promise((resolve,reject)=>{
  const chunks=[];let size=0,large=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BODY)large=true;else chunks.push(chunk)});
  req.on('end',()=>{if(large)return reject(new Error('large'));try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('json'))}});
  req.on('error',reject);req.on('aborted',()=>reject(new Error('aborted')));
});}
function openDb(filename){
  try{const fd=openSync(filename,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW||0),0o600);closeSync(fd)}catch(e){if(e.code!=='EEXIST')throw e}
  const info=lstatSync(filename);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||(info.mode&0o077)!==0)throw new Error('invalid_feedback_db');
  const db=new DatabaseSync(filename);db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY, message TEXT NOT NULL, created_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback(created_at)');return db;
}
export function createProductionFeedbackApi({root,dbPath,publicOrigin}={}){
  if(!root||!path.isAbsolute(root)||!dbPath||!path.isAbsolute(dbPath))throw new Error('feedback_paths_required');
  const origin=new URL(publicOrigin);if(origin.protocol!=='https:'||origin.origin!==publicOrigin||origin.username||origin.password)throw new Error('invalid_public_origin');
  const parent=realpathSync(path.dirname(dbPath)),dir=lstatSync(parent);
  if(!dir.isDirectory()||(dir.mode&0o077)!==0)throw new Error('db_directory_must_be_private');
  dbPath=path.join(parent,path.basename(dbPath));
  const relative=path.relative(realpathSync(root),dbPath);
  if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('db_must_be_outside_release');
  let db=null,timer=null,lastCleanup=0,globalStart=0,globalCount=0;const rates=new Map();
  function cleanup(force=false){if(!db)return;const now=Date.now();if(!force&&now-lastCleanup<300000)return;db.prepare('DELETE FROM feedback WHERE created_at < ?').run(now-RETENTION_MS);lastCleanup=now}
  function database(){if(!db){db=openDb(dbPath);cleanup(true);timer=setInterval(()=>{try{cleanup()}catch{}},300000);timer.unref()}return db}
  // Reopen an existing store at startup, so expiration is enforced even when
  // there are no new submissions or owner visits after a service restart.
  try{lstatSync(dbPath);database()}catch(e){if(e.code!=='ENOENT')throw e}
  function allowedRate(ip){const now=Date.now();if(now-globalStart>=60000){globalStart=now;globalCount=0}if(++globalCount>500)return false;let item=rates.get(ip);if(!item||now-item.start>=60000){if(rates.size>=10000){for(const [k,v] of rates)if(now-v.start>=60000)rates.delete(k);if(rates.size>=10000)return false}item={start:now,count:0};rates.set(ip,item)}return ++item.count<=5}
  async function handle(req,res){
    const peer=req.socket?.remoteAddress;
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)||req.headers.host!==origin.host||req.headers['x-forwarded-proto']!=='https'||req.headers.origin!==publicOrigin||!['same-origin','none',undefined].includes(req.headers['sec-fetch-site']))return send(res,403,{error:'same_origin_only'});
    if(req.url!=='/api/feedback')return send(res,400,{error:'invalid_request'});
    const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
    if(!allowedRate(ip))return send(res,429,{error:'rate_limited'});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'method_not_allowed'})}
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
    const length=req.headers['content-length'];if(length!==undefined&&(!/^[0-9]+$/.test(String(length))||Number(length)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'})}
    let data;try{data=await readBody(req)}catch(e){return send(res,e.message==='large'?413:400,{error:e.message==='large'?'body_too_large':'invalid_json'})}
    if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==1||typeof data.message!=='string')return send(res,400,{error:'invalid_request'});
    const message=data.message.trim();
    if(!message||Array.from(message).length>MAX_CHARS||Buffer.byteLength(message,'utf8')>1200||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message))return send(res,400,{error:'invalid_message'});
    const d=database();cleanup();
    if(Number(d.prepare('SELECT COUNT(*) AS n FROM feedback').get().n)>=10000)return send(res,503,{error:'feedback_full'});
    d.prepare('INSERT INTO feedback(message,created_at) VALUES(?,?)').run(message,Date.now());
    return send(res,202,{ok:true});
  }
  return {
    middleware(req,res,next){if(String(req.url||'').split('?')[0]!=='/api/feedback')return next();void handle(req,res).catch(()=>{if(!res.headersSent)send(res,503,{error:'feedback_unavailable'});else res.destroy()})},
    list(){const d=database();cleanup();return {retentionDays:30,items:d.prepare('SELECT message,created_at FROM feedback WHERE created_at>=? ORDER BY created_at DESC,id DESC LIMIT 100').all(Date.now()-RETENTION_MS).map(row=>({message:row.message,createdAt:new Date(row.created_at).toISOString()}))}},
    close(){if(timer){clearInterval(timer);timer=null}if(db){db.close();db=null}rates.clear()}
  };
}
