import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,rm} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';
import {createServer,request} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createProductionStatsApi} from '../server/production-stats.mjs';

const PASSWORD='only-used-in-local-test';
function get(url,{method='GET',headers={},body}={}){return new Promise((resolve,reject)=>{
  const req=request(url,{method,headers},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:data?JSON.parse(data):null,headers:res.headers}))});
  req.on('error',reject);if(body!==undefined)req.write(body);req.end();
});}
async function setup({configured=true}={}){
  const parent=await mkdtemp(path.join(tmpdir(),'ainpe-stats-')),root=path.join(parent,'release');await mkdir(root,{mode:0o700});
  const pass=path.join(parent,'password.json'),dbPath=path.join(parent,'tracking.sqlite'),salt=randomBytes(16);
  const cfg={version:1,algorithm:'scrypt',salt:salt.toString('base64url'),hash:scryptSync(PASSWORD,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).toString('base64url')};
  await writeFile(pass,JSON.stringify(cfg),{mode:0o600});
  const api=createProductionStatsApi({root,dbPath,publicOrigin:'https://ainpe.example',passwordFile:configured?pass:null});
  const server=createServer((req,res)=>api.middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`,headers={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1',origin:'https://ainpe.example','content-type':'application/json'};
  const call=(url,options={})=>get(base+url,{...options,headers:{...headers,...options.headers}});
  const login=async(password=PASSWORD,extra={})=>call('/api/admin/login',{method:'POST',body:JSON.stringify({password}),headers:extra});
  return {parent,root,pass,dbPath,api,server,base,headers,call,login,close:async()=>{await new Promise(r=>server.close(r));api.close();await rm(parent,{recursive:true,force:true})}};
}
async function cookie(x){const r=await x.login();assert.equal(r.status,200);assert.match(r.headers['set-cookie'][0],/HttpOnly; Secure; SameSite=Strict/);return r.headers['set-cookie'][0].split(';')[0]}
function events(dbPath){
 const db=new DatabaseSync(dbPath);db.exec('CREATE TABLE events(id INTEGER PRIMARY KEY,event TEXT NOT NULL,source TEXT,target TEXT,game TEXT,created_at INTEGER NOT NULL,device_hash TEXT NOT NULL)');
 const add=db.prepare('INSERT INTO events(event,source,target,game,created_at,device_hash) VALUES(?,?,?,?,?,?)'),now=Date.now();
 add.run('sim_start',null,null,'miniapp',now-1000,'1'.repeat(64));add.run('sim_start',null,null,'miniapp',now-900,'1'.repeat(64));add.run('sim_start',null,null,'video',now-800,'2'.repeat(64));
 add.run('sim_finish',null,null,'miniapp',now-700,'1'.repeat(64));add.run('camp_view',null,null,null,now-600,'1'.repeat(64));
 add.run('challenge_open','poster_qr',null,null,now-500,'2'.repeat(64));add.run('site_view','persona_qr',null,null,now-450,'2'.repeat(64));add.run('site_view','persona_qr',null,null,now-440,'1'.repeat(64));add.run('challenge_open','share_link',null,null,now-400,'1'.repeat(64));
 add.run('outbound_click','camp','join',null,now-300,'2'.repeat(64));add.run('sim_start',null,null,'miniapp',now-91*86400000,'3'.repeat(64));db.close();
}
test('admin requires same-origin HTTPS, a private hash file and an authenticated session',async()=>{
 const x=await setup();try{
  assert.equal((await x.call('/api/admin/stats')).status,401);
  assert.equal((await x.login(PASSWORD,{origin:'https://evil.example'})).status,403);
  assert.equal((await x.login(PASSWORD,{'x-forwarded-proto':'http'})).status,403);
  assert.equal((await x.login('incorrect')).status,401);
  const c=await cookie(x),r=await x.call('/api/admin/stats',{headers:{cookie:c}});
  assert.equal(r.status,200);assert.equal(r.body.available,false);assert.match(r.headers['cache-control'],/no-store/);
  assert.equal((await x.call('/api/admin/stats?days=1',{headers:{cookie:c}})).status,400);
  assert.equal((await x.call('/api/admin/stats?days=7&days=30',{headers:{cookie:c}})).status,400);
  assert.equal((await x.call('/api/admin/logout',{method:'POST',headers:{cookie:c}})).status,200);
  assert.equal((await x.call('/api/admin/stats',{headers:{cookie:c}})).status,401);
 }finally{await x.close()}
});
test('bounded read-only aggregates distinguish poster arrivals and anonymous browsers',async()=>{
 const x=await setup();try{
  events(x.dbPath);await chmod(x.dbPath,0o600);const c=await cookie(x),r=await x.call('/api/admin/stats?days=30',{headers:{cookie:c}});
  assert.equal(r.status,200);assert.equal(r.body.available,true);assert.deepEqual(r.body.metrics.simStarts,{events:3,browsers:2});
  assert.deepEqual(r.body.metrics.simFinishes,{events:1,browsers:1});assert.deepEqual(r.body.metrics.campViews,{events:1,browsers:1});
  assert.deepEqual(r.body.metrics.posterQrVisits,{events:3,browsers:2});
  assert.deepEqual(r.body.metrics.challengePosterVisits,{events:1,browsers:1});assert.deepEqual(r.body.metrics.personaPosterVisits,{events:2,browsers:2});
  assert.equal(r.body.daily.reduce((sum,row)=>sum+row.posterQrVisits,0),3);assert.deepEqual(r.body.metrics.shareLinkVisits,{events:1,browsers:1});
  assert.deepEqual(r.body.metrics.joinClicks,{events:1,browsers:1});assert.equal(JSON.stringify(r.body).includes('1'.repeat(64)),false);
  assert.deepEqual(r.body.funnel,{unit:'browser_project',started:2,finished:1,campVisitsAfterFinish:1,finishRate:50,campAfterFinishRate:100});
  assert.ok(r.body.daily.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)));
 }finally{await x.close()}
});
test('funnel is based on same browser and project with later events within the selected window',async()=>{
 const x=await setup();try{
  events(x.dbPath);await chmod(x.dbPath,0o600);
  const db=new DatabaseSync(x.dbPath),add=db.prepare('INSERT INTO events(event,source,target,game,created_at,device_hash) VALUES(?,?,?,?,?,?)'),now=Date.now();
  add.run('sim_start',null,null,'video',now-7000,'1'.repeat(64));
  add.run('sim_finish',null,null,'different',now-6500,'2'.repeat(64));
  add.run('sim_finish',null,null,'video',now-6000,'1'.repeat(64));
  add.run('camp_view',null,null,null,now-6100,'1'.repeat(64));
  add.run('sim_finish',null,null,'video',now+10000,'2'.repeat(64));db.close();
  const c=await cookie(x),r=await x.call('/api/admin/stats?days=7',{headers:{cookie:c}});
  assert.equal(r.status,200);assert.deepEqual(r.body.funnel,{unit:'browser_project',started:3,finished:2,campVisitsAfterFinish:2,finishRate:66.7,campAfterFinishRate:100});
 }finally{await x.close()}
});
test('older databases without target do not misrepresent unavailable joining clicks as zero',async()=>{
 const x=await setup();try{
  const db=new DatabaseSync(x.dbPath);db.exec('CREATE TABLE events(id INTEGER PRIMARY KEY,event TEXT NOT NULL,source TEXT,game TEXT,created_at INTEGER NOT NULL,device_hash TEXT NOT NULL)');db.close();await chmod(x.dbPath,0o600);
  const c=await cookie(x),r=await x.call('/api/admin/stats',{headers:{cookie:c}});assert.equal(r.status,200);assert.equal(r.body.metrics.joinClicks,null);
 }finally{await x.close()}
});
test('older databases without game do not claim a zero-valued funnel',async()=>{
 const x=await setup();try{
  const db=new DatabaseSync(x.dbPath);db.exec('CREATE TABLE events(id INTEGER PRIMARY KEY,event TEXT NOT NULL,source TEXT,created_at INTEGER NOT NULL,device_hash TEXT NOT NULL)');db.close();await chmod(x.dbPath,0o600);
  const c=await cookie(x),r=await x.call('/api/admin/stats',{headers:{cookie:c}});assert.equal(r.status,200);assert.equal(r.body.funnel,null);
 }finally{await x.close()}
});
test('disabled or invalid configuration is fail-closed; password rotation invalidates sessions',async()=>{
 const x=await setup({configured:false});try{assert.equal((await x.login()).status,503)}finally{await x.close()}
 const y=await setup();try{
  const c=await cookie(y);await chmod(y.pass,0o644);
  assert.equal((await y.call('/api/admin/stats',{headers:{cookie:c}})).status,503);
  await chmod(y.pass,0o600);const salt=randomBytes(16),value={version:1,algorithm:'scrypt',salt:salt.toString('base64url'),hash:scryptSync('a-new-pass',salt,32,{N:16384,r:8,p:1,maxmem:67108864}).toString('base64url')};
  await writeFile(y.pass,JSON.stringify(value),{mode:0o600});assert.equal((await y.call('/api/admin/stats',{headers:{cookie:c}})).status,401);
 }finally{await y.close()}
});
test('login failures are bounded and private files may not be served from the release',async()=>{
 const x=await setup();try{
  for(let i=0;i<5;i++)assert.equal((await x.login('wrong')).status,401);
  assert.equal((await x.login('wrong')).status,429);
  const file=path.join(x.root,'password.json');await writeFile(file,'{}',{mode:0o600});
  const api=createProductionStatsApi({root:x.root,dbPath:x.dbPath,publicOrigin:'https://ainpe.example',passwordFile:file});
  const server=createServer((req,res)=>api.middleware(req,res,()=>res.end()));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const r=await get(`http://127.0.0.1:${server.address().port}/api/admin/login`,{method:'POST',headers:x.headers,body:JSON.stringify({password:PASSWORD})});assert.equal(r.status,503)}finally{await new Promise(r=>server.close(r));api.close()}
 }finally{await x.close()}
});
test('concurrent split-body logins cannot exceed the password-derivation limit',async()=>{
 const x=await setup();try{
  const calls=Array.from({length:8},(_,i)=>new Promise((resolve,reject)=>{
   const req=request(x.base+'/api/admin/login',{method:'POST',headers:{...x.headers,'x-real-ip':`198.51.100.${i+10}`}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))});
   req.on('error',reject);req.write('{"password":"');setTimeout(()=>req.end('wrong"}'),25);
  }));
  const statuses=await Promise.all(calls);assert.ok(statuses.some(x=>x===429));assert.ok(statuses.every(x=>x===401||x===429));
 }finally{await x.close()}
});
