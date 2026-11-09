import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,access} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';
import {createServer,request} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createProductionFeedbackApi} from '../server/production-feedback.mjs';
import {createProductionStatsApi} from '../server/production-stats.mjs';

const PASSWORD='local-feedback-test';
async function setup(){
  const parent=await mkdtemp(path.join(tmpdir(),'ainpe-feedback-')),root=path.join(parent,'release');await mkdir(root,{mode:0o700});
  const pass=path.join(parent,'password.json'),dbPath=path.join(parent,'feedback.sqlite'),salt=randomBytes(16);
  const cfg={version:1,algorithm:'scrypt',salt:salt.toString('base64url'),hash:scryptSync(PASSWORD,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).toString('base64url')};
  await writeFile(pass,JSON.stringify(cfg),{mode:0o600});
  const publicOrigin='https://ainpe.example',feedback=createProductionFeedbackApi({root,dbPath,publicOrigin});
  const stats=createProductionStatsApi({root,dbPath:path.join(parent,'tracking.sqlite'),publicOrigin,passwordFile:pass,feedback});
  const server=createServer((req,res)=>stats.middleware(req,res,()=>feedback.middleware(req,res,()=>{res.writeHead(404);res.end()})));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  const defaults={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1',origin:publicOrigin,'content-type':'application/json'};
  const call=(url,{method='GET',headers={},body}={})=>new Promise((resolve,reject)=>{const req=request(base+url,{method,headers:{...defaults,...headers}},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:data?JSON.parse(data):null,headers:res.headers}))});req.on('error',reject);if(body!==undefined)req.write(body);req.end()});
  const login=async()=>{const r=await call('/api/admin/login',{method:'POST',body:JSON.stringify({password:PASSWORD})});assert.equal(r.status,200);return r.headers['set-cookie'][0].split(';')[0]};
  return {root,dbPath,feedback,call,login,close:async()=>{await new Promise(resolve=>server.close(resolve));stats.close();feedback.close();await rm(parent,{recursive:true,force:true})}};
}

test('feedback is private, separately stored, and readable only after admin login',async()=>{
  const x=await setup();try{
    const message='<script>window.bad=1</script> 建议增加短剧教程';
    const sent=await x.call('/api/feedback',{method:'POST',body:JSON.stringify({message})});assert.equal(sent.status,202);assert.deepEqual(sent.body,{ok:true});
    assert.equal((await x.call('/api/admin/feedback')).status,401);
    const cookie=await x.login(),read=await x.call('/api/admin/feedback',{headers:{cookie}});
    assert.equal(read.status,200);assert.equal(read.body.retentionDays,30);assert.equal(read.body.items.length,1);assert.equal(read.body.items[0].message,message);
    assert.deepEqual(Object.keys(read.body.items[0]).sort(),['createdAt','message']);
    assert.equal((await x.call('/api/admin/feedback?unexpected=1',{headers:{cookie}})).status,400);
  }finally{await x.close()}
});

test('unused feedback store is not created on service startup',async()=>{
  const x=await setup();try{await assert.rejects(access(x.dbPath),{code:'ENOENT'})}finally{await x.close()}
});

test('admin can read submitted feedback even with no tracking database',async()=>{
  const x=await setup();try{
    assert.equal((await x.call('/api/feedback',{method:'POST',body:JSON.stringify({message:'只提交意见'})})).status,202);
    const cookie=await x.login(),stats=await x.call('/api/admin/stats',{headers:{cookie}}),feedback=await x.call('/api/admin/feedback',{headers:{cookie}});
    assert.equal(stats.status,200);assert.equal(stats.body.available,false);assert.equal(feedback.status,200);assert.equal(feedback.body.items[0].message,'只提交意见');
  }finally{await x.close()}
});

test('feedback validates fields, length, method and same-origin trusted proxy',async()=>{
  const x=await setup();try{
    const send=(v,headers={})=>x.call('/api/feedback',{method:'POST',headers,body:JSON.stringify(v)});
    assert.equal((await send({message:'测试',extra:'查询原文'})).status,400);
    assert.equal((await send({message:' '})).status,400);
    assert.equal((await send({message:'甲'.repeat(201)})).status,400);
    assert.equal((await send({message:'a\u0000b'})).status,400);
    assert.equal((await send({message:'测试'},{origin:'https://attacker.example'})).status,403);
    assert.equal((await send({message:'测试'},{'x-real-ip':'bad'})).status,403);
    assert.equal((await x.call('/api/feedback',{method:'GET'})).status,405);
    assert.equal((await send({message:'甲'.repeat(200)},{'x-real-ip':'198.51.100.2'})).status,202);
  }finally{await x.close()}
});

test('feedback submissions are bounded per IP',async()=>{
  const x=await setup();try{
    for(let i=0;i<5;i++)assert.equal((await x.call('/api/feedback',{method:'POST',body:JSON.stringify({message:'建议 '+i})})).status,202);
    assert.equal((await x.call('/api/feedback',{method:'POST',body:JSON.stringify({message:'another'})})).status,429);
  }finally{await x.close()}
});

test('admin cannot read expired feedback, and expired records are pruned',async()=>{
  const x=await setup();try{
    x.feedback.list();const db=new DatabaseSync(x.dbPath),now=Date.now();
    const add=db.prepare('INSERT INTO feedback(message,created_at) VALUES(?,?)');add.run('旧意见',now-31*86400000);add.run('近期意见',now-2*86400000);db.close();
    const cookie=await x.login(),res=await x.call('/api/admin/feedback',{headers:{cookie}});
    assert.deepEqual(res.body.items.map(v=>v.message),['近期意见']);
    x.feedback.close();x.feedback.list();const check=new DatabaseSync(x.dbPath,{readOnly:true});assert.equal(Number(check.prepare('SELECT COUNT(*) AS n FROM feedback').get().n),1);check.close();
  }finally{await x.close()}
});

test('service restart prunes an existing expired store without waiting for a request',async()=>{
  const x=await setup();let restarted;
  try{
    x.feedback.list();const db=new DatabaseSync(x.dbPath),now=Date.now();
    db.prepare('INSERT INTO feedback(message,created_at) VALUES(?,?)').run('过期意见',now-31*86400000);db.close();x.feedback.close();
    restarted=createProductionFeedbackApi({root:x.root,dbPath:x.dbPath,publicOrigin:'https://ainpe.example'});
    const check=new DatabaseSync(x.dbPath,{readOnly:true});assert.equal(Number(check.prepare('SELECT COUNT(*) AS n FROM feedback').get().n),0);check.close();
  }finally{restarted?.close();await x.close()}
});
