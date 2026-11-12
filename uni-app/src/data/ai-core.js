// 小程序「学 AI」「每日 AI」「我的」共用的规则：等级、经验、连续天数、单元徽章、跟着做的进度。
// 规则和网页版（static/learn/ai-play.js、meiri-ai.js、xue-ai.js）一致，tests/mini-ai.test.mjs 会对照检查。
// 记录只存在本机：uni.setStorageSync('ainpe_mini_ai_level_v1')；小程序和网站的记录不互通。

export const STORE_KEY = 'ainpe_mini_ai_level_v1';
export const LEARNING_KEY = 'ainpe_mini_learning_v1'; // 跟着做的步骤记录（guide.vue 写）
export const ASSET = 'https://ainpe.aisen.xin/static/learn/img/';
export const ROLES = {
  a: { name: '小A', src: ASSET + 'role-a.jpg' },
  lin: { name: '小林', src: ASSET + 'role-lin.jpg' },
  yuan: { name: '小圆', src: ASSET + 'role-yuan.jpg' },
  zhou: { name: '老周', src: ASSET + 'role-zhou.jpg' },
};
// 小A 的三种表情图（面罩上的眼睛和嘴）：平静、没听懂、眨眼。开心用原图。
export const A_FACES = { flat: ASSET + 'role-a-flat.jpg', confused: ASSET + 'role-a-confused.jpg', blink: ASSET + 'role-a-blink.jpg', happy: ASSET + 'role-a.jpg' };
export const ART = (key) => (key ? ASSET + 'art/' + key + '.png' : '');
// 跟着做：教程素材（实操截图、生成图、视频）放在网站 static/learn/ 下，大图优先用手机版（LITE 对照表）
export const LEARN_BASE = 'https://ainpe.aisen.xin/static/learn/';
export const ZUO_KEY = 'ainpe_mini_zuo_v1';
export function mediaUrl(path, lite) {
  const p = String(path || '');
  if (!p) return '';
  if (/^https:\/\//.test(p)) return p;
  return LEARN_BASE + ((lite && lite[p]) || p).replace(/^\/+/, '');
}

export const LEVELS = [
  { n: 'AI 新朋友', need: 0 }, { n: 'AI 新手', need: 30 }, { n: '会问的人', need: 80 },
  { n: '会用的人', need: 150 }, { n: 'AI 熟手', need: 240 }, { n: 'AI 达人', need: 360 },
];

export function blank() { return { v: 1, xp: 0, daily: {}, lessons: {} }; }
export function normalize(value) {
  if (value && typeof value === 'object' && value.v === 1 && typeof value.xp === 'number' && value.xp >= 0) {
    return { v: 1, xp: value.xp, daily: plainObject(value.daily), lessons: plainObject(value.lessons) };
  }
  return blank();
}
function plainObject(v) { return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {}; }
export function loadStore(storage) {
  try { let v = storage.getStorageSync(STORE_KEY); if (typeof v === 'string') v = v ? JSON.parse(v) : null; return normalize(v); } catch { return blank(); }
}
export function saveStore(storage, store) { try { storage.setStorageSync(STORE_KEY, store); return true; } catch { return false; } }

export function levelOf(xp) { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l.need) i = k; }); return i; }
export function levelInfo(xp) {
  const i = levelOf(xp), cur = LEVELS[i], nx = LEVELS[i + 1] || null;
  return { index: i, number: i + 1, name: cur.n, next: nx, toNext: nx ? nx.need - xp : 0, pct: nx ? Math.round((xp - cur.need) / (nx.need - cur.need) * 100) : 100 };
}

/* ---------- 日期：北京时间（UTC+08:00），与设备所在时区无关 ---------- */
export function ymd(d) { const x = new Date(d.getTime() + 8 * 3600000); return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0') + '-' + String(x.getUTCDate()).padStart(2, '0'); }
// A date-only value is a calendar day, not an instant; do its arithmetic in UTC.
export function parseYmd(s) { const p = String(s).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
export function addDays(s, n) { const d = parseYmd(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function weekStart(s) { const d = parseYmd(s); return addDays(s, -((d.getUTCDay() + 6) % 7)); }
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
export function weekday(s) { return WEEKDAYS[(parseYmd(s).getUTCDay() + 6) % 7]; }
export function mmdd(s) { const d = parseYmd(s); return (d.getUTCMonth() + 1) + ' 月 ' + d.getUTCDate() + ' 日'; }

/* ---------- 每日 AI ---------- */
export function issueByDate(issues, d) { return (issues || []).find((x) => x.date === d) || null; }
export function doneOnDay(store, issues, d) { const is = issueByDate(issues, d); return !!(is && store.daily[is.id] === d); }
export function streak(store, issues, today) {
  let d = doneOnDay(store, issues, today) ? today : addDays(today, -1), n = 0;
  while (doneOnDay(store, issues, d)) { n++; d = addDays(d, -1); }
  return n;
}
export function currentIssue(issues, today) {
  const t = issueByDate(issues, today);
  if (t) return { issue: t, isToday: true };
  const past = (issues || []).filter((x) => x.date < today).sort((a, b) => (a.date < b.date ? 1 : -1));
  return { issue: past[0] || (issues || [])[0] || null, isToday: false };
}
export function playable(issue, today, unlockAll) { return !!unlockAll || issue.date <= today; }
export function week(store, issues, today) {
  const start = weekStart(today);
  return WEEKDAYS.map((label, k) => {
    const d = addDays(start, k), is = issueByDate(issues, d), onTime = doneOnDay(store, issues, d);
    const late = !onTime && d <= today && !!(is && store.daily[is.id]);
    return { date: d, label: d === today ? '今天' : label, day: parseYmd(d).getUTCDate(), onTime, late, today: d === today };
  });
}
/* 做完一期：当天 +today，补玩 +makeup，连续 streakFrom 天以上当天再加 streakBonus。已做过不再加。 */
export function finishIssue(store, issues, issue, today, XP) {
  const next = normalize(store), first = !next.daily[issue.id], before = levelOf(next.xp);
  let gain = 0, bonus = 0;
  if (first) {
    const onTime = issue.date === today;
    next.daily[issue.id] = today;
    gain = onTime ? XP.today : XP.makeup;
    if (onTime && streak(next, issues, today) >= XP.streakFrom) bonus = XP.streakBonus;
    next.xp += gain + bonus;
  }
  const info = levelInfo(next.xp);
  return { store: next, first, gain, bonus, levelUp: info.index > before, info };
}

/* ---------- 学 AI ---------- */
export function finishLesson(store, id) { const next = normalize(store), first = !next.lessons[id]; next.lessons[id] = 1; return { store: next, first }; }
/* 跟着做：小程序教程的步骤记录在 ainpe_mini_learning_v1[id].completedSteps */
export function projectOf(guides, progress, id) {
  const g = (guides || []).find((x) => x.id === id); if (!g) return null;
  const total = (g.steps || []).length, p = progress && typeof progress === 'object' ? progress[id] : null;
  const n = Array.isArray(p?.completedSteps) ? new Set(p.completedSteps.filter((i) => Number.isInteger(i) && i >= 0 && i < total)).size : 0;
  return { id, title: g.title, cover: g.cover || '', total, n, done: total > 0 && n >= total, step: n ? (n >= total ? '做完了' : '做到第 ' + n + ' / ' + total + ' 步') : '' };
}
export function unitState(unit, store, guides, progress) {
  const lessons = unit.lessons.filter((id) => store.lessons[id]).length;
  const projects = (unit.projects || []).map((id) => projectOf(guides, progress, id)).filter(Boolean);
  const made = projects.filter((p) => p.done).length;
  return { lessons, total: unit.lessons.length, projects, made, badge: lessons === unit.lessons.length && made >= (unit.needProjects || 0) };
}
export function resumeLesson(order, store) { return order.find((id) => !store.lessons[id]) || null; }
export function unitOf(units, lessonId) { return units.find((u) => u.lessons.includes(lessonId)) || null; }
export function shortName(unit) { return unit.name.replace(/^第 \d 单元 /, ''); }
export function unitNo(unit) { return (unit.name.match(/^第 \d 单元/) || [''])[0]; }
