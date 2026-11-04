<template>
  <view class="sim-camp">
    <view class="sim-camp-copy">
      <text class="sim-camp-kicker">继续动手实践</text>
      <text class="sim-camp-title">从一次体验，走向真正实践。</text>
      <text class="sim-camp-desc">想系统了解 AI 实战？看看生财有术三天体验营的完整介绍和参与方式。</text>
      <button class="sim-camp-button" @tap="openCamp">了解三天体验营 <text>→</text></button>
      <text class="sim-camp-hint">体验营与其他线下活动分别报名，具体安排以入口说明为准。</text>
    </view>
    <view class="sim-camp-art" @tap="previewPoster">
      <image class="sim-camp-poster" :src="campaign.posterUrl" mode="widthFix" />
      <text class="sim-camp-art-label">点击查看完整海报</text>
    </view>
  </view>
</template>
<script setup>
import { campaign } from '../../data/content.js';
function openCamp() { uni.navigateTo({ url: '/pages/camp/index' }); }
function previewPoster() { uni.previewImage({ current: campaign.posterUrl, urls: [campaign.posterUrl] }); }
</script>
<style scoped>
.sim-camp { display:flex; align-items:center; justify-content:space-between; gap:28px; margin:24px 0 4px; padding:24px 30px; border:1px solid #204937; border-radius:8px; background:#103b2a; color:#f5f8f0; box-sizing:border-box; }
.sim-camp-copy { min-width:0; max-width:590px; }
.sim-camp-kicker,.sim-camp-title,.sim-camp-desc,.sim-camp-hint,.sim-camp-art-label { display:block; }
.sim-camp-kicker { color:#d6e7a0; font-size:12px; font-weight:700; letter-spacing:.04em; }
.sim-camp-title { margin-top:10px; color:#fff; font-size:23px; line-height:1.4; font-weight:750; }
.sim-camp-desc { margin-top:9px; color:#c6d7c9; font-size:14px; line-height:1.75; }
.sim-camp-button { display:inline-flex; align-items:center; gap:16px; min-height:44px; margin:18px 0 0; padding:0 18px; border:0; border-radius:6px; background:#ef5b28; color:#fff; font-size:14px; line-height:44px; font-weight:700; }
.sim-camp-button::after { border:0; }
.sim-camp-hint { margin-top:13px; color:#a8c2ae; font-size:11px; line-height:1.7; }
.sim-camp-art { display:flex; flex-direction:column; align-items:center; gap:7px; flex:0 0 116px; cursor:pointer; }
.sim-camp-poster { display:block; width:116px; border-radius:4px; }
.sim-camp-art-label { color:#c6d7c9; font-size:10px; line-height:1.4; white-space:nowrap; }
@media(max-width:600px) {
  .sim-camp { align-items:flex-start; gap:16px; padding:20px 17px; }
  .sim-camp-title { font-size:19px; }
  .sim-camp-desc { font-size:13px; }
  .sim-camp-button { width:auto; min-height:42px; padding:0 12px; font-size:13px; }
  .sim-camp-art { flex-basis:90px; }
  .sim-camp-poster { width:90px; }
}
@media(max-width:360px) { .sim-camp { gap:12px; padding:17px 13px; } .sim-camp-art{flex-basis:74px}.sim-camp-poster{width:74px}.sim-camp-title{font-size:18px}.sim-camp-button{font-size:12px} }
</style>
