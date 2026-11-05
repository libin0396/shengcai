<template>
  <view class="cc">
    <image class="cc-illo" :src="campaign.posterUrl" mode="widthFix" @tap="showPoster" />
    <view class="cc-body">
      <text class="cc-k">生财有术 · AI 成万事</text>
      <text class="cc-t"><text class="cc-hi">3 天</text>，迈出 AI 实战第一步</text>
      <view class="cc-tags"><text>看机会</text><text>学路径</text><text>有人带</text><text>出成果</text></view>
      <view class="cc-qr"><CampQr :size="96" compact /><view class="cc-qr-copy"><text class="cc-qr-t">长按二维码加入体验营</text><text class="cc-qr-s">微信里长按识别</text><text class="cc-qr-s">电脑上用微信扫一扫</text></view></view>
      <text class="cc-f">2 场直播课 · 3 天答疑群 · 1 张体验卡 · 不保证收入</text>
      <text v-if="showMore" class="cc-more" @tap="openCamp">了解体验营 ›</text>
    </view>
  </view>
</template>
<script setup>
import CampQr from './CampQr.vue';
import { campaign } from '../data/content.js';
function showPoster() { uni.previewImage({ current: campaign.posterUrl, urls: [campaign.posterUrl] }); }
const props = defineProps({ from: { type: String, default: 'footer' }, showMore: { type: Boolean, default: true } });
function openCamp() { uni.navigateTo({ url: '/pages/camp/index?from=' + props.from }); }
</script>
<style scoped>
.cc{border-radius:20px;overflow:hidden;background:#0B2E20;color:#fff}
.cc-illo{display:block;width: min(100%, 250px);margin: 12px auto 0;border-radius:10px;cursor:pointer}
.cc-body{padding:2px 16px 16px}
.cc-k,.cc-t,.cc-f,.cc-qr-t,.cc-qr-s,.cc-more{display:block}
.cc-k{font-size:12px;font-weight:900;color:#9FD8B5}
.cc-t{font-size:20px;line-height:1.35;font-weight:850;margin-top:3px}.cc-hi{color:#FFC94D}
.cc-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.cc-tags text{font-size:12px;background:rgba(255,255,255,.08);border-radius:8px;padding:3px 8px;color:#DCE9E0}
.cc-qr{display:flex;gap:12px;align-items:center;margin-top:12px;background:#fff;border-radius:14px;padding:10px;color:#13241B}
.cc-qr-copy{min-width:0}.cc-qr-t{font-size:14.5px;font-weight:850}.cc-qr-s{font-size:12px;color:#45594D;line-height:1.5}
.cc-f{font-size:11.5px;color:#9FB8A7;margin-top:8px}
.cc-more{font-size:13px;color:#FFC94D;font-weight:800;margin-top:6px;cursor:pointer}
</style>
