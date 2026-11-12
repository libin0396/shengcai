// 学 AI 一节课、每日 AI 一期的演出顺序（小程序用）。
// 只改传进来的 state：小程序页面里是 reactive 对象，测试里是普通对象。界面怎么画由页面负责。
// 步骤和网页版 static/learn/xue-ai.js、meiri-ai.js 一一对应，tests/mini-ai.test.mjs 会把每节课、每一期从头走到尾。
// 注意：state 是 reactive 时，改值一定要通过 state.xxx 去改（拿到的是代理），不要改赋值前的原对象。

export const STOP = 'stop';

/* 计时：speed=0 时不等待、打字一次出全（测试用） */
export function createClock(opts = {}) {
  const speed = opts.speed ?? 1;
  const later = opts.setTimeout || ((fn, ms) => setTimeout(fn, ms));
  let run = 0;
  return {
    speed,
    later: (fn, ms) => later(fn, Math.round(ms * speed)),
    next() { return ++run; },
    alive(t) { return t === run; },
    stop() { run++; },
    sleep(ms, t) { return new Promise((ok, no) => later(() => (t === run ? ok() : no(STOP)), Math.round(ms * speed))); },
    type(obj, key, text, t, sp = 45) {
      if (!speed) { obj[key] = text; return Promise.resolve(); }
      obj[key] = ''; let i = 0;
      return new Promise((ok, no) => {
        (function step() {
          if (t !== run) return no(STOP);
          if (i >= text.length) return ok();
          obj[key] += text.charAt(i++);
          later(step, Math.round(sp * speed));
        })();
      });
    },
  };
}

/* 和网页版 AIPlay.shuffle 相同的打乱方法，保证两边顺序一样 */
export function shuffle(list, seed) {
  const a = list.slice(); let s = seed || 7;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
  if (a.length > 1 && a.every((v, i) => v === list[i])) { const y = a[0]; a[0] = a[1]; a[1] = y; }
  return a;
}

function shakeLater(clock, obj) { obj.shake = false; clock.later(() => { obj.shake = true; clock.later(() => { obj.shake = false; }, 450); }, 20); }

/* ======================= 学 AI：一节课 ======================= */
export function lessonState() {
  return {
    act: 0, acts: 0, narr: '', narrKey: 0, person: 'lin', mood: 'flat', marks: 0, nod: 0,
    you: { show: false, text: '', parts: null, key: 0 },
    ai: { show: false, text: '', art: '', stamp: false, key: 0 },
    demo: false, panel: { kind: '' },
  };
}

export function createLessonPlayer(lesson, state, opts = {}) {
  const clock = opts.clock || createClock(opts);
  let waiter = null;
  state.acts = lesson.acts.length;
  function wait(panel) { state.panel = panel; return new Promise((ok) => { waiter = ok; }); }
  function release(v) { const w = waiter; waiter = null; if (w) w(v); }
  function say(text) { state.narr = text; state.narrKey++; }
  function clear() { state.you.show = false; state.ai.show = false; state.ai.stamp = false; state.demo = false; state.marks = 0; state.mood = 'flat'; }

  const DO = {
    say: (s, t) => { say(s.text); return clock.sleep(450, t); },
    person: (s) => { state.person = s.who; },
    mood: (s) => { state.mood = s.m; },
    marks: (s, t) => { state.marks = s.n; return clock.sleep(700, t); },
    clear: () => clear(),
    you: (s, t) => {
      state.you.parts = null; state.you.show = true; state.you.key++;
      if (s.instant) { state.you.text = s.text; return clock.sleep(500, t); }
      return clock.type(state.you, 'text', s.text, t, s.sp || 70).then(() => clock.sleep(450, t));
    },
    ai: (s, t) => {
      if (s.mood) state.mood = s.mood; if (s.mood === 'happy') state.marks = 0;
      state.ai.stamp = false; state.ai.art = s.art || ''; state.ai.text = ''; state.ai.show = true; state.ai.key++; state.demo = !!opts.demo;
      return clock.sleep(s.art ? 500 : 0, t).then(() => clock.type(state.ai, 'text', s.text, t, s.sp || 40)).then(() => clock.sleep(450, t));
    },
    stamp: (s, t) => { state.ai.stamp = true; return clock.sleep(500, t); },
    next: (s) => wait({ kind: 'next', label: s.label || '继续' }),
    choice: (s) => wait({ kind: 'choice', opts: s.opts.map((o) => ({ text: o.text, ok: !!o.ok, fb: o.fb, state: '', shake: false })), fb: '', fbOk: false, solved: false }),
    sort: (s) => runSort(s),
    order: (s) => wait({ kind: 'order', items: s.items.slice(), doneFb: s.fb, got: [], pool: shuffle(s.items, s.items.length * 7 + 3).map((text) => ({ text, shake: false })), fb: '', fbOk: false, solved: false }),
    build: (s) => {
      const picked = {};
      const parts = () => s.tpl.map((p) => (typeof p === 'string' ? { text: p, add: false } : picked[p.k] ? { text: s.chips.find((c) => c.k === p.k).text, add: true } : null)).filter(Boolean);
      state.you.show = true; state.you.key++; state.you.text = ''; state.you.parts = parts(); state.marks = Math.min(3, s.chips.length);
      buildCtx = { s, picked, parts };
      return wait({ kind: 'build', chips: s.chips.map((c) => ({ k: c.k, label: c.label, sub: c.sub, used: false })), ready: false, send: s.send }).then(() => { buildCtx = null; state.panel = { kind: '' }; });
    },
    end: (s) => {
      const result = opts.onEnd ? opts.onEnd(s) : {};
      say('这节学完了。' + s.done); state.mood = 'happy';
      state.panel = { kind: 'end', done: s.done, copy: s.copy || '', ...result };
      return new Promise(() => {});
    },
  };
  let buildCtx = null, sortCtx = null;

  function runSort(s) {
    return new Promise((ok) => {
      sortCtx = { s, i: 0, ok };
      showSortItem();
    });
  }
  function showSortItem() {
    const { s, i } = sortCtx; state.mood = 'flat';
    state.panel = { kind: 'sort', labels: s.labels.slice(), text: s.items[i].text, index: i, total: s.items.length, answered: false, fb: '', fbOk: false, shake: false, last: i + 1 >= s.items.length };
  }

  function runAct(a) {
    const t = clock.next(); state.act = a; waiter = null; sortCtx = null; buildCtx = null;
    state.panel = { kind: '' }; clear(); state.you.text = ''; state.you.parts = null; state.ai.text = ''; state.ai.art = ''; state.person = lesson.who;
    let p = Promise.resolve();
    for (const s of lesson.acts[a]) p = p.then(() => { if (!clock.alive(t)) throw STOP; return DO[s.t](s, t); });
    return p.then(() => { if (clock.alive(t) && a + 1 < lesson.acts.length) return runAct(a + 1); }).catch((e) => { if (e !== STOP) throw e; });
  }

  return {
    state,
    start: () => runAct(0),
    replay: () => runAct(state.act),
    stop: () => clock.stop(),
    /* 点「继续」「下一个」「发给小A」 */
    next() {
      const p = state.panel;
      if (p.kind === 'next') { state.panel = { kind: '' }; release(); return; }
      if ((p.kind === 'choice' || p.kind === 'order') && p.solved) { release(); return; }
      if (p.kind === 'build' && p.ready) { release(); return; }
      if (p.kind === 'sort' && p.answered && sortCtx) {
        sortCtx.i++;
        if (sortCtx.i >= sortCtx.s.items.length) { const done = sortCtx.ok; sortCtx = null; done(); } else showSortItem();
      }
    },
    choose(i) {
      const p = state.panel; if (p.kind !== 'choice' || p.solved) return;
      const o = p.opts[i]; if (!o) return;
      if (o.ok) { o.state = 'right'; p.solved = true; p.fb = o.fb; p.fbOk = true; state.mood = 'happy'; state.marks = 0; }
      else { shakeLater(clock, o); state.mood = 'confused'; p.fb = o.fb + '再看看别的。'; p.fbOk = false; }
    },
    sortPick(k) {
      const p = state.panel; if (p.kind !== 'sort' || p.answered || !sortCtx) return;
      const it = sortCtx.s.items[sortCtx.i];
      if (k === it.a) { p.answered = true; p.fb = it.fb; p.fbOk = true; state.mood = 'happy'; }
      else { shakeLater(clock, p); state.mood = 'confused'; p.fb = '再想想。' + it.fb; p.fbOk = false; }
    },
    orderPick(i) {
      const p = state.panel; if (p.kind !== 'order' || p.solved) return;
      const item = p.pool[i]; if (!item) return;
      if (item.text === p.items[p.got.length]) {
        p.got.push(item.text); p.pool.splice(i, 1); state.nod++; p.fb = '';
        if (p.got.length === p.items.length) { p.solved = true; p.fb = p.doneFb; p.fbOk = true; state.mood = 'happy'; }
      } else { shakeLater(clock, item); state.mood = 'confused'; p.fb = '这一步还没到，想想先做哪个。'; p.fbOk = false; }
    },
    chip(k) {
      const p = state.panel; if (p.kind !== 'build' || !buildCtx) return;
      const c = p.chips.find((x) => x.k === k); if (!c || c.used) return;
      c.used = true; buildCtx.picked[k] = 1; state.you.parts = buildCtx.parts(); state.nod++;
      const left = p.chips.filter((x) => !x.used).length; state.marks = Math.min(3, left);
      if (!left) { state.mood = 'flat'; say(buildCtx.s.ready); p.ready = true; }
    },
  };
}

/* ======================= 每日 AI：一期 ======================= */
export function issueState() {
  return { prog: { n: 0, total: 1 }, narr: '', narrKey: 0, view: { kind: '' }, panel: { kind: '' }, result: null };
}

export function createIssuePlayer(issue, state, opts = {}) {
  const clock = opts.clock || createClock(opts);
  let waiter = null, sortCtx = null, t = 0;
  function wait(panel) { state.panel = panel; return new Promise((ok) => { waiter = ok; }); }
  function release(v) { const w = waiter; waiter = null; state.panel = { kind: '' }; if (w) w(v); }
  function say(text) { state.narr = text; state.narrKey++; }
  function prog(n, total) { state.prog = { n, total }; }
  const sleep = (ms) => clock.sleep(ms, t);
  const type = (obj, key, text, sp) => clock.type(obj, key, text, t, sp);
  const nextBtn = (label) => wait({ kind: 'next', label });
  const choiceWait = (opts2) => wait({ kind: 'choice', opts: opts2.map((o) => ({ text: o.text, ok: !!o.ok, fb: o.fb || '', state: '', shake: false })), fb: '', fbOk: false, solved: false });
  const pickWait = (opts2) => wait({ kind: 'pick', opts: opts2.map((o) => ({ text: o.text })) });

  const PLAY = {
    async story() {
      const total = issue.steps.length + 1; let vars = {};
      state.view = { kind: 'story', scene: '', prop: '', sleep: false, line: '' };
      prog(1, total); say(issue.intro);
      await sleep(500); await type(state.view, 'line', issue.start);
      for (let k = 0; k < issue.steps.length; k++) {
        const step = issue.steps[k];
        say(step.ask);
        const i = await pickWait(step.opts); const o = step.opts[i];
        prog(k + 2, total);
        if (o.scene) { state.view.scene = o.scene; state.view.prop = o.scene; }
        if (o.vars) vars = o.vars;
        if (o.sleep) state.view.sleep = true;
        say('小A 接着往下编……');
        await type(state.view, 'line', o.line.replace(/\{(\w+)\}/g, (_, k2) => vars[k2] || ''));
      }
      say(issue.outro); await sleep(1000); await nextBtn('完成这一期');
    },
    async spot() {
      prog(1, 2); say(issue.intro);
      state.view = { kind: 'spot', who: issue.who, ask: issue.ask, sentences: [], clickable: false };
      for (const s of issue.sentences) {
        state.view.sentences.push({ text: '', bad: !!s.bad, hit: false, shake: false });
        await type(state.view.sentences[state.view.sentences.length - 1], 'text', s.t, 30);
      }
      say('哪一句是错的？点它。'); state.view.clickable = true;
      await wait({ kind: 'spot', fb: '', fbOk: false });
      say(issue.outro); await nextBtn('完成这一期');
    },
    async quiz() {
      const total = issue.questions.length; prog(1, total); say(issue.intro);
      state.view = { kind: 'quiz', chat: issue.chat ? { from: issue.chat.from, voice: issue.chat.voice, typed: '', segs: null } : null };
      if (issue.chat) {
        await sleep(600);
        await type(state.view.chat, 'typed', issue.chat.text.map((x) => (typeof x === 'string' ? x : x.t)).join(''), 40);
        state.view.chat.segs = issue.chat.text.map((x) => (typeof x === 'string' ? { t: x, m: '', on: false } : { t: x.t, m: x.m, on: false }));
      }
      for (let k = 0; k < issue.questions.length; k++) {
        const q = issue.questions[k]; prog(k + 1, total);
        if (q.mark && state.view.chat && state.view.chat.segs) {
          q.mark.forEach((m, j) => clock.later(() => { const seg = state.view.chat.segs.find((x) => x.m === m); if (seg) seg.on = true; }, j * 350));
        }
        say(q.q); await choiceWait(q.opts);
      }
    },
    async puzzle() {
      prog(1, 2); say(issue.intro);
      state.view = { kind: 'puzzle', who: issue.who, parts: [], reply: '', replyShow: false };
      await sleep(400); say(issue.goal);
      const all = issue.pieces.map((x) => ({ t: x })).concat(issue.extra || []);
      await wait({ kind: 'pieces', pool: shuffle(all, all.length * 5 + 1).map((p) => ({ text: p.t, fb: p.fb || '', shake: false })), fb: '', fbOk: false });
      prog(2, 2); say('拼好了，发给小A。'); state.view.replyShow = true;
      await sleep(500); await type(state.view, 'reply', issue.reply, 40);
      say(issue.outro); await sleep(600); await nextBtn('完成这一期');
    },
    async oneline() {
      prog(1, 2); say(issue.intro);
      state.view = { kind: 'oneline', scene: issue.scene, line: '', tip: issue.tip };
      await sleep(500); await type(state.view, 'line', issue.line, 45);
      say('复制这一句，去你的 AI 里试一次。');
      await wait({ kind: 'copy', text: issue.line, copied: false });
    },
    async sort() {
      const total = issue.items.length; state.view = { kind: 'sort', who: issue.who };
      say(issue.intro); prog(0, total); await sleep(500);
      await new Promise((ok) => { sortCtx = { ok, i: 0 }; showSort(); });
      say(issue.outro); await nextBtn('完成这一期');
    },
    async walk() {
      const total = issue.steps.length;
      state.view = { kind: 'walk', screen: 'idle', field: '发消息…', question: '', answer: '', cam: false, send: false };
      say(issue.intro); await sleep(600);
      for (let k = 0; k < total; k++) {
        const s = issue.steps[k]; prog(k + 1, total); say(s.narr);
        state.view.cam = s.screen === 'camera'; state.view.send = s.screen === 'ask';
        if (s.screen === 'photo') state.view.screen = 'photo';
        if (s.screen === 'ask') { state.view.screen = 'ask'; state.view.field = ''; await type(state.view, 'field', s.ask, 40); }
        if (s.screen === 'answer') { state.view.question = state.view.field; state.view.field = '发消息…'; state.view.screen = 'answer'; await sleep(500); await type(state.view, 'answer', s.answer, 30); }
        if (s.tap) await nextBtn(s.tap);
      }
      say(issue.outro); await sleep(600); await nextBtn('完成这一期');
    },
  };
  function showSort() {
    const it = issue.items[sortCtx.i];
    say('第 ' + (sortCtx.i + 1) + ' 张：小A 能做吗？'); prog(sortCtx.i, issue.items.length);
    state.panel = { kind: 'sort', labels: issue.labels.slice(), text: it.text, index: sortCtx.i, total: issue.items.length, answered: false, fb: '', fbOk: false, shake: false, last: sortCtx.i + 1 >= issue.items.length };
  }

  function finish() {
    const r = opts.onFinish ? opts.onFinish(issue) : { first: false, gain: 0, bonus: 0, levelUp: false, info: null };
    state.prog = { n: 1, total: 1 }; say(r.levelUp ? '升级了！' : '这期做完了。');
    state.result = { ...r, line: issue.done, learn: issue.learn || '' };
    state.panel = { kind: 'done' };
  }

  return {
    state,
    start() {
      t = clock.next(); state.result = null; state.panel = { kind: '' }; state.view = { kind: '' };
      const play = PLAY[issue.type] || PLAY.spot;
      return play().then(() => { if (clock.alive(t)) finish(); }).catch((e) => { if (e !== STOP) throw e; });
    },
    stop: () => clock.stop(),
    next() {
      const p = state.panel;
      if (p.kind === 'next') { release(); return; }
      if (p.kind === 'choice' && p.solved) { release(); return; }
      if (p.kind === 'copy' && p.copied) { release(); return; }
      if (p.kind === 'sort' && p.answered && sortCtx) {
        sortCtx.i++; prog(sortCtx.i, issue.items.length);
        if (sortCtx.i >= issue.items.length) { const done = sortCtx.ok; sortCtx = null; state.panel = { kind: '' }; done(); } else showSort();
      }
    },
    choose(i) {
      const p = state.panel;
      if (p.kind === 'pick') { if (p.opts[i]) release(i); return; }
      if (p.kind !== 'choice' || p.solved) return;
      const o = p.opts[i]; if (!o) return;
      if (o.ok) { o.state = 'right'; p.solved = true; p.fb = o.fb; p.fbOk = true; }
      else { shakeLater(clock, o); p.fb = o.fb; p.fbOk = false; }
    },
    sortPick(k) {
      const p = state.panel; if (p.kind !== 'sort' || p.answered || !sortCtx) return;
      const it = issue.items[sortCtx.i];
      if (k === it.a) { p.answered = true; p.fb = it.fb; p.fbOk = true; prog(sortCtx.i + 1, issue.items.length); }
      else { shakeLater(clock, p); p.fb = '再想想。' + it.fb; p.fbOk = false; }
    },
    spotPick(i) {
      const p = state.panel, v = state.view; if (p.kind !== 'spot' || !v.clickable) return;
      const s = v.sentences[i]; if (!s) return;
      if (s.bad) { s.hit = true; v.clickable = false; p.fb = issue.hit; p.fbOk = true; prog(2, 2); clock.later(() => release(), 900); }
      else { shakeLater(clock, s); p.fb = issue.miss; p.fbOk = false; }
    },
    piecePick(i) {
      const p = state.panel; if (p.kind !== 'pieces') return;
      const piece = p.pool[i]; if (!piece) return;
      if (piece.fb) { shakeLater(clock, piece); p.fb = piece.fb; p.fbOk = false; return; }
      const got = state.view.parts.length;
      if (piece.text === issue.pieces[got]) {
        state.view.parts.push(piece.text); p.pool.splice(i, 1); p.fb = '';
        if (state.view.parts.length === issue.pieces.length) release();
      } else { shakeLater(clock, piece); p.fb = '顺序不对。先说「我是谁」，再说要做什么，然后是细节和要求。'; p.fbOk = false; }
    },
    copied() { const p = state.panel; if (p.kind === 'copy') { p.copied = true; prog(2, 2); } },
  };
}
