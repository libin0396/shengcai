import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('resume finds the first unfinished tutorial step',async()=>{
  const source=await readFile('uni-app/src/pages/learn/guide.vue','utf8');
  const match=source.match(/function nextPendingIndex\(total,done\)\{[^\n]+\}/);
  assert.ok(match);
  const context={};vm.runInNewContext(match[0],context);
  assert.equal(context.nextPendingIndex(5,[]),0);
  assert.equal(context.nextPendingIndex(5,[0,2]),1);
  assert.equal(context.nextPendingIndex(3,[2,0,1]),-1);
  assert.equal(context.nextPendingIndex(0,[]),-1);
  assert.match(source,/:id="'guide-step-'\+index"/);
  assert.match(source,/next<0\?'#tutorial-complete':'#guide-step-'\+next/);
});
