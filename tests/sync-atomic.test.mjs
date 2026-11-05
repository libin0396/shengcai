import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {bootstrapFeed,publishFeed} from '../server/feed-store.mjs';

test('archive failure retains the last successful feed and timestamp',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'ainpe-sync-test-'));try{
  for(const dir of ['scripts','server','src'])await mkdir(path.join(root,dir));
  for(const file of ['scripts/sync-from-mcp.mjs','scripts/normalize-feed.mjs','server/feed-store.mjs','src/sync-schedule.js'])await copyFile(file,path.join(root,file));
  await writeFile(path.join(root,'package.json'),'{"type":"module"}');
  const baseline=await bootstrapFeed(),now=new Date().toISOString();baseline.updatedAt=now;baseline.fetchedAt=now;baseline.sync.status='ok';
  const published=await publishFeed(baseline,{root});
  // A regular file at the archive root reliably forces archiving to fail.
  await writeFile(path.join(root,'资料库'),'unavailable');
  const sec=Math.floor(Date.now()/1000),article={topicDTO:{entityType:'xq_topic',entityId:'123',showTitle:'AI 示例',articleContent:'AI 复盘',gmtCreate:sec-60,isDigested:0},topicUserDTO:{name:'示例'},detailUrl:'https://scys.com/articleDetail/xq_topic/123'};
  const input=path.join(root,'input.json');await writeFile(input,JSON.stringify({now,events:[],latest:[article],hot:[],topicArticles:[]}));
  const child=spawnSync(process.execPath,[path.join(root,'scripts/sync-from-mcp.mjs'),input],{encoding:'utf8'});assert.notEqual(child.status,0);
  const after=JSON.parse(await readFile(path.join(root,'data/live-feed.json'),'utf8'));
  assert.deepEqual(after.articles,published.articles);assert.deepEqual(after.events,published.events);assert.equal(after.sync.lastSuccessAt,published.sync.lastSuccessAt);assert.equal(after.sync.status,'error');
 }finally{await rm(root,{recursive:true,force:true});}
});
