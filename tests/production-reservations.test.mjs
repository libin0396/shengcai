import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {createServer, request as httpRequest} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createProductionReservationApi} from '../server/production-reservations.mjs';

function localFetch(url,options={}){return new Promise((resolve,reject)=>{const q=httpRequest(url,{method:options.method||'GET',headers:options.headers||{}},r=>{let body='';r.setEncoding('utf8');r.on('data',x=>body+=x);r.on('end',()=>resolve({status:r.statusCode,headers:{get:k=>Array.isArray(r.headers[k])?r.headers[k][0]:r.headers[k]},json:async()=>JSON.parse(body)}))});q.on('error',reject);if(options.body)q.write(options.body);q.end()})}

test('production reservations reject cross-site and deduplicate browser',async()=>{
 const parent=await mkdtemp(path.join(tmpdir(),'ainpe-prod-'));const root=path.join(parent,'release');await mkdir(root);
 const api=createProductionReservationApi({root,dbPath:path.join(parent,'reservations.sqlite'),publicOrigin:'https://ainpe.example',isProjectAllowed:()=>true});
 const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 const request=async(method,body,cookie,headers={})=>localFetch(`http://127.0.0.1:${port}/api/reservations`,{method,headers:{host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1',...(method==='POST'?{origin:'https://ainpe.example','content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await request('POST',{projectId:'article:123'})).status,428);
  assert.equal((await request('POST',{projectId:'article:123'},'__Host-ainpe_reservation='+('x'.repeat(43)))).status,428);
  assert.equal((await request('GET',null,null,{'x-real-ip':'not-an-ip'})).status,403);
  let r=await request('GET');assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/; Secure;/);assert.match(cookie,/; HttpOnly;/);assert.match(cookie,/; SameSite=Strict/);
  assert.equal((await request('POST',{projectId:'article:123'},cookie,{origin:'https://evil.example'})).status,403);
  assert.equal((await request('POST',{projectId:'article:123'},cookie,{'x-forwarded-proto':'http'})).status,403);
  assert.equal((await request('POST',{projectId:'evil'},cookie)).status,404);
  for(let i=0;i<2;i++){r=await request('POST',{projectId:'article:123'},cookie);assert.equal(r.status,200);assert.equal((await r.json()).count,1);}
  for(const projectId of ['voyage-office','voyage-enterprise']){r=await request('POST',{projectId},cookie);assert.equal(r.status,200);assert.equal((await r.json()).count,1);}
  r=await request('GET',null,cookie);let data=await r.json();assert.equal(data.countUnit,'browser');assert.equal(data.counts['article:123'],1);assert.deepEqual(data.mine,['article:123','voyage-enterprise','voyage-office']);
  let last;for(let i=0;i<45;i++)last=await request('GET',null,cookie);assert.equal(last.status,429);
  for(let i=0;i<130;i++)last=await request('GET');assert.equal(last.status,429);
  assert.equal((await request('GET',null,null,{'x-real-ip':'198.51.100.2'})).status,200);
  const noadmin=await localFetch(`http://127.0.0.1:${port}/api/reservations/admin`);assert.equal(noadmin.status,404);
 }finally{server.close();api.close();await rm(parent,{recursive:true,force:true});}
});

test('unavailable database fails closed without a fabricated count',async()=>{
 const parent=await mkdtemp(path.join(tmpdir(),'ainpe-prod-'));const root=path.join(parent,'release');await mkdir(root);await mkdir(path.join(parent,'blocked'));
 const api=createProductionReservationApi({root,dbPath:path.join(parent,'blocked'),publicOrigin:'https://ainpe.example'});const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const r=await localFetch(`http://127.0.0.1:${server.address().port}/api/reservations`,{headers:{host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1'}});assert.equal(r.status,503);assert.equal((await r.json()).error,'reservation_unavailable');}finally{server.close();api.close();await rm(parent,{recursive:true,force:true});}
});

test('bounded expiration cleanup preserves reservations and recent sessions',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const parent=await mkdtemp(path.join(tmpdir(),'ainpe-clean-'));const root=path.join(parent,'release');await mkdir(root);const dbPath=path.join(parent,'reservations.sqlite');
 const db=new DatabaseSync(dbPath);db.exec('CREATE TABLE sessions (browser_hash TEXT PRIMARY KEY, created_at TEXT NOT NULL) WITHOUT ROWID; CREATE TABLE reservations(project_id TEXT NOT NULL,browser_hash TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(project_id,browser_hash)) WITHOUT ROWID');
 const insert=db.prepare('INSERT INTO sessions VALUES(?,?)');for(let i=0;i<501;i++)insert.run(`old-${i}`,'2020-01-01T00:00:00.000Z');insert.run('recent',new Date().toISOString());db.prepare('INSERT INTO reservations VALUES(?,?,?)').run('voyage-agent','old-0','2020-01-01T00:00:00.000Z');db.close();
 const api=createProductionReservationApi({root,dbPath,publicOrigin:'https://ainpe.example'});const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  let r=await localFetch(`http://127.0.0.1:${server.address().port}/api/reservations`,{headers:{host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.3'}});assert.equal(r.status,200);assert.equal((await r.json()).counts['voyage-agent'],1);
  const verify=new DatabaseSync(dbPath);try{assert.equal(verify.prepare("SELECT count(*) AS n FROM sessions WHERE created_at='2020-01-01T00:00:00.000Z'").get().n,1);assert.equal(verify.prepare("SELECT count(*) AS n FROM sessions WHERE browser_hash='recent'").get().n,1);assert.equal(verify.prepare('SELECT count(*) AS n FROM reservations').get().n,1);}finally{verify.close()}
 }finally{server.close();api.close();await rm(parent,{recursive:true,force:true})}
});
