import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {bootstrapFeed,publishFeed,readFeed,recordFeedFailure,getFeedStatus,validateFeed} from '../server/feed-store.mjs';
import {createFeedMiddleware} from '../server/feed-api.mjs';
const baseline=await bootstrapFeed();
function input(){const x=structuredClone(baseline);const now=new Date().toISOString();x.updatedAt=now;x.fetchedAt=now;x.sync={status:'ok',lastAttemptAt:now,lastSuccessAt:now,intervalMinutes:60,message:'ready'};return x;}
async function withRoot(fn){const root=await mkdtemp(path.join(tmpdir(),'ainpe-feed-'));try{await fn(root);}finally{await rm(root,{recursive:true,force:true});}}

test('publish only whitelisted public fields; preserve IDs and stable article data',()=>withRoot(async root=>{
 const x=input();x.extra='ignored';x.events[0].unknown='ignored';x.articles[0].privateProfile='ignored';const result=await publishFeed(x,{root});
 assert.equal(result.articles[0].id,x.articles[0].id);assert.equal(typeof result.articles[0].id,'string');assert.equal(result.extra,undefined);assert.equal(result.events[0].unknown,undefined);assert.equal(result.articles[0].privateProfile,undefined);
 assert.equal((await readFeed({root})).articles[0].title,x.articles[0].title);
}));

test('reject unsafe source URLs, numeric IDs and nested credential keys',()=>{
 for(const mutate of [x=>x.articles[0].sourceUrl='https://scys.com.evil.test/a',x=>x.events[0].url='http://scys.com/a',x=>x.articles[0].id=82258452244481412,x=>x.articles[0].sourceUrl='https://scys.com/a?code=private',x=>x.extra={refresh_token:'private'},x=>x.topicGuides.fde.clientSecret='private',x=>x.articles[0].publishedAt=1e100,x=>x.articles[0].isDigested='false']){
  const x=input();mutate(x);assert.throws(()=>validateFeed(x),/validation failed/);
 }
});

test('failed or invalid refresh retains last successful content and timestamp',()=>withRoot(async root=>{
 const good=await publishFeed(input(),{root});const before=await readFile(path.join(root,'data/live-feed.json'),'utf8');const bad=input();bad.articles[0].sourceUrl='javascript:bad';
 await assert.rejects(publishFeed(bad,{root}));assert.equal(await readFile(path.join(root,'data/live-feed.json'),'utf8'),before);
 const later=new Date(Date.parse(good.sync.lastSuccessAt)+3600000);const failed=await recordFeedFailure('do not store raw errors',{root,now:later});
 assert.deepEqual(failed.articles,good.articles);assert.equal(failed.sync.lastSuccessAt,good.sync.lastSuccessAt);assert.equal(failed.sync.status,'error');assert.equal(failed.sync.lastAttemptAt,later.toISOString());assert.ok(!JSON.stringify(failed).includes('do not store raw errors'));
 assert.equal((await getFeedStatus({root,now:new Date(Date.parse(good.sync.lastSuccessAt)+24*3600000)})).stale,false);
 assert.equal((await getFeedStatus({root,now:new Date(Date.parse(good.sync.lastSuccessAt)+36*3600000+1)})).stale,true);
}));

test('atomic replacement remains parseable while multiple refreshes and readers overlap',()=>withRoot(async root=>{
 await publishFeed(input(),{root});let publishing=true;
 const readers=(async()=>{while(publishing){const x=JSON.parse(await readFile(path.join(root,'data/live-feed.json'),'utf8'));assert.equal(x.version,1);assert.equal(x.articles.length,49);}})();
 try{await Promise.all(Array.from({length:12},(_,i)=>{const x=input();x.articles[0].likeCount=i;return publishFeed(x,{root});}));}finally{publishing=false;await readers;}
 assert.equal((await readFeed({root})).articles[0].likeCount,11);
}));

test('HTTP interface is read-only, no-store, same origin and has status metadata',()=>withRoot(async root=>{
 await publishFeed(input(),{root});const middleware=createFeedMiddleware({root});const server=http.createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();const base=`http://127.0.0.1:${address.port}`;
 try{
  const r=await fetch(base+'/api/feed');assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('access-control-allow-origin'),null);assert.equal((await r.json()).articles.length,49);
  const status=await fetch(base+'/api/feed/status').then(r=>r.json());assert.equal(status.status,'ok');assert.equal(status.intervalMinutes,1440);assert.equal(status.stale,false);
  const cross=await fetch(base+'/api/feed',{headers:{Origin:'https://other.example'}});assert.equal(cross.status,403);
  for(const method of ['POST','PUT','DELETE'])assert.equal((await fetch(base+'/api/feed',{method})).status,405);
  const head=await fetch(base+'/api/feed',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await fetch(base+'/missing')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
}));
