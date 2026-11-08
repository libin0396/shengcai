import {DatabaseSync} from 'node:sqlite';
import {createHash, randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import {isIP} from 'node:net';
import path from 'node:path';

// This endpoint exposes aggregate counts only. Password material is read from
// a separate private file; neither credentials nor raw events are returned.
const MAX_BODY=1024, SESSION_MS=4*60*60*1000, COOKIE='__Host-ainpe_stats';
const PARAMS={N:16384,r:8,p:1,maxmem:64*1024*1024};
const METRICS={
  siteViews:{event:'site_view'}, simStarts:{event:'sim_start'}, simFinishes:{event:'sim_finish'},
  campViews:{event:'camp_view'}, campClicks:{event:'camp_join_click'},
  posterQrVisits:{sources:[['challenge_open','poster_qr'],['site_view','persona_qr']]},
  challengePosterVisits:{event:'challenge_open',source:'poster_qr'}, personaPosterVisits:{event:'site_view',source:'persona_qr'},
  shareLinkVisits:{event:'challenge_open',source:'share_link'},
  posterDownloads:{event:'poster_save'}, joinClicks:{event:'outbound_click',target:'join'},
  learnViews:{event:'learn_view'}, learnSteps:{event:'learn_step'}, learnDone:{event:'learn_done'},
  workCardSaves:{event:'card_save'}, skillCopies:{event:'skill_copy'}, promptCopies:{event:'aid_copy'}, wantSubmits:{event:'want_submit'},
  learnCampClicks:{event:'outbound_click',target:'camp',source:'learn'},
};
const emptyMetric=()=>({events:0,browsers:0});
function send(res,status,value,extra={}){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Pragma':'no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',...extra});
  res.end(JSON.stringify(value));
}
function readBody(req){return new Promise((resolve,reject)=>{
  let size=0,large=false;const chunks=[];
  req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BODY)large=true;else chunks.push(chunk)});
  req.on('end',()=>{if(large)return reject(new Error('large'));try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('json'))}});
  req.on('error',reject);req.on('aborted',()=>reject(new Error('aborted')));
});}
function privateFile(filename,root){
  if(typeof filename!=='string'||!path.isAbsolute(filename))throw new Error('invalid_file');
  const parent=realpathSync(path.dirname(filename)),dir=lstatSync(parent),file=path.join(parent,path.basename(filename));
  if(!dir.isDirectory()||(dir.mode&0o077)!==0)throw new Error('invalid_directory');
  const relative=path.relative(realpathSync(root),file);
  if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('file_in_release');
  const info=lstatSync(file);
  if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||(info.mode&0o077)!==0)throw new Error('invalid_file');
  return {file,info};
}
function passwordConfig(filename,root){
  const {file,info}=privateFile(filename,root);if(info.size<1||info.size>4096)throw new Error('invalid_password_config');
  const value=JSON.parse(readFileSync(file,'utf8'));
  if(!value||value.version!==1||value.algorithm!=='scrypt'||typeof value.salt!=='string'||typeof value.hash!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(value.salt)||!/^[A-Za-z0-9_-]{43}$/.test(value.hash))throw new Error('invalid_password_config');
  const salt=Buffer.from(value.salt,'base64url'),hash=Buffer.from(value.hash,'base64url');
  if(salt.length!==16||hash.length!==32||salt.toString('base64url')!==value.salt||hash.toString('base64url')!==value.hash)throw new Error('invalid_password_config');
  return {salt,hash};
}
function derive(password,salt){return new Promise((resolve,reject)=>scrypt(password,salt,32,PARAMS,(e,key)=>e?reject(e):resolve(key)));}
function cookieToken(req){
  const value=req.headers.cookie;if(typeof value!=='string'||value.length>2048)return null;
  const matches=value.split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
  if(matches.length!==1)return null;const token=matches[0].slice(COOKIE.length+1);
  return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
function summary(dbPath,root,days){
  const until=Date.now(),since=until-days*86400000;
  const result={period:{days,since:new Date(since).toISOString(),until:new Date(until).toISOString(),retentionDays:90},available:false,metrics:Object.fromEntries(Object.keys(METRICS).map(k=>[k,emptyMetric()])),funnel:{unit:'browser_project',started:0,finished:0,campVisitsAfterFinish:0,finishRate:null,campAfterFinishRate:null},learnByTopic:null,wants:null,daily:[]};
  let file;try{file=privateFile(dbPath,root).file}catch(e){if(e.code==='ENOENT')return result;throw e}
  const db=new DatabaseSync(file,{readOnly:true});
  try{
    const columns=db.prepare('PRAGMA table_info(events)').all().map(x=>x.name);
    if(!['event','source','device_hash','created_at'].every(x=>columns.includes(x)))throw new Error('invalid_database');
    for(const [name,spec] of Object.entries(METRICS)){
      if(spec.target&&!columns.includes('target')){result.metrics[name]=null;continue}
      let sql='SELECT COUNT(*) AS events, COUNT(DISTINCT device_hash) AS browsers FROM events WHERE created_at>=? AND created_at<?';
      const values=[since,until];
      if(spec.sources){
        sql+=' AND ('+spec.sources.map(()=>'(event=? AND source=?)').join(' OR ')+')';
        for(const [event,source] of spec.sources)values.push(event,source);
      }else{
        sql+=' AND event=?';values.push(spec.event);
        if(spec.source){sql+=' AND source=?';values.push(spec.source)}
      }
      if(spec.target){sql+=' AND target=?';values.push(spec.target)}
      const row=db.prepare(sql).get(...values);result.metrics[name]={events:Number(row.events),browsers:Number(row.browsers)};
    }
    if(columns.includes('game')){
      // Fixed topic keys only. Never return visitor-entered text or device identifiers.
      result.wants=Object.fromEntries(db.prepare("SELECT game,COUNT(DISTINCT device_hash) AS browsers FROM events WHERE event='want_submit' AND game IN ('kejian','huiben','video','novel','tuwen','assistant','money','other') AND created_at>=? AND created_at<? GROUP BY game").all(since,until).map(x=>[x.game,Number(x.browsers)]));
      result.learnByTopic=Object.fromEntries(db.prepare("SELECT game,SUM(CASE WHEN event='learn_view' THEN 1 ELSE 0 END) AS views,COUNT(DISTINCT CASE WHEN event='learn_view' THEN device_hash END) AS browsers,COUNT(DISTINCT CASE WHEN event='learn_done' THEN device_hash END) AS doneBrowsers FROM events WHERE event IN ('learn_view','learn_done') AND game IN ('index','kejian','huiben','jijiu') AND created_at>=? AND created_at<? GROUP BY game").all(since,until).map(x=>[x.game,{views:Number(x.views),browsers:Number(x.browsers),doneBrowsers:Number(x.doneBrowsers)}]));
      const row=db.prepare(`WITH starts AS (
        SELECT device_hash,game,MIN(created_at) AS at FROM events
        WHERE event='sim_start' AND game IS NOT NULL AND created_at>=? AND created_at<? GROUP BY device_hash,game
      ), finishes AS (
        SELECT s.device_hash,s.game,MIN(e.created_at) AS at FROM starts s JOIN events e
        ON e.event='sim_finish' AND e.device_hash=s.device_hash AND e.game=s.game AND e.created_at>=s.at AND e.created_at<? GROUP BY s.device_hash,s.game
      ) SELECT (SELECT COUNT(*) FROM starts) AS started,
        (SELECT COUNT(*) FROM finishes) AS finished,
        (SELECT COUNT(*) FROM finishes f WHERE EXISTS(SELECT 1 FROM events e WHERE e.event='camp_view' AND e.device_hash=f.device_hash AND e.created_at>=f.at AND e.created_at<?)) AS camp`).get(since,until,until,until);
      const started=Number(row.started),finished=Number(row.finished),camp=Number(row.camp),rate=(n,d)=>d?Math.round(n/d*1000)/10:null;
      result.funnel={unit:'browser_project',started,finished,campVisitsAfterFinish:camp,finishRate:rate(finished,started),campAfterFinishRate:rate(camp,finished)};
    }else result.funnel=null;
    result.daily=db.prepare(`SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','+8 hours') AS date,
      SUM(CASE WHEN event='site_view' THEN 1 ELSE 0 END) AS siteViews,
      SUM(CASE WHEN event='sim_start' THEN 1 ELSE 0 END) AS simStarts,
      SUM(CASE WHEN event='sim_finish' THEN 1 ELSE 0 END) AS simFinishes,
      SUM(CASE WHEN event='camp_view' THEN 1 ELSE 0 END) AS campViews,
      SUM(CASE WHEN (event='challenge_open' AND source='poster_qr') OR (event='site_view' AND source='persona_qr') THEN 1 ELSE 0 END) AS posterQrVisits
      FROM events WHERE created_at>=? AND created_at<? GROUP BY date ORDER BY date`).all(since,until).map(x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,k==='date'?v:Number(v)])));
    result.available=true;return result;
  }finally{db.close()}
}
export function createProductionStatsApi({root,dbPath,publicOrigin,passwordFile}={}){
  if(!root||!path.isAbsolute(root)||!dbPath||!path.isAbsolute(dbPath))throw new Error('stats_paths_required');
  const origin=new URL(publicOrigin);if(origin.protocol!=='https:'||origin.origin!==publicOrigin||origin.username||origin.password)throw new Error('invalid_public_origin');
  const sessions=new Map(),attempts=new Map(),reads=new Map();let globalStart=0,globalCount=0,readStart=0,readCount=0,deriving=0;
  function configTag(config){return createHash('sha256').update(config.salt).update(config.hash).digest('hex')}
  function authenticated(req,tag){const token=cookieToken(req);if(!token)return false;const hash=createHash('sha256').update(token).digest('hex'),session=sessions.get(hash);if(!session)return false;if(session.expires<=Date.now()||session.tag!==tag){sessions.delete(hash);return false}return true;}
  function rate(ip){const now=Date.now();if(now-globalStart>=60000){globalStart=now;globalCount=0}if(++globalCount>60)return false;let item=attempts.get(ip);if(!item||now-item.start>=900000){if(attempts.size>=10000){for(const [k,v] of attempts)if(now-v.start>=900000)attempts.delete(k);if(attempts.size>=10000)return false}item={start:now,count:0};attempts.set(ip,item)}return ++item.count<=5;}
  function readRate(ip){const now=Date.now();if(now-readStart>=60000){readStart=now;readCount=0}if(++readCount>500)return false;let item=reads.get(ip);if(!item||now-item.start>=60000){if(reads.size>=10000){for(const [k,v] of reads)if(now-v.start>=60000)reads.delete(k);if(reads.size>=10000)return false}item={start:now,count:0};reads.set(ip,item)}return ++item.count<=60;}
  async function handle(req,res){
    const peer=req.socket?.remoteAddress,originHeader=req.headers.origin,fetchSite=req.headers['sec-fetch-site'];
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)||req.headers.host!==origin.host||req.headers['x-forwarded-proto']!=='https'||(originHeader!==undefined&&originHeader!==publicOrigin)||!['same-origin','none',undefined].includes(fetchSite))return send(res,403,{error:'same_origin_only'});
    const ip=req.headers['x-real-ip'];if(typeof ip!=='string'||!isIP(ip))return send(res,403,{error:'trusted_proxy_required'});
    let url;try{url=new URL(req.url,publicOrigin)}catch{return send(res,400,{error:'invalid_request'})}
    if(!passwordFile)return send(res,503,{error:'not_configured'});
    if(url.pathname==='/api/admin/login'){
      if(req.method!=='POST')return send(res,405,{error:'method_not_allowed'},{Allow:'POST'});
      if(originHeader!==publicOrigin)return send(res,403,{error:'same_origin_only'});
      if(!rate(ip)||deriving>=2)return send(res,429,{error:'rate_limited'},{'Retry-After':'60'});
      if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers['content-type']||'')))return send(res,415,{error:'json_required'});
      const length=req.headers['content-length'];if(length!==undefined&&(!/^[0-9]+$/.test(String(length))||Number(length)>MAX_BODY)){req.resume();return send(res,413,{error:'body_too_large'})}
      let data;try{data=await readBody(req)}catch(e){return send(res,e.message==='large'?413:400,{error:e.message==='large'?'body_too_large':'invalid_json'})}
      if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==1||typeof data.password!=='string'||Buffer.byteLength(data.password)>256||!data.password.length)return send(res,400,{error:'invalid_request'});
      let config;try{config=passwordConfig(passwordFile,root)}catch{return send(res,503,{error:'not_configured'})}
      if(deriving>=2)return send(res,429,{error:'rate_limited'},{'Retry-After':'60'});
      let key;deriving++;try{key=await derive(data.password,config.salt)}finally{deriving--}
      if(!timingSafeEqual(key,config.hash))return send(res,401,{error:'unauthorized'});
      const now=Date.now();for(const [k,v] of sessions)if(v.expires<=now)sessions.delete(k);if(sessions.size>=100)return send(res,429,{error:'rate_limited'});
      const token=randomBytes(32).toString('base64url');sessions.set(createHash('sha256').update(token).digest('hex'),{expires:now+SESSION_MS,tag:configTag(config)});
      return send(res,200,{ok:true},{'Set-Cookie':`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS/1000}`});
    }
    if(url.pathname==='/api/admin/logout'){
      if(req.method!=='POST')return send(res,405,{error:'method_not_allowed'},{Allow:'POST'});
      if(originHeader!==publicOrigin)return send(res,403,{error:'same_origin_only'});
      const token=cookieToken(req);if(token)sessions.delete(createHash('sha256').update(token).digest('hex'));
      return send(res,200,{ok:true},{'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
    }
    if(url.pathname==='/api/admin/stats'){
      if(req.method!=='GET')return send(res,405,{error:'method_not_allowed'},{Allow:'GET'});
      let config;try{config=passwordConfig(passwordFile,root)}catch{return send(res,503,{error:'not_configured'})}
      if(!authenticated(req,configTag(config)))return send(res,401,{error:'unauthorized'});
      if(!readRate(ip))return send(res,429,{error:'rate_limited'},{'Retry-After':'60'});
      if([...url.searchParams.keys()].some(k=>k!=='days')||url.searchParams.getAll('days').length>1)return send(res,400,{error:'invalid_request'});
      const days=Number(url.searchParams.get('days')||30);if(![7,30,90].includes(days))return send(res,400,{error:'invalid_request'});
      try{return send(res,200,summary(dbPath,root,days))}catch{return send(res,503,{error:'stats_unavailable'})}
    }
    return send(res,404,{error:'not_found'});
  }
  return {middleware(req,res,next){const pathname=(req.url||'').split('?')[0];if(!pathname.startsWith('/api/admin/'))return next();void handle(req,res).catch(()=>{if(!res.headersSent)send(res,503,{error:'stats_unavailable'});else res.destroy()})},close(){sessions.clear();attempts.clear();reads.clear()}};
}
