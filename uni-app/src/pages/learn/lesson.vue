<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="page">
    <view class="top">
      <view class="back" hover-class="press" aria-label="回到学 AI" @tap="back"><text>‹</text></view>
      <view class="top-t"><text class="unit-l">{{unitLabel}}</text><text class="title">{{lesson ? lesson.title : '没有找到这节课'}}</text></view>
    </view>
    <view class="prog"><view v-for="i in state.acts" :key="i" class="seg" :class="{on: i - 1 <= state.act}" /></view>
    <view class="narr"><text :key="state.narrKey" class="narr-t">{{state.narr}}</text></view>

    <view class="stage" :class="'ai-' + state.mood">
      <view class="row">
        <view class="who"><view class="char"><image class="char-img" :src="roles[state.person].src" mode="aspectFill" /></view><text class="who-n">{{roles[state.person].name}}</text></view>
        <view v-if="state.you.show" :key="'y' + state.you.key" class="bubble you-b">
          <template v-if="state.you.parts"><text v-for="(p, i) in state.you.parts" :key="i" :class="{add: p.add}">{{p.text}}</text></template>
          <text v-else>{{state.you.text}}</text>
        </view>
      </view>
      <view class="row ai">
        <view class="who" :class="{nod: nodOn}">
          <view v-if="state.marks > 0" class="marks"><text v-for="i in 3" :key="i" class="mark" :class="{gone: i > state.marks}">?</text></view>
          <view class="char ai-char"><image class="char-img" :src="aFace" mode="aspectFill" /></view>
          <text class="who-n">小A</text>
        </view>
        <view v-if="state.ai.show" :key="'a' + state.ai.key" class="bubble ai-b">
          <image v-if="state.ai.art" class="art" :src="artSrc(state.ai.art)" mode="widthFix" />
          <text class="ai-t">{{state.ai.text}}</text>
          <text v-if="state.ai.stamp" class="stamp">做成了</text>
        </view>
      </view>
      <text v-if="state.demo" class="demo">示意回答，上线前换成实测结果</text>
    </view>

    <view v-if="state.panel.kind === 'end'" class="end">
      <!-- 刚拿到徽章：金色徽章转着弹出来，闪一道光，四周冒小星星 -->
      <view v-if="state.panel.badge" class="fb newbdg">
        <view class="nb-art">
          <image class="nb-img" :src="state.panel.badgeImg" mode="aspectFit" />
          <view class="nb-shine-box"><view class="nb-shine" /></view>
          <view v-for="i in 6" :key="i" class="nb-ray" :class="'k' + i"><view class="nb-spark" /></view>
        </view>
        <text class="tag">新徽章</text>
        <text class="nb-name">{{state.panel.badge}}</text>
        <text class="nb-sub">{{state.panel.badgeSub}}</text>
      </view>
      <view v-else-if="state.panel.hint" class="fb hintbdg"><image class="hint-img" :src="state.panel.hintImg" mode="aspectFit" /><text class="hint-t">{{state.panel.hint}}</text></view>
      <view class="two">
        <view v-if="state.panel.copy" class="btn soft" hover-class="press" @tap="copy(state.panel.copy)">复制去试试</view>
        <view v-else-if="state.panel.nextId" class="btn soft" hover-class="press" @tap="back">回到目录</view>
        <view class="btn" hover-class="press" @tap="finish">{{state.panel.nextId ? '学下一节' : '回到目录'}}</view>
      </view>
    </view>
    <AiPanel v-if="state.panel.kind !== 'end'" :panel="state.panel" @next="onNext" @choose="onChoose" @sort="onSort" @order="onOrder" @chip="onChip" />
    <view v-if="lesson && state.panel.kind !== 'end'" class="replay" hover-class="press" @tap="replay">重看这一幕</view>
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="page">
    <view class="top">
      <view class="back" hover-class="press" aria-label="回到学 AI" @tap="back"><text>‹</text></view>
      <view class="top-t"><text class="unit-l">{{unitLabel}}</text><text class="title">{{lesson ? lesson.title : '没有找到这节课'}}</text></view>
    </view>
    <view class="prog"><view v-for="i in state.acts" :key="i" class="seg" :class="{on: i - 1 <= state.act}" /></view>
    <view class="narr"><text :key="state.narrKey" class="narr-t">{{state.narr}}</text></view>

    <view class="stage" :class="'ai-' + state.mood">
      <view class="row">
        <view class="who"><view class="char"><image class="char-img" :src="roles[state.person].src" mode="aspectFill" /></view><text class="who-n">{{roles[state.person].name}}</text></view>
        <view v-if="state.you.show" :key="'y' + state.you.key" class="bubble you-b">
          <template v-if="state.you.parts"><text v-for="(p, i) in state.you.parts" :key="i" :class="{add: p.add}">{{p.text}}</text></template>
          <text v-else>{{state.you.text}}</text>
        </view>
      </view>
      <view class="row ai">
        <view class="who" :class="{nod: nodOn}">
          <view v-if="state.marks > 0" class="marks"><text v-for="i in 3" :key="i" class="mark" :class="{gone: i > state.marks}">?</text></view>
          <view class="char ai-char"><image class="char-img" :src="aFace" mode="aspectFill" /></view>
          <text class="who-n">小A</text>
        </view>
        <view v-if="state.ai.show" :key="'a' + state.ai.key" class="bubble ai-b">
          <image v-if="state.ai.art" class="art" :src="artSrc(state.ai.art)" mode="widthFix" />
          <text class="ai-t">{{state.ai.text}}</text>
          <text v-if="state.ai.stamp" class="stamp">做成了</text>
        </view>
      </view>
      <text v-if="state.demo" class="demo">示意回答，上线前换成实测结果</text>
    </view>

    <view v-if="state.panel.kind === 'end'" class="end">
      <view v-if="state.panel.badge" class="fb"><text class="tag">新徽章</text><text>{{state.panel.badge}}</text></view>
      <view v-else-if="state.panel.hint" class="fb"><text>{{state.panel.hint}}</text></view>
      <view class="two">
        <view v-if="state.panel.copy" class="btn soft" hover-class="press" @tap="copy(state.panel.copy)">复制去试试</view>
        <view v-else-if="state.panel.nextId" class="btn soft" hover-class="press" @tap="back">回到目录</view>
        <view class="btn" hover-class="press" @tap="finish">{{state.panel.nextId ? '学下一节' : '回到目录'}}</view>
      </view>
    </view>
    <AiPanel v-else :panel="state.panel" @next="onNext" @choose="onChoose" @sort="onSort" @order="onOrder" @chip="onChip" />
    <view v-if="lesson && state.panel.kind !== 'end'" class="replay" hover-class="press" @tap="replay">重看这一幕</view>
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

import { scheduleSync } from '../../data/mini-account.js';
// 学 AI 的一节动画互动课。演出顺序在 data/ai-runner.js，课程内容在 data/mini-ai.json（由网页版内容生成）。
import { reactive, ref, computed, watch } from 'vue';
import { onLoad, onUnload, onHide } from '@dcloudio/uni-app';
import AiPanel from '../../components/AiPanel.vue';
import mini from '../../data/mini-ai.json';
import guides from '../../data/mini-guides.json';
import { ROLES, A_FACES, ART, LEARNING_KEY, loadStore, saveStore, finishLesson, unitOf, unitState, shortName, unitNo, badgeImage, markSeen } from '../../data/ai-core.js';
import { createLessonPlayer, lessonState } from '../../data/ai-runner.js';

const X = mini.xue;
const roles = ROLES;
const state = reactive(lessonState());
const lessonId = ref('');
const lesson = computed(() => X.LESSONS[lessonId.value] || null);
const unit = computed(() => (lesson.value ? unitOf(X.UNITS, lessonId.value) : null));
const unitLabel = computed(() => (unit.value ? unit.value.name + ' · 第 ' + (unit.value.lessons.indexOf(lessonId.value) + 1) + ' 节' : '学 AI'));
const aFace = computed(() => (state.mood === 'happy' ? A_FACES.happy : state.mood === 'confused' ? A_FACES.confused : A_FACES.flat));
const artSrc = (key) => ART(key);
let player = null;
const nodOn = ref(false);
watch(() => state.nod, () => { nodOn.value = false; setTimeout(() => { nodOn.value = true; setTimeout(() => { nodOn.value = false; }, 420); }, 20); });

function read(key, fallback) { try { return uni.getStorageSync(key) || fallback; } catch { return fallback; } }
function nextLesson(id) { const i = X.ORDER.indexOf(id); return i >= 0 && i + 1 < X.ORDER.length ? X.ORDER[i + 1] : ''; }
// 学完：记下这节课，看看这个单元的徽章是不是刚拿到
function onEnd() {
  const u = unit.value, progress = read(LEARNING_KEY, {});
  const before = unitState(u, loadStore(uni), guides, progress).badge;
  const r = finishLesson(loadStore(uni), lessonId.value); saveStore(uni, r.store); scheduleSync();
  const after = unitState(u, r.store, guides, progress);
  const fresh = r.first && after.badge && !before;
  const hint = !after.badge && after.lessons === after.total && (u.needProjects || 0) > after.made ? '再跟着做完一件作品，就能拿到' + unitNo(u) + '的徽章。' : '';
  if (fresh) markSeen(uni, u.id);
  return {
    nextId: nextLesson(lessonId.value),
    badge: fresh ? shortName(u) : '',
    badgeImg: fresh ? badgeImage(u, after) : '',
    badgeSub: fresh ? (u.needProjects ? '课学完了，作品也做好了' : '这个单元的 ' + after.total + ' 节课都学完了') : '',
    hint,
    hintImg: hint ? badgeImage(u, after) : '',
  };
}
function start(id) {
  if (player) player.stop();
  lessonId.value = id;
  Object.assign(state, lessonState());
  if (!lesson.value) return;
  player = createLessonPlayer(lesson.value, state, { demo: X.DEMO, onEnd });
  player.start();
}
onLoad((options) => start(String(options?.id || '')));
onHide(() => { if (player && state.panel.kind !== 'end') player.stop(); });
onUnload(() => { if (player) player.stop(); });
function replay() { if (player) player.replay(); }
// 操作区的点击交给演出逻辑（判断对错在 ai-runner.js）
function onNext() { if (player) player.next(); }
function onChoose(i) { if (player) player.choose(i); }
function onSort(k) { if (player) player.sortPick(k); }
function onOrder(i) { if (player) player.orderPick(i); }
function onChip(k) { if (player) player.chip(k); }
function back() { if (player) player.stop(); uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/learn/learning' }) }); }
function finish() { const id = state.panel.nextId; if (id) uni.redirectTo({ url: '/pages/learn/lesson?id=' + encodeURIComponent(id) }); else back(); }
function copy(text) { uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制，去你的 AI 里试试', icon: 'none' }) }); }

// #endif
// #ifndef MP-WEIXIN

// 学 AI 的一节动画互动课。演出顺序在 data/ai-runner.js，课程内容在 data/mini-ai.json（由网页版内容生成）。
import { reactive, ref, computed, watch } from 'vue';
import { onLoad, onUnload, onHide } from '@dcloudio/uni-app';
import AiPanel from '../../components/AiPanel.vue';
import mini from '../../data/mini-ai.json';
import guides from '../../data/mini-guides.json';
import { ROLES, A_FACES, ART, LEARNING_KEY, loadStore, saveStore, finishLesson, unitOf, unitState, shortName, unitNo } from '../../data/ai-core.js';
import { createLessonPlayer, lessonState } from '../../data/ai-runner.js';

const X = mini.xue;
const roles = ROLES;
const state = reactive(lessonState());
const lessonId = ref('');
const lesson = computed(() => X.LESSONS[lessonId.value] || null);
const unit = computed(() => (lesson.value ? unitOf(X.UNITS, lessonId.value) : null));
const unitLabel = computed(() => (unit.value ? unit.value.name + ' · 第 ' + (unit.value.lessons.indexOf(lessonId.value) + 1) + ' 节' : '学 AI'));
const aFace = computed(() => (state.mood === 'happy' ? A_FACES.happy : state.mood === 'confused' ? A_FACES.confused : A_FACES.flat));
const artSrc = (key) => ART(key);
let player = null;
const nodOn = ref(false);
watch(() => state.nod, () => { nodOn.value = false; setTimeout(() => { nodOn.value = true; setTimeout(() => { nodOn.value = false; }, 420); }, 20); });

function read(key, fallback) { try { return uni.getStorageSync(key) || fallback; } catch { return fallback; } }
function nextLesson(id) { const i = X.ORDER.indexOf(id); return i >= 0 && i + 1 < X.ORDER.length ? X.ORDER[i + 1] : ''; }
// 学完：记下这节课，看看这个单元的徽章是不是刚拿到
function onEnd() {
  const u = unit.value, progress = read(LEARNING_KEY, {});
  const before = unitState(u, loadStore(uni), guides, progress).badge;
  const r = finishLesson(loadStore(uni), lessonId.value); saveStore(uni, r.store);
  const after = unitState(u, r.store, guides, progress);
  return {
    nextId: nextLesson(lessonId.value),
    badge: r.first && after.badge && !before ? '学完了「' + shortName(u) + '」' : '',
    hint: after.lessons === after.total && !after.badge && (u.needProjects || 0) > after.made ? '再跟着做完一件作品，就能拿到' + unitNo(u) + '的徽章。' : '',
  };
}
function start(id) {
  if (player) player.stop();
  lessonId.value = id;
  Object.assign(state, lessonState());
  if (!lesson.value) return;
  player = createLessonPlayer(lesson.value, state, { demo: X.DEMO, onEnd });
  player.start();
}
onLoad((options) => start(String(options?.id || '')));
onHide(() => { if (player && state.panel.kind !== 'end') player.stop(); });
onUnload(() => { if (player) player.stop(); });
function replay() { if (player) player.replay(); }
// 操作区的点击交给演出逻辑（判断对错在 ai-runner.js）
function onNext() { if (player) player.next(); }
function onChoose(i) { if (player) player.choose(i); }
function onSort(k) { if (player) player.sortPick(k); }
function onOrder(i) { if (player) player.orderPick(i); }
function onChip(k) { if (player) player.chip(k); }
function back() { if (player) player.stop(); uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/learn/learning' }) }); }
function finish() { const id = state.panel.nextId; if (id) uni.redirectTo({ url: '/pages/learn/lesson?id=' + encodeURIComponent(id) }); else back(); }
function copy(text) { uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制，去你的 AI 里试试', icon: 'none' }) }); }

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:16px 16px calc(32px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23;display:flex;flex-direction:column;gap:12px}
.top{display:flex;align-items:center;gap:10px}
.back{flex:none;width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;color:#161a23}
.top-t{flex:1;min-width:0;display:flex;flex-direction:column}
.unit-l{font-size:12px;font-weight:700;color:#5f6675}.title{font-size:22px;font-weight:900;line-height:1.3}
.prog{display:flex;gap:5px}.seg{flex:1;height:6px;border-radius:3px;background:#e6e8ec}.seg.on{background:#2b44e6}
.narr{min-height:52px;display:flex;align-items:center}.narr-t{font-size:17px;font-weight:700;line-height:1.5;animation:rise .35s ease both}
.stage{display:flex;flex-direction:column;gap:14px;min-height:236px;background:#fff;border-radius:22px;padding:16px 14px 12px;box-shadow:0 14px 34px -26px rgba(22,26,35,.5)}
.row{display:flex;align-items:flex-end;gap:10px}.row.ai{flex-direction:row-reverse}
.who{flex:none;width:84px;display:flex;flex-direction:column;align-items:center;position:relative}
.who-n{font-size:12px;font-weight:700;color:#5f6675;margin-top:2px}
.char{width:84px;height:84px;border-radius:50%;overflow:hidden;animation:bob 2.6s ease-in-out infinite}
.char-img{display:block;width:84px;height:84px}
.ai-confused .ai-char{animation:tilt 1.1s ease-in-out infinite}
.ai-happy .ai-char{animation:jump .7s ease 2}
.nod .ai-char{animation:nod .4s ease 1}
.marks{position:absolute;top:-16px;left:0;right:0;height:24px}
.mark{position:absolute;top:0;font-size:20px;font-weight:900;color:#2b44e6;animation:float 1.4s ease-in-out infinite}
.mark:nth-child(1){left:12px}.mark:nth-child(2){left:36px;top:-8px}.mark:nth-child(3){left:60px}
.mark.gone{opacity:0;transition:opacity .3s}
.bubble{flex:1;min-width:0;border-radius:18px;padding:10px 14px;font-size:16px;line-height:1.65;position:relative;animation:pop .28s ease both}
.you-b{background:#eceffe;border-bottom-left-radius:6px}
.ai-b{background:#f3f4f6;border-bottom-right-radius:6px}
.add{background:#2b44e6;color:#fff;border-radius:6px;padding:1px 3px;margin:0 1px}
.art{display:block;width:100%;border-radius:12px;margin-bottom:8px}
.ai-t{white-space:pre-wrap}
.stamp{position:absolute;right:-6px;top:-14px;background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:9px;padding:3px 10px;transform:rotate(6deg);animation:stamp .45s ease both}
.demo{font-size:12px;color:#5f6675;text-align:right}
.end{display:flex;flex-direction:column;gap:10px}
.fb{background:#fff;border-radius:16px;padding:12px 15px;font-size:15px;line-height:1.6}
.tag{display:inline-block;background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:8px;padding:1px 9px;margin-right:8px}
/* 新徽章：章转着弹出来（.8s），单元号的那块图一起出来；0.6s 后一道光扫过，六颗小星星往外飞 */
.newbdg{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:14px 16px 16px}
.newbdg .tag{margin-right:0}
.nb-art{position:relative;width:112px;height:112px}
.nb-img{display:block;width:112px;height:112px;animation:nbIn .8s cubic-bezier(.3,1.5,.5,1) both}
.nb-shine-box{position:absolute;left:20px;top:20px;width:72px;height:72px;border-radius:50%;overflow:hidden}
.nb-shine{position:absolute;top:-20px;left:0;width:14px;height:112px;background:rgba(255,255,255,.6);transform:translateX(-60px) rotate(20deg);animation:nbShine .9s ease-in-out .6s both}
.nb-ray{position:absolute;left:56px;top:56px;width:0;height:0}
.nb-ray.k1{transform:rotate(30deg)}.nb-ray.k2{transform:rotate(90deg)}.nb-ray.k3{transform:rotate(150deg)}.nb-ray.k4{transform:rotate(210deg)}.nb-ray.k5{transform:rotate(270deg)}.nb-ray.k6{transform:rotate(330deg)}
.nb-spark{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#ffc83d;opacity:0;animation:nbSpark .9s ease-out .35s both}
.nb-ray.k2 .nb-spark,.nb-ray.k4 .nb-spark,.nb-ray.k6 .nb-spark{left:-2.5px;top:-2.5px;width:5px;height:5px;background:#2b44e6}
.nb-name{font-size:20px;font-weight:900;line-height:1.3}
.nb-sub{font-size:13px;font-weight:700;color:#5f6675}
.hintbdg{display:flex;align-items:center;gap:12px}
.hint-img{flex:none;width:48px;height:48px}
.hint-t{flex:1;min-width:0}
@keyframes nbIn{from{opacity:0;transform:scale(.55) rotate(-25deg)}to{opacity:1;transform:none}}
@keyframes nbShine{from{transform:translateX(-60px) rotate(20deg)}to{transform:translateX(90px) rotate(20deg)}}
@keyframes nbSpark{0%{opacity:0;transform:translateY(-34px) scale(.3)}30%{opacity:1}100%{opacity:0;transform:translateY(-54px) scale(1)}}
.two{display:flex;gap:10px}
.btn{flex:1;display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.btn.soft{background:#eceffe;color:#2b44e6}
.replay{align-self:center;font-size:14px;font-weight:700;color:#5f6675;padding:12px}
.press{opacity:.75}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes tilt{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}
@keyframes nod{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes stamp{from{opacity:0;transform:rotate(-20deg) scale(2)}to{opacity:1;transform:rotate(6deg) scale(1)}}

/* #endif */
/* #ifndef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:16px 16px calc(32px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23;display:flex;flex-direction:column;gap:12px}
.top{display:flex;align-items:center;gap:10px}
.back{flex:none;width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;color:#161a23}
.top-t{flex:1;min-width:0;display:flex;flex-direction:column}
.unit-l{font-size:12px;font-weight:700;color:#5f6675}.title{font-size:22px;font-weight:900;line-height:1.3}
.prog{display:flex;gap:5px}.seg{flex:1;height:6px;border-radius:3px;background:#e6e8ec}.seg.on{background:#2b44e6}
.narr{min-height:52px;display:flex;align-items:center}.narr-t{font-size:17px;font-weight:700;line-height:1.5;animation:rise .35s ease both}
.stage{display:flex;flex-direction:column;gap:14px;min-height:236px;background:#fff;border-radius:22px;padding:16px 14px 12px;box-shadow:0 14px 34px -26px rgba(22,26,35,.5)}
.row{display:flex;align-items:flex-end;gap:10px}.row.ai{flex-direction:row-reverse}
.who{flex:none;width:84px;display:flex;flex-direction:column;align-items:center;position:relative}
.who-n{font-size:12px;font-weight:700;color:#5f6675;margin-top:2px}
.char{width:84px;height:84px;border-radius:50%;overflow:hidden;animation:bob 2.6s ease-in-out infinite}
.char-img{display:block;width:84px;height:84px}
.ai-confused .ai-char{animation:tilt 1.1s ease-in-out infinite}
.ai-happy .ai-char{animation:jump .7s ease 2}
.nod .ai-char{animation:nod .4s ease 1}
.marks{position:absolute;top:-16px;left:0;right:0;height:24px}
.mark{position:absolute;top:0;font-size:20px;font-weight:900;color:#2b44e6;animation:float 1.4s ease-in-out infinite}
.mark:nth-child(1){left:12px}.mark:nth-child(2){left:36px;top:-8px}.mark:nth-child(3){left:60px}
.mark.gone{opacity:0;transition:opacity .3s}
.bubble{flex:1;min-width:0;border-radius:18px;padding:10px 14px;font-size:16px;line-height:1.65;position:relative;animation:pop .28s ease both}
.you-b{background:#eceffe;border-bottom-left-radius:6px}
.ai-b{background:#f3f4f6;border-bottom-right-radius:6px}
.add{background:#2b44e6;color:#fff;border-radius:6px;padding:1px 3px;margin:0 1px}
.art{display:block;width:100%;border-radius:12px;margin-bottom:8px}
.ai-t{white-space:pre-wrap}
.stamp{position:absolute;right:-6px;top:-14px;background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:9px;padding:3px 10px;transform:rotate(6deg);animation:stamp .45s ease both}
.demo{font-size:12px;color:#5f6675;text-align:right}
.end{display:flex;flex-direction:column;gap:10px}
.fb{background:#fff;border-radius:16px;padding:12px 15px;font-size:15px;line-height:1.6}
.tag{display:inline-block;background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:8px;padding:1px 9px;margin-right:8px}
.two{display:flex;gap:10px}
.btn{flex:1;display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.btn.soft{background:#eceffe;color:#2b44e6}
.replay{align-self:center;font-size:14px;font-weight:700;color:#5f6675;padding:12px}
.press{opacity:.75}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes tilt{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}
@keyframes nod{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes stamp{from{opacity:0;transform:rotate(-20deg) scale(2)}to{opacity:1;transform:rotate(6deg) scale(1)}}

/* #endif */
</style>
