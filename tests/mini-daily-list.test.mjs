import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { weekStart, addDays, weekday, playable } from '../uni-app/src/data/ai-core.js';

const source = await readFile('uni-app/src/pages/learn/daily.vue', 'utf8');
const mini = JSON.parse(await readFile('uni-app/src/data/mini-ai.json', 'utf8'));
const listBody = source.match(/const others = computed\(\(\) => \{([\s\S]*?)\n\}\);/)?.[1];
const labelBody = source.match(/function labelOther\(o\) \{([^\n]+)\}/)?.[1];
assert.ok(listBody && labelBody, 'daily list and label must be available');

function renderList(today, finished = {}) {
  const context = { M: mini.meiri, today: { value: today }, store: { value: { daily: finished } }, weekStart, addDays, weekday, playable };
  const list = vm.runInNewContext(`(() => {${listBody}\n})()`, context);
  const label = vm.runInNewContext(`(o => {${labelBody}})`, context);
  return { list, label };
}

test('weekly list includes today in date order and today opens like the main card', () => {
  const { list, label } = renderList('2026-11-12');
  const dates = Array.from(list, row => row.issue.date);
  assert.equal(dates.filter(date => date === '2026-11-12').length, 1);
  assert.deepEqual(dates, [...dates].sort());
  const today = list.find(row => row.issue.date === '2026-11-12');
  assert.equal(today.open, true);
  assert.equal(label(today), '今天');
  assert.match(source, /function tapOther\(o\) \{ if \(o\.open\) open\(o\.issue\); \}/);
});

test('past, future and completed issues retain their existing states', () => {
  const issue = mini.meiri.ISSUES.find(row => row.date === '2026-11-12');
  const { list, label } = renderList('2026-11-12', { [issue.id]: { done: true } });
  assert.equal(label(list.find(row => row.issue.date === '2026-11-12')), '已完成');
  assert.equal(label(list.find(row => row.issue.date === '2026-11-11')), '补玩');
  assert.equal(label(list.find(row => row.issue.date === '2026-11-13')), '还没到');
});

test('the removed explanatory paragraph is not displayed', () => {
  const template = source.split('<!-- #ifndef MP-WEIXIN -->')[0];
  assert.match(template, /<!-- #ifdef MP-WEIXIN -->/);
  assert.doesNotMatch(template, /每期 3 分钟内玩完|断了不扣等级/);
  assert.match(source.split('<!-- #ifndef MP-WEIXIN -->')[1], /每期 3 分钟内玩完/);
});
