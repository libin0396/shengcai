import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createProductionMiniUserApi } from '../server/production-mini-user.mjs';

test('growth state is validated, isolated, revisioned, and retained by older clients', async () => {
  const temp=mkdtempSync(path.join(os.tmpdir(),'ainpe-growth-api-'));
  const root=path.join(temp,'release'), dir=path.join(temp,'db');
  mkdirSync(root,{mode:0o700}); mkdirSync(dir,{mode:0o700});
  const api=createProductionMiniUserApi({root,dbPath:path.join(dir,'users.db'),publicOrigin:'https://example.test',appId:'wx64bff577b112626f',exchangeCode:async code=>({openid:'test-'+code})});
  const server=createServer((q,s)=>api.middleware(q,s,()=>{s.statusCode=404;s.end()}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function req(route,{method='GET',data,token}={}) {
    return await new Promise((resolve,reject)=>{
      const q=httpRequest(base+route,{method,headers:{host:'example.test','x-forwarded-proto':'https','x-real-ip':'127.0.0.1',...(token?{authorization:'Bearer '+token}:{}),...(data?{'content-type':'application/json'}:{})}},s=>{
        let body='';s.on('data',x=>body+=x);s.on('end',()=>resolve({status:s.statusCode,body:JSON.parse(body)}));
      });
      q.on('error',reject);q.end(data?JSON.stringify(data):undefined);
    });
  }
  try {
    const a=await req('/api/mini-auth/login',{method:'POST',data:{code:'a'}}), b=await req('/api/mini-auth/login',{method:'POST',data:{code:'b'}});
    assert.equal(a.status,200);assert.equal(b.status,200);
    const growth={v:1,cards:[{id:'card_1',at:'2026-11-12',mark:0}],log:['l:first','s:card_1'],guides:{guide:'2026-11-12'},shares:{card_1:'2026-11-12'},shown:1,old:false,oldSeen:false};
    const write=(token,baseRevision,state)=>req('/api/mini-user/state',{method:'PUT',token,data:{baseRevision,state}});
    assert.equal((await write(a.body.token,0,{growth,favorites:['first']})).status,200);
    assert.deepEqual((await req('/api/mini-user/state',{token:b.body.token})).body.state,{});
    assert.equal((await write(a.body.token,0,{favorites:[]})).status,409);
    assert.equal((await write(a.body.token,1,{favorites:['second']})).status,200);
    const saved=(await req('/api/mini-user/state',{token:a.body.token})).body;
    assert.deepEqual(saved.state.growth,growth);
    assert.deepEqual(saved.state.favorites,['second']);
    assert.equal((await write(a.body.token,2,{growth:{...growth,privateInput:'should-not-be-stored'}})).status,400);
    assert.equal((await write(a.body.token,2,{growth:{...growth,log:['l:first','l:first']}})).status,400);
    assert.deepEqual((await req('/api/mini-user/state',{token:a.body.token})).body.state.growth,growth);
  } finally {
    await new Promise(resolve=>server.close(resolve));api.close();rmSync(temp,{recursive:true,force:true});
  }
});
