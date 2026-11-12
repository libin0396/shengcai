// 跟着做 · 动画互动版：剧本、玩法规则、素材、网页和小程序两边是否一致
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const LEARN = 'uni-app/src/static/learn/';
const plain = (x) => JSON.parse(JSON.stringify(x));
function loadWeb() {
  const ctx = {window: {}};
  vm.createContext(ctx);
  for (const f of ['guides-data.js', 'xue-ai-data.js', 'zuo-core.js', 'zuo-data.js']) vm.runInContext(readFileSync(LEARN + f, 'utf8'), ctx, {filename: f});
  const Z = ctx.window.AINPE_ZUO, C = ctx.window.AINPE_ZUO_CORE;
  const G = ctx.window.AINPE_GUIDES.concat(Z.EXTRA || []);
  return {Z, C, G, X: ctx.window.AINPE_XUE};
}
const {Z, C, G, X} = loadWeb();
const guideOf = (id) => G.find((g) => g.id === id);
const mini = JSON.parse(readFileSync('uni-app/src/data/mini-guides.json', 'utf8'));

test('七篇跟着做都有剧本，步数和教程一致，学 AI 里的作品都能打开', () => {
  assert.deepEqual(plain(Z.ORDER).sort(), Object.keys(Z.SCRIPTS).sort());
  assert.equal(Z.ORDER.length, 7);
  const projects = X.UNITS.flatMap((u) => u.projects || []);
  for (const id of projects) assert.ok(Z.SCRIPTS[id], '学 AI 里的作品没有剧本：' + id);
  for (const id of Z.ORDER) {
    const g = guideOf(id), s = Z.SCRIPTS[id];
    assert.ok(g, '找不到教程 ' + id);
    assert.equal(s.steps.length, g.steps.length, id + ' 步数');
    assert.ok(['lin', 'yuan', 'zhou'].includes(s.who), id + ' 角色');
    for (const k of ['me', 'ai']) { assert.ok(s.hello[k], id + ' 开场'); assert.ok(s.end[k], id + ' 结尾'); }
    s.steps.forEach((st, i) => { assert.ok(st.ai, id + ' 第 ' + (i + 1) + ' 步小A 的话'); assert.ok(st.done, id + ' 第 ' + (i + 1) + ' 步做完的话'); });
  }
});

test('每一种玩法都有规则，按正确做法都能做完；跳过练习也能摆成做好的样子', () => {
  for (const id of Z.ORDER) Z.SCRIPTS[id].steps.forEach((st, i) => {
    for (const w of C.plays(st)) {
      assert.ok(C.K[w.kind], id + ' 第 ' + (i + 1) + ' 步：没有这种玩法 ' + w.kind);
      const s = C.start(w);
      assert.equal(C.done(w, s), false, id + ' 第 ' + (i + 1) + ' 步 ' + w.kind + ' 一开始就算做完了');
      C.solve(w, s);
      assert.equal(C.done(w, s), true, id + ' 第 ' + (i + 1) + ' 步 ' + w.kind + ' 摆不成做好的样子');
    }
  });
});

test('照着答案一步步点，也能做完（模拟用户操作）', () => {
  const now = {t: 1000};
  for (const id of Z.ORDER) Z.SCRIPTS[id].steps.forEach((st, i) => {
    for (const w of C.plays(st)) {
      const s = C.start(w), where = id + ' 第 ' + (i + 1) + ' 步 ' + w.kind;
      if (w.kind === 'mask') { const m = C.K.mask.words(w); for (const k of Object.keys(m.keep)) assert.equal(C.act(w, s, {word: k}).ok, false, where); for (const k of Object.keys(m.need)) assert.equal(C.act(w, s, {word: k}).ok, true, where); }
      if (w.kind === 'spot') w.lines.forEach((L, j) => assert.equal(C.act(w, s, {i: j}).ok, L.bad ? true : false, where));
      if (w.kind === 'judge') w.items.forEach((it) => { assert.equal(C.act(w, s, {bin: (it.bin + 1) % w.bins.length}).ok, false, where); assert.equal(C.act(w, s, {bin: it.bin}).ok, true, where); });
      if (w.kind === 'pick') { const bad = w.options.findIndex((o) => !o.ok); assert.equal(C.act(w, s, {i: bad}).ok, false, where); assert.equal(C.act(w, s, {i: w.options.findIndex((o) => o.ok)}).ok, true, where); }
      if (w.kind === 'order') { if (w.items.length > 1) assert.equal(C.act(w, s, {i: 1}).ok, false, where); w.items.forEach((_, j) => assert.equal(C.act(w, s, {i: j}).ok, true, where)); }
      if (w.kind === 'chips') w.slots.forEach((sl) => { const bad = sl.options.findIndex((o) => o.bad); if (bad >= 0) assert.equal(C.act(w, s, {k: sl.k, j: bad}).ok, false, where); assert.equal(C.act(w, s, {k: sl.k, j: sl.options.findIndex((o) => !o.bad)}).ok, true, where); });
      if (w.kind === 'alloc') w.parts.forEach((p, j) => { let d = w.answer[j] - s.v[j]; while (d) { C.act(w, s, {p: j, d: Math.sign(d)}); d -= Math.sign(d); } });
      if (w.kind === 'place') w.texts.forEach((t, j) => { C.act(w, s, {text: j}); const wrong = w.zones.find((z) => z.k !== t.zone); assert.equal(C.act(w, s, {zone: wrong.k}).ok, false, where); assert.equal(C.act(w, s, {zone: t.zone}).ok, true, where); });
      if (w.kind === 'read') { C.act(w, s, {go: true, now: now.t}); assert.equal(C.act(w, s, {stop: true, now: now.t + 9000}).ok, true, where); assert.equal(s.secs, 9); }
      if (w.kind === 'book') w.pages.forEach(() => C.act(w, s, {d: 1}));
      if (w.kind === 'film') C.act(w, s, {end: true});
      assert.equal(C.done(w, s), true, where + ' 没做完');
    }
  });
});

test('分时间：加起来要正好是总时长，重点那段最长', () => {
  const w = Z.SCRIPTS.kejian.steps[2].play, s = C.start(w);
  assert.equal(C.K.alloc.status(w, s).ok, null);
  assert.match(C.K.alloc.status(w, s).msg, /还剩/);
  assert.equal(C.act(w, s, {p: 0, d: 10}).ok, false);
  assert.equal(C.done(w, s), false);
  C.solve(w, s);
  assert.equal(C.K.alloc.sum(w, s), w.total);
  assert.equal(C.done(w, s), true);
});

test('提示词的空：普通的空都有示例或前面玩法给的值；粘贴框留给用户', () => {
  for (const id of Z.ORDER) {
    const g = guideOf(id), s = Z.SCRIPTS[id], known = new Set();
    s.steps.forEach((st, i) => {
      for (const w of C.plays(st)) {
        if (w.kind === 'chips') { w.slots.forEach((x) => known.add(x.k)); if (w.saveAs) known.add(w.saveAs); }
        if (w.kind === 'pick' && w.save) known.add(w.save);
        if (w.kind === 'mask' && w.saveAs) known.add(w.saveAs);
      }
      for (const slot of C.slots(g.steps[i].prompt || '')) {
        if (C.isPaste(slot)) continue;
        const ok = (st.fill && st.fill[slot] != null) || known.has(slot) || (st.use && known.has(st.use[slot]));
        assert.ok(ok, id + ' 第 ' + (i + 1) + ' 步的空【' + slot + '】没有示例');
      }
      for (const k of Object.values(st.use || {})) assert.ok(known.has(k), id + ' 第 ' + (i + 1) + ' 步用了还没记下的值 ' + k);
    });
  }
  assert.equal(C.fill('给【A】写【粘贴B】', {A: '甲'}), '给甲写【粘贴B】');
  assert.deepEqual(plain(C.slots('【A】和【粘贴B】')), ['A', '粘贴B']);
  assert.deepEqual(plain(C.checks({check: '检查：一；二。三'}, {})), ['一', '二', '三']);
});

test('不是本站实测原文的练习都标了「练习」或「示意」；实测素材都带类型和说明', () => {
  const kinds = ['AI生成产出', 'AI生成视频', '实操截图', '人工编辑成果'];
  for (const id of Z.ORDER) Z.SCRIPTS[id].steps.forEach((st, i) => {
    for (const w of C.plays(st)) {
      if (w.kind === 'spot' || w.kind === 'mask') assert.match(w.tag || '', /练习/, id + ' 第 ' + (i + 1) + ' 步的' + w.kind + '要标「练习」');
    }
    for (const m of (st.reveal && st.reveal.media) || []) { assert.ok(kinds.includes(m.kind), id + ' 素材类型'); assert.ok(m.caption, id + ' 素材说明'); }
    const r = st.reveal && st.reveal.result;
    if (r) assert.match(r.tag || '', /实测|示意/, id + ' 的结果卡要说明来源');
  });
  // 剧本里不出现真实品牌的宣传话术、收入或销量承诺
  const text = JSON.stringify(Z.SCRIPTS);
  assert.doesNotMatch(text, /赚钱|收益|月入|稳赚/);
});

test('用到的图片、视频都在站里；大图都有手机版，而且不超过 300 KB', () => {
  const paths = new Set();
  const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); else if (typeof v === 'string' && /^media\/.+\.(png|jpe?g|mp4)$/i.test(v)) paths.add(v); };
  for (const id of Z.ORDER) { walk(Z.SCRIPTS[id]); walk(guideOf(id).steps); walk(guideOf(id).exampleMedia || []); }
  for (const p of paths) assert.ok(existsSync(LEARN + p), '缺少素材 ' + p);
  for (const [from, to] of Object.entries(Z.LITE)) {
    assert.ok(existsSync(LEARN + from) && existsSync(LEARN + to), '手机版对照表有缺的文件：' + from);
    assert.ok(statSync(LEARN + to).size <= 300 * 1024, to + ' 太大');
  }
  for (const p of paths) if (!p.endsWith('.mp4') && statSync(LEARN + p).size > 250 * 1024) assert.ok(Z.LITE[p], p + ' 是大图，要有手机版（运行 python3 scripts/build-zuo-media.py）');
});

test('课件、绘本两篇的教程正文和小程序的 mini-guides.json 是同一份', () => {
  for (const id of ['kejian', 'huiben']) {
    const a = Z.EXTRA.find((g) => g.id === id), b = mini.find((g) => g.id === id);
    assert.ok(a && b);
    assert.deepEqual(plain(a.steps), b.steps);
    assert.deepEqual(plain(a.exampleMedia), b.exampleMedia);
    assert.deepEqual(plain(a.evidence), b.evidence);
    for (const k of ['title', 'outcome', 'needs', 'intro']) assert.equal(a[k], b[k]);
  }
  for (const id of Z.ORDER) assert.ok(mini.find((g) => g.id === id), '小程序教程里没有 ' + id);
});

test('小程序用的剧本和玩法规则是由网页版生成的最新版本', async () => {
  execFileSync('node', ['scripts/build-mini-ai-content.mjs', '--check'], {stdio: 'pipe'});
  const z = JSON.parse(readFileSync('uni-app/src/data/mini-zuo.json', 'utf8'));
  assert.deepEqual(z.SCRIPTS, plain(Z.SCRIPTS));
  assert.deepEqual(z.LITE, plain(Z.LITE));
  assert.doesNotMatch(JSON.stringify(z), /\/static\//);
  const core = (await import('../uni-app/src/data/zuo-core.js')).default;
  assert.deepEqual(Object.keys(core).sort(), Object.keys(C).sort());
  const w = Z.SCRIPTS['meeting-notes'].steps[0].play, s = core.start(w);
  core.act(w, s, {word: '王芳'});
  assert.match(core.K.mask.text(w, s), /成员 A/);
});

test('网页和小程序的页面都接上了', () => {
  const html = readFileSync(LEARN + 'zuo.html', 'utf8');
  const order = ['ai-play.js', 'guides-data.js', 'xue-ai-data.js', 'zuo-core.js', 'zuo-data.js', 'zuo.js'].map((f) => html.indexOf('src="' + f + '"'));
  assert.ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), 'zuo.html 里脚本的顺序');
  assert.doesNotMatch(html, /<script>(?!<\/script>)/);
  const pages = readFileSync('uni-app/src/pages.json', 'utf8');
  assert.match(pages, /"path": "pages\/learn\/zuo"/);
  const learning = readFileSync('uni-app/src/pages/learn/learning.vue', 'utf8');
  assert.match(learning, /\/pages\/learn\/zuo\?id=/);
  const vue = readFileSync('uni-app/src/pages/learn/zuo.vue', 'utf8');
  assert.match(vue, /mini-zuo\.json/);
  assert.match(vue, /zuo-core\.js/);
  assert.doesNotMatch(vue + readFileSync('uni-app/src/components/ZuoWidget.vue', 'utf8'), /(^|[^n])\/static\//m);
});
