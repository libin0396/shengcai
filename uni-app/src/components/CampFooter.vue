<template>
  <view class="camp-footer">
    <view class="camp-inner">
      <image class="poster" :src="campaign.posterUrl" mode="widthFix" @tap="previewPoster" />
      <view class="copy">
        <text class="eyebrow">下一步 · 动手试试</text>
        <text class="title">把看到的方法，变成自己的实践。</text>
        <text class="desc">了解生财有术三天体验营，具体安排以入口说明为准。</text>
      </view>
      <button class="button" @tap="open">了解三天体验营 →</button>
    </view>
  </view>
</template>
<script setup>
import {campaign} from '../data/content.js';
function open(){uni.navigateTo({url:'/pages/camp/index'});}
function previewPoster(){uni.previewImage({current:campaign.posterUrl,urls:[campaign.posterUrl]});}
</script>
<style scoped>
.camp-footer{background:#103b2a;color:#f5f9ec;padding:28px 24px;margin-top:36px}
.camp-inner{max-width:1060px;margin:auto;display:flex;gap:24px;align-items:center}
.poster{display:block;width:78px;flex:0 0 78px;border-radius:4px;cursor:pointer}
.copy{flex:1;min-width:0}.eyebrow,.title,.desc{display:block}.eyebrow{color:#d6e7a0;font-size:12px;font-weight:700}.title{font-size:21px;font-weight:700;line-height:1.4;margin:8px 0}.desc{color:#c1d4be;font-size:13px;line-height:1.7}
.button{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;background:#ef5b28;color:#fff;border:0;border-radius:6px;font-size:13px;font-weight:700;line-height:44px;min-height:44px;margin:0;padding:0 17px}.button::after{border:0}
@media(max-width:600px){.camp-footer{padding:22px 16px}.camp-inner{display:grid;grid-template-columns:70px minmax(0,1fr);gap:12px 15px;align-items:center}.poster{width:70px;grid-row:1 / 3}.title{font-size:17px}.desc{font-size:12px}.button{grid-column:2;justify-self:start;line-height:42px;min-height:42px;padding:0 12px}}
</style>
