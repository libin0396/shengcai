import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes} from 'node:crypto';
import {constants,closeSync,lstatSync,openSync,realpathSync} from 'node:fs';
import {isIP} from 'node:net';
import path from 'node:path';

const GAMES=new Set(['miniapp','video','education-ppt','books','brain','trends']);
const MAX_BODY=1024, TTL=7*86400000;
const NOTICE='玩家自报的模拟成绩，未经验证，可能被篡改，不代表真实收入或能力。';
const blocked=/(广告|赌博|博彩|诈骗|色情|微信|加微|客服|代购|贷款|傻逼|操你)/i;
function weekAt(time){
  const d=new Date(time+8*3600000);d.setUTCHours(0,0,0,0);
  d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  const y=d.getUTCFullYear(),first=new Date(Date.UTC(y,0,1));
  return y+'-'+String(Math.ceil((((d-first)/86400000)+1)/7)).padStart(2,'0');
}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
function body(req){return new Promise((resolve,reject)=>{let n=0,large=false;const parts=[];req.on('data',c=>{n+=c.length;if(n>MAX_BODY)large=true;else parts.push(c)});req.on('end',()=>{if(large)return reject(new Error('large'));try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')))}catch{reject(new Error('json'))}});req.on('error',reject);req.on('aborted',()=>reject(new Error('aborted')))});}
function hash(s){return createHash('sha256').update(s).digest('hex')}
function openDb(filename){
 try{const fd=openSync(filename,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW||0),0o600);closeSync(fd)}catch(e){if(e.code!=='EEXIST')throw e}
 const info=lstatSync(filename);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||(info.mode&0o077)!==0)throw new Error('invalid_database_file');
 const db=new DatabaseSync(filename);db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=3000;
 CREATE TABLE IF NOT EXISTS board(id TEXT PRIMARY KEY, game TEXT NOT NULL, week TEXT NOT NULL, nickname TEXT NOT NULL, persona INTEGER, tier INTEGER NOT NULL, profit INTEGER NOT NULL, choices TEXT, wild INTEGER, created_at INTEGER NOT NULL, delete_hash TEXT NOT NULL) WITHOUT ROWID;
 CREATE INDEX IF NOT EXISTS board_rank ON board(game,week,tier,profit DESC,created_at);
 CREATE INDEX IF NOT EXISTS board_expiry ON board(created_at);`);return db;
}
function validRecord(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['nickname','personaIndex','resultTier','profit','choices','wildIndex'].includes(k)))return false;
 if(typeof v.nickname!=='string'||![...v.nickname].length||[...v.nickname].length>8||!/^[-_·\p{L}\p{N}]+$/u.test(v.nickname)||blocked.test(v.nickname)||/\d{5}/.test(v.nickname))return false;
 if(!(v.personaIndex===null||(Number.isInteger(v.personaIndex)&&v.personaIndex>=0&&v.personaIndex<=23))||!Number.isInteger(v.resultTier)||v.resultTier<0||v.resultTier>5||!Number.isInteger(v.profit)||Math.abs(v.profit)>100000)return false;
 if(v.choices!==undefined&&(typeof v.choices!=='string'||!/^\d{1,20}$/.test(v.choices)))return false;
 if(v.wildIndex!==undefined&&(!Number.isInteger(v.wildIndex)||v.wildIndex<0||v.wildIndex>100))return false;
 return true;
}
export function createProductionBoardApi({root,dbPath,publicOrigin}={}){
 if(!root||!dbPath||!path.isAbsolute(dbPath))throw new Error('board_db_path_required');
 const origin=new URL(publicOrigin);if(origin.protocol!=='https:'||origin.origin!==publicOrigin||origin.username||origin.password)throw new Error('invalid_public_origin');
 const parent=realpathSync(path.dirname(dbPath)),dir=lstatSync(parent);if(!dir.isDirectory()||(dir.mode&0o077)!==0)throw new Error('db_directory_must_be_private');
 dbPath=path.join(parent,path.basename(dbPath));const rel=path.relative(realpathSync(root),dbPath);if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw new Error('db_must_be_outside_release');
 let db=null,timer=null,lastCleanup=0,totalStart=0,totalCount=0;const rates=new Map();
 function cleanup(){if(!db)return;const now=Date.now();if(now-lastCleanup<300000)return;db.prepare('DELETE FROM board WHERE id IN (SELECT id FROM board WHERE created_at < ? LIMIT 500)').run(now-TTL);lastCleanup=now;}
 function database(){if(!db){db=openDb(dbPath);timer=setInterval(()=>{try{cleanup()}catch{}},300000);timer.unref()}cleanup();return db;}
 function rate(ip,method){const now=Date.now();if(now-totalStart>=60000){totalStart=now;totalCount=0}if(++totalCount>5000)return false;const key=ip+':'+(method==='POST'?'write':'read');let slot=rates.get(key);if(!slot||now-slot.t>=60000){if(rates.size>=10000){for(const [k,v] of rates)if(now-v.t>=60000)rates.delete(k);if(rates.size>=10000)return false}slot={t:now,n:0};rates.set(key,slot)}return ++slot.n<=(method==='POST'?3:120)}
 function entries(game,week){return database().prepare('SELECT id,nickname,persona AS personaIndex,tier AS resultTier,profit,choices,wild AS wildIndex,created_at AS createdAt FROM board WHERE game=? AND week=? AND created_at>=? ORDER BY tier ASC,profit DESC,created_at ASC,id ASC LIMIT 20').all(game,week,Date.now()-TTL).map((r,i)=>({...r,rank:i+1}));}
 function total(game,week){return Number(database().prepare('SELECT count(*) AS n FROM board WHERE game=? AND week=? AND created_at>=?').get(game,week,Date.now()-TTL).n)}
 async function handle(req,res,m){
  const peer=req.socket?.remoteAddress,method=req.method;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)||req.headers.host!==origin.host||req.headers['x-forwarded-proto']!=='https'||(req.headers.origin&&req.headers.origin!==publicOrigin)||(['POST','DELETE'].includes(method)&&req.headers.origin!==publicOrigin)||!['same-origin','none',undefined].includes(req.headers['sec-fetch-site']))return send(res,403,{error:'same_origin_only'});
  const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
  if(!rate(ip,method))return send(res,429,{error:'rate_limited'});
  const [,game,week,id]=m;const nowWeek=weekAt(Date.now()),previousWeek=weekAt(Date.now()-TTL);
  if(!GAMES.has(game)||(week!==nowWeek&&(method!=='DELETE'||week!==previousWeek)))return send(res,404,{error:'board_unavailable'});
  if(method==='GET'&&!id)return send(res,200,{game,week,total:total(game,week),entries:entries(game,week),notice:NOTICE});
  if(!((method==='POST'&&!id)||(method==='DELETE'&&id))){res.setHeader('Allow',id?'DELETE':'GET, POST');return send(res,405,{error:'method_not_allowed'});}
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
  const size=req.headers['content-length'];if(size!==undefined&&(!/^\d+$/.test(String(size))||Number(size)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'})}
  let data;try{data=await body(req)}catch(e){return send(res,e.message==='large'?413:400,{error:'invalid_request'})}
  if(method==='DELETE'){
   if(!/^[a-f0-9]{32}$/.test(id)||!data||Object.keys(data).length!==1||typeof data.deleteToken!=='string'||!/^[a-f0-9]{64}$/.test(data.deleteToken))return send(res,400,{error:'invalid_request'});
   const result=database().prepare('DELETE FROM board WHERE id=? AND game=? AND week=? AND delete_hash=? AND created_at>=?').run(id,game,week,hash(data.deleteToken),Date.now()-TTL);
   return result.changes?send(res,200,{deleted:true}):send(res,404,{error:'not_found'});
  }
  if(!validRecord(data))return send(res,400,{error:'invalid_request'});
  const id2=randomBytes(16).toString('hex'),token=randomBytes(32).toString('hex'),now=Date.now(),db=database();
  db.prepare('INSERT INTO board(id,game,week,nickname,persona,tier,profit,choices,wild,created_at,delete_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id2,game,week,data.nickname,data.personaIndex,data.resultTier,data.profit,data.choices||null,data.wildIndex??null,now,hash(token));
  const rank=Number(db.prepare('SELECT COUNT(*) AS n FROM board WHERE game=? AND week=? AND created_at>=? AND (tier<? OR (tier=? AND (profit>? OR (profit=? AND (created_at<? OR (created_at=? AND id<=?))))))').get(game,week,now-TTL,data.resultTier,data.resultTier,data.profit,data.profit,now,now,id2).n);
  return send(res,201,{rank,total:total(game,week),entryId:id2,deleteToken:token,notice:NOTICE});
 }
 return {middleware(req,res,next){const url=String(req.url||'').split('?')[0];if(!url.startsWith('/api/board/'))return next();const m=/^\/api\/board\/([a-z0-9-]+)\/(\d{4}-\d{2})(?:\/([a-f0-9]+))?$/.exec(url);if(!m)return send(res,404,{error:'not_found'});void handle(req,res,m).catch(()=>{if(!res.headersSent)send(res,503,{error:'board_unavailable'});else res.destroy()})},close(){if(timer){clearInterval(timer);timer=null}if(db){db.close();db=null}lastCleanup=0}};
}
