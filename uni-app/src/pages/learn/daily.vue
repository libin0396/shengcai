<template>
  <view class="page">
    <view class="intro"><text class="eyebrow">{{dateText}}</text><text class="title">每日 AI</text></view>
    <AiLevelCard :xp="store.xp" :streak="streakDays" :plays="plays" :lessons="lessonsDone" :today-text="todayText" compact />

    <view class="week">
      <view v-for="d in weekDays" :key="d.date" class="day" :class="{done: d.onTime, late: d.late, today: d.today}">
        <text class="day-l">{{d.label}}</text><text class="day-i">{{d.onTime || d.late ? '✓' : d.day}}</text>
      </view>
    </view>

    <view v-if="current" class="today" hover-class="press" @tap="open(current.issue)">
      <view class="cover">
        <view v-for="s in stars" :key="s.k" class="star" :style="{left: s.left, top: s.top, animationDelay: s.delay}" />
        <text class="tag">{{current.isToday ? '今天 · ' : '最近一期 · '}}{{current.issue.kind}}</text>
        <text class="cover-q">{{current.issue.cover}}</text>
        <image class="cb" :src="roles[current.issue.who].src" mode="aspectFill" />
        <image class="ca" :src="roles.a.src" mode="aspectFill" />
      </view>
      <view class="tx">
        <text class="t-title">{{current.issue.title}}</text>
        <text class="t-meta">{{current.issue.meta}}</text>
        <text v-if="demo" class="tested">示意内容 · 上线前实测</text>
        <view class="btn" :class="{done: store.daily[current.issue.id]}">{{store.daily[current.issue.id] ? '已完成 · 再玩一次' : current.issue.btn + ' · 得 ' + (current.isToday ? XP.today : XP.makeup) + ' 经验'}}</view>
        <text v-if="!current.isToday" class="note">今天这期还在准备，先玩最近一期。</text>
      </view>
    </view>

    <view v-if="others.length" class="past">
      <view v-for="o in others" :key="o.issue.id" class="pi" :class="{off: !o.open}" hover-class="press" @tap="tapOther(o)">
        <image class="pi-img" :class="{dim: !o.open}" :src="o.open ? roles[o.issue.who].src : roles.a.src" mode="aspectFill" />
        <view class="pi-t"><text class="pi-s">周{{o.wd}} · {{o.issue.kind}}</text><text class="pi-b">{{o.open ? o.issue.title : '周' + o.wd + '揭晓'}}</text></view>
        <text class="pill" :class="{ok: o.done, lock: !o.open}">{{!o.open ? '还没到' : o.done ? '已完成' : '补玩'}}</text>
      </view>
    </view>
    <view class="foot">每期 3 分钟内玩完，做完才算完成。当天完成得 {{XP.today}} 经验，补玩得 {{XP.makeup}} 经验；连续 {{XP.streakFrom}} 天以上每天再加 {{XP.streakBonus}}。断了不扣等级。</view>
    <MiniNav active="daily" />
  </view>
</template>

<script setup>
// 每日 AI：每天一期 3 分钟的小互动，做完涨经验。内容在 data/mini-ai.json（由网页版内容生成），玩的页面是 pages/learn/play。
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import AiLevelCard from '../../components/AiLevelCard.vue';
import mini from '../../data/mini-ai.json';
import { ROLES, loadStore, ymd, mmdd, weekday, weekStart, addDays, week, streak, currentIssue, playable } from '../../data/ai-core.js';

const M = mini.meiri, XP = M.XP, demo = M.DEMO, roles = ROLES;
const today = ref(ymd(new Date()));
const store = ref(loadStore(uni));
onShow(() => { today.value = ymd(new Date()); store.value = loadStore(uni); });
const dateText = computed(() => mmdd(today.value) + ' · 周' + weekday(today.value));
const current = computed(() => { const c = currentIssue(M.ISSUES, today.value); return c.issue ? c : null; });
const weekDays = computed(() => week(store.value, M.ISSUES, today.value));
const streakDays = computed(() => streak(store.value, M.ISSUES, today.value));
const plays = computed(() => Object.keys(store.value.daily).length);
const lessonsDone = computed(() => Object.keys(store.value.lessons).length);
const todayText = computed(() => {
  const c = current.value; const s = streakDays.value ? '连续 ' + streakDays.value + ' 天 · ' : '';
  if (!c || !c.isToday) return s + '今天这期还在准备';
  return s + (store.value.daily[c.issue.id] ? '今天已完成' : '今天还没玩');
});
// 本周和上周的其他期，按日期排；没到日子的显示「还没到」
const others = computed(() => {
  const start = weekStart(today.value), cur = current.value ? current.value.issue.id : '';
  return M.ISSUES.filter((x) => x.id !== cur && x.date >= addDays(start, -7) && x.date <= addDays(start, 6))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((issue) => ({ issue, wd: weekday(issue.date), open: playable(issue, today.value, M.UNLOCK_ALL), done: !!store.value.daily[issue.id] }));
});
const stars = Array.from({ length: 12 }, (_, k) => ({ k, left: (5 + ((k * 37) % 55)) + '%', top: (10 + ((k * 53) % 60)) + '%', delay: (k % 5) * 0.4 + 's' }));
function tapOther(o) { if (o.open) open(o.issue); }
function open(issue) { uni.navigateTo({ url: '/pages/learn/play?id=' + encodeURIComponent(issue.id) }); }
</script>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:24px 16px calc(96px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23;display:flex;flex-direction:column;gap:12px}
.intro{display:flex;flex-direction:column}.eyebrow{font-size:13px;font-weight:700;color:#5f6675}.title{font-size:28px;font-weight:900}
.week{display:flex;background:#fff;border-radius:18px;padding:12px 6px}
.day{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px}
.day-l{font-size:12px;font-weight:700;color:#5f6675}
.day-i{width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#f3f4f6;font-size:13px;font-weight:800;color:#5f6675}
.day.today .day-l{color:#2b44e6;font-weight:900}
.day.today .day-i{background:#fff;color:#2b44e6;box-shadow:inset 0 0 0 2px #2b44e6}
.day.late .day-i{background:#fff;color:#2b44e6;box-shadow:inset 0 0 0 2px #eceffe}
.day.done .day-i{background:#2b44e6;color:#fff;box-shadow:none}
.today{background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 14px 34px -24px rgba(22,26,35,.5)}
.cover{position:relative;height:160px;overflow:hidden;background:linear-gradient(160deg,#1c2550,#33407f)}
.star{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;animation:twinkle 2.4s ease-in-out infinite}
.tag{position:absolute;left:12px;top:12px;font-size:12px;font-weight:800;color:#fff;background:rgba(255,255,255,.18);border-radius:8px;padding:3px 9px}
.cover-q{position:absolute;left:14px;top:44px;right:170px;color:#fff;font-size:15px;font-weight:800;line-height:1.5}
.ca,.cb{position:absolute;border-radius:50%;border:4px solid rgba(255,255,255,.9)}
.ca{right:12px;bottom:-10px;width:78px;height:78px;animation:bob 2.6s ease-in-out infinite}
.cb{right:80px;bottom:-16px;width:66px;height:66px;animation:bob 2.6s ease-in-out .4s infinite}
.tx{display:flex;flex-direction:column;padding:14px 16px 16px}
.t-title{font-size:21px;font-weight:900;line-height:1.3}.t-meta{font-size:13px;color:#5f6675;margin-top:2px}
.tested{align-self:flex-start;margin-top:8px;font-size:12px;font-weight:700;color:#5f6675;background:#f3f4f6;border-radius:8px;padding:3px 8px}
.btn{display:flex;align-items:center;justify-content:center;min-height:52px;margin-top:12px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.btn.done{background:#ffc83d;color:#161a23}
.note{font-size:12px;color:#5f6675;margin-top:8px}
.past{background:#fff;border-radius:18px;padding:4px 16px}
.pi{display:flex;align-items:center;gap:12px;min-height:62px;border-top:1px solid #e6e8ec;padding:8px 0}.pi:first-child{border-top:0}
.pi-img{flex:none;width:40px;height:40px;border-radius:50%}.pi-img.dim{opacity:.45}
.pi-t{flex:1;min-width:0;display:flex;flex-direction:column}.pi-s{font-size:12px;font-weight:700;color:#5f6675}.pi-b{font-size:15px;font-weight:800}
.pi.off .pi-b{color:#5f6675}
.pill{flex:none;font-size:12px;font-weight:800;border-radius:8px;padding:4px 9px;background:#eceffe;color:#2b44e6}
.pill.ok{background:#ffc83d;color:#161a23}.pill.lock{background:#f3f4f6;color:#5f6675}
.foot{font-size:12px;color:#5f6675;text-align:center;line-height:1.7}
.press{opacity:.75}
@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
</style>
