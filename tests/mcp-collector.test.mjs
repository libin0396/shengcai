import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,stat,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {collectMcpInput,saveMcpInput} from '../scripts/mcp-collector.mjs';

const now=Date.parse('2026-11-03T04:31:00Z');
const result=body=>({structuredContent:body,content:[]});
const oneParty=(id='101')=>({partyId:id,name:'AI 活动',partyStatus:'APPROVED',startTime:1793800000,url:'https://scys.com/meeting/detail?id=101',personalContact:'not allowed',nested:{secret:'not allowed'}});
const oneTopic=(id='201')=>({topicDTO:{entityId:id,entityType:'xq_topic',showTitle:'AI 实践',articleContent:'摘要',gmtCreate:1793600000,isDigested:false,internal:'not allowed'},topicUserDTO:{name:'圈友',avatar:'https://search01.shengcaiyoushu.com/a',email:'not allowed'},detailUrl:'https://scys.com/articleDetail/xq_topic/201',hidden:'not allowed'});
function clientFor(handler) {const calls=[];return {calls,client:{async callTool(input){calls.push(input);return handler(input);}}};}

test('complete future events and bounded article samples use exact read-only queries and field allowlists',async()=>{
  const {calls,client}=clientFor(({name,arguments:a})=>{
    if(name==='listMenu')return result({items:[{menuName:'AI',menuId:'2488550'},{menuName:'AI视频',menuId:'2882664'}]});
    if(name==='searchParties')return result(a.pageIndex===1?{items:[oneParty('101')],hasNext:true}:{items:[oneParty('102')],hasNext:false});
    if(name==='searchTopic'){
      if(a.keyword==='FDE')return result({items:[oneTopic('205')],total:1});
      if(a.includeMenuIdList?.[0]==='2882664')return result({items:[oneTopic('206')],total:1});
      if(a.isHot)return result({items:[oneTopic('204')],total:1});
      return result(a.pageIndex===1?{items:Array.from({length:10},(_,i)=>oneTopic(String(300+i))),total:11}:{items:[oneTopic('203')],total:11});
    }
    throw new Error('unexpected');
  });
  const input=await collectMcpInput({client,clock:()=>now});
  assert.equal(input.now,'2026-11-03T04:31:00.000Z');
  assert.deepEqual(input.events.map(x=>x.partyId),['101','102']);
  assert.equal(input.latest.length,11);assert.equal(input.hot.length,1);
  assert.deepEqual(input.topicArticles.map(x=>[x.slug,x.items.length]),[['fde',1],['ai-video',1]]);
  assert.equal(input.events[0].personalContact,undefined);assert.equal(input.events[0].nested,undefined);
  assert.equal(input.latest[0].hidden,undefined);assert.equal(input.latest[0].topicDTO.internal,undefined);assert.equal(input.latest[0].topicUserDTO.email,undefined);
  assert.equal(calls.filter(c=>c.name==='searchParties').length,2);
  for(const call of calls.filter(c=>c.name==='searchTopic')) {
    assert.equal(call.arguments.displayMode,1);assert.equal(call.arguments.pageSize,10);assert.equal(call.arguments.orderBy,'gmt_create');
    assert.equal(call.arguments.gmtCreateStart,Math.floor(now/1000)-30*86400);
  }
  assert.deepEqual(calls.filter(c=>c.name==='searchTopic' && c.arguments.isHot).map(c=>c.arguments.includeMenuIdList),[['2488550']]);
});

test('missing or ambiguous menu IDs use explicit keywords rather than stale guessed tags',async()=>{
  const {calls,client}=clientFor(({name})=>name==='listMenu'?result({items:[{name:'AI',id:'1'},{name:'AI',id:'2'}]}):name==='searchParties'?result({items:[],hasNext:false}):result({items:[],total:0}));
  await collectMcpInput({client,clock:()=>now});
  const topics=calls.filter(c=>c.name==='searchTopic').map(c=>c.arguments);
  assert.deepEqual(topics.map(c=>c.keyword),['AI','AI','FDE','AI视频']);
  assert.ok(topics.every(c=>!c.includeMenuIdList));
});

test('string menu arrays survive the allowlist, and unsafe menu identifiers fail closed',async()=>{
  for(const [ids,expected] of [[['2882664',123],['2882664','123']],[[Number.MAX_SAFE_INTEGER+2],null]]) {
    const item=oneTopic();item.topicDTO.menuIds=ids;
    const {client}=clientFor(({name})=>name==='listMenu'?result({items:[]}):name==='searchParties'?result({items:[],hasNext:false}):result({items:[item],total:1}));
    if(expected)assert.deepEqual((await collectMcpInput({client,clock:()=>now})).latest[0].topicDTO.menuIds,expected);
    else await assert.rejects(collectMcpInput({client,clock:()=>now}),e=>e.code==='INVALID_ID');
  }
});

test('missing pagination proof and a truncated twentieth events page fail closed',async()=>{
  for(const bad of [undefined,true]) {
    const {calls,client}=clientFor(({name})=>name==='listMenu'?result({items:[]}):result({items:bad?[oneParty()]:[],...(bad===undefined?{}:{hasNext:true})}));
    await assert.rejects(collectMcpInput({client,clock:()=>now}),e=>e.code===(bad?'PAGINATION_INCOMPLETE':'PAGINATION_UNVERIFIED'));
    assert.equal(calls.filter(c=>c.name==='searchParties').length,bad?20:1);
    assert.equal(calls.some(c=>c.name==='searchTopic'),false);
  }
});

test('conflicting event total and hasNext cannot silently discard upcoming events',async()=>{
  const {client}=clientFor(({name})=>name==='listMenu'?result({items:[]}):result({items:[oneParty()],total:21,hasNext:false}));
  await assert.rejects(collectMcpInput({client,clock:()=>now}),e=>e.code==='PAGINATION_UNVERIFIED');
});

test('article pagination uses actual total, keeps sample bounds, and rejects absent or contradictory totals',async()=>{
  const page=Array.from({length:10},(_,i)=>oneTopic(String(500+i)));
  const bounded=clientFor(({name})=>name==='listMenu'?result({items:[]}):name==='searchParties'?result({items:[],hasNext:false}):result({items:page,total:100}));
  const input=await collectMcpInput({client:bounded.client,clock:()=>now});
  assert.equal(input.latest.length,30);assert.equal(input.hot.length,30);
  assert.equal(input.topicArticles[0].items.length,10);assert.equal(input.topicArticles[1].items.length,20);
  for(const invalid of [{items:[]},{items:[],total:15},{items:page,total:'100'}]) {
    const {client}=clientFor(({name})=>name==='listMenu'?result({items:[]}):name==='searchParties'?result({items:[],hasNext:false}):result(invalid));
    await assert.rejects(collectMcpInput({client,clock:()=>now}),e=>['PAGINATION_UNVERIFIED','INVALID_RESPONSE'].includes(e.code));
  }
});

test('server-provided rate-limit delay is honored and retries are bounded',async()=>{
  let attempts=0;const sleeps=[];
  const {client}=clientFor(({name})=>{
    if(name==='listMenu' && attempts++===0)return {isError:true,structuredContent:{code:'MCP_RATE_LIMITED',retryAfterSeconds:2.5}};
    return name==='listMenu'?result({items:[]}):name==='searchParties'?result({items:[],hasNext:false}):result({items:[],total:0});
  });
  await collectMcpInput({client,clock:()=>now,sleep:async ms=>sleeps.push(ms)});
  assert.deepEqual(sleeps,[2500]);assert.equal(attempts,2);
  const limited=clientFor(()=>({isError:true,structuredContent:{code:'MCP_RATE_LIMITED',retryAfterSeconds:1}}));
  await assert.rejects(collectMcpInput({client:limited.client,clock:()=>now,sleep:async()=>{},maxRateRetries:1}),e=>e.code==='RATE_LIMITED');
  assert.equal(limited.calls.length,2);
});

test('errors, malformed payloads and unsafe numeric IDs fail without leaking response content',async()=>{
  const badClients=[
    clientFor(()=>{throw new Error('private response should never be printed');}).client,
    clientFor(()=>({isError:true,structuredContent:{code:'AUTH_FAILED',details:'private response'}})).client,
    clientFor(()=>result({})).client,
    clientFor(({name})=>name==='listMenu'?result({items:[]}):result({items:[oneParty(Number.MAX_SAFE_INTEGER+2)],hasNext:false})).client,
  ];
  for(const client of badClients)await assert.rejects(collectMcpInput({client,clock:()=>now}),e=>e instanceof Error && !e.message.includes('private'));
});

test('unapproved query plans fail before any MCP call',async()=>{
  const {client,calls}=clientFor(()=>result({items:[]}));
  await assert.rejects(collectMcpInput({client,clock:()=>now,plan:{lookbackDays:365,articlePages:3,pageSize:10,topicPages:2,maximumActivityPages:20}}),e=>e.code==='INVALID_QUERY_PLAN');
  assert.equal(calls.length,0);
});

test('MCP text JSON is supported and long-running collections are rejected',async()=>{
  const textClient=clientFor(({name})=>({content:[{type:'text',text:JSON.stringify(name==='listMenu'?{items:[]}:name==='searchParties'?{items:[],hasNext:false}:{items:[],total:0})}]}));
  let n=0;await assert.rejects(collectMcpInput({client:textClient.client,clock:()=>now+(n++?31*60*1000:0)}),e=>e.code==='COLLECTION_EXPIRED');
});

test('complete staging input is atomically replaced with owner-only file mode',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'ainpe-collector-'));try{
    const dir=path.join(root,'staging');const input={now:new Date(now).toISOString(),events:[],latest:[],hot:[],topicArticles:[{slug:'fde',items:[]},{slug:'ai-video',items:[]}]};
    const file=await saveMcpInput(input,dir);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),input);
    assert.equal((await stat(file)).mode&0o777,0o600);
    await writeFile(file,'old','utf8');
    await assert.rejects(saveMcpInput({...input,events:[{...oneParty(),description:'x'.repeat(4*1024*1024)}]},dir),e=>e.code==='INPUT_TOO_LARGE');
    assert.equal(await readFile(file,'utf8'),'old');
  }finally{await rm(root,{recursive:true,force:true});}
});

test('staging reapplies the allowlist and excludes embedded secrets or credential-bearing URLs',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'ainpe-safe-'));try{
    const a=oneTopic();a.topicDTO.articleContent='示例 access_token=private_value 和 Bearer sample_value 以及 {"refresh_token":"another_value"}';a.topicDTO.extra='private_value';
    const input={now:new Date(now).toISOString(),events:[oneParty()],latest:[a],hot:[],topicArticles:[{slug:'fde',items:[]},{slug:'ai-video',items:[]}],cookie:'private_value'};
    const file=await saveMcpInput(input,path.join(root,'staging'));
    const serialized=await readFile(file,'utf8');assert.doesNotMatch(serialized,/private_value|sample_value|another_value|personalContact|cookie/);
    for(const unsafeUrl of ['https://scys.com/a?access_token=private_value','https://scys.com/a#access%5Ftoken=private_value']) {
      const unsafe=oneTopic();unsafe.detailUrl=unsafeUrl;
      await assert.rejects(saveMcpInput({...input,latest:[unsafe]},path.join(root,'staging')),e=>e.code==='INVALID_ITEM');
      assert.equal(await readFile(file,'utf8'),serialized);
    }
  }finally{await rm(root,{recursive:true,force:true});}
});
