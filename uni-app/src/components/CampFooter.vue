<template>
  <view class="funnel">
    <view class="funnel-in">
      <text class="funnel-t">下一步，选一个适合你的</text>
      <view class="funnel-grid"><CampCard :from="from" /><JoinCard :from="from" /></view>
    </view>
  </view>
</template>
<script setup>
import CampCard from './CampCard.vue';
import JoinCard from './JoinCard.vue';
defineProps({ from: { type: String, default: 'footer' } });
</script>
<style scoped>
.funnel{padding:28px 16px 8px;margin-top:24px}
.funnel-in{max-width:1060px;margin:auto}
.funnel-t{display:block;font-size:19px;font-weight:900;color:#13241B;margin:0 2px 12px}
.funnel-grid{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:760px){.funnel-grid{grid-template-columns:1fr 1fr;align-items:start}}
</style>
