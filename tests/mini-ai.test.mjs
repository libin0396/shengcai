// 小程序「学 AI」「每日 AI」：内容和网页版一致；每节课、每一期都能从头走到尾（含答错再改）；等级和经验规则正确；
// 小程序代码里引用的站内图片都是线上完整地址（审核包不带 static 目录）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
import * as core from '../uni-app/src/data/ai-core.js';
import {createLessonPlayer, lessonState, createIssuePlayer, issueState, shuffle} from '../uni-app/src/data/ai-runner.js';

const mini = JSON.parse(readFileSync(new URL('../uni-app/src/data/mini-ai.json', import.meta.url), 'utf8'));
const guides = JSON.parse(readFileSync(new URL('../uni-app/src/data/mini-guides.json', import.meta.url), 'utf8'));
const staticDir = new URL('../uni-app/src/static/learn/', import.meta.url);
function loadStatic(...files) {
  const ctx = {window: {}}; vm.createContext(ctx);
  for (const f of files) vm.runInContext(readFileSync(new URL(f, staticDir), 'utf8'), ctx, {filename: f});
  return JSON.parse(JSON.stringify(ctx.window));
}
const tick = () => new Promise((r) => setImmediate(r));
// 测试里不真的等：所有延时都排到下一轮事件循环
const fast = {speed: 0, setTimeout: (fn) => setImmediate(fn)};

test('小程序内容和网页版一致（改了网页版内容要重新生成 mini-ai.json）', () => {
  const W = loadStatic('xue-ai-data.js', 'meiri-ai-data.js');
  assert.deepEqual(mini.xue.UNITS, W.AINPE_XUE.UNITS);
  assert.deepEqual(mini.xue.LESSONS, W.AINPE_XUE.LESSONS);
  assert.deepEqual(mini.xue.ORDER, W.AINPE_XUE.ORDER);
  assert.deepEqual(mini.meiri.ISSUES, W.AINPE_MEIRI.ISSUES);
  assert.deepEqual(mini.meiri.XP, W.AINPE_MEIRI.XP);
  assert.equal(mini.meiri.UNLOCK_ALL, false, '上线内容不能解锁全部期');
});

test('跟着做引用的教程在小程序教程里都有', () => {
  const ids = new Set(guides.map((g) => g.id));
  for (const u of mini.xue.UNITS) for (const id of u.projects) assert.ok(ids.has(id), id);
});

test('等级规则和网页版一致', () => {
  const ctx = {window: {document: null, location: {search: ''}, matchMedia: null, localStorage: null, navigator: {}}};
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('ai-play.js', staticDir), 'utf8'), ctx);
  const web = ctx.window.AIPlay;
  for (let xp = 0; xp <= 400; xp += 5) assert.deepEqual(JSON.parse(JSON.stringify(core.levelInfo(xp))), JSON.parse(JSON.stringify(web.levelInfo(xp))), 'xp ' + xp);
  for (const list of [['a', 'b', 'c'], ['写脚本', '画分镜', '一段一段生成', '剪辑、加字幕和音乐'], [1, 2, 3, 4, 5]]) {
    for (const seed of [3, 10, 31, 36]) assert.deepEqual(shuffle(list, seed), JSON.parse(JSON.stringify(web.shuffle(list, seed))));
  }
});

test('每日经验：当天、补玩、连续奖励、已做过不再加', () => {
  const issues = [{id: 'a', date: '2026-11-09'}, {id: 'b', date: '2026-11-10'}, {id: 'c', date: '2026-11-11'}, {id: 'd', date: '2026-11-12'}];
  const XP = {today: 10, makeup: 5, streakBonus: 5, streakFrom: 3};
  let s = core.blank(), r;
  r = core.finishIssue(s, issues, issues[0], '2026-11-09', XP); s = r.store; assert.equal(r.gain + r.bonus, 10);
  r = core.finishIssue(s, issues, issues[1], '2026-11-10', XP); s = r.store; assert.equal(r.gain + r.bonus, 10);
  r = core.finishIssue(s, issues, issues[2], '2026-11-11', XP); s = r.store; assert.equal(r.gain, 10); assert.equal(r.bonus, 5, '连续第 3 天');
  assert.equal(s.xp, 35); assert.equal(core.levelInfo(s.xp).name, 'AI 新手'); assert.equal(r.levelUp, true);
  r = core.finishIssue(s, issues, issues[2], '2026-11-11', XP); assert.equal(r.first, false); assert.equal(r.store.xp, 35);
  assert.equal(core.streak(s, issues, '2026-11-11'), 3);
  assert.equal(core.streak(s, issues, '2026-11-12'), 3, '今天还没玩，连续天数算到昨天');
  assert.equal(core.streak(s, issues, '2026-11-13'), 0);
  const late = core.finishIssue(core.blank(), issues, issues[0], '2026-11-11', XP);
  assert.equal(late.gain, 5); assert.equal(late.bonus, 0);
  const w = core.week(late.store, issues, '2026-11-11');
  assert.equal(w.length, 7); assert.equal(w[0].late, true); assert.equal(w[0].onTime, false); assert.equal(w[2].today, true); assert.equal(w[2].label, '今天');
  assert.deepEqual(core.currentIssue(issues, '2026-11-20').issue.id, 'd');
  assert.equal(core.currentIssue(issues, '2026-11-10').isToday, true);
  assert.deepEqual(core.normalize({v: 1, xp: -3}), core.blank());
  assert.deepEqual(core.normalize('坏数据'), core.blank());
});

test('单元徽章：动画课学完；第 6 单元还要做完一件作品', () => {
  const u6 = mini.xue.UNITS.find((u) => u.id === 'u6');
  const store = core.finishLesson(core.blank(), 'trip').store;
  assert.equal(core.unitState(u6, store, guides, {}).badge, false);
  const kejian = guides.find((g) => g.id === 'kejian');
  const progress = {kejian: {completedSteps: kejian.steps.map((_, i) => i)}};
  const st = core.unitState(u6, store, guides, progress);
  assert.equal(st.badge, true); assert.equal(st.made, 1); assert.equal(st.projects.find((p) => p.id === 'kejian').step, '做完了');
  const half = core.projectOf(guides, {kejian: {completedSteps: [0, 0, 1, 99]}}, 'kejian');
  assert.equal(half.n, 2); assert.equal(half.done, false);
  const u1 = mini.xue.UNITS[0];
  let s = core.blank(); for (const id of u1.lessons) s = core.finishLesson(s, id).store;
  assert.equal(core.unitState(u1, s, guides, {}).badge, true);
  assert.equal(core.resumeLesson(mini.xue.ORDER, s), mini.xue.UNITS[1].lessons[0]);
});

/* 模拟一个会先答错一次、再答对的用户 */
async function playLesson(id) {
  const lesson = mini.xue.LESSONS[id], state = lessonState();
  const tried = new Set();
  let ended = null;
  const player = createLessonPlayer(lesson, state, {...fast, demo: true, onEnd: (s) => { ended = s; return {nextId: 'x'}; }});
  player.start();
  for (let n = 0; n < 3000; n++) {
    await tick();
    const p = state.panel;
    if (p.kind === 'end') break;
    if (p.kind === 'next') player.next();
    else if (p.kind === 'choice') {
      if (p.solved) { player.next(); continue; }
      const wrong = p.opts.findIndex((o, i) => !o.ok && !tried.has(p.opts.map((x) => x.text).join() + i));
      if (wrong >= 0) { tried.add(p.opts.map((x) => x.text).join() + wrong); player.choose(wrong); assert.equal(p.solved, false); assert.ok(p.fb); }
      else player.choose(p.opts.findIndex((o) => o.ok));
    } else if (p.kind === 'sort') {
      if (p.answered) { player.next(); continue; }
      const it = lesson.acts.flat().find((s) => s.t === 'sort' && s.items.some((x) => x.text === p.text)).items.find((x) => x.text === p.text);
      const key = 'sort' + p.text;
      if (!tried.has(key)) { tried.add(key); player.sortPick(1 - it.a); assert.equal(p.answered, false); } else player.sortPick(it.a);
    } else if (p.kind === 'order') {
      if (p.solved) { player.next(); continue; }
      const want = p.items[p.got.length], key = 'order' + p.got.length;
      const wrong = p.pool.findIndex((x) => x.text !== want);
      if (!tried.has(key) && wrong >= 0) { tried.add(key); player.orderPick(wrong); }
      else player.orderPick(p.pool.findIndex((x) => x.text === want));
    } else if (p.kind === 'build') {
      const c = p.chips.find((x) => !x.used);
      if (c) player.chip(c.k); else { assert.equal(p.ready, true); player.next(); }
    }
  }
  return {state, ended};
}
for (const id of mini.xue.ORDER) {
  test('学 AI 小程序：' + mini.xue.LESSONS[id].title + ' 能走到最后', async () => {
    const {state, ended} = await playLesson(id);
    assert.equal(state.panel.kind, 'end', id + ' 没走到最后');
    assert.ok(ended && ended.done);
    assert.match(state.narr, /^这节学完了。/);
  });
}

async function playIssue(issue) {
  const state = issueState(); let finished = null; const tried = new Set();
  const store = {s: core.blank()};
  const player = createIssuePlayer(issue, state, {...fast, onFinish: (is) => { const r = core.finishIssue(store.s, mini.meiri.ISSUES, is, is.date, mini.meiri.XP); store.s = r.store; finished = r; return r; }});
  player.start();
  for (let n = 0; n < 3000; n++) {
    await tick();
    const p = state.panel;
    if (p.kind === 'done') break;
    if (p.kind === 'next') player.next();
    else if (p.kind === 'pick') player.choose(n % p.opts.length);
    else if (p.kind === 'choice') {
      if (p.solved) { player.next(); continue; }
      const key = p.opts.map((o) => o.text).join();
      const wrong = p.opts.findIndex((o) => !o.ok);
      if (!tried.has(key) && wrong >= 0) { tried.add(key); player.choose(wrong); assert.equal(p.solved, false); }
      else player.choose(p.opts.findIndex((o) => o.ok));
    } else if (p.kind === 'spot') {
      const v = state.view; if (!v.clickable) continue;
      if (!tried.has('spot')) { tried.add('spot'); player.spotPick(v.sentences.findIndex((s) => !s.bad)); assert.equal(v.clickable, true); }
      else player.spotPick(v.sentences.findIndex((s) => s.bad));
    } else if (p.kind === 'pieces') {
      const extra = p.pool.findIndex((x) => x.fb);
      if (extra >= 0 && !tried.has('extra')) { tried.add('extra'); player.piecePick(extra); assert.ok(p.fb); continue; }
      const want = issue.pieces[state.view.parts.length];
      player.piecePick(p.pool.findIndex((x) => x.text === want));
    } else if (p.kind === 'copy') { if (!p.copied) player.copied(); else player.next(); }
    else if (p.kind === 'sort') {
      if (p.answered) { player.next(); continue; }
      const it = issue.items[p.index], key = 'sort' + p.index;
      if (!tried.has(key)) { tried.add(key); player.sortPick(1 - it.a); } else player.sortPick(it.a);
    }
  }
  return {state, finished};
}
for (const issue of mini.meiri.ISSUES) {
  test('每日 AI 小程序：' + issue.title + '（' + issue.type + '）能玩完并记经验', async () => {
    const {state, finished} = await playIssue(issue);
    assert.equal(state.panel.kind, 'done', issue.id + ' 没玩完');
    assert.ok(state.result && state.result.line);
    assert.equal(finished.first, true); assert.equal(finished.gain, mini.meiri.XP.today);
    if (issue.type === 'puzzle') assert.equal(state.view.parts.join(''), issue.pieces.join(''));
    if (issue.type === 'story') assert.equal(state.view.sleep, true);
    if (issue.type === 'walk') assert.equal(state.view.screen, 'answer');
  });
}

test('小程序代码里的站内图片都用线上完整地址（审核包不带 static 目录）', () => {
  const files = [];
  const add = (dir, re) => { for (const f of readdirSync(new URL(dir, import.meta.url))) if (re.test(f)) files.push(new URL(dir + f, import.meta.url)); };
  add('../uni-app/src/pages/learn/', /\.vue$/); add('../uni-app/src/components/', /^(Mini|Ai).*\.vue$/); add('../uni-app/src/data/', /^(ai-|mini-ai).*$/);
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/\/static\//g)) assert.ok(text.slice(Math.max(0, m.index - 23), m.index) === 'https://ainpe.aisen.xin', f.pathname + ' @' + m.index);
  }
});
