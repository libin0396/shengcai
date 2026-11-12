<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="page">
    <!-- 页头：标题、徽章数，和一条按单元分组的进度（一格一节课，点一组跳到那个单元） -->
    <view class="xhead">
      <view class="xh-row">
        <text class="title">学 AI</text>
        <view class="xh-badge" :class="{ got: badgeCount > 0 }"><image class="xh-bi" :src="badgeCount > 0 ? BADGE_MINI.got : BADGE_MINI.off" mode="aspectFit" /><text>徽章 {{ badgeCount }} / {{ units.length }}</text></view>
      </view>
      <text class="xh-sub">从认识 AI 到做出作品，一共 6 个单元。</text>
      <view class="xh-path">
        <view v-for="(u, ui) in units" :key="u.id" class="xh-u" :class="{ got: u.badge, now: resume && resume.unitId === u.id }" :style="{ flexGrow: u.lessons.length }" @tap="jump(u.id)">
          <view class="xh-ticks"><view v-for="l in u.lessons" :key="l.id" class="xh-t" :class="{ on: l.done, cur: resume && resume.id === l.id }" /></view>
          <text class="xh-n">{{ ui + 1 }}</text>
        </view>
      </view>
      <text class="xh-meta">{{ meta }}</text>
    </view>
    <view class="cast">
      <view class="faces"><image v-for="k in castKeys" :key="k" class="face" :src="roles[k].src" mode="aspectFill" /></view>
      <text class="cast-text">小A 和小林、小圆、老周陪你学。按顺序一步步来，每节 3～5 分钟。</text>
    </view>
    <view v-if="resume" class="resume" hover-class="press" @tap="openLesson(resume.id)">
      <text class="resume-k">{{resume.k}}</text>
      <text class="resume-t">{{resume.title}}</text>
      <view class="btn">{{resume.go}}</view>
    </view>

    <view v-for="u in units" :id="'unit-' + u.id" :key="u.id" class="unit">
      <button class="unit-toggle" hover-class="press" :aria-expanded="isUnitOpen(u.id)" :aria-label="u.short + (isUnitOpen(u.id) ? '，已展开，点击收起' : '，已收起，点击展开')" @tap="toggleUnit(u.id)">
        <view class="unit-head">
          <image class="u-bdg" :src="u.badgeImg" mode="aspectFit" />
          <view class="unit-name"><text class="lv-tag">{{u.level}}</text><text class="unit-t">{{u.short}}</text></view>
          <view class="unit-meta"><text class="count" :class="{got:u.badge}">{{u.badge ? '徽章 · ' : ''}}{{u.lessonsDone}} / {{u.total}}</text><text class="unit-toggle-hint">{{isUnitOpen(u.id) ? '收起 ▴' : '展开 ▾'}}</text></view>
        </view>
        <text class="unit-sub">{{u.no}} · {{u.sub}}</text>
      </button>
      <template v-if="isUnitOpen(u.id)">
      <view v-for="(l,i) in u.lessons" :key="l.id" class="item" hover-class="press" @tap="openLesson(l.id)">
        <text class="n" :class="{done:l.done}">{{l.done ? '✓' : i + 1}}</text>
        <view class="t"><text class="t-b">{{l.title}}</text><text class="t-s">{{l.mins}} 分钟 · {{l.who}}</text></view>
        <text class="w">{{l.done ? '学完了' : '›'}}</text>
      </view>
      <template v-if="u.projects.length">
        <view class="proj-head"><text class="proj-b">跟着做 · 真实教程</text><text class="proj-s">{{u.needProjects ? '做完 ' + u.needProjects + ' 件就能拿徽章' : '学完可以试试，不做也不影响徽章'}}</text></view>
        <view v-for="p in u.projects" :key="p.id" class="proj" hover-class="press" @tap="openGuide(p.id)">
          <image v-if="p.cover" class="proj-cover" :src="p.cover" mode="aspectFill" />
          <view v-else class="proj-cover" />
          <view class="t"><text class="t-b">{{p.title}}</text><text class="t-s">{{p.step || (hasZuo(p.id) ? '先看演示，再跟着做' : '分步骤 · 提示词可复制')}}</text></view>
          <text class="w" :class="{ok:p.done}">{{p.done ? '做完了' : '去做 ›'}}</text>
        </view>
      </template>
      </template>
    </view>
    <MiniNav active="study" />
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="page">
    <view class="intro">
      <view class="eyebrow">{{summary}}</view>
      <view class="title">学 AI</view>
    </view>
    <view class="cast">
      <view class="faces"><image v-for="k in castKeys" :key="k" class="face" :src="roles[k].src" mode="aspectFill" /></view>
      <text class="cast-text">小A 和小林、小圆、老周陪你学。按顺序一步步来，每节 3～5 分钟。</text>
    </view>
    <view v-if="resume" class="resume" hover-class="press" @tap="openLesson(resume.id)">
      <text class="resume-k">{{resume.k}}</text>
      <text class="resume-t">{{resume.title}}</text>
      <view class="btn">{{resume.go}}</view>
    </view>

    <view v-for="u in units" :key="u.id" class="unit">
      <view class="unit-head">
        <view class="unit-name"><text class="lv-tag">{{u.level}}</text><text class="unit-t">{{u.short}}</text></view>
        <text class="count" :class="{got:u.badge}">{{u.badge ? '徽章 · ' : ''}}{{u.lessonsDone}} / {{u.total}}</text>
      </view>
      <text class="unit-sub">{{u.no}} · {{u.sub}}</text>
      <view v-for="(l,i) in u.lessons" :key="l.id" class="item" hover-class="press" @tap="openLesson(l.id)">
        <text class="n" :class="{done:l.done}">{{l.done ? '✓' : i + 1}}</text>
        <view class="t"><text class="t-b">{{l.title}}</text><text class="t-s">{{l.mins}} 分钟 · {{l.who}}</text></view>
        <text class="w">{{l.done ? '学完了' : '›'}}</text>
      </view>
      <template v-if="u.projects.length">
        <view class="proj-head"><text class="proj-b">跟着做 · 真实教程</text><text class="proj-s">{{u.needProjects ? '做完 ' + u.needProjects + ' 件就能拿徽章' : '学完可以试试，不做也不影响徽章'}}</text></view>
        <view v-for="p in u.projects" :key="p.id" class="proj" hover-class="press" @tap="openGuide(p.id)">
          <image v-if="p.cover" class="proj-cover" :src="p.cover" mode="aspectFill" />
          <view v-else class="proj-cover" />
          <view class="t"><text class="t-b">{{p.title}}</text><text class="t-s">{{p.step || (hasZuo(p.id) ? '先看演示，再跟着做' : '分步骤 · 提示词可复制')}}</text></view>
          <text class="w" :class="{ok:p.done}">{{p.done ? '做完了' : '去做 ›'}}</text>
        </view>
      </template>
    </view>
    <view v-if="demo" class="note">课里小A 的回答目前是示意，上线前会换成实测结果。</view>
    <MiniNav active="study" />
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

// 学 AI：六个单元按顺序学，每节是一段动画互动课（pages/learn/lesson）；学完的单元可以「跟着做」真实教程（pages/learn/guide）。
import { ref, computed, nextTick } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import mini from '../../data/mini-ai.json';
import guides from '../../data/mini-guides.json';
import zuo from '../../data/mini-zuo.json';
import { ROLES, LEARNING_KEY, BADGE_MINI, loadStore, unitState, badgeImage, resumeLesson, unitOf, shortName, unitNo } from '../../data/ai-core.js';

const X = mini.xue;
const roles = ROLES;
const castKeys = ['a', 'lin', 'yuan', 'zhou'];
const demo = X.DEMO;
const openUnits = ref(X.UNITS.length ? [X.UNITS[0].id] : []);
function isUnitOpen(id) { return openUnits.value.includes(id); }
function toggleUnit(id) { openUnits.value = isUnitOpen(id) ? openUnits.value.filter((value) => value !== id) : [...openUnits.value, id]; }
const store = ref(loadStore(uni));
const progress = ref({});
function read(key, fallback) { try { return uni.getStorageSync(key) || fallback; } catch { return fallback; } }
onShow(() => { store.value = loadStore(uni); progress.value = read(LEARNING_KEY, {}); });

const units = computed(() => X.UNITS.map((u) => {
  const st = unitState(u, store.value, guides, progress.value);
  return {
    id: u.id, level: u.level, short: shortName(u), no: unitNo(u), sub: u.sub, needProjects: u.needProjects || 0,
    badge: st.badge, badgeImg: badgeImage(u, st), lessonsDone: st.lessons, total: st.total, projects: st.projects,
    lessons: u.lessons.map((id) => { const L = X.LESSONS[id]; return { id, title: L.title, mins: L.mins, who: ROLES[L.who].name, done: !!store.value.lessons[id] }; }),
  };
}));
const badgeCount = computed(() => units.value.filter((u) => u.badge).length);
const meta = computed(() => {
  const done = X.ORDER.filter((id) => store.value.lessons[id]).length;
  return resume.value ? '已学完 ' + done + ' / ' + X.ORDER.length + ' 节 · 现在在「' + resume.value.unitName + '」' : X.ORDER.length + ' 节全部学完了';
});
function jump(id) { if (!isUnitOpen(id)) openUnits.value = [...openUnits.value, id]; nextTick(() => uni.pageScrollTo({ selector: '#unit-' + id, duration: 300 })); }
const resume = computed(() => {
  const id = resumeLesson(X.ORDER, store.value); if (!id) return null;
  const u = unitOf(X.UNITS, id), started = X.ORDER.some((x) => store.value.lessons[x]);
  return { id, unitId: u.id, unitName: shortName(u), title: X.LESSONS[id].title, k: (started ? '接着学 · ' : '从这里开始 · ') + unitNo(u) + '第 ' + (u.lessons.indexOf(id) + 1) + ' 节', go: started ? '继续学' : '开始学' };
});
function openLesson(id) { uni.navigateTo({ url: '/pages/learn/lesson?id=' + encodeURIComponent(id) }); }
// 有角色剧本的教程打开「跟着做 · 动画互动版」，其余打开图文教程
const hasZuo = (id) => !!zuo.SCRIPTS[id];
function openGuide(id) { uni.navigateTo({ url: (zuo.SCRIPTS[id] ? '/pages/learn/zuo?id=' : '/pages/learn/guide?id=') + encodeURIComponent(id) }); }

// #endif
// #ifndef MP-WEIXIN

// 学 AI：六个单元按顺序学，每节是一段动画互动课（pages/learn/lesson）；学完的单元可以「跟着做」真实教程（pages/learn/guide）。
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import mini from '../../data/mini-ai.json';
import guides from '../../data/mini-guides.json';
import zuo from '../../data/mini-zuo.json';
import { ROLES, LEARNING_KEY, loadStore, unitState, resumeLesson, unitOf, shortName, unitNo } from '../../data/ai-core.js';

const X = mini.xue;
const roles = ROLES;
const castKeys = ['a', 'lin', 'yuan', 'zhou'];
const demo = X.DEMO;
const store = ref(loadStore(uni));
const progress = ref({});
function read(key, fallback) { try { return uni.getStorageSync(key) || fallback; } catch { return fallback; } }
onShow(() => { store.value = loadStore(uni); progress.value = read(LEARNING_KEY, {}); });

const units = computed(() => X.UNITS.map((u) => {
  const st = unitState(u, store.value, guides, progress.value);
  return {
    id: u.id, level: u.level, short: shortName(u), no: unitNo(u), sub: u.sub, needProjects: u.needProjects || 0,
    badge: st.badge, lessonsDone: st.lessons, total: st.total, projects: st.projects,
    lessons: u.lessons.map((id) => { const L = X.LESSONS[id]; return { id, title: L.title, mins: L.mins, who: ROLES[L.who].name, done: !!store.value.lessons[id] }; }),
  };
}));
const summary = computed(() => {
  const done = X.ORDER.filter((id) => store.value.lessons[id]).length;
  return '已学完 ' + done + ' / ' + X.ORDER.length + ' 节 · 徽章 ' + units.value.filter((u) => u.badge).length + ' 枚';
});
const resume = computed(() => {
  const id = resumeLesson(X.ORDER, store.value); if (!id) return null;
  const u = unitOf(X.UNITS, id), started = X.ORDER.some((x) => store.value.lessons[x]);
  return { id, title: X.LESSONS[id].title, k: (started ? '接着学 · ' : '从这里开始 · ') + unitNo(u) + '第 ' + (u.lessons.indexOf(id) + 1) + ' 节', go: started ? '继续学' : '开始学' };
});
function openLesson(id) { uni.navigateTo({ url: '/pages/learn/lesson?id=' + encodeURIComponent(id) }); }
// 有角色剧本的教程打开「跟着做 · 动画互动版」，其余打开图文教程
const hasZuo = (id) => !!zuo.SCRIPTS[id];
function openGuide(id) { uni.navigateTo({ url: (zuo.SCRIPTS[id] ? '/pages/learn/zuo?id=' : '/pages/learn/guide?id=') + encodeURIComponent(id) }); }

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:24px 16px calc(96px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23}
.title{font-size:28px;font-weight:900;line-height:1.2}
.xhead{display:flex;flex-direction:column;gap:8px}
.xh-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.xh-badge{flex:none;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#5f6675;background:#fff;border-radius:999px;padding:5px 12px 5px 7px}
.xh-bi{flex:none;width:22px;height:22px}
.xh-badge.got{color:#161a23}
.xh-badge.got .xh-bi{animation:pop .45s ease both}
.xh-sub{font-size:14px;line-height:1.5;color:#5f6675;margin-top:-4px}
.xh-path{display:flex;gap:8px;margin-top:2px}
.xh-u{flex-basis:0;min-width:0;display:flex;flex-direction:column;gap:6px;padding:4px 0}
.xh-ticks{display:flex;gap:3px}
.xh-t{flex:1;height:10px;border-radius:5px;background:#fff;box-shadow:inset 0 0 0 1px #e6e8ec;animation:tickin .45s ease both}
.xh-t.on{background:#2b44e6;box-shadow:none}
.xh-t.cur{box-shadow:inset 0 0 0 2px #2b44e6;animation:tickin .45s ease both,curring 1.8s ease-in-out .8s infinite}
.xh-n{align-self:flex-start;font-size:11px;font-weight:800;line-height:1.5;color:#5f6675;padding:0 5px;margin-left:-5px;border-radius:6px}
.xh-u.now .xh-n{color:#2b44e6}
.xh-u.got .xh-n{background:#ffc83d;color:#161a23;margin-left:0}
.xh-meta{font-size:13px;font-weight:700;color:#5f6675}
@keyframes tickin{from{transform:scaleX(.2);opacity:0}to{transform:none;opacity:1}}
@keyframes curring{0%,100%{box-shadow:inset 0 0 0 2px #2b44e6,0 0 0 0 #eceffe}50%{box-shadow:inset 0 0 0 2px #2b44e6,0 0 0 4px #eceffe}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}

.u-bdg{width:46px;height:46px;flex:none}.unit-head{align-items:center} .unit-name{flex:1}
.cast{display:flex;align-items:center;gap:12px;margin-top:14px;background:#fff;border-radius:18px;padding:12px 14px}
.faces{display:flex;flex:none}.face{width:40px;height:40px;border-radius:50%;border:3px solid #fff;margin-left:-12px}.face:first-child{margin-left:0}
.cast-text{flex:1;font-size:13px;line-height:1.5;color:#5f6675}
.resume{display:flex;flex-direction:column;margin-top:12px;background:#fff;border-radius:20px;padding:14px 16px 16px;box-shadow:0 14px 30px -24px rgba(22,26,35,.5)}
.resume-k{font-size:12px;font-weight:800;color:#2b44e6}.resume-t{font-size:20px;font-weight:900;margin:4px 0 12px}
.btn{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.unit{margin-top:12px;background:#fff;border-radius:18px;padding:14px 16px 6px}
.unit-toggle{display:block;width:100%;margin:0;padding:0;border:0;border-radius:0;background:transparent;color:inherit;line-height:normal;text-align:left;overflow:visible}
.unit-toggle::after{border:0}
.unit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.unit-meta{display:flex;align-items:center;gap:8px;flex:none}.unit-toggle-hint{font-size:12px;font-weight:700;color:#2b44e6}
.unit-name{display:flex;align-items:center;gap:6px;min-width:0}
.lv-tag{font-size:11px;font-weight:800;color:#2b44e6;background:#eceffe;border-radius:6px;padding:1px 6px}
.unit-t{font-size:18px;font-weight:900}
.count{flex:none;font-size:12px;font-weight:800;color:#5f6675;padding-top:3px}.count.got{color:#161a23;background:#ffc83d;border-radius:8px;padding:2px 8px}
.unit-sub{display:block;font-size:12px;font-weight:700;color:#5f6675;margin-top:2px;margin-bottom:8px}
.item,.proj{display:flex;align-items:center;gap:12px;min-height:58px;border-top:1px solid #e6e8ec;padding:6px 0}
.n{flex:none;width:28px;height:28px;line-height:28px;text-align:center;border-radius:9px;background:#eceffe;color:#2b44e6;font-size:14px;font-weight:900}
.n.done{background:#ffc83d;color:#161a23}
.t{flex:1;min-width:0;display:flex;flex-direction:column}.t-b{font-size:16px;font-weight:800}.t-s{font-size:12px;font-weight:700;color:#5f6675}
.w{flex:none;font-size:13px;font-weight:800;color:#5f6675}
.proj .w{color:#2b44e6}.proj .w.ok{color:#161a23;background:#ffc83d;border-radius:8px;padding:2px 8px}
.proj-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-top:6px;padding:10px 0 4px;border-top:1px dashed #e6e8ec}
.proj-b{font-size:14px;font-weight:900}.proj-s{font-size:12px;font-weight:700;color:#5f6675}
.proj-cover{flex:none;width:52px;height:52px;border-radius:12px;background:#eceffe}
.note{margin-top:16px;font-size:12px;color:#5f6675;text-align:center;line-height:1.7}
.press{opacity:.75}

/* #endif */
/* #ifndef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:24px 16px calc(96px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23}
.eyebrow{font-size:13px;font-weight:700;color:#5f6675}.title{font-size:28px;font-weight:900;margin-top:2px}
.cast{display:flex;align-items:center;gap:12px;margin-top:14px;background:#fff;border-radius:18px;padding:12px 14px}
.faces{display:flex;flex:none}.face{width:40px;height:40px;border-radius:50%;border:3px solid #fff;margin-left:-12px}.face:first-child{margin-left:0}
.cast-text{flex:1;font-size:13px;line-height:1.5;color:#5f6675}
.resume{display:flex;flex-direction:column;margin-top:12px;background:#fff;border-radius:20px;padding:14px 16px 16px;box-shadow:0 14px 30px -24px rgba(22,26,35,.5)}
.resume-k{font-size:12px;font-weight:800;color:#2b44e6}.resume-t{font-size:20px;font-weight:900;margin:4px 0 12px}
.btn{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.unit{margin-top:12px;background:#fff;border-radius:18px;padding:14px 16px 6px}
.unit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.unit-name{display:flex;align-items:center;gap:6px;min-width:0}
.lv-tag{font-size:11px;font-weight:800;color:#2b44e6;background:#eceffe;border-radius:6px;padding:1px 6px}
.unit-t{font-size:18px;font-weight:900}
.count{flex:none;font-size:12px;font-weight:800;color:#5f6675;padding-top:3px}.count.got{color:#161a23;background:#ffc83d;border-radius:8px;padding:2px 8px}
.unit-sub{display:block;font-size:12px;font-weight:700;color:#5f6675;margin-top:2px;margin-bottom:8px}
.item,.proj{display:flex;align-items:center;gap:12px;min-height:58px;border-top:1px solid #e6e8ec;padding:6px 0}
.n{flex:none;width:28px;height:28px;line-height:28px;text-align:center;border-radius:9px;background:#eceffe;color:#2b44e6;font-size:14px;font-weight:900}
.n.done{background:#ffc83d;color:#161a23}
.t{flex:1;min-width:0;display:flex;flex-direction:column}.t-b{font-size:16px;font-weight:800}.t-s{font-size:12px;font-weight:700;color:#5f6675}
.w{flex:none;font-size:13px;font-weight:800;color:#5f6675}
.proj .w{color:#2b44e6}.proj .w.ok{color:#161a23;background:#ffc83d;border-radius:8px;padding:2px 8px}
.proj-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-top:6px;padding:10px 0 4px;border-top:1px dashed #e6e8ec}
.proj-b{font-size:14px;font-weight:900}.proj-s{font-size:12px;font-weight:700;color:#5f6675}
.proj-cover{flex:none;width:52px;height:52px;border-radius:12px;background:#eceffe}
.note{margin-top:16px;font-size:12px;color:#5f6675;text-align:center;line-height:1.7}
.press{opacity:.75}

/* #endif */
</style>
