import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {constants, closeSync, lstatSync, openSync, realpathSync} from 'node:fs';
import {isIP} from 'node:net';
import path from 'node:path';

// A bounded, same-origin event log. Raw IPs, URLs, user-entered content and
// browser identifiers are never written to the database.
const EVENTS = new Set(['site_view', 'sim_start', 'sim_finish', 'camp_view', 'camp_join_click', 'share_open', 'share_save', 'challenge_open', 'replay_same_seed', 'versus_finish', 'versus_share', 'board_view', 'board_join', 'board_share', 'outbound_click', 'contact_copy']);
const TARGETS = new Set(['camp', 'join', 'source', 'event']);
const SOURCES = new Set(['article', 'camp', 'result', 'mine', 'home', 'home_bar', 'event', 'header']);
const ID = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const DEVICE = /^[a-f0-9]{32}$/;
const MAX_BODY = 1024;
const FIELDS = new Set(['event', 'page', 'from', 'game', 'tier', 'played', 'ts', 'did', 'target']);

function send(res, status, value) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(value));
}
function body(req) {
  return new Promise((resolve, reject) => {
    const chunks=[]; let size=0, tooLarge=false;
    req.on('data', chunk => { size+=chunk.length; if(size>MAX_BODY) tooLarge=true; else chunks.push(chunk); });
    req.on('end', () => { if(tooLarge)return reject(new Error('too_large')); try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('invalid_json'))} });
    req.on('error', reject); req.on('aborted', () => reject(new Error('aborted')));
  });
}
function valid(v) {
  if(!v || typeof v!=='object' || Array.isArray(v) || Object.keys(v).some(k=>!FIELDS.has(k)))return false;
  if(!EVENTS.has(v.event) || !DEVICE.test(v.did || '') || !Number.isSafeInteger(v.ts) || Math.abs(Date.now()-v.ts)>86400000)return false;
  if(typeof v.played!=='boolean')return false;
  if(v.event==='outbound_click') { if(!TARGETS.has(v.target) || !SOURCES.has(v.from))return false; }
  else if(v.target!==undefined)return false;
  if(v.event==='contact_copy' && !SOURCES.has(v.from))return false;
  return ['page','from','game','tier'].every(k=>v[k]===undefined || (typeof v[k]==='string' && ID.test(v[k])));
}
function openDb(filename) {
  try { const fd=openSync(filename,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW||0),0o600);closeSync(fd); }
  catch(e){if(e.code!=='EEXIST')throw e;}
  const info=lstatSync(filename);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||(info.mode&0o077)!==0)throw new Error('invalid_database_file');
  const db=new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY, event TEXT NOT NULL, page TEXT, source TEXT, game TEXT, tier TEXT,
      played INTEGER NOT NULL, created_at INTEGER NOT NULL, device_hash TEXT NOT NULL, target TEXT
    );
    CREATE INDEX IF NOT EXISTS event_created_idx ON events(created_at);`);
  if(!db.prepare('PRAGMA table_info(events)').all().some(column=>column.name==='target'))db.exec('ALTER TABLE events ADD COLUMN target TEXT');
  return db;
}
export function createProductionTrackingApi({root,dbPath,publicOrigin}={}) {
  if(!root||!dbPath||!path.isAbsolute(dbPath))throw new Error('tracking_db_path_required');
  const origin=new URL(publicOrigin);
  if(origin.protocol!=='https:'||origin.origin!==publicOrigin||origin.username||origin.password)throw new Error('invalid_public_origin');
  const parent=realpathSync(path.dirname(dbPath));
  const dir=lstatSync(parent);if(!dir.isDirectory()||(dir.mode&0o077)!==0)throw new Error('db_directory_must_be_private');
  dbPath=path.join(parent,path.basename(dbPath));
  const relative=path.relative(realpathSync(root),dbPath);
  if(relative==='' || (!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('db_must_be_outside_release');
  let db=null, cleanupTimer=null, lastCleanup=0, totalStart=0, totalCount=0;const rates=new Map();
  function cleanup(){
    if(!db)return;
    const now=Date.now();if(now-lastCleanup<300000)return;
    db.prepare('DELETE FROM events WHERE id IN (SELECT id FROM events WHERE created_at < ? LIMIT 500)').run(now-90*86400000);
    lastCleanup=now;
  }
  function rate(ip) {
    const now=Date.now();if(now-totalStart>=60000){totalStart=now;totalCount=0;}if(++totalCount>5000)return false;
    let slot=rates.get(ip);if(!slot||now-slot.t>=60000){
      if(rates.size>=10000){for(const [k,v] of rates)if(now-v.t>=60000)rates.delete(k);if(rates.size>=10000)return false;}
      slot={t:now,n:0};rates.set(ip,slot);
    }
    return ++slot.n<=120;
  }
  async function handle(req,res) {
    const peer=req.socket?.remoteAddress;
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)||req.headers.host!==origin.host||req.headers['x-forwarded-proto']!=='https'||req.headers.origin!==publicOrigin||!['same-origin','none',undefined].includes(req.headers['sec-fetch-site']))return send(res,403,{error:'same_origin_only'});
    const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
    if(!rate(ip))return send(res,429,{error:'rate_limited'});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'method_not_allowed'});}
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
    const length=req.headers['content-length'];if(length!==undefined&&(!/^[0-9]+$/.test(String(length))||Number(length)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'});}
    let data;try{data=await body(req)}catch(e){return send(res,e.message==='too_large'?413:400,{error:e.message==='too_large'?'body_too_large':'invalid_json'});}
    if(!valid(data))return send(res,400,{error:'invalid_request'});
    if(!db){db=openDb(dbPath);cleanupTimer=setInterval(()=>{try{cleanup()}catch{}},300000);cleanupTimer.unref();}
    const now=Date.now();
    cleanup();
    const hash=createHash('sha256').update(data.did).digest('hex');
    db.prepare('INSERT INTO events(event,page,source,game,tier,played,created_at,device_hash,target) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(data.event,data.page||null,data.from||null,data.game||null,data.tier||null,data.played?1:0,now,hash,data.target||null);
    return send(res,202,{ok:true});
  }
  return {
    middleware(req,res,next){if(String(req.url||'').split('?')[0]!=='/api/track')return next();void handle(req,res).catch(()=>{if(!res.headersSent)send(res,503,{error:'tracking_unavailable'});else res.destroy()});},
    close(){if(cleanupTimer){clearInterval(cleanupTimer);cleanupTimer=null;}if(db){db.close();db=null;}lastCleanup=0;},
  };
}
