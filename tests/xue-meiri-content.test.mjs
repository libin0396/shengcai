// 学 AI、每日 AI 内容检查：每节课、每一期都能走到结尾，选择题只有一个对的，引用的角色、图、课都存在。
// 运行：node --test tests/xue-meiri-content.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../uni-app/src/static/learn/', import.meta.url);
function load(...files) {
  const ctx = {window: {}};
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(readFileSync(new URL(f, dir), 'utf8'), ctx, {filename: f});
  return ctx.window;
}
const W = load('ai-art.js', 'xue-ai-data.js', 'meiri-ai-data.js');
// 数据在另一个 vm 环境里创建，转成本环境的普通对象再比较
const plain = x => JSON.parse(JSON.stringify(x));
const {UNITS, LESSONS, ORDER} = plain(W.AINPE_XUE);
const {ISSUES, XP} = plain(W.AINPE_MEIRI);
const ART = W.AIArt;
const ROLES = ['lin', 'yuan', 'zhou'];
const STEP_TYPES = new Set(['say', 'person', 'mood', 'marks', 'clear', 'you', 'ai', 'stamp', 'next', 'choice', 'sort', 'build', 'order', 'end']);
const len = s => [...String(s)].length;

test('学 AI 有 6 个单元，按初级、中级、高级排', () => {
  assert.equal(UNITS.length, 6);
  assert.deepEqual(UNITS.map(u => u.level), ['初级', '初级', '中级', '中级', '中级', '高级']);
});

test('每个单元引用的课都存在，没有重复', () => {
  const seen = new Set();
  for (const u of UNITS) for (const id of u.lessons) {
    assert.ok(LESSONS[id], `缺少课 ${id}`);
    assert.ok(!seen.has(id), `课 ${id} 重复`);
    seen.add(id);
  }
  assert.equal(ORDER.length, seen.size);
  assert.equal(Object.keys(LESSONS).length, seen.size, '有课没放进任何单元');
});

test('课程标题不超过 12 个字，人物都是小林、小圆、老周', () => {
  for (const [id, L] of Object.entries(LESSONS)) {
    assert.ok(len(L.title) <= 12, `${id} 标题太长：${L.title}`);
    assert.ok(ROLES.includes(L.who), `${id} 人物不对：${L.who}`);
  }
});

test('每节动画课：步骤类型都认识，最后一幕以 end 结束，中间没有 end', () => {
  for (const [id, L] of Object.entries(LESSONS)) {
    if (L.link) { assert.match(L.link, /^(kejian|huiben)\.html/); continue; }
    assert.ok(L.acts.length >= 2, `${id} 至少 2 幕`);
    const all = L.acts.flat();
    for (const s of all) assert.ok(STEP_TYPES.has(s.t), `${id} 有不认识的步骤 ${s.t}`);
    assert.equal(all.at(-1).t, 'end', `${id} 最后一步不是 end`);
    assert.equal(all.filter(s => s.t === 'end').length, 1, `${id} end 不止一个`);
    L.acts.slice(0, -1).forEach((act, k) => assert.ok(act.some(s => ['next', 'build', 'choice', 'sort', 'order'].includes(s.t)), `${id} 第 ${k + 1} 幕没有让用户动手的地方`));
  }
});

test('选择题只有一个对的，每个选项都有反馈', () => {
  const check = (where, opts) => {
    assert.equal(opts.filter(o => o.ok).length, 1, `${where} 对的选项不是正好一个`);
    for (const o of opts) assert.ok(o.fb, `${where} 选项「${o.text}」没有反馈`);
  };
  for (const [id, L] of Object.entries(LESSONS)) for (const s of (L.acts || []).flat()) if (s.t === 'choice') check(id, s.opts);
  for (const is of ISSUES) for (const q of is.questions || []) check(is.id, q.opts);
});

test('归类题答案落在两边之内，补全题的块都在模板里', () => {
  for (const [id, L] of Object.entries(LESSONS)) for (const s of (L.acts || []).flat()) {
    if (s.t === 'sort') { assert.equal(s.labels.length, 2); for (const it of s.items) assert.ok([0, 1].includes(it.a), `${id} ${it.text}`); }
    if (s.t === 'build') { const keys = s.tpl.filter(p => typeof p === 'object').map(p => p.k); assert.deepEqual([...keys].sort(), s.chips.map(c => c.k).sort(), `${id} 补全块对不上`); }
    if (s.t === 'order') assert.ok(s.items.length >= 3, `${id} 排序至少 3 项`);
    if (s.t === 'ai' && s.art) assert.ok(ART[s.art], `${id} 缺图 ${s.art}`);
  }
});

test('每日 AI：日期不重复、按顺序，每期都有玩法和去学 AI 的出口', () => {
  const types = new Set(['story', 'spot', 'quiz', 'puzzle', 'oneline', 'sort', 'walk']);
  const dates = ISSUES.map(i => i.date);
  assert.equal(new Set(dates).size, dates.length, '日期重复');
  assert.deepEqual([...dates].sort(), dates, '日期没按顺序');
  assert.equal(new Set(ISSUES.map(i => i.id)).size, ISSUES.length, 'id 重复');
  for (const is of ISSUES) {
    assert.ok(types.has(is.type), `${is.id} 玩法不认识`);
    assert.ok(ROLES.includes(is.who), `${is.id} 人物不对`);
    assert.ok(len(is.title) <= 12, `${is.id} 标题太长`);
    assert.ok(is.done, `${is.id} 没有结尾一句`);
    assert.ok(LESSONS[is.learn], `${is.id} 指向的课 ${is.learn} 不存在`);
  }
});

test('每日 AI 各玩法的数据完整', () => {
  for (const is of ISSUES) {
    if (is.type === 'spot') assert.equal(is.sentences.filter(s => s.bad).length, 1, `${is.id} 错句不是正好一句`);
    if (is.type === 'story') for (const st of is.steps) assert.ok(st.opts.length >= 2 && st.opts.every(o => o.line), `${is.id} 分支不全`);
    if (is.type === 'puzzle') { assert.ok(is.pieces.length >= 3); assert.ok((is.extra || []).every(x => x.fb)); }
    if (is.type === 'oneline') assert.ok(is.line && is.line.length < 80, `${is.id} 一句话太长`);
    if (is.type === 'sort') for (const it of is.items) assert.ok([0, 1].includes(it.a));
    if (is.type === 'walk') { assert.equal(is.steps.at(-1).screen, 'answer'); assert.ok(ART.fridge); }
    if (is.type === 'quiz' && is.chat) {
      const marks = is.chat.text.filter(x => typeof x === 'object').map(x => x.m);
      for (const q of is.questions) for (const m of q.mark || []) assert.ok(marks.includes(m), `${is.id} 标黄 ${m} 不存在`);
    }
  }
});

test('经验规则是正数，内容不出现收入承诺', () => {
  for (const k of ['today', 'makeup', 'streakBonus', 'streakFrom']) assert.ok(XP[k] > 0);
  const text = JSON.stringify({LESSONS, ISSUES});
  assert.doesNotMatch(text, /月入|赚钱|收入|变现|副业/);
});
