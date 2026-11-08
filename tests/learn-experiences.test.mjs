import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../uni-app/src/static/learn/', import.meta.url);
const read = name => readFileSync(new URL(name, dir), 'utf8');

test('five lesson stages retain source-attributed real experiences', () => {
  const window = {};
  vm.runInNewContext(read('kejian-data.js'), { window });
  const levels = window.AINPE_KEJIAN.LEVELS;
  assert.equal(levels.length, 5);
  const stories = levels.flatMap(level => Array.from(level.qs)).filter(q => q.real);
  assert.equal(stories.length, 5);
  for (const story of stories) {
    assert.match(story.realSource, /^https:\/\/scys\.com\/articleDetail\/xq_topic\/\d+$/);
    assert.doesNotMatch(story.real, /三分之一|保证收益|一定赚钱/);
  }
  assert.match(read('kejian.js'), /encodeURIComponent\(q\.realSource\)/);
});

test('picture-book stories keep setting, mishap and resolution aligned', () => {
  const code = read('huiben.js');
  const start = code.indexOf('  var HERO=');
  const end = code.indexOf('  function buildSkill()', start);
  assert.ok(start >= 0 && end > start);
  const S = { hero: 'girl', name: '', age: '4-6', fix: 'friend', trouble: 'boat' };
  const ctx = { S };
  vm.runInNewContext(code.slice(start, end), ctx);
  for (const [place, expected, unexpected] of [
    ['sea', /潜水镜/, /小船开始漏水|小螃蟹/],
    ['island', /小船开始漏水/, /潜水镜|小螃蟹/],
    ['beach', /小桶被卷走/, /潜水镜|小船开始漏水|小鱼游过来/],
  ]) {
    S.place = place;
    for (const fix of ['friend', 'self', 'share']) {
      S.fix = fix;
      const text = Array.from(ctx.pages(), page => page.text).join('');
      assert.match(text, expected);
      assert.doesNotMatch(text, unexpected);
    }
  }
});

test('learning tabs use shared scroll positioning', () => {
  assert.match(read('learn.js'), /function toTabs\(\)/);
  for (const file of ['kejian.js', 'huiben.js']) {
    assert.match(read(file), /L\.toTabs\(\)/);
    assert.doesNotMatch(read(file), /\$\('\.tabs'\)\.scrollIntoView/);
  }
});
