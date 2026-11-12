import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {createServer,request as httpRequest} from 'node:http';
import {createProductionMiniUserApi} from '../server/production-mini-user.mjs';

test('WeChat identity isolation, persistent state, optimistic writes, avatar and session invalidation',async()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'ainpe-user-test-')),root=path.join(temp,'release'),dir=path.join(temp,'db');mkdirSync(root,{mode:0o700});mkdirSync(dir,{mode:0o700});let time=1700000000000;
 const api=createProductionMiniUserApi({root,dbPath:path.join(dir,'users.db'),publicOrigin:'https://example.test',appId:'wx64bff577b112626f',now:()=>time,exchangeCode:async code=>code==='invalid'?{errcode:40029}:{openid:'openid-'+code}});
 const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function request(route,{method='GET',data,token,raw,contentType='application/json',headers={}}={}){return new Promise((resolve,reject)=>{const req=httpRequest(base+route,{method,headers:{host:'example.test','x-forwarded-proto':'https','x-real-ip':'127.0.0.1',...(token?{authorization:'Bearer '+token}:{}),...(data||raw?{'content-type':contentType}:{}),...headers}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const bytes=Buffer.concat(chunks);resolve({status:res.statusCode,body:String(res.headers['content-type']||'').includes('application/json')?JSON.parse(bytes):bytes})})});req.on('error',reject);req.end(raw??(data?JSON.stringify(data):undefined))})}
 try{
  const trustedFrame='https://servicewechat.com/wx64bff577b112626f/devtools/page-frame.html';
  const wechatHeaders={'sec-fetch-site':'cross-site',referer:trustedFrame};
  assert.equal((await request('/api/mini-user/state',{headers:wechatHeaders})).status,401);
  const androidHeaders={...wechatHeaders,origin:'https://servicewechat.com'};
  assert.equal((await request('/api/mini-user/state',{headers:androidHeaders})).status,401);
  assert.equal((await request('/api/mini-auth/login',{method:'POST',data:{code:'invalid'},headers:androidHeaders})).status,401);
  assert.equal((await request('/api/mini-user/state',{headers:{...androidHeaders,referer:'https://servicewechat.com/wx64bff577b112626f/123/page-frame.html'}})).status,401);
  for(const referer of ['', 'https://servicewechat.com/wx0000000000000000/devtools/page-frame.html','https://servicewechat.com.evil.test/wx64bff577b112626f/devtools/page-frame.html','https://servicewechat.com/wx64bff577b112626f/devtools/page-frame.html/evil'])assert.equal((await request('/api/mini-user/state',{headers:{...androidHeaders,referer}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...androidHeaders,origin:'https://evil.test'}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...androidHeaders,origin:'https://example.test'}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,referer:'https://servicewechat.com/wx64bff577b112626f/123/page-frame.html'}})).status,401);
  for(const referer of ['', 'https://servicewechat.com/wx0000000000000000/devtools/page-frame.html','https://servicewechat.com.evil.test/wx64bff577b112626f/devtools/page-frame.html','https://servicewechat.com/wx64bff577b112626f/devtools/page-frame.html/evil'])assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,referer}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,origin:'https://evil.test'}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,host:'evil.test'}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,'x-forwarded-proto':'http'}})).status,403);
  assert.equal((await request('/api/mini-user/state',{headers:{...wechatHeaders,'x-real-ip':'invalid'}})).status,403);
  assert.equal((await request('/api/mini-auth/login',{method:'POST',data:{code:'invalid'}})).status,401);
  const a=await request('/api/mini-auth/login',{method:'POST',data:{code:'personA'}}), b=await request('/api/mini-auth/login',{method:'POST',data:{code:'personB'}});assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.body.accountId,b.body.accountId);
  assert.equal((await request('/api/mini-user/state',{token:a.body.token,headers:wechatHeaders})).status,200);
  const state={'ai':{v:1,xp:10,daily:{day:'2026-11-11'},lessons:{}},'favorites':['drama']};
  assert.equal((await request('/api/mini-user/state',{method:'PUT',token:a.body.token,data:{baseRevision:0,state}})).status,200);
  assert.equal((await request('/api/mini-user/state',{method:'PUT',token:a.body.token,data:{baseRevision:0,state}})).status,409);
  assert.deepEqual((await request('/api/mini-user/state',{token:b.body.token})).body.state,{});
  assert.equal((await request('/api/mini-user/state',{method:'PUT',token:a.body.token,data:{baseRevision:1,state:{'ainpe_mini_zuo_v1':{note:'private'}}}})).status,400);
  assert.equal((await request('/api/mini-user/state',{method:'PUT',token:a.body.token,data:{baseRevision:1,state:{potential:{answers:{question:'用户自由输入'}}}}})).status,400);
  assert.equal((await request('/api/mini-user/profile',{method:'PUT',token:a.body.token,data:{nickname:'小林'}})).status,200);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');const boundary='test-boundary';const raw=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),png,Buffer.from(`\r\n--${boundary}--\r\n`)]);
  assert.equal((await request('/api/mini-user/avatar',{method:'POST',token:a.body.token,raw,contentType:'multipart/form-data; boundary='+boundary})).status,200);
  assert.deepEqual((await request('/api/mini-user/avatar',{token:a.body.token})).body,png);assert.equal((await request('/api/mini-user/avatar',{token:b.body.token})).status,404);
  const a2=await request('/api/mini-auth/login',{method:'POST',data:{code:'personA'}});assert.equal(a2.body.accountId,a.body.accountId);assert.deepEqual((await request('/api/mini-user/state',{token:a2.body.token})).body.state,state);
  const reqId=randomUUID(),local={favorites:['local-guide']};const makeBackup=()=>request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:reqId,baseRevision:1,local}});
  const [backup,replay]=await Promise.all([makeBackup(),makeBackup()]);assert.equal(backup.status,200);assert.equal(replay.body.id,backup.body.id);
  assert.equal((await request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:reqId,baseRevision:1,local:{favorites:['another']}}})).body.error,'idempotency_conflict');
  const snapshot=await request('/api/mini-user/backups/'+backup.body.id,{token:a2.body.token});assert.deepEqual(snapshot.body.local,local);assert.deepEqual(snapshot.body.remote,state);
  assert.equal((await request('/api/mini-user/backups/'+backup.body.id,{token:b.body.token})).status,404);
  assert.equal((await request('/api/mini-user/backups/'+backup.body.id,{method:'DELETE',token:b.body.token})).status,404);
  assert.equal((await request('/api/mini-user/backups',{token:a2.body.token})).body.backups.length,1);
  const writes=await Promise.all([request('/api/mini-user/state',{method:'PUT',token:a2.body.token,data:{baseRevision:1,state:local}}),request('/api/mini-user/state',{method:'PUT',token:a2.body.token,data:{baseRevision:1,state}})]);assert.deepEqual(writes.map(x=>x.status).sort(),[200,409]);
  assert.equal((await request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:randomUUID(),baseRevision:1,local}})).body.error,'revision_conflict');
  assert.equal((await request('/api/mini-user/backups/'+backup.body.id,{method:'DELETE',token:a2.body.token})).status,200);
  let firstId='';for(let i=0;i<20;i++){const saved=await request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:randomUUID(),baseRevision:2,local}});assert.equal(saved.status,200);if(i===0)firstId=saved.body.id}
  assert.equal((await request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:randomUUID(),baseRevision:2,local}})).body.error,'backup_limit');
  assert.equal((await request('/api/mini-user/backups/'+firstId,{method:'DELETE',token:a2.body.token})).status,200);
  assert.equal((await request('/api/mini-user/backups',{method:'POST',token:a2.body.token,data:{requestId:randomUUID(),baseRevision:2,local}})).status,200);
  assert.equal((await request('/api/mini-auth/logout',{method:'POST',token:a.body.token})).status,200);assert.equal((await request('/api/mini-user/state',{token:a.body.token})).status,401);
  time+=31*86400000;assert.equal((await request('/api/mini-user/state',{token:a2.body.token})).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));api.close();rmSync(temp,{recursive:true,force:true})}
});
