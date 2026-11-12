<template>
  <view class="page">
    <view v-if="!guide || !script" class="missing">
      <text class="title">没有找到这篇教程</text>
      <text class="sub">回到学 AI，从「跟着做」里重新打开。</text>
      <view class="btn" hover-class="press" @tap="goLearn">回到学 AI</view>
    </view>

    <template v-else>
      <view class="top">
        <view class="back" hover-class="press" @tap="back"><text>‹</text></view>
        <view class="top-t">
          <text class="sub">{{ view === 'step' ? '第 ' + (cur + 1) + ' / ' + guide.steps.length + ' 步' : view === 'end' ? '跟着做 · 全部做完' : '跟着做 · ' + (guide.category || '教程') }}</text>
          <text class="title">{{ view === 'step' ? guide.steps[cur].title : guide.title }}</text>
        </view>
      </view>
      <view v-if="view === 'step'" class="prog"><view v-for="(s, i) in guide.steps" :key="i" class="seg" :class="{ on: i <= cur }" /></view>

      <!-- 两位角色轮流说话 -->
      <view class="stage" :class="'m-' + mood">
        <text v-if="view === 'end' && stamp" class="stamp">做成了</text>
        <view class="duo">
          <view class="p" :class="{ talk: talkWho === 'me' }"><image class="char" :src="roles[script.who].src" mode="aspectFill" /><text class="pn">{{ roles[script.who].name }}</text></view>
          <view class="p" :class="{ talk: talkWho === 'a' }"><image class="char ach" :src="aFace" mode="aspectFill" /><text class="pn">小A</text></view>
        </view>
        <view v-if="sayWho" :key="'say' + sayKey" class="say" :class="sayWho === 'a' ? 'sa' : 'sm'">
          <text class="say-n">{{ sayWho === 'a' ? '小A' : roles[script.who].name }}</text>
          <text class="say-t">{{ sayText }}</text>
        </view>
      </view>

      <!-- 开场 -->
      <template v-if="view === 'intro'">
        <view v-if="teaser" class="teaser">
          <view class="tz-media" @tap="tapTeaser"><image class="tz-img" :src="teaser.img" mode="aspectFill" /><text class="tz-lbl">{{ teaser.label }}</text><view v-if="teaser.play" class="tz-play" /></view>
          <view class="tz-t"><text class="tz-b">{{ teaser.title }}</text><text class="tz-s">{{ teaser.sub }}</text></view>
        </view>
        <view v-if="guide.video && guide.video.verified && playTeaser" class="card"><video class="vid" :src="url(guide.video.src)" :poster="url(script.poster)" controls :autoplay="true" object-fit="contain" /></view>
        <view class="card"><text class="card-h">要准备</text><text class="card-p">{{ guide.needs }}</text></view>
        <view class="card">
          <view class="steps-h"><text class="card-h">一共 {{ guide.steps.length }} 步</text><text class="muted">{{ doneN ? '做完 ' + doneN + ' / ' + guide.steps.length + ' 步 · 只存在这台设备' : '记录只存在这台设备' }}</text></view>
          <view v-for="(s, i) in guide.steps" :key="i" class="srow" hover-class="press" @tap="play(i)">
            <text class="sn" :class="{ ok: isDone(i) }">{{ isDone(i) ? '✓' : i + 1 }}</text>
            <view class="st"><text class="st-b">{{ s.title }}</text><text v-if="kindsOf(i)" class="st-k">玩法：{{ kindsOf(i) }}</text></view>
            <text class="sw">{{ isDone(i) ? '做完了' : '›' }}</text>
          </view>
        </view>
        <text v-if="guide.evidence && guide.evidence.verified" class="proof">本站实测 · {{ guide.evidence.tool }}</text>
        <view class="btn" hover-class="press" @tap="startTap">{{ startLabel }}</view>
        <text class="link" @tap="openGuide">看完整图文教程</text>
      </template>

      <!-- 一步：玩一玩 → 本站实测 → 轮到你 -->
      <template v-if="view === 'step'">
        <ZuoWidget v-for="(w, k) in plays.slice(0, shown)" :key="stepKey + '-' + k" :w="w" :lite="lite" :solved="skipAll" :video="guide.video || null" :poster="script.poster || ''" @done="onWidgetDone(k, $event)" @react="react" />
        <text v-if="plays.length && !playsDone && shown > 0" class="skip" @tap="skip">跳过练习，直接去做</text>

        <view v-if="playsDone && (revealMedia.length || revealResult)" class="card reveal">
          <text class="card-h2">本站实测</text>
          <view v-for="(m, i) in revealMedia" :key="i" class="media">
            <video v-if="m.video" class="clip" :src="url(m.video)" :poster="url(m.poster)" controls :initial-time="m.clip ? m.clip[0] : 0" object-fit="cover" />
            <image v-else class="shot" :src="url(m.src)" mode="widthFix" />
            <text class="mk">{{ m.kind }}</text><text class="cap">{{ m.caption }}</text>
          </view>
          <view v-if="revealResult" class="res">
            <view class="res-h"><text class="res-b">{{ revealResult.title }}</text><text v-if="revealResult.tag" class="wt">{{ revealResult.tag }}</text></view>
            <view v-for="(r, i) in revealResult.rows || []" :key="'r' + i" class="res-r"><text class="res-k">{{ r[0] }}</text><text class="res-v">{{ r[1] }}</text></view>
            <view v-if="revealResult.frames" class="frames"><view v-for="(f, i) in revealResult.frames" :key="'f' + i" class="frame"><text class="frame-n">{{ i + 1 }}</text><text>{{ f }}</text></view></view>
          </view>
        </view>

        <view v-if="playsDone" class="yours">
          <text class="h2">轮到你了：去真的 AI 里做</text>
          <view class="card"><text class="card-h3">怎么做</text><text class="card-p">{{ step.action }}</text></view>
          <view v-if="step.prompt" class="card">
            <text class="card-h3">提示词</text>
            <view class="ptext"><text v-for="(x, i) in promptParts" :key="i" :class="{ pf: x.slot && x.val, pe: x.slot && !x.val }">{{ x.slot ? (x.val || '【' + x.slot + '】') : x.text }}</text></view>
            <view v-for="f in fields" :key="f.k" class="field">
              <text class="field-k">{{ f.label }}</text>
              <textarea v-if="f.paste" class="field-a" :value="vals[f.k] || ''" :placeholder="f.k" auto-height maxlength="-1" @input="setVal(f.k, $event.detail.value)" />
              <input v-else class="field-i" :value="vals[f.k] || ''" :placeholder="f.k" @input="setVal(f.k, $event.detail.value)" />
            </view>
            <text v-if="tip" class="tip">{{ tip }}</text>
            <view class="btn soft" hover-class="press" @tap="copyPrompt">复制提示词</view>
          </view>
          <view class="card">
            <text class="card-h3">做完对照检查，一项一项勾</text>
            <view v-for="(c, i) in checks" :key="i" class="chk" :class="{ on: ticked[i] }" hover-class="press" @tap="tick(i)"><text class="box">{{ ticked[i] ? '✓' : '' }}</text><text class="chk-t">{{ c }}</text></view>
            <text v-if="stepScript.note" class="note">{{ stepScript.note }}</text>
          </view>
          <view class="btn" :class="{ off: left > 0 }" hover-class="press" @tap="finishStep">{{ left > 0 ? '还差 ' + left + ' 项没勾' : cur + 1 < guide.steps.length ? '这一步做完了 · 去第 ' + (cur + 2) + ' 步' : '全部做完了 · 看成品' }}</view>
          <text class="skip" @tap="play(cur)">重玩这一步</text>
        </view>
      </template>

      <!-- 做成了 -->
      <template v-if="view === 'end'">
        <view v-if="newBadge" class="card badge"><text class="badge-t">新徽章</text><text>学完了「{{ newBadge }}」</text></view>
        <view class="card"><text class="muted">你做出了</text><text class="made">{{ guide.outcome }}</text></view>
        <view v-if="guide.video && guide.video.verified" class="card">
          <text class="card-h2">{{ guide.video.title }}</text>
          <video class="vid" :src="url(guide.video.src)" :poster="url(script.poster)" controls object-fit="contain" />
          <text class="cap">{{ guide.video.caption }} 来源：{{ guide.video.source }}</text>
        </view>
        <view v-else-if="gallery.length" class="card">
          <text class="card-h2">本站试做的成品</text>
          <scroll-view scroll-x class="gal"><view v-for="(m, i) in gallery" :key="i" class="gal-f"><image class="gal-i" :src="url(m.src)" mode="widthFix" /><text class="mk">{{ m.kind }}</text><text class="cap">{{ m.cap }}</text></view></scroll-view>
        </view>
        <view v-if="guide.evidence && guide.evidence.verified" class="card">
          <text class="card-h2">本站实测：{{ guide.evidence.title }}</text>
          <text class="muted">{{ guide.evidence.tool }}</text>
          <view v-for="r in evRows" :key="r[0]" class="res-r"><text class="res-k">{{ r[0] }}</text><text class="res-v">{{ r[1] }}</text></view>
        </view>
        <view class="two"><view class="btn soft" hover-class="press" @tap="openGuide">看图文教程</view><view class="btn" hover-class="press" @tap="goLearn">回到学 AI</view></view>
      </template>
    </template>
  </view>
</template>

<script setup>
// 跟着做 · 动画互动版（小程序）。和网页版 static/learn/zuo.html 同一套剧本和玩法：
// 剧本在 data/mini-zuo.json，玩法规则在 data/zuo-core.js（都由 scripts/build-mini-ai-content.mjs 从网页版生成），教程正文在 data/mini-guides.json。
// 每一步做没做完记在 ainpe_mini_learning_v1（和图文教程页 pages/learn/guide 同一份），玩法里选的词记在 ainpe_mini_zuo_v1。
import { ref, computed } from 'vue';
import { onLoad, onUnload, onHide } from '@dcloudio/uni-app';
import ZuoWidget from '../../components/ZuoWidget.vue';
import guides from '../../data/mini-guides.json';
import zuo from '../../data/mini-zuo.json';
import mini from '../../data/mini-ai.json';
import core from '../../data/zuo-core.js';
import { ROLES, A_FACES, LEARNING_KEY, ZUO_KEY, mediaUrl, loadStore, unitState, shortName } from '../../data/ai-core.js';

const roles = ROLES;
const lite = zuo.LITE || {};
const KIND_LABEL = { mask: '打码', spot: '找茬', judge: '分一分', pick: '选一选', order: '排顺序', chips: '选词拼', alloc: '分时间', place: '放文字', read: '读一遍', book: '翻一翻', film: '看成片' };
const id = ref('');
const guide = computed(() => guides.find((g) => g.id === id.value) || null);
const script = computed(() => zuo.SCRIPTS[id.value] || null);
const view = ref('intro');
const cur = ref(0);
const url = (p) => mediaUrl(p, lite);

/* ---------- 记录 ---------- */
const progress = ref({});
const saved = ref({});
function readStore(key) { try { const v = uni.getStorageSync(key); return v && typeof v === 'object' ? v : {}; } catch { return {}; } }
function load() { progress.value = readStore(LEARNING_KEY); saved.value = (readStore(ZUO_KEY)[id.value]) || {}; }
const completed = computed(() => { const r = progress.value[id.value]; return Array.isArray(r && r.completedSteps) ? r.completedSteps : []; });
const isDone = (i) => completed.value.includes(i);
const doneN = computed(() => (guide.value ? guide.value.steps.filter((_, i) => isDone(i)).length : 0));
const firstTodo = () => { const n = guide.value ? guide.value.steps.length : 0; for (let i = 0; i < n; i++) if (!isDone(i)) return i; return -1; };
function markDone(i) {
  const all = readStore(LEARNING_KEY), rec = all[id.value] || {};
  const steps = Array.from(new Set([...(Array.isArray(rec.completedSteps) ? rec.completedSteps : []), i])).sort((a, b) => a - b);
  all[id.value] = { ...rec, completedSteps: steps, updatedAt: new Date().toISOString() };
  try { uni.setStorageSync(LEARNING_KEY, all); } catch { uni.showToast({ title: '保存失败，请重试', icon: 'none' }); }
  progress.value = all;
}
function keep(vals) {
  if (!vals || !Object.keys(vals).length) return;
  const all = readStore(ZUO_KEY), rec = { ...(all[id.value] || {}), ...vals };
  all[id.value] = rec;
  try { uni.setStorageSync(ZUO_KEY, all); } catch {}
  saved.value = rec;
}
function badgeOf() {
  const u = mini.xue.UNITS.find((x) => (x.projects || []).includes(id.value));
  return u ? { unit: u, got: unitState(u, loadStore(uni), guides, readStore(LEARNING_KEY)).badge } : null;
}

/* ---------- 角色 ---------- */
let run = 0;
const mood = ref('flat');
const blink = ref(false);
const talkWho = ref('');
const sayWho = ref('');
const sayText = ref('');
const sayKey = ref(0);
const stamp = ref(false);
const aFace = computed(() => (mood.value === 'happy' ? A_FACES.happy : mood.value === 'confused' ? A_FACES.confused : blink.value ? A_FACES.blink : A_FACES.flat));
const blinkTimer = setInterval(() => { if (mood.value !== 'flat') return; blink.value = true; setTimeout(() => { blink.value = false; }, 170); }, 3600);
function sleep(ms, t) { return new Promise((ok, no) => setTimeout(() => (t === run ? ok() : no('stop')), ms)); }
function talk(who) { talkWho.value = ''; setTimeout(() => { talkWho.value = who; }, 20); }
function say(who, text, t) {
  sayWho.value = who; sayText.value = ''; sayKey.value++; talk(who);
  return new Promise((ok, no) => {
    let i = 0;
    const next = () => { if (t !== run) return no('stop'); if (i >= text.length) return ok(); sayText.value += text.charAt(i++); setTimeout(next, 38); };
    next();
  });
}
let moodTimer = 0;
function react(ok) {
  clearTimeout(moodTimer);
  if (ok === true) { mood.value = 'happy'; talk('a'); moodTimer = setTimeout(() => { mood.value = 'flat'; }, 1200); }
  else if (ok === false) { mood.value = 'confused'; moodTimer = setTimeout(() => { mood.value = 'flat'; }, 1400); }
}
function toTop() { uni.pageScrollTo({ scrollTop: 0, duration: 0 }); }

/* ---------- 开场 ---------- */
const playTeaser = ref(false);
const teaser = computed(() => {
  const g = guide.value, s = script.value; if (!g || !s) return null;
  if (g.video && g.video.verified && s.poster) return { img: url(s.poster), label: '成品示例', play: true, title: g.video.title, sub: '本站跟着这 ' + g.steps.length + ' 步试做出来的，点开看看。' };
  if (s.cover) return { img: url(s.cover), label: s.coverLabel || '配图', play: false, title: (g.evidence && g.evidence.title) || g.title, sub: gallery.value.length ? '做完能看到本站试做的成品。' : '本站用虚构素材实测过，做完给你看实测记录。' };
  return null;
});
const startLabel = computed(() => { const k = doneN.value, n = firstTodo(); return n < 0 ? '全部做完了 · 再看成品' : k ? '接着做第 ' + (n + 1) + ' 步' : '开始第 1 步'; });
const kindsOf = (i) => core.plays((script.value.steps || [])[i] || {}).map((w) => KIND_LABEL[w.kind]).filter(Boolean).join(' · ');
function showIntro() {
  const t = ++run; view.value = 'intro'; mood.value = 'flat'; sayWho.value = ''; stamp.value = false; playTeaser.value = false; toTop();
  sleep(300, t).then(() => say('me', script.value.hello.me, t)).then(() => sleep(500, t))
    .then(() => { mood.value = 'happy'; return say('a', script.value.hello.ai, t); }).catch(() => {});
}
function tapTeaser() { if (teaser.value && teaser.value.play) playTeaser.value = true; }
function startTap() { const n = firstTodo(); if (n < 0) showEnd(null); else play(n); }

/* ---------- 一步 ---------- */
const step = computed(() => guide.value.steps[cur.value]);
const stepScript = computed(() => (script.value.steps || [])[cur.value] || {});
const plays = ref([]);
const shown = ref(0);
const playsDone = ref(false);
const skipAll = ref(false);
const stepKey = ref(0);
// 提示词里的值：前面玩法记下的、剧本里的例子，加上用户自己改的（用户改的优先）
const edits = ref({});
const vals = computed(() => (view.value === 'step' ? { ...initialVals(), ...edits.value } : {}));
const ticked = ref([]);
function play(i) {
  const t = ++run;
  cur.value = i; view.value = 'step'; mood.value = 'flat'; sayWho.value = '';
  plays.value = core.plays(stepScript.value); shown.value = 0; playsDone.value = false; skipAll.value = false; stepKey.value++;
  edits.value = {}; ticked.value = [];
  toTop();
  sleep(200, t).then(() => say('a', stepScript.value.ai || step.value.title, t)).then(() => sleep(500, t))
    .then(() => (stepScript.value.me ? say('me', stepScript.value.me, t) : null))
    .then(() => { if (plays.value.length) shown.value = 1; else finishPlays(t); }).catch(() => {});
}
function onWidgetDone(k, v) {
  keep(v);
  const t = run;
  if (skipAll.value) { if (k === plays.value.length - 1) finishPlays(t); return; }
  setTimeout(() => { if (t !== run) return; if (k + 1 < plays.value.length) shown.value = k + 2; else finishPlays(t); }, 450);
}
function skip() { run++; skipAll.value = true; shown.value = plays.value.length; finishPlays(run); }
function finishPlays(t) {
  if (playsDone.value) return;
  playsDone.value = true; mood.value = 'happy';
  ticked.value = checks.value.map(() => isDone(cur.value));
  say('a', stepScript.value.done || '轮到你了：去真的 AI 里做一遍，再对照检查。', t).catch(() => {});
}
const revealMedia = computed(() => {
  const sc = stepScript.value, out = [];
  if (!sc.noMedia) (step.value.media || []).filter((m) => m.verified && m.src && m.kind && m.caption).forEach((m) => out.push(m));
  ((sc.reveal && sc.reveal.media) || []).forEach((m) => out.push(m));
  return out;
});
const revealResult = computed(() => (stepScript.value.reveal && stepScript.value.reveal.result) || null);

/* ---------- 轮到你了 ---------- */
function initialVals() {
  const v = {}, sv = saved.value, sc = stepScript.value, use = sc.use || {};
  Object.keys(sc.fill || {}).forEach((k) => { v[k] = sc.fill[k]; });
  core.slots(step.value.prompt || '').forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(sv, k)) v[k] = sv[k];
    if (use[k] && Object.prototype.hasOwnProperty.call(sv, use[k])) v[k] = sv[use[k]];
  });
  return v;
}
function setVal(k, v) { edits.value = { ...edits.value, [k]: v }; }
const fields = computed(() => Array.from(new Set(core.slots(step.value.prompt || ''))).map((k) => ({ k, paste: core.isPaste(k), label: core.isPaste(k) ? '粘贴：' + k.replace(/^粘贴/, '') : k })));
const promptParts = computed(() => core.parts(step.value.prompt || '').map((x) => (x.slot != null ? { slot: x.slot, val: String(vals.value[x.slot] || '').trim() } : { text: x.text })));
const tip = computed(() => {
  const f = fields.value, bits = [];
  if (f.some((x) => !x.paste && vals.value[x.k])) bits.push('【】里填好了例子，可以改成你自己的');
  if (f.some((x) => x.paste && vals.value[x.k])) bits.push('粘贴框里先放了练习里的内容，换成你自己的');
  else if (f.some((x) => x.paste)) bits.push('粘贴框留给你粘贴上一步的结果');
  return bits.length ? bits.join('；') + '。' : '';
});
function copyPrompt() { uni.setClipboardData({ data: core.fill(step.value.prompt, vals.value), success: () => uni.showToast({ title: '已复制，去对话 AI 里粘贴发送', icon: 'none' }) }); }
const checks = computed(() => core.checks(step.value, stepScript.value));
const left = computed(() => checks.value.filter((_, i) => !ticked.value[i]).length);
function tick(i) { const a = ticked.value.slice(); a[i] = !a[i]; ticked.value = a; if (a[i]) talk('a'); }
function finishStep() {
  if (left.value > 0) { uni.showToast({ title: '还差 ' + left.value + ' 项没勾', icon: 'none' }); return; }
  const i = cur.value, n = guide.value.steps.length, before = badgeOf();
  markDone(i);
  const rest = firstTodo();
  if (i + 1 < n) { uni.showToast({ title: '第 ' + (i + 1) + ' 步做完了', icon: 'none' }); play(i + 1); return; }
  if (rest >= 0) { uni.showToast({ title: '还有第 ' + (rest + 1) + ' 步没做完', icon: 'none' }); play(rest); return; }
  const after = badgeOf();
  showEnd(after && after.got && !(before && before.got) ? shortName(after.unit) : null);
}

/* ---------- 做成了 ---------- */
const newBadge = ref('');
const gallery = computed(() => {
  const g = guide.value; if (!g) return [];
  const out = (g.exampleMedia || []).map((m) => ({ src: m.src, cap: m.caption, kind: '本站实测' }));
  if (!out.length) g.steps.forEach((s) => (s.media || []).forEach((m) => { if (m.verified && m.kind !== '实操截图') out.push({ src: m.src, cap: m.caption, kind: m.kind }); }));
  return out;
});
const evRows = computed(() => { const e = guide.value && guide.value.evidence; return e ? [['素材', e.input], ['怎么做', e.process], ['结果', e.result], ['还没验证', e.limits]].filter((r) => r[1]) : []; });
function showEnd(badge) {
  const t = ++run; view.value = 'end'; mood.value = 'happy'; sayWho.value = ''; stamp.value = false; newBadge.value = badge || ''; toTop();
  sleep(300, t).then(() => say('me', script.value.end.me, t)).then(() => sleep(450, t))
    .then(() => say('a', script.value.end.ai, t)).then(() => { stamp.value = true; }).catch(() => {});
}

/* ---------- 导航 ---------- */
function back() { if (view.value !== 'intro') { showIntro(); return; } uni.navigateBack({ fail: goLearn }); }
function goLearn() { uni.redirectTo({ url: '/pages/learn/learning' }); }
function openGuide() { uni.navigateTo({ url: '/pages/learn/guide?id=' + encodeURIComponent(id.value) }); }

onLoad((options) => {
  id.value = String((options && options.id) || '');
  load();
  if (guide.value && script.value) showIntro();
});
onHide(() => { run++; });
onUnload(() => { run++; clearInterval(blinkTimer); clearTimeout(moodTimer); });
</script>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:16px 16px calc(40px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23;display:flex;flex-direction:column;gap:12px}
.top{display:flex;align-items:center;gap:10px}
.back{flex:none;width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1}
.top-t{flex:1;min-width:0;display:flex;flex-direction:column}
.sub{font-size:12px;font-weight:700;color:#5f6675}
.title{font-size:22px;font-weight:900;line-height:1.3}
.prog{display:flex;gap:5px}.seg{flex:1;height:6px;border-radius:3px;background:#e6e8ec}.seg.on{background:#2b44e6}
.stage{position:relative;background:#fff;border-radius:22px;padding:16px 14px 14px}
.duo{display:flex;justify-content:space-between;align-items:flex-end}
.p{display:flex;flex-direction:column;align-items:center;gap:2px;width:72px}
.char{width:64px;height:64px;border-radius:50%;animation:bob 2.6s ease-in-out infinite}
.p.talk .char{animation:hop .5s ease 1}
.m-happy .ach{animation:jump .7s ease 2}
.m-confused .ach{animation:tilt 1.1s ease-in-out infinite}
.pn{font-size:12px;font-weight:700;color:#5f6675}
.say{position:relative;margin-top:10px;background:#f3f4f6;border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;animation:pop .25s ease both}
.say.sm{background:#eceffe}
.say-n{font-size:12px;font-weight:800;color:#5f6675}
.say-t{font-size:16px;line-height:1.6}
.stamp{position:absolute;right:14px;top:-12px;z-index:2;background:#ffc83d;color:#161a23;font-size:16px;font-weight:900;border-radius:10px;padding:4px 14px;transform:rotate(6deg);animation:stamp .5s ease both}
.card{display:flex;flex-direction:column;gap:8px;background:#fff;border-radius:20px;padding:14px 16px}
.card-h{font-size:16px;font-weight:900}
.card-h2{font-size:16px;font-weight:900}
.card-h3{font-size:14px;font-weight:900;color:#5f6675}
.card-p{font-size:15px;line-height:1.75}
.muted{font-size:12px;font-weight:700;color:#5f6675}
.teaser{display:flex;gap:14px;align-items:center}
.tz-media{position:relative;flex:none;width:120px;height:120px;border-radius:16px;overflow:hidden;background:#1c2550}
.tz-img{width:120px;height:120px}
.tz-lbl{position:absolute;left:8px;top:8px;font-size:11px;font-weight:800;color:#fff;background:rgba(22,26,35,.62);border-radius:8px;padding:2px 7px}
.tz-play{position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92)}
.tz-t{flex:1;min-width:0;display:flex;flex-direction:column}
.tz-b{font-size:16px;font-weight:900;line-height:1.4}.tz-s{font-size:14px;color:#5f6675;line-height:1.6}
.steps-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.srow{display:flex;align-items:center;gap:12px;min-height:58px;border-top:1px solid #e6e8ec;padding:6px 0}
.sn{flex:none;width:28px;height:28px;line-height:28px;text-align:center;border-radius:9px;background:#eceffe;color:#2b44e6;font-size:14px;font-weight:900}
.sn.ok{background:#ffc83d;color:#161a23}
.st{flex:1;min-width:0;display:flex;flex-direction:column}.st-b{font-size:15px;font-weight:800}.st-k{font-size:12px;font-weight:700;color:#2b44e6}
.sw{flex:none;font-size:13px;color:#5f6675}
.proof{font-size:12px;font-weight:700;color:#5f6675;text-align:center}
.btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800;flex:1}
.btn.soft{background:#eceffe;color:#2b44e6}
.btn.off{opacity:.5}
.link,.skip{align-self:center;font-size:14px;font-weight:800;color:#2b44e6;padding:8px}
.skip{color:#5f6675}
.vid{width:100%;height:420px;border-radius:14px}
.reveal{gap:12px}
.media{display:flex;flex-direction:column;gap:4px}
.shot{width:100%;border-radius:12px;display:block}
.clip{width:146px;height:260px;border-radius:12px}
.mk{align-self:flex-start;font-size:11px;font-weight:800;background:#f3f4f6;border-radius:6px;padding:1px 6px}
.cap{font-size:12px;color:#5f6675;line-height:1.5}
.res{display:flex;flex-direction:column;gap:8px;background:#f3f4f6;border-radius:14px;padding:12px 14px}
.res-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.res-b{font-size:15px;font-weight:900}
.wt{font-size:11px;font-weight:700;color:#5f6675;background:#fff;border-radius:6px;padding:2px 7px}
.res-r{display:flex;gap:12px;font-size:14px;line-height:1.6}.res-k{flex:none;font-weight:800;color:#5f6675}.res-v{flex:1;min-width:0}
.frames{display:flex;gap:8px}
.frame{flex:1;height:120px;border-radius:10px;border:2px dashed #e6e8ec;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:800;text-align:center;padding:6px}
.frame-n{width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;background:#eceffe;color:#2b44e6}
.yours{display:flex;flex-direction:column;gap:10px}
.h2{font-size:19px;font-weight:900}
.ptext{background:#f3f4f6;border-radius:12px;padding:10px 12px;font-size:15px;line-height:1.9}
.pf{color:#2b44e6;font-weight:800}.pe{color:#5f6675}
.field{display:flex;flex-direction:column;gap:4px}
.field-k{font-size:12px;font-weight:800;color:#5f6675}
.field-i,.field-a{background:#fff;border:2px solid #2b44e6;border-radius:10px;padding:8px 10px;font-size:15px;font-weight:700;color:#2b44e6}
.field-i{height:44px;box-sizing:border-box}
.field-a{width:auto;min-height:60px;border-style:dashed}
.tip{font-size:12px;color:#5f6675}
.chk{display:flex;align-items:center;gap:10px;border:2px solid #e6e8ec;border-radius:14px;padding:10px 12px;min-height:52px;box-sizing:border-box}
.chk.on{border-color:#2b44e6;background:#eceffe}
.box{flex:none;width:24px;height:24px;line-height:22px;text-align:center;border-radius:8px;border:2px solid #e6e8ec;color:#fff;font-size:14px;font-weight:900;box-sizing:border-box}
.chk.on .box{background:#2b44e6;border-color:#2b44e6}
.chk-t{flex:1;font-size:15px;font-weight:700;line-height:1.5}
.note{font-size:13px;line-height:1.6;color:#5f6675}
.badge{flex-direction:row;align-items:center;gap:8px;font-size:15px}
.badge-t{background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:8px;padding:2px 10px}
.made{font-size:18px;font-weight:900;line-height:1.5}
.gal{white-space:nowrap;width:100%}
.gal-f{display:inline-flex;flex-direction:column;gap:4px;width:78%;margin-right:10px;white-space:normal;vertical-align:top}
.gal-i{width:100%;border-radius:12px}
.two{display:flex;gap:10px}
.missing{display:flex;flex-direction:column;gap:12px;padding-top:40px}
.press{opacity:.75}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-9px)}}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}
@keyframes tilt{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes stamp{from{opacity:0;transform:rotate(-20deg) scale(2)}to{opacity:1;transform:rotate(6deg) scale(1)}}
</style>
