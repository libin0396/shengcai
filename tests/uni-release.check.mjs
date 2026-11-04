import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createProductionServer} from '../server/production.mjs';

const client=path.resolve('dist/client');
test('uni shell and games use CSP-compatible same-origin scripts',async()=>{
  const shell=await readFile(path.join(client,'index.html'),'utf8');
  assert.match(shell,/\/assets\/[^"']+\.js/);
  const directory=path.join(client,'static/simulation-games');
  const files=(await readdir(directory)).filter(name=>name.endsWith('.html'));
  for(const name of ['miniapp.html','video.html','education-ppt.html','voyage-lab.html']) assert.ok(files.includes(name),`${name} missing`);
  for(const game of files){
    const file=path.join(directory,game);
    const html=await readFile(file,'utf8');
    assert.ok(!/<[^>]+\son(?:click|load|change|input|submit|keydown|error)\s*=/i.test(html),`${game}: inline handler`);
    for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)){
      const [,,body]=match; const attrs=match[1];
      if(/type=["']application\/json["']/i.test(attrs)) continue;
      assert.equal(body.trim(),'',`${game}: inline script`);
      const src=attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      assert.ok(src && !/^(?:https?:)?\/\//i.test(src),`${game}: non-local script`);
      const resolved=path.resolve(path.dirname(file),src);
      assert.ok(resolved.startsWith(client+path.sep));
      await readFile(resolved);
    }
  }
});

test('production server preserves health, feed and old routes',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'ainpe-uni-release-'));
  await mkdir(path.join(root,'data'),{recursive:true});
  await writeFile(path.join(root,'release.json'),JSON.stringify({sourceCommit:'a'.repeat(40)}));
  await writeFile(path.join(root,'data/live-feed.json'),JSON.stringify({version:1,updatedAt:'2026-11-03T04:30:00Z',fetchedAt:'2026-11-03T04:30:00Z',articles:[{id:'1',entityType:'xq_topic',title:'AI 示例',publishedAt:1790000000,sourceUrl:'https://scys.com/articleDetail/xq_topic/1'}],events:[],hotArticleIds:[],trendingTopics:[],featuredEventId:null,comments:[],topicGuides:{},sync:{status:'ok',lastAttemptAt:'2026-11-03T04:30:00Z',lastSuccessAt:'2026-11-03T04:30:00Z',message:''}}));
  const server=await createProductionServer({root,staticRoot:client});
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const health=await (await fetch(base+'/api/health')).json();
    assert.deepEqual(health,{status:'ok',sourceCommit:'a'.repeat(40)});
    assert.equal((await (await fetch(base+'/api/feed')).json()).articles[0].id,'1');
    const old=await fetch(base+'/topics/fde',{redirect:'manual'});
    assert.equal(old.status,302);assert.equal(old.headers.get('location'),'/#/pages/topic/index?slug=fde');
    const source=await fetch(base+'/source?url='+encodeURIComponent('https://scys.com/articleDetail/xq_topic/1'),{redirect:'manual'});
    assert.equal(source.headers.get('location'),'/#/pages/camp/index?source='+encodeURIComponent('https://scys.com/articleDetail/xq_topic/1'));
    const hostile=await fetch(base+'/source?url='+encodeURIComponent('https://scys.com.example.org/'),{redirect:'manual'});
    assert.equal(hostile.headers.get('location'),'/#/pages/camp/index');
    assert.equal((await fetch(base+'/static/assets/conference-invite.png')).status,200);
    assert.equal((await fetch(base+'/api/not-found')).status,404);
  } finally {await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
