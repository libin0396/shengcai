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
