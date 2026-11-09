import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {createServer,request} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import {createProductionTrackingApi} from '../server/production-tracking.mjs';

function fetchLocal(url,{method='POST',headers={},body}={}){return new Promise((resolve,reject)=>{
  const req=request(url,{method,headers},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:data?JSON.parse(data):null}));});
  req.on('error',reject);if(body!==undefined)req.write(body);req.end();
});}
async function setup(){
  const parent=await mkdtemp(path.join(tmpdir(),'ainpe-track-'));const root=path.join(parent,'release');await mkdir(root,{mode:0o700});
  const dbPath=path.join(parent,'track.sqlite');const api=createProductionTrackingApi({root,dbPath,publicOrigin:'https://ainpe.example'});
  const server=createServer((req,res)=>api.middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/api/track`;
  const headers={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1',origin:'https://ainpe.example','content-type':'application/json'};
  const post=(value,extra={})=>fetchLocal(url,{body:JSON.stringify(value),headers:{...headers,...extra}});
  return {parent,root,dbPath,api,server,url,headers,post,close:async()=>{await new Promise(r=>server.close(r));api.close();await rm(parent,{recursive:true,force:true})}};
}
const sample=()=>({event:'sim_start',page:'simulate',game:'books',from:'home-hero',played:false,ts:Date.now(),did:'a'.repeat(32)});

test('valid same-origin events persist with hashed identifiers and no raw IP',async()=>{
  const x=await setup();try{
    let r=await x.post(sample());assert.equal(r.status,202);
    const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
      const row=db.prepare('SELECT * FROM events').get();assert.equal(row.event,'sim_start');assert.equal(row.game,'books');
      assert.match(row.device_hash,/^[a-f0-9]{64}$/);assert.notEqual(row.device_hash,'a'.repeat(32));
      assert.equal(Object.values(row).includes('198.51.100.1'),false);
    }finally{db.close()}
  }finally{await x.close()}
});

test('challenge replay events accept the share and poster entry sources',async()=>{
  const x=await setup();try{
    for(const from of ['poster_qr','share_link'])assert.equal((await x.post({...sample(),event:'replay_same_seed',from})).status,202);
  }finally{await x.close()}
});

test('persona poster landing site views reach the tracking store with their source',async()=>{
 const x=await setup();try{
  assert.equal((await x.post({event:'site_view',page:'pick',from:'persona_qr',played:false,ts:Date.now(),did:'a'.repeat(32)})).status,202);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   const row=db.prepare('SELECT event,page,source FROM events').get();
   assert.deepEqual({...row},{event:'site_view',page:'pick',source:'persona_qr'});
  }finally{db.close()}
 }finally{await x.close()}
});

test('homepage camp clicks are accepted with a bounded source and target',async()=>{
 const x=await setup();try{
  assert.equal((await x.post({...sample(),event:'outbound_click',from:'home',target:'camp'})).status,202);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   const row=db.prepare('SELECT source,target FROM events').get();assert.equal(row.source,'home');assert.equal(row.target,'camp');
  }finally{db.close()}
 }finally{await x.close()}
});

test('learning events accept only fixed categories and never raw request data',async()=>{
 const x=await setup();try{
  const base={page:'learn',played:false,ts:Date.now(),did:'a'.repeat(32)};
  for(const [event,game,tier] of [['learn_view','index'],['learn_step','kejian','start'],['learn_done','huiben','pro'],['card_save','kejian','wx'],['want_submit','video'],['aid_copy','jijiu','excel'],['skill_copy','huiben','file']]){
   assert.equal((await x.post({...base,event,game,...(tier?{tier}:{})})).status,202);
  }
  assert.equal((await x.post({...base,page:'home',event:'want_submit',game:'video'})).status,202);
  for(const invalid of [
   {...base,event:'want_submit',game:'my_private_request'},
   {...base,event:'want_submit',game:'other',message:'private input'},
   {...base,event:'learn_view',game:'private-topic'},
   {...base,event:'learn_step',game:'kejian',tier:'private-input'},
   {...base,event:'learn_done',game:'kejian',from:'home'},
   {...base,event:'card_save',page:'home',game:'kejian'}
  ])assert.equal((await x.post(invalid)).status,400);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   assert.equal(db.prepare('SELECT COUNT(*) AS n FROM events').get().n,8);
   assert.equal(db.prepare("SELECT COUNT(*) AS n FROM events WHERE event='want_submit' AND game='video'").get().n,2);
  }finally{db.close()}
 }finally{await x.close()}
});

test('onboarding accepts only fixed open, skip and start actions',async()=>{
 const x=await setup();try{
  const base={event:'learn_step',page:'learn',game:'onboard',played:false,ts:Date.now(),did:'a'.repeat(32)};
  for(const tier of ['open','skip','start'])assert.equal((await x.post({...base,tier})).status,202);
  for(const bad of [base,{...base,tier:'private-input'},{...base,tier:'open',page:'home'},{...base,tier:'open',event:'learn_done'},{...base,tier:'open',game:'kejian'},{...base,tier:'open',raw:'secret'}])assert.equal((await x.post(bad)).status,400);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{assert.equal(db.prepare("SELECT COUNT(*) AS n FROM events WHERE event='learn_step' AND game='onboard'").get().n,3)}finally{db.close()}
 }finally{await x.close()}
});

test('search outcomes and feedback accept only bounded categories and reject raw queries',async()=>{
 const x=await setup();try{
  const base={page:'learn',game:'find',played:false,ts:Date.now(),did:'a'.repeat(32)};
  for(const tier of ['hit','related','miss'])assert.equal((await x.post({...base,event:'find_search',tier})).status,202);
  for(const tier of ['drama','video','office','content','education','business','other'])assert.equal((await x.post({...base,event:'find_feedback',tier})).status,202);
  for(const invalid of [
   {...base,event:'find_search',tier:'some-private-query'}, {...base,event:'find_search',tier:'miss',query:'personal query'},
   {...base,event:'find_feedback',tier:'some-private-query'}, {...base,event:'find_feedback',tier:'other',text:'private input'},
   {...base,event:'find_feedback',tier:'other',game:'library'}, {...base,event:'find_feedback',tier:'other',played:true},
   {...base,event:'find_feedback',tier:'other',page:'home'}, {...base,event:'find_feedback',tier:'other',from:'home'}
  ])assert.equal((await x.post(invalid)).status,400);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   assert.equal(db.prepare("SELECT COUNT(*) AS n FROM events WHERE event='find_search'").get().n,3);
   assert.equal(db.prepare("SELECT COUNT(*) AS n FROM events WHERE event='find_feedback'").get().n,7);
  }finally{db.close()}
 }finally{await x.close()}
});

test('rejects cross-origin, untrusted proxy, oversized and unapproved data',async()=>{
 const x=await setup();try{
  assert.equal((await x.post(sample(),{origin:'https://evil.example'})).status,403);
  assert.equal((await x.post(sample(),{'x-forwarded-proto':'http'})).status,403);
  assert.equal((await x.post(sample(),{'x-real-ip':'bad'})).status,403);
  assert.equal((await x.post({...sample(),event:'arbitrary'})).status,400);
  assert.equal((await x.post({...sample(),page:'https://example.com/private'})).status,400);
  assert.equal((await x.post({...sample(),note:'sensitive'})).status,400);
  assert.equal((await x.post({...sample(),did:'not-an-id'})).status,400);
  assert.equal((await x.post({...sample(),ts:0})).status,400);
  assert.equal((await x.post({...sample(),played:'yes'})).status,400);
  assert.equal((await x.post({...sample(),extra:'x'.repeat(1100)})).status,413);
  assert.equal((await x.post(sample(),{'content-type':'text/plain'})).status,415);
  assert.equal((await fetchLocal(x.url,{method:'GET',headers:x.headers})).status,405);
 }finally{await x.close()}
});

test('rate limiting bounds collection and database must be outside release',async()=>{
 const x=await setup();try{
  let r;for(let i=0;i<121;i++)r=await x.post(sample());assert.equal(r.status,429);
  assert.throws(()=>createProductionTrackingApi({root:x.root,dbPath:path.join(x.root,'track.sqlite'),publicOrigin:'https://ainpe.example'}),/outside_release/);
 }finally{await x.close()}
});

test('cleanup removes old events in bounded batches and preserves recent events',async()=>{
 const x=await setup();try{
  let r=await x.post(sample());assert.equal(r.status,202);x.api.close();
  const db=new DatabaseSync(x.dbPath);const add=db.prepare('INSERT INTO events(event,played,created_at,device_hash) VALUES(?,?,?,?)');
  for(let i=0;i<501;i++)add.run('site_view',0,0,'0'.repeat(64));db.close();
  r=await x.post(sample(),{'x-real-ip':'198.51.100.2'});assert.equal(r.status,202);
  const check=new DatabaseSync(x.dbPath,{readOnly:true});try{assert.equal(check.prepare('SELECT count(*) AS n FROM events WHERE created_at=0').get().n,1);assert.equal(check.prepare('SELECT count(*) AS n FROM events WHERE created_at>0').get().n,2)}finally{check.close()}
 }finally{await x.close()}
});

test('local funnel report returns bounded browser cohorts and safe empty denominators',async()=>{
 const x=await setup();try{
  assert.equal((await x.post({...sample(),event:'site_view'})).status,202);
  const result=spawnSync(process.execPath,['scripts/tracking-report.mjs',x.dbPath,'30'],{encoding:'utf8'});
  assert.equal(result.status,0);const data=JSON.parse(result.stdout);
  assert.equal(data.simulation_completion.denominator,0);assert.equal(data.simulation_completion.percent,null);
  assert.equal(data.newcomer_direct_click.denominator,1);assert.equal(data.newcomer_direct_click.numerator,0);
 }finally{await x.close()}
});

test('new events accept only anonymous bounded categories and aggregate without identifiers',async()=>{
 const x=await setup();try{
  const event={...sample(),event:'outbound_click',from:'article',target:'camp'};
  assert.equal((await x.post(event)).status,202);
  assert.equal((await x.post({...event,target:'join'})).status,202);
  assert.equal((await x.post({...event,event:'contact_copy',target:undefined})).status,202);
  assert.equal((await x.post({...event,event:'contact_copy',from:'header',target:undefined})).status,202);
  for(const invalid of [{...event,target:'https://example.com'}, {...event,target:undefined}, {...event,from:'private'}, {...event,url:'https://example.com'}, {...event,event:'contact_copy'}, {...sample(),target:'camp'}])assert.equal((await x.post(invalid)).status,400);
  const report=spawnSync(process.execPath,['scripts/tracking-report.mjs',x.dbPath,'30'],{encoding:'utf8'});
  assert.equal(report.status,0);const result=JSON.parse(report.stdout);
  assert.deepEqual(result.outbound_clicks.camp,{clicks:1,anonymous_browsers:1});
  assert.deepEqual(result.outbound_clicks.join,{clicks:1,anonymous_browsers:1});
  assert.deepEqual(result.contact_copies,{copies:2,anonymous_browsers:1});
  assert.equal(report.stdout.includes('a'.repeat(32)),false);
  assert.equal(report.stdout.includes('https://'),false);
 }finally{await x.close()}
});

test('old databases migrate without losing records and old reports remain readable',async()=>{
 const x=await setup();try{
  const {writeFile,chmod}=await import('node:fs/promises');await writeFile(x.dbPath,'',{mode:0o600});await chmod(x.dbPath,0o600);
  let db=new DatabaseSync(x.dbPath);db.exec(`CREATE TABLE events (id INTEGER PRIMARY KEY,event TEXT NOT NULL,page TEXT,source TEXT,game TEXT,tier TEXT,played INTEGER NOT NULL,created_at INTEGER NOT NULL,device_hash TEXT NOT NULL)`);
  db.prepare('INSERT INTO events(event,played,created_at,device_hash) VALUES(?,?,?,?)').run('site_view',0,Date.now(),'0'.repeat(64));db.close();
  let report=spawnSync(process.execPath,['scripts/tracking-report.mjs',x.dbPath,'30'],{encoding:'utf8'});assert.equal(report.status,0);assert.equal(JSON.parse(report.stdout).outbound_clicks.camp.clicks,0);assert.equal(JSON.parse(report.stdout).persona_events.persona_unlock.hidden.events,0);
  assert.equal((await x.post({...sample(),event:'outbound_click',from:'camp',target:'join'})).status,202);
  x.api.close();assert.equal((await x.post(sample(),{'x-real-ip':'198.51.100.2'})).status,202);
  db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   const rows=db.prepare('SELECT event,target,hidden FROM events ORDER BY id').all();assert.equal(rows.length,3);assert.equal(rows[0].event,'site_view');assert.equal(rows[0].target,null);assert.equal(rows[0].hidden,null);assert.equal(rows[1].target,'join');
  }finally{db.close()}
 }finally{await x.close()}
});

test('persona events accept only an anonymous boolean and report browser counts',async()=>{
 const x=await setup();try{
  const base={played:true,ts:Date.now(),did:'a'.repeat(32)};
  for(const event of ['persona_unlock','poster_save'])for(const hidden of [true,false])assert.equal((await x.post({...base,event,hidden})).status,202);
  for(const bad of [
   {...base,event:'persona_unlock'}, {...base,event:'persona_unlock',hidden:'true'},
   {...base,event:'poster_save',hidden:true,name:'private'}, {...base,event:'poster_save',hidden:false,game:'miniapp'},
   {...base,event:'persona_unlock',hidden:true,tier:'tier-1'}, {...base,event:'site_view',hidden:true}
  ])assert.equal((await x.post(bad)).status,400);
  const report=spawnSync(process.execPath,['scripts/tracking-report.mjs',x.dbPath,'30'],{encoding:'utf8'});
  assert.equal(report.status,0);const result=JSON.parse(report.stdout);
  assert.deepEqual(result.persona_events.persona_unlock.hidden,{events:1,anonymous_browsers:1});
  assert.deepEqual(result.persona_events.poster_save.normal,{events:1,anonymous_browsers:1});
  assert.match(result.note,/not long presses, successful saves or shares/);
  const db=new DatabaseSync(x.dbPath,{readOnly:true});try{
   const rows=db.prepare("SELECT hidden,page,source,game,tier FROM events WHERE event='persona_unlock' ORDER BY id").all();
   assert.deepEqual(rows.map(row=>row.hidden),[1,0]);assert.equal(rows[0].game,null);assert.equal(rows[0].tier,null);
  }finally{db.close()}
 }finally{await x.close()}
});

test('coarse activity samples and separated learning categories reject extra data',async()=>{
 const x=await setup();try{
  const base={played:false,ts:Date.now(),did:'a'.repeat(32)};
  assert.equal((await x.post({...base,event:'active_sample'})).status,202);
  for(const extra of [{page:'home'},{from:'home'},{game:'find'},{tier:'reply'},{target:'camp'},{hidden:true},{played:true},{text:'sensitive'}])assert.equal((await x.post({...base,event:'active_sample',...extra})).status,400);
  for(const game of ['find','library','jijiu'])assert.equal((await x.post({...base,event:'learn_view',page:'learn',game})).status,202);
  assert.equal((await x.post({...base,event:'learn_view',page:'learn',game:'input'})).status,400);
 }finally{await x.close()}
});
