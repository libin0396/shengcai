import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,request} from 'node:http';
import {createProductionMiniUserApi} from '../server/production-mini-user.mjs';
import {uploadMiniAvatar} from '../uni-app/src/data/mini-avatar.js';
test('synthetic avatar upload uses the live local API contract',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ainpe-avatar-test-')),root=join(dir,'root'),privateDir=join(dir,'private');mkdirSync(root,{mode:0o700});mkdirSync(privateDir,{mode:0o700});
 const api=createProductionMiniUserApi({root,dbPath:join(privateDir,'users.db'),publicOrigin:'https://example.test',appId:'wx64bff577b112626f',exchangeCode:async()=>({openid:'synthetic-test-user'})});
 const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 function call(route,method,data,headers={}){return new Promise((resolve,reject)=>{const q=request(base+route,{method,headers:{host:'example.test','x-forwarded-proto':'https','x-real-ip':'127.0.0.1',...headers}},r=>{const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>resolve({statusCode:r.statusCode,data:Buffer.concat(chunks)}))});q.on('error',reject);q.end(data)})}
 try{
  const response=await call('/api/mini-auth/login','POST',JSON.stringify({code:'synthetic'}),{'content-type':'application/json'});assert.equal(response.statusCode,200);const session=JSON.parse(response.data.toString());
  const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'),boundary='test-synthetic-boundary';
  const wxApi={getFileSystemManager:()=>({getFileInfo:o=>o.success({size:pixel.length})})};let saved=false;
  const platform={getImageInfo:o=>o.success({width:1,height:1}),uploadFile:o=>{const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${o.name}"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n`),pixel,Buffer.from(`\r\n--${boundary}--\r\n`)]);call('/api/mini-user/avatar','POST',body,{'content-type':'multipart/form-data; boundary='+boundary,authorization:o.header.Authorization}).then(o.success,o.fail)}};
  const result=await uploadMiniAvatar({platform,wxApi,url:'https://example.test/api/mini-user/avatar',auth:session.token,filePath:'synthetic-test-path',isCurrent:()=>true,onSaved:()=>{saved=true}});
  assert.equal(result.ok,true);assert.equal(saved,true);const state=await call('/api/mini-user/state','GET',null,{authorization:'Bearer '+session.token});assert.equal(JSON.parse(state.data.toString()).profile.hasAvatar,true);
 }finally{await new Promise(r=>server.close(r));api.close();rmSync(dir,{recursive:true,force:true})}
});
