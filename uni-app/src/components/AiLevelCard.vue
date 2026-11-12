<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="lv" :class="{compact}">
    <image class="lv-cheer" :src="cheer" mode="aspectFill" />
    <!-- #ifdef MP-WEIXIN -->
    <view v-if="showAccount" class="lv-user" role="button" :aria-label="avatar ? '设置头像和昵称' : '登录或设置头像'" @tap.stop="$emit('account')">
      <image v-if="avatar" class="lv-user-img" :src="avatar" mode="aspectFill" />
      <text v-else class="lv-user-placeholder">{{loggedIn ? '头像' : '登录'}}</text>
    </view>
    <!-- #endif -->
    <view class="lv-row">
      <view class="lv-num"><text class="lv-num-s">等级</text><text class="lv-num-b">{{info.number}}</text></view>
      <view class="lv-name"><text class="lv-name-b">{{info.name}}</text><text class="lv-name-s">{{info.next ? '下一级：' + info.next.n : '已经是最高级了'}}</text></view>
    </view>
    <view class="lv-bar" :class="{full:!info.next}"><view class="lv-fill" :style="{width: shown + '%'}" /></view>
    <view class="lv-meta"><text>经验 {{xp}}{{info.next ? ' · 还差 ' + info.toNext : ''}}</text><text>{{todayText}}</text></view>
    <view v-if="!compact" class="lv-stats">
      <view class="lv-stat"><text class="lv-stat-b">{{streak}}</text><text class="lv-stat-s">连续天数</text></view>
      <view class="lv-stat"><text class="lv-stat-b">{{plays}}</text><text class="lv-stat-s">玩过的期数</text></view>
      <view class="lv-stat"><text class="lv-stat-b">{{lessons}}</text><text class="lv-stat-s">学完的课</text></view>
    </view>
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="lv" :class="{compact}">
    <image class="lv-cheer" :src="cheer" mode="aspectFill" />
    <view class="lv-row">
      <view class="lv-num"><text class="lv-num-s">等级</text><text class="lv-num-b">{{info.number}}</text></view>
      <view class="lv-name"><text class="lv-name-b">{{info.name}}</text><text class="lv-name-s">{{info.next ? '下一级：' + info.next.n : '已经是最高级了'}}</text></view>
    </view>
    <view class="lv-bar" :class="{full:!info.next}"><view class="lv-fill" :style="{width: shown + '%'}" /></view>
    <view class="lv-meta"><text>经验 {{xp}}{{info.next ? ' · 还差 ' + info.toNext : ''}}</text><text>{{todayText}}</text></view>
    <view v-if="!compact" class="lv-stats">
      <view class="lv-stat"><text class="lv-stat-b">{{streak}}</text><text class="lv-stat-s">连续天数</text></view>
      <view class="lv-stat"><text class="lv-stat-b">{{plays}}</text><text class="lv-stat-s">玩过的期数</text></view>
      <view class="lv-stat"><text class="lv-stat-b">{{lessons}}</text><text class="lv-stat-s">学完的课</text></view>
    </view>
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

// AI 等级卡：每日 AI 页和我的页共用。经验条在显示时从 0 涨到当前进度。
import { computed, ref, watch, onMounted } from 'vue';
import { levelInfo, ROLES } from '../data/ai-core.js';
const props = defineProps({
  xp: { type: Number, default: 0 }, streak: { type: Number, default: 0 }, plays: { type: Number, default: 0 },
  avatar: { type: String, default: '' }, showAccount: { type: Boolean, default: false }, loggedIn: { type: Boolean, default: false },
  lessons: { type: Number, default: 0 }, todayText: { type: String, default: '' }, compact: { type: Boolean, default: false },
});
const info = computed(() => levelInfo(props.xp));
const cheer = ROLES.a.src;
const shown = ref(0);
function grow() { shown.value = 0; setTimeout(() => { shown.value = info.value.pct; }, 60); }
onMounted(grow);
watch(() => props.xp, grow);

// #endif
// #ifndef MP-WEIXIN

// AI 等级卡：每日 AI 页和我的页共用。经验条在显示时从 0 涨到当前进度。
import { computed, ref, watch, onMounted } from 'vue';
import { levelInfo, ROLES } from '../data/ai-core.js';
const props = defineProps({
  xp: { type: Number, default: 0 }, streak: { type: Number, default: 0 }, plays: { type: Number, default: 0 },
  lessons: { type: Number, default: 0 }, todayText: { type: String, default: '' }, compact: { type: Boolean, default: false },
});
const info = computed(() => levelInfo(props.xp));
const cheer = ROLES.a.src;
const shown = ref(0);
function grow() { shown.value = 0; setTimeout(() => { shown.value = info.value.pct; }, 60); }
onMounted(grow);
watch(() => props.xp, grow);

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.lv{position:relative;overflow:hidden;background:linear-gradient(150deg,#2b44e6,#1f33b8);color:#fff;border-radius:22px;padding:16px;box-shadow:0 16px 36px -24px rgba(43,68,230,.9)}
.lv-cheer{position:absolute;right:-8px;top:-6px;width:84px;height:84px;border-radius:50%;border:4px solid rgba(255,255,255,.85);animation:lvBob 2.6s ease-in-out infinite}
.lv-user{position:absolute;z-index:2;right:54px;top:18px;width:53px;height:53px;overflow:hidden;border:3px solid rgba(255,255,255,.9);border-radius:50%;background:#dce6ff;display:flex;align-items:center;justify-content:center}.lv-user-img{width:100%;height:100%}.lv-user-placeholder{font-size:11px;font-weight:800;color:#294ac8}.lv-row{display:flex;align-items:center;gap:12px;padding-right:70px}
.lv-num{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;height:62px;border-radius:18px;background:rgba(255,255,255,.16);animation:lvPop .5s ease both}
.lv-num-s{font-size:11px;font-weight:800;opacity:.85;line-height:1.2}.lv-num-b{font-size:30px;font-weight:900;line-height:1.1}
.lv-name{display:flex;flex-direction:column;min-width:0}.lv-name-b{font-size:20px;font-weight:900}.lv-name-s{font-size:13px;opacity:.9;margin-top:2px}
.lv-bar{height:11px;border-radius:6px;background:rgba(255,255,255,.22);overflow:hidden;margin-top:14px}
.lv-fill{height:100%;border-radius:6px;background:#fff;transition:width 1s ease}
.lv-bar.full .lv-fill{background:#ffc83d}
.lv-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:13px;font-weight:700;opacity:.95}
.lv-stats{display:flex;gap:8px;margin-top:12px}
.lv-stat{flex:1;display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.14);border-radius:14px;padding:9px 6px}
.lv-stat-b{font-size:19px;font-weight:900}.lv-stat-s{font-size:11px;font-weight:700;opacity:.9}
.compact .lv-cheer{width:66px;height:66px}
@keyframes lvBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes lvPop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}

/* #endif */
/* #ifndef MP-WEIXIN */

.lv{position:relative;overflow:hidden;background:linear-gradient(150deg,#2b44e6,#1f33b8);color:#fff;border-radius:22px;padding:16px;box-shadow:0 16px 36px -24px rgba(43,68,230,.9)}
.lv-cheer{position:absolute;right:-8px;top:-6px;width:84px;height:84px;border-radius:50%;border:4px solid rgba(255,255,255,.85);animation:lvBob 2.6s ease-in-out infinite}
.lv-row{display:flex;align-items:center;gap:12px;padding-right:70px}
.lv-num{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;height:62px;border-radius:18px;background:rgba(255,255,255,.16);animation:lvPop .5s ease both}
.lv-num-s{font-size:11px;font-weight:800;opacity:.85;line-height:1.2}.lv-num-b{font-size:30px;font-weight:900;line-height:1.1}
.lv-name{display:flex;flex-direction:column;min-width:0}.lv-name-b{font-size:20px;font-weight:900}.lv-name-s{font-size:13px;opacity:.9;margin-top:2px}
.lv-bar{height:11px;border-radius:6px;background:rgba(255,255,255,.22);overflow:hidden;margin-top:14px}
.lv-fill{height:100%;border-radius:6px;background:#fff;transition:width 1s ease}
.lv-bar.full .lv-fill{background:#ffc83d}
.lv-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:13px;font-weight:700;opacity:.95}
.lv-stats{display:flex;gap:8px;margin-top:12px}
.lv-stat{flex:1;display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.14);border-radius:14px;padding:9px 6px}
.lv-stat-b{font-size:19px;font-weight:900}.lv-stat-s{font-size:11px;font-weight:700;opacity:.9}
.compact .lv-cheer{width:66px;height:66px}
@keyframes lvBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes lvPop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}

/* #endif */
</style>
