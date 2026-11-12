import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,access} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';
import {request} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createProductionServer} from '../server/production.mjs';
import {createProductionMiniFeedbackApi} from '../server/production-mini-feedback.mjs';

const PASSWORD='local-mini-feedback-test';
async function setup(){
  const parent=await mkdtemp(path.join(tmpdir(),'ainpe-mini-feedback-')),root=path.join(parent,'release');
  await mkdir(path.join(root,'dist','client'),{recursive:true,mode:0o700});await writeFile(path.join(root,'dist','client','index.html'),'test');
  const pass=path.join(parent,'password.json'),salt=randomBytes(16);
  await writeFile(pass,JSON.stringify({version:1,algorithm:'scrypt',salt:salt.toString('base64url'),hash:scryptSync(PASSWORD,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).toString('base64url')}),{mode:0o600});
  const publicOrigin='https://ainpe.example',dbPath=path.join(parent,'ainpe-mini-feedback.sqlite');
  const server=await createProductionServer({root,reservation:{dbPath:path.join(parent,'reservations.sqlite'),publicOrigin},statsPasswordFile:pass});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  const defaults={host:'ainpe.example','x-forwarded-proto':'https','x-real-ip':'198.51.100.1','content-type':'application/json'};
  const call=(url,{method='POST',headers={},body}={})=>new Promise((resolve,reject)=>{const req=request(base+url,{method,headers:{...defaults,...headers}},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:data?JSON.parse(data):null,headers:res.headers}))});req.on('error',reject);if(body!==undefined)req.write(body);req.end()});
  const send=(data,headers={})=>call('/api/mini-feedback',{headers,body:JSON.stringify(data)});
  const login=async()=>{const r=await call('/api/admin/login',{headers:{origin:publicOrigin},body:JSON.stringify({password:PASSWORD})});assert.equal(r.status,200);return r.headers['set-cookie'][0].split(';')[0]};
  return {root,dbPath,server,call,send,login,close:async()=>{await new Promise(resolve=>server.close(resolve));await rm(parent,{recursive:true,force:true})}};
}

test('mini feedback is private, counted by fixed categories, and visible only to logged-in owner',async()=>{
  const x=await setup();try{
    assert.equal((await x.send({kind:'search',value:'miss'})).status,202);
    assert.equal((await x.send({kind:'search',value:'hit'})).status,202);
    assert.equal((await x.send({kind:'feedback',value:'drama'})).status,202);
    assert.equal((await x.send({kind:'message',value:'希望增加短剧示例'})).status,202);
    assert.equal((await x.call('/api/mini-feedback',{method:'GET'})).status,405);
    assert.equal((await x.call('/api/admin/feedback',{method:'GET'})).status,401);
    const cookie=await x.login(),read=await x.call('/api/admin/feedback',{method:'GET',headers:{cookie}});
    assert.equal(read.status,200);
    assert.match(read.body.items[0].message,/小程序近 30 天汇总.*搜索 2 次，未找到 1 次.*AI 短剧 1 次/);
    assert.ok(read.body.items.some(x=>x.message==='【小程序意见】希望增加短剧示例'));
    const db=new DatabaseSync(x.dbPath,{readOnly:true});const schema=db.prepare('PRAGMA table_info(daily_counts)').all().map(r=>r.name);db.close();
    assert.deepEqual(schema,['day','kind','value','count']);
    assert.equal((await x.call('/api/feedback',{headers:{origin:'https://attacker.example'},body:JSON.stringify({message:'旧端点不能被跨站绕过'})})).status,403);
  }finally{await x.close()}
});

test('rejects search text, extra fields, untrusted requests, invalid messages and oversized bodies',async()=>{
  const x=await setup();try{
    assert.equal((await x.send({kind:'search',value:'miss',query:'用户输入的搜索词'})).status,400);
    assert.equal((await x.send({kind:'search',value:'用户输入的搜索词'})).status,400);
    assert.equal((await x.send({kind:'feedback',value:'用户自填文本'})).status,400);
    assert.equal((await x.send({kind:'message',value:' '})).status,400);
    assert.equal((await x.send({kind:'message',value:'甲'.repeat(201)})).status,400);
    assert.equal((await x.send({kind:'message',value:'bad\u0000text'})).status,400);
    assert.equal((await x.send({kind:'search',value:'miss'},{origin:'https://attacker.example'})).status,403);
    assert.equal((await x.send({kind:'search',value:'miss'},{'x-real-ip':'bad'})).status,403);
    assert.equal((await x.call('/api/mini-feedback',{body:' '.repeat(2049)})).status,413);
    await assert.rejects(access(x.dbPath),{code:'ENOENT'});
  }finally{await x.close()}
});

test('mini feedback accepts the actual WeChat developer frame while rejecting untrusted cross-site requests',async()=>{
  const x=await setup();try{
    const headers={'sec-fetch-site':'cross-site',referer:'https://servicewechat.com/wx64bff577b112626f/devtools/page-frame.html'};
    assert.equal((await x.send({kind:'search',value:'miss'},headers)).status,202);
    assert.equal((await x.send({kind:'search',value:'hit'},{...headers,referer:'https://servicewechat.com/wx64bff577b112626f/123/page-frame.html'})).status,202);
    for(const referer of ['', 'https://servicewechat.com/wx0000000000000000/devtools/page-frame.html','https://servicewechat.com.evil.test/wx64bff577b112626f/devtools/page-frame.html','https://servicewechat.com/wx64bff577b112626f/devtools/page-frame.html/evil'])assert.equal((await x.send({kind:'search',value:'miss'},{...headers,referer})).status,403);
    assert.equal((await x.send({kind:'search',value:'miss'},{...headers,origin:'https://attacker.example'})).status,403);
    assert.equal((await x.send({kind:'search',value:'miss'},{...headers,host:'attacker.example'})).status,403);
    assert.equal((await x.send({kind:'search',value:'miss'},{...headers,'x-forwarded-proto':'http'})).status,403);
    assert.equal((await x.send({kind:'search',value:'miss'},{...headers,'x-real-ip':'bad'})).status,403);
    assert.equal((await x.call('/api/mini-feedback',{headers:{...headers,'content-type':'text/plain'},body:'{"kind":"search","value":"miss"}'})).status,415);
  }finally{await x.close()}
});

test('submissions are rate-limited and expired data is removed on restart',async()=>{
  const x=await setup();let restarted;try{
    for(let i=0;i<5;i++)assert.equal((await x.send({kind:'message',value:'建议 '+i})).status,202);
    assert.equal((await x.send({kind:'message',value:'超额建议'})).status,429);
    const db=new DatabaseSync(x.dbPath);db.prepare('INSERT INTO messages(message,created_at) VALUES(?,?)').run('过期意见',Date.now()-31*86400000);db.prepare('INSERT INTO daily_counts(day,kind,value,count) VALUES(?,?,?,?)').run(Math.floor(Date.now()/86400000)-31,'search','miss',20);db.close();
    await new Promise(resolve=>x.server.close(resolve));
    restarted=createProductionMiniFeedbackApi({root:x.root,dbPath:x.dbPath,publicOrigin:'https://ainpe.example'});
    const check=new DatabaseSync(x.dbPath,{readOnly:true});assert.equal(Number(check.prepare("SELECT COUNT(*) AS n FROM messages WHERE message='过期意见'").get().n),0);assert.equal(Number(check.prepare('SELECT COUNT(*) AS n FROM daily_counts').get().n),0);check.close();
  }finally{restarted?.close();if(x.server.listening)await x.close();else await rm(path.dirname(x.root),{recursive:true,force:true})}
});

test('mini frontend sends fixed events and submitted feedback, never the search text',async()=>{
  // Check the actual WeChat build: the source also contains the intentionally
  // unchanged H5 version behind uni-app conditional compilation.
  const {readFile}=await import('node:fs/promises');
  const template=await readFile('uni-app/dist/build/mp-weixin/pages/learn/find.wxml','utf8');
  const script=await readFile('uni-app/dist/build/mp-weixin/pages/learn/find.js','utf8');
  assert.match(template,/问题的解法没找到？/);
  assert.match(template,/<textarea\b[^>]*maxlength="30"[^>]*最多 30 字/);
  assert.match(template,/告诉我们你想用 AI 解决什么，我们会筛选合适的问题补充内容。/);
  assert.doesNotMatch(template,/搜索内容只在当前设备上匹配|请不要填写姓名、电话等个人信息|提交问题|最多 200 字/);
  assert.match(script,/\?"提交中…":"提交"/);
  assert.match(script,/\.length>30\?/);
  assert.match(script,/"search",[^,]*\?"hit":"miss"/);
  assert.match(script,/data:\{kind:[^,}]+,value:[^}]+\}/);
  assert.doesNotMatch(script,/data:\{[^}]*query/);
});
