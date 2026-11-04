import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {createServer,request} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createProductionBoardApi} from '../server/production-board.mjs';
import {createProductionServer} from '../server/production.mjs';

function week(time=Date.now()){const d=new Date(time+8*3600000);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=d.getUTCFullYear();return y+'-'+String(Math.ceil((((d-new Date(Date.UTC(y,0,1)))/86400000)+1)/7)).padStart(2,'0')}
function fetchLocal(url,{method='GET',headers={},body}={}){return new Promise((resolve,reject)=>{const req=request(url,{method,headers:{...headers,...(body!==undefined?{'content-length':Buffer.byteLength(body)}:{})}},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:data?JSON.parse(data):null}));});req.on('error',reject);if(body!==undefined)req.write(body);req.end()})}
async function setup(){const parent=await mkdtemp(path.join(tmpdir(),'ainpe-board-'));const root=path.join(parent,'release');await mkdir(root,{mode:0o700});const dbPath=path.join(parent,'board.sqlite');const api=createProductionBoardApi({root,dbPath,publicOrigin:'https://ainpe.example'});const server=createServer((req,res)=>api.middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/api/board/miniapp/${week()}`;const headers={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1',origin:'https://ainpe.example','content-type':'application/json'};return {parent,root,dbPath,api,url,headers,send:(method,body,extra={},suffix='')=>fetchLocal(url+suffix,{method,headers:{...headers,...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})}),close:async()=>{await new Promise(r=>server.close(r));api.close();await rm(parent,{recursive:true,force:true})}}}
const rec=(nickname='玩家甲',profit=100,tier=2)=>({nickname,personaIndex:null,resultTier:tier,profit,choices:'01234',wildIndex:1});

test('opt-in entries rank, do not expose tokens and can be deleted only with the correct token',async()=>{const x=await setup();try{
 let a=await x.send('POST',rec());assert.equal(a.status,201);assert.equal(a.body.rank,1);assert.match(a.body.deleteToken,/^[a-f0-9]{64}$/);
 let b=await x.send('POST',rec('玩家乙',300,1));assert.equal(b.status,201);assert.equal(b.body.rank,1);
 let list=await x.send('GET');assert.equal(list.status,200);assert.equal(list.body.total,2);assert.equal(list.body.entries[0].nickname,'玩家乙');assert.match(list.body.notice,/未经验证/);assert.equal(JSON.stringify(list.body).includes(a.body.deleteToken),false);
 assert.equal((await x.send('DELETE',{deleteToken:'0'.repeat(64)},{},'/'+a.body.entryId)).status,404);
 assert.equal((await x.send('DELETE',{deleteToken:a.body.deleteToken},{},'/'+a.body.entryId)).status,200);
 assert.equal((await x.send('GET')).body.total,1);
 }finally{await x.close()}});

test('rejects cross-site traffic, invalid records, unapproved games and old weeks',async()=>{const x=await setup();try{
 assert.equal((await x.send('POST',rec(),{origin:'https://evil.example'})).status,403);
 assert.equal((await x.send('POST',{...rec(),nickname:'<img>'})).status,400);
 assert.equal((await x.send('POST',{...rec(),nickname:'加微信'})).status,400);
 assert.equal((await x.send('POST',{...rec(),profit:Infinity})).status,400);
 assert.equal((await fetchLocal(x.url.replace('/miniapp/','/other/'),{headers:x.headers})).status,404);
 assert.equal((await fetchLocal(x.url.replace(week(),'2020-01'),{headers:x.headers})).status,404);
 }finally{await x.close()}});

test('submission rate limit and private release-independent database',async()=>{const x=await setup();try{
 for(let i=0;i<3;i++)assert.equal((await x.send('POST',rec('玩家'+i))).status,201);
 assert.equal((await x.send('POST',rec('玩家四'))).status,429);
 assert.throws(()=>createProductionBoardApi({root:x.root,dbPath:path.join(x.root,'board.sqlite'),publicOrigin:'https://ainpe.example'}),/outside_release/);
 }finally{await x.close()}});

test('expired entries are not displayed',async()=>{const x=await setup();try{
 assert.equal((await x.send('POST',rec())).status,201);x.api.close();const db=new DatabaseSync(x.dbPath);db.exec('UPDATE board SET created_at=0');db.close();
 const list=await x.send('GET');assert.equal(list.status,200);assert.equal(list.body.total,0);assert.deepEqual(list.body.entries,[]);
 }finally{await x.close()}});

test('a previous-week entry can be deleted with its token during the retention period',async()=>{const x=await setup();try{
 const r=await x.send('POST',rec());assert.equal(r.status,201);x.api.close();const previous=week(Date.now()-7*86400000);
 const db=new DatabaseSync(x.dbPath);db.prepare('UPDATE board SET week=? WHERE id=?').run(previous,r.body.entryId);db.close();
 const oldUrl=x.url.replace(week(),previous);assert.equal((await fetchLocal(oldUrl,{headers:x.headers})).status,404);
 assert.equal((await fetchLocal(oldUrl+'/'+r.body.entryId,{method:'DELETE',headers:x.headers,body:JSON.stringify({deleteToken:r.body.deleteToken})})).status,200);
 }finally{await x.close()}});

test('production server routes board and tracking through the configured proxy',async()=>{
 const parent=await mkdtemp(path.join(tmpdir(),'ainpe-prod-routes-')),root=path.join(parent,'release'),dist=path.join(root,'dist','client');
 await mkdir(dist,{recursive:true});await writeFile(path.join(dist,'index.html'),'<!doctype html>');
 const server=await createProductionServer({root,staticRoot:dist,reservation:{dbPath:path.join(parent,'reservations.sqlite'),publicOrigin:'https://ainpe.example'}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`,headers={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.9',origin:'https://ainpe.example','content-type':'application/json'};
 try{
  assert.equal((await fetchLocal(base+'/api/board/miniapp/'+week(),{headers})).status,200);
  assert.equal((await fetchLocal(base+'/api/track',{method:'POST',headers,body:JSON.stringify({event:'site_view',played:false,ts:Date.now(),did:'a'.repeat(32)})})).status,202);
 }finally{await new Promise(r=>server.close(r));await rm(parent,{recursive:true,force:true})}
});
