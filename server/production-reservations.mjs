import {DatabaseSync} from 'node:sqlite';
import {createHash, randomBytes} from 'node:crypto';
import {constants, closeSync, lstatSync, mkdirSync, openSync, realpathSync} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {isIP} from 'node:net';

// Production-only anonymous reservation API behind a trusted loopback proxy.
const DEFAULT_ROOT=fileURLToPath(new URL('../',import.meta.url));
const DIRECTIONS=new Set(['voyage-agent','voyage-miniapp','voyage-secondbrain','voyage-office','voyage-enterprise']);
const ARTICLE=/^article:([0-9]{1,30})$/;
const COOKIE='__Host-ainpe_reservation';
const MAX_BODY=1024;
const MAX_FEED=8*1024*1024;

function requestAllowed(req, publicOrigin){
  const peer=req.socket?.remoteAddress;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer))return false;
  const expected=new URL(publicOrigin);
  if(req.headers.host!==expected.host || req.headers['x-forwarded-proto']!=='https')return false;
  const origin=req.headers.origin;
  if(req.method==='POST' && origin!==publicOrigin)return false;
  if(origin && origin!==publicOrigin)return false;
  const site=req.headers['sec-fetch-site'];
  return !site||site==='same-origin'||site==='none';
}
function tokenFrom(req){
  const parts=String(req.headers.cookie||'').split(';');
  for(const part of parts){
    const pos=part.indexOf('=');
    if(pos<0||part.slice(0,pos).trim()!==COOKIE)continue;
    const value=part.slice(pos+1).trim();
    if(/^[A-Za-z0-9_-]{43}$/.test(value))return value;
  }
  return '';
}
function digest(token){return createHash('sha256').update(token,'utf8').digest('hex');}
function issued(db, token){if(!token)return false;const row=db.prepare('SELECT created_at FROM sessions WHERE browser_hash=?').get(digest(token));if(!row)return false;const created=Date.parse(row.created_at);return Number.isFinite(created)&&created<=Date.now()&&Date.now()-created<31536000000;}
function session(req,res,db){
  let token=tokenFrom(req);
  if(!issued(db,token)){
    token=randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions(browser_hash,created_at) VALUES(?,?)').run(digest(token),new Date().toISOString());
    res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=31536000`);
  }
  return digest(token);
}
function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(payload));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let size=0,tooLarge=false;const chunks=[];
    req.on('data',chunk=>{
      size+=chunk.length;
      if(size>MAX_BODY){tooLarge=true;return;}
      chunks.push(chunk);
    });
    req.on('end',()=>{
      if(tooLarge){reject(new Error('too_large'));return;}
      try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(new Error('invalid_json'));}
    });
    req.on('error',()=>reject(new Error('read_failed')));
    req.on('aborted',()=>reject(new Error('read_failed')));
  });
}
async function readArticleIds(root){
  const ids=new Set();let readable=0;
  for(const filename of [path.join(root,'data','live-feed.json'),path.join(root,'src','knowledge.json')]){
    try{
      const details=await stat(filename);
      if(!details.isFile()||details.size>MAX_FEED)continue;
      const value=JSON.parse(await readFile(filename,'utf8'));
      if(!Array.isArray(value?.articles))continue;
      readable++;
      for(const item of value.articles){
        const id=item?.id;
        if(typeof id==='string'&&/^[0-9]{1,30}$/.test(id))ids.add(id);
      }
    }catch{/* Missing or invalid inputs fail closed for article IDs. */}
  }
  if(!readable)throw new Error('article_source_unavailable');
  return ids;
}
function createDb(filename){
  mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});
  try{
    const fd=openSync(filename,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600);
    closeSync(fd);
  }catch(error){if(error.code!=='EEXIST')throw error;}
  const info=lstatSync(filename);
  if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1)throw new Error('invalid_database_file');
  const db=new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS sessions (browser_hash TEXT PRIMARY KEY, created_at TEXT NOT NULL) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON sessions(created_at);
    CREATE TABLE IF NOT EXISTS reservations (
      project_id TEXT NOT NULL,
      browser_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(project_id,browser_hash)
    ) WITHOUT ROWID;`);
  return db;
}

/**
 * Anonymous browser-scoped reservations.
 * A record is not a verified person, contact, signup, or official enrollment.
 * isProjectAllowed(projectId) can be injected for isolated tests.
 */
export function createProductionReservationApi({root=DEFAULT_ROOT, dbPath, publicOrigin, isProjectAllowed}={}){
  if(!dbPath || !path.isAbsolute(dbPath))throw new Error('reservation_db_path_required');
  const origin=new URL(publicOrigin);
  if(origin.protocol!=='https:' || origin.origin!==publicOrigin || origin.username || origin.password)throw new Error('invalid_public_origin');
  // The database must never be served or overwritten with a release checkout.
  const parent=realpathSync(path.dirname(dbPath));
  const dir=lstatSync(parent);if(!dir.isDirectory() || (dir.mode & 0o077)!==0)throw new Error('db_directory_must_be_private');
  dbPath=path.join(parent,path.basename(dbPath));
  const relative=path.relative(realpathSync(root),dbPath);
  if(relative==='' || (!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('db_must_be_outside_release');
  const ipRate=new Map(), sessionRate=new Map(); let totalWindow=0,totalCount=0;
  function within(map,key,limit,now){
    let slot=map.get(key);
    if(!slot || now-slot.t>=60000){
      if(map.size>=10000){for(const [k,v] of map)if(now-v.t>=60000)map.delete(k);if(map.size>=10000)return false;}
      slot={t:now,n:0};map.set(key,slot);
    }
    return ++slot.n<=limit;
  }
  function allowedRate(ip,token){
    const now=Date.now();if(now-totalWindow>=60000){totalWindow=now;totalCount=0;}if(++totalCount>5000)return false;
    return within(ipRate,ip,120,now) && (!token || within(sessionRate,digest(token),40,now));
  }
  let db=null;
  const database=()=>{if(!db)db=createDb(path.resolve(dbPath));return db;};
  const close=()=>{if(db){db.close();db=null;}};
  // Opportunistic and bounded: on traffic, remove at most 500 expired
  // sessions every five minutes. Reservation records remain untouched.
  let lastCleanup=0;
  function pruneExpiredSessions(database){
    const now=Date.now();if(now-lastCleanup<300000)return;
    const cutoff=new Date(now-31536000000).toISOString();
    database.prepare('DELETE FROM sessions WHERE browser_hash IN (SELECT browser_hash FROM sessions WHERE created_at < ? ORDER BY created_at LIMIT 500)').run(cutoff);
    lastCleanup=now;
  }
  async function permitted(projectId){
    if(typeof projectId!=='string'||projectId.length>64)return false;
    if(!DIRECTIONS.has(projectId)&&!ARTICLE.test(projectId))return false;
    if(typeof isProjectAllowed==='function')return Boolean(await isProjectAllowed(projectId));
    if(DIRECTIONS.has(projectId))return true;
    const match=ARTICLE.exec(projectId);
    return (await readArticleIds(root)).has(match[1]);
  }
  function counts(){
    const rows=database().prepare('SELECT project_id, COUNT(*) AS count FROM reservations GROUP BY project_id').all();
    return Object.fromEntries(rows.map(row=>[row.project_id,Number(row.count)]));
  }
  function mine(browserHash){
    return database().prepare('SELECT project_id FROM reservations WHERE browser_hash=? ORDER BY project_id').all(browserHash).map(row=>row.project_id);
  }
  async function handle(req,res,pathname){
    if(!requestAllowed(req,publicOrigin))return send(res,403,{error:'same_origin_only'});
    const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
    const tok=tokenFrom(req);if(!allowedRate(ip,tok))return send(res,429,{error:'rate_limited'});
    if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(res,405,{error:'method_not_allowed'});}
    if(req.method==='GET'){
      const db=database();pruneExpiredSessions(db);
      const browserHash=session(req,res,db);
      return send(res,200,{counts:counts(),mine:mine(browserHash),countUnit:'browser'});
    }
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
    const declared=req.headers['content-length'];
    if(declared!==undefined&&(!/^[0-9]+$/.test(String(declared))||Number(declared)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'});}
    let body;
    try{body=await readBody(req);}catch(error){return send(res,error.message==='too_large'?413:400,{error:error.message==='too_large'?'body_too_large':'invalid_json'});}
    if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'projectId')||typeof body.projectId!=='string')return send(res,400,{error:'invalid_request'});
    let allowed=false;
    try{allowed=await permitted(body.projectId);}catch{return send(res,503,{error:'project_list_unavailable'});}
    if(!allowed)return send(res,404,{error:'project_not_available'});
    const db=database();
    if(!issued(db,tok))return send(res,428,{error:'initialize_session'});
    const browserHash=digest(tok);
    db.exec('BEGIN IMMEDIATE');
    try{
      db.prepare('INSERT OR IGNORE INTO reservations(project_id,browser_hash,created_at) VALUES(?,?,?)').run(body.projectId,browserHash,new Date().toISOString());
      const count=Number(db.prepare('SELECT COUNT(*) AS count FROM reservations WHERE project_id=?').get(body.projectId).count);
      db.exec('COMMIT');
      return send(res,200,{projectId:body.projectId,count,reserved:true,countUnit:'browser'});
    }catch{try{db.exec('ROLLBACK');}catch{}return send(res,503,{error:'reservation_unavailable'});}
  }
  const middleware=(req,res,next)=>{
    const pathname=String(req.url||'').split('?')[0];
    if(pathname!=='/api/reservations')return next();
    void handle(req,res,pathname).catch(()=>{if(!res.headersSent)send(res,503,{error:'reservation_unavailable'});else res.destroy();});
  };
  return {middleware,close};
}

