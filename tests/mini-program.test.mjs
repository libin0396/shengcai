import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('mini tutorials retain the website steps and safe media origins', async()=>{
  const mini=JSON.parse(await readFile('uni-app/src/data/mini-guides.json','utf8'));
  const covers=JSON.parse(await readFile('uni-app/src/static/learn/guide-covers.json','utf8'));
  const context={window:{}};
  vm.runInNewContext(await readFile('uni-app/src/static/learn/guides-data.js','utf8'),context);
  const source=context.window.AINPE_GUIDES;
  assert.equal(mini.length,7);
  assert.equal(new Set(mini.map(g=>g.id)).size,7);
  for(const guide of mini){
    assert.match(guide.cover,/^https:\/\/ainpe\.aisen\.xin\/static\/learn\//);
    assert.equal(guide.cover,'https://ainpe.aisen.xin'+covers[guide.id].src);
    assert.equal(guide.coverLabel,covers[guide.id].label);
    assert.ok(guide.steps.length>0);
    assert.ok(guide.outcome && guide.needs);
    const original=source.find(x=>x.id===guide.id);
    if(original){
      assert.equal(guide.steps.length,original.steps.length);
      guide.steps.forEach((step,i)=>{assert.equal(step.title,original.steps[i].title);assert.equal(step.prompt,original.steps[i].prompt)});
    }
  }
  assert.match(mini.find(g=>g.id==='short-drama').video.caption,/没有音轨/);
});

test('mini four difficulty levels point to available content or a clearly pending challenge', async()=>{
  const guides=JSON.parse(await readFile('uni-app/src/data/mini-guides.json','utf8'));
  const home=await readFile('uni-app/src/components/MiniHome.vue','utf8');
  const list=await readFile('uni-app/src/pages/learn/guides.vue','utf8');
  for(const level of ['简单','一般','困难','超级挑战']){
    assert.ok(home.includes(level));
    assert.ok(list.includes(level));
  }
  assert.ok(guides.every(g=>['一般','困难'].includes(g.level)));
  assert.match(home,/@tap="openGuide\('short-drama'\)"/);
  assert.match(home,/超级挑战[\s\S]*?筹备中/);
  assert.match(list,/guide\.kind==='future'\)return/);
  assert.match(list,/level\.value==='全部等级'/);
  assert.match(list,/active\.value==='全部'/);
  assert.doesNotMatch(home,/跟着做，做出自己的作品/);
});

test('mini navigation targets are all compiled and private website pages are omitted', async()=>{
  const app=JSON.parse(await readFile('uni-app/dist/build/mp-weixin/app.json','utf8'));
  assert.deepEqual(app.pages,['pages/discover/index','pages/learn/guides','pages/learn/guide','pages/learn/find','pages/learn/library','pages/learn/mine','pages/learn/potential','pages/learn/learning','pages/learn/daily','pages/learn/lesson','pages/learn/play','pages/learn/zuo']);
  for(const page of app.pages){
    const json=JSON.parse(await readFile('uni-app/dist/build/mp-weixin/'+page+'.json','utf8'));
    assert.ok(json && typeof json==='object');
    assert.ok((await readFile('uni-app/dist/build/mp-weixin/'+page+'.wxml','utf8')).length>0);
  }
  assert.doesNotMatch(await readFile('uni-app/dist/build/mp-weixin/app.js','utf8'),/api\/feed|refreshFeed/);
});

test('course practice makes its example topic clear and avoids sales claims', async()=>{
  const practice=JSON.parse(await readFile('uni-app/src/data/mini-course-practice.json','utf8'));
  assert.equal(practice.levels.length,5);
  assert.doesNotMatch(JSON.stringify(practice.levels),/上架|卖得好|拿去卖|商品描述|铺量/);
  assert.match(await readFile('uni-app/src/components/MiniCoursePractice.vue','utf8'),/以三年级语文课题为示例/);
});
