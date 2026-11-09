import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {isLearnPath} from '../uni-app/src/data/game-matching.js';

const content=await readFile('uni-app/src/static/learn/guides-data.js','utf8');
const ctx={window:{}};vm.runInNewContext(content,ctx);const guides=ctx.window.AINPE_GUIDES;
test('all published guide entries have real steps, clear outcomes and tool prerequisites',()=>{
  assert.equal(guides.length,5);
  for(const g of guides){
    assert.ok(/^[a-z-]+$/.test(g.id));assert.ok(g.title&&g.outcome&&g.needs);
    assert.ok(g.steps.length>=3);assert.ok(g.steps.some(s=>s.prompt));
    for(const s of g.steps)assert.ok(s.title&&s.action&&s.check);
    assert.equal(isLearnPath('/static/learn/guide.html?id='+g.id),true);
  }
  assert.equal(isLearnPath('/static/learn/guides.html'),true);
});
test('short drama guide covers a specific end-to-end production path without guaranteeing free output',()=>{
  const g=guides.find(x=>x.id==='short-drama');
  assert.ok(g);assert.match(g.outcome,/20～30 秒/);
  const titles=g.steps.map(s=>s.title).join(' ');
  for(const key of ['故事','分镜','参考图','镜头','剪','检查'])assert.ok(titles.includes(key),key);
  assert.match(g.needs,/费用/);assert.match(g.steps.at(-1).action,/权限/);
  assert.equal(g.source.url,'https://jimeng.jianying.com/tools/ai-short-drama');
});
