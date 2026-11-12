import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createServer,request as httpRequest} from 'node:http';
import {createProductionMiniUserApi} from '../server/production-mini-user.mjs';
const tmp=mkdtempSync(join(tmpdir(),'ainpe-integration-')),root=join(tmp,'root'),dir=join(tmp,'data');mkdirSync(root,{mode:0o700});mkdirSync(dir,{mode:0o700});
const api=createProductionMiniUserApi({root,dbPath:join(dir,'users.db'),publicOrigin:'https://example.test',appId:'wx64bff577b112626f',exchangeCode:async()=>({openid:'mock-openid'})});
const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const mem=new Map();let token='';const base=`http://127.0.0.1:${server.address().port}`;
function apiRequest(route,method='GET',body,auth=''){return new Promise((resolve,reject)=>{const q=httpRequest(base+route,{method,headers:{host:'example.test','x-forwarded-proto':'https','x-real-ip':'127.0.0.1',...(auth?{authorization:auth}:{}),...(body?{'content-type':'application/json'}:{})}},r=>{const parts=[];r.on('data',x=>parts.push(x));r.on('end',()=>{const text=Buffer.concat(parts).toString();resolve({statusCode:r.statusCode,data:JSON.parse(text||'{}')})})});q.on('error',reject);q.end(body?JSON.stringify(body):undefined)})}
globalThis.wx={getRandomValues:o=>o.success({randomValues:Uint8Array.from(randomBytes(o.length)).buffer})};
globalThis.uni={getStorageSync:k=>mem.get(k),setStorageSync:(k,v)=>mem.set(k,JSON.parse(JSON.stringify(v))),removeStorageSync:k=>mem.delete(k),login:o=>o.success({code:'fake-code'}),showModal:o=>o.success({confirm:true}),downloadFile:o=>o.success({statusCode:404}),request:o=>{const route=new URL(o.url).pathname;const auth=o.header?.Authorization||'';if(auth)token=auth;apiRequest(route,o.method,o.data,auth).then(o.success,o.fail)}};
try{const m=await import('../uni-app/src/data/mini-account.js?integration');await m.loginAccount();assert.equal(m.account.value.loggedIn,true);
 mem.set('ainpe_mini_ai_level_v1',{v:1,xp:10,daily:{first:'2026-11-10'},lessons:{}});await m.syncAccount();
 const local=structuredClone(mem.get('ainpe_mini_ai_level_v1'));local.xp=25;local.daily.same='2026-11-11';mem.set('ainpe_mini_ai_level_v1',local);
 const cloud=await apiRequest('/api/mini-user/state','GET',undefined,token);cloud.data.state.ai.xp=20;cloud.data.state.ai.daily.same='2026-11-11';assert.equal((await apiRequest('/api/mini-user/state','PUT',{baseRevision:cloud.data.revision,state:cloud.data.state},token)).statusCode,200);
 await m.syncAccount();assert.match(m.account.value.status,/冲突/);await m.inspectAccountConflict();assert.equal(m.conflictView.value.choices[0].summary.xp,25);assert.equal(m.conflictView.value.choices[1].summary.xp,20);
 assert.equal(await m.chooseAccountResolution('remote'),true);assert.equal(mem.get('ainpe_mini_ai_level_v1').xp,20);await m.loadAccountBackups();assert.equal(m.accountBackups.value.length,1);const id=m.accountBackups.value[0].id;
 await m.inspectAccountBackup(id,'local');assert.equal(await m.chooseAccountResolution('restore'),true);assert.equal(mem.get('ainpe_mini_ai_level_v1').xp,25);const final=await apiRequest('/api/mini-user/state','GET',undefined,token);assert.equal(final.data.state.ai.xp,25);
 console.log('PASS: real local API, conflict, both backups, explicit selection and restoration');
}finally{await new Promise(r=>server.close(r));api.close();rmSync(tmp,{recursive:true,force:true})}
