<template>
  <view class="jc">
    <image class="jc-illo" src="/static/assets/join-banner.svg" mode="widthFix" />
    <view class="jc-body">
      <view class="jc-pr"><text class="jc-now">了解加入生财有术</text></view>
      <view class="jc-list"><text class="jc-li">了解项目、实战内容与圈友交流</text></view>
      <view class="jc-btn" @tap="go">加入生财有术 ↗</view>
      <text class="jc-f">站长推荐链接 · 费用与权益以入口说明为准</text>
    </view>
  </view>
</template>
<script setup>
import { REFERRAL_URL, openExternal } from '../data/offer.js';
import { track } from '../data/track.js';
const props = defineProps({ from: { type: String, default: 'footer' } });
function go() { track('outbound_click', { target: 'join', from: props.from }); openExternal(REFERRAL_URL); }
</script>
<style scoped>
.jc{border-radius:20px;overflow:hidden;background:#fff;border:1px solid #E5DECF;color:#13241B}
.jc-illo{display:block;width:100%}
.jc-body{padding:12px 16px 16px}
.jc-pr{display:flex;align-items:baseline;gap:8px}.jc-now{font-size:20px;font-weight:900;color:#D9481A}.jc-was{color:#7C897F;font-size:14px;text-decoration:line-through}
.jc-left{margin-left:auto;font-size:12px;font-weight:900;background:#FFF1C9;color:#7A5200;border-radius:999px;padding:3px 9px;white-space:nowrap}
.jc-list{margin-top:8px}.jc-li{display:block;font-size:13.5px;line-height:1.5;padding:3px 0}
.jc-btn{display:flex;height:48px;border-radius:14px;background:#0E5A3A;color:#fff;font-weight:900;font-size:15.5px;align-items:center;justify-content:center;margin-top:12px;cursor:pointer}
.jc-f{display:block;font-size:11.5px;color:#7C897F;margin-top:8px;text-align:center}
</style>
