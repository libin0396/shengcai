<template>
  <view v-if="visible" class="ss-mask" @tap.self="$emit('close')">
    <view class="ss" @tap.stop>
      <view class="ss-grab" />
      <text class="ss-t">{{ kind === 'event' ? '报名方式在生财有术活动页' : '原帖在生财有术里' }}</text>
      <text class="ss-p">{{ kind === 'event' ? '这场活动在生财有术里发布，圈友登录后能看报名方式和群二维码。' : '这是生财有术的会员内容，圈友登录后能看全文。' }}还不是圈友，可以通过站长的推荐链接了解加入方式，价格与活动安排以入口说明为准。</text>
      <view class="ss-a" @tap="toReferral"><text>{{ kind === 'event' ? '加入生财，去报名' : '加入生财，看完整原帖' }} ↗</text></view>
      <view class="ss-m" @tap="toSource">{{ kind === 'event' ? '了解体验营后查看报名方式' : '了解体验营后查看原帖' }}</view>
      <text class="ss-f">前往体验营页面后，可以继续查看原文或报名方式</text>
    </view>
  </view>
</template>
<script setup>
import { REFERRAL_URL, openExternal } from '../data/offer.js';
import { track } from '../data/track.js';
const props = defineProps({ visible: Boolean, url: { type: String, default: '' }, kind: { type: String, default: 'article' }, from: { type: String, default: 'article' } });
const emit = defineEmits(['close']);
function toReferral() { track('outbound_click', { target: 'referral', from: props.from }); emit('close'); openExternal(REFERRAL_URL); }
function toSource() { const source=String(props.url||''); if (!/^https:\/\/(?:www\.)?scys\.com\//i.test(source)) return; emit('close'); uni.navigateTo({url:'/pages/camp/index?from='+(props.kind === 'event' ? 'event' : 'article')+'&source='+encodeURIComponent(source)}); }
</script>
<style scoped>
.ss-mask{position:fixed;inset:0;z-index:200;background:rgba(10,20,15,.55);display:flex;align-items:flex-end;justify-content:center}
.ss{width:100%;max-width:520px;background:#fff;border-radius:22px 22px 0 0;padding:10px 18px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;color:#13241B}
.ss-grab{width:40px;height:5px;border-radius:3px;background:#D9D2C3;margin:0 auto 12px}
.ss-t,.ss-p,.ss-f,.ss-a-s{display:block}
.ss-t{font-size:17px;font-weight:900}.ss-p{font-size:13px;color:#45594D;margin-top:4px;line-height:1.6}
.ss-a{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:58px;border-radius:14px;background:#0E5A3A;color:#fff;font-weight:900;font-size:16px;margin-top:14px;line-height:1.35;cursor:pointer}
.ss-a-s{font-size:11.5px;color:#FFC94D;font-weight:800}
.ss-m{display:flex;height:48px;align-items:center;justify-content:center;border-radius:14px;border:1.5px solid #E5DECF;font-weight:900;margin-top:10px;cursor:pointer}
.ss-f{font-size:11.5px;color:#7C897F;text-align:center;margin-top:10px}
</style>
