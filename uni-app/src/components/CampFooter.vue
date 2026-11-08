<template>
  <!-- 减推广：只有首页底部留一句话，其它页面底部不再放推广卡 -->
  <view v-if="from === 'home'" class="oneline" role="link" tabindex="0" @tap="go" @keydown.enter.prevent="go">
    <text class="ol-q">想跟着真人做？</text>
    <text class="ol-a">看看生财有术 ›</text>
  </view>
</template>
<script setup>
import { track } from '../data/track.js';
const props = defineProps({ from: { type: String, default: 'footer' } });
function go() {
  track('outbound_click', { target: 'camp', from: props.from });
  uni.navigateTo({ url: '/pages/camp/index?from=' + encodeURIComponent(props.from) });
}
</script>
<style scoped>
.oneline{max-width:1060px;margin:28px auto 4px;padding:16px 18px;border-top:1px solid #E6E8EC;display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer}
.ol-q{font-size:14px;color:#5F6675}
.ol-a{font-size:14px;font-weight:800;color:#2B44E6}
</style>
