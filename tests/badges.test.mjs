// 学 AI 徽章：网页画的 SVG（static/learn/ai-badges.js）和小程序用的 PNG（static/learn/img/badges/）是同一套；
// 两边算进度的规则一致；小程序拼出来的每个图片地址都有对应的图；页面都接上了。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../uni-app/src/data/ai-core.js';

const learn = new URL('../uni-app/src/static/learn/', import.meta.url);
const badgeDir = new URL('img/badges/', learn);
const ctx = {window: {}};
vm.createContext(ctx);
for (const f of ['ai-badges.js', 'xue-ai-data.js']) vm.runInContext(readFileSync(new URL(f, learn), 'utf8'), ctx, {filename: f});
const B = ctx.window.AINPE_BADGES, X = ctx.window.AINPE_XUE;
const mini = JSON.parse(readFileSync(new URL('../uni-app/src/data/mini-ai.json', import.meta.url), 'utf8'));

// 标签要配对（自闭合的不算），不然浏览器会把后面的内容吞掉
function balanced(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    if (m[3]) continue;
    if (m[1]) { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
  }
  return stack.length === 0;
}
function pngSize(file) {
  const b = readFileSync(new URL(file, badgeDir));
  assert.equal(b.subarray(1, 4).toString(), 'PNG', file + ' 不是 PNG');
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test('六个单元都有自己的小图，各种状态都画得出来', () => {
  assert.deepEqual([...Object.keys(B.ICONS)].sort(), [...X.UNITS.map((u) => u.id)].sort());
  X.UNITS.forEach((u, i) => {
    const total = B.steps(u, 0, 0).total;
    for (let k = 0; k <= total; k++) {
      const s = B.svg(u.id, {got: false, done: k, total, no: i + 1, size: 64});
      assert.ok(balanced(s), u.id + ' 没拿到 ' + k);
      assert.equal((s.match(/class="abg-done"/g) || []).length, k, '进度圈走了 ' + k + ' 段');
      assert.equal((s.match(/class="abg-(done|track)"/g) || []).length, total, '进度圈一共 ' + total + ' 段');
    }
    const got = B.svg(u.id, {got: true, no: i + 1, size: 112, earn: true});
    assert.ok(balanced(got), u.id + ' 拿到');
    assert.ok(!/abg-track|abg-done/.test(got), '拿到以后不画进度圈');
    assert.equal((got.match(/class="abg-spark"/g) || []).length, 6, '拿到时冒六颗小星星');
    assert.match(got, />\d<\/text>/);
  });
  // 一页上好几枚在播动画时，闪光的裁剪区不能撞名
  const a = B.svg('u1', {got: true, earn: true}).match(/clipPath id="([^"]+)"/)[1];
  const b = B.svg('u1', {got: true, earn: true}).match(/clipPath id="([^"]+)"/)[1];
  assert.notEqual(a, b);
  assert.ok(balanced(B.mini(true)) && balanced(B.mini(false)));
  assert.match(B.svg('u1', {got: true, standalone: true}), /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(B.svg('u1', {got: true}), /aria-hidden="true"/);
});

test('网页和小程序算徽章进度的规则一样（一节课一段，第 6 单元多一段作品）', () => {
  assert.deepEqual(mini.xue.UNITS, JSON.parse(JSON.stringify(X.UNITS)));
  for (const u of mini.xue.UNITS) {
    const need = u.needProjects || 0;
    for (let lessons = 0; lessons <= u.lessons.length; lessons++) for (let made = 0; made <= need + 1; made++) {
      const web = JSON.parse(JSON.stringify(B.steps(u, lessons, made)));
      assert.deepEqual(core.badgeSteps(u, {lessons, made}), web, u.id + ' ' + lessons + '/' + made);
    }
  }
  assert.deepEqual(core.badgeSteps(mini.xue.UNITS[5], {lessons: 1, made: 0}), {done: 1, total: 2});
});

test('小程序的徽章图一张不少、没有多余的，地址都是线上完整地址', () => {
  const want = new Set(['mini-got.png', 'mini-off.png']);
  for (const u of mini.xue.UNITS) {
    const total = core.badgeSteps(u, {lessons: 0, made: 0}).total;
    want.add(u.id + '-got.png');
    for (let k = 0; k < total; k++) want.add(u.id + '-' + k + '.png');
    for (let lessons = 0; lessons <= u.lessons.length; lessons++) for (let made = 0; made <= (u.needProjects || 0); made++) {
      const badge = lessons === u.lessons.length && made >= (u.needProjects || 0);
      const url = core.badgeImage(u, {lessons, made, badge});
      assert.ok(url.startsWith('https://ainpe.aisen.xin/static/learn/img/badges/'), url);
      assert.ok(want.has(url.split('/').pop()), url);
    }
  }
  for (const url of Object.values(core.BADGE_MINI)) assert.ok(want.has(url.replace('https://ainpe.aisen.xin/static/learn/img/badges/', '')), url);
  assert.deepEqual(new Set(readdirSync(badgeDir)), want, '改了单元以后要重新运行 python3 scripts/build-badge-images.py');
  for (const f of want) assert.deepEqual(pngSize(f), f.startsWith('mini') ? [66, 66] : [288, 288], f);
});

test('学 AI、我的两个页面都接上了徽章', () => {
  for (const [page, script] of [['xue-ai.html', 'xue-ai.js'], ['wode.html', 'wode.js']]) {
    const html = readFileSync(new URL(page, learn), 'utf8');
    assert.ok(html.includes('href="ai-badges.css"'), page);
    const at = html.indexOf('src="ai-badges.js"');
    assert.ok(at > 0 && at < html.indexOf('src="' + script + '"'), page + ' 要先加载 ai-badges.js');
    assert.match(readFileSync(new URL(script, learn), 'utf8'), /AINPE_BADGES/);
  }
  const vue = (f) => readFileSync(new URL('../uni-app/src/pages/learn/' + f, import.meta.url), 'utf8');
  assert.match(vue('learning.vue'), /badgeImage\(u, st\)/);
  assert.match(vue('lesson.vue'), /markSeen\(uni, u\.id\)/);
  assert.match(vue('mine.vue'), /markSeen\(uni,id\)/);
  assert.equal(core.BADGE_SEEN_KEY, 'ainpe_mini_badges_seen_v1');
  assert.equal(B.SEEN_KEY, 'ainpe:badges-seen');
});
