<template>
  <view class="mp">
    <view v-if="open === ''" class="mp-row">
      <view class="mp-c mp-camp" @tap="open = 'camp'"><text class="mp-s">3 天体验营</text><text class="mp-b">{{ hook }}</text><text class="mp-i">有人带你走一遍 ›</text></view>
      <view class="mp-c mp-join" @tap="open = 'join'"><text class="mp-s">直接加入生财</text><text class="mp-b">了解项目与圈友交流</text><text class="mp-i">查看加入方式 ›</text></view>
    </view>
    <view v-else><CampCard v-if="open === 'camp'" :from="from" /><JoinCard v-else :from="from" /><text class="mp-back" @tap="open = ''">收起</text></view>
  </view>
</template>
<script setup>
import { ref } from 'vue';
import CampCard from './CampCard.vue';
import JoinCard from './JoinCard.vue';
defineProps({ hook: { type: String, default: '想把这个做法用到自己身上？' }, from: { type: String, default: 'article' } });
const open = ref('');
</script>
<style scoped>
.mp{margin:14px 0 22px}
.mp-row{display:flex;gap:10px}
.mp-c{flex:1;min-width:0;border-radius:16px;padding:12px;min-height:118px;display:flex;flex-direction:column;cursor:pointer;box-sizing:border-box}
.mp-camp{background:#0B2E20;color:#fff}.mp-join{background:#fff;border:1px solid #E5DECF;color:#13241B}
.mp-s,.mp-b,.mp-b2,.mp-i{display:block}.mp-b2{font-size:15.5px;font-weight:850;line-height:1.35}
.mp-s{font-size:11.5px;font-weight:900}.mp-camp .mp-s{color:#9FD8B5}.mp-join .mp-s{color:#0E5A3A}
.mp-b{font-size:15.5px;line-height:1.35;font-weight:850;margin-top:3px;}.mp-p{color:#D9481A}
.mp-i{margin-top:auto;font-size:13px;font-weight:900;padding-top:8px}.mp-camp .mp-i{color:#FFC94D}.mp-join .mp-i{color:#0E5A3A}
.mp-back{display:block;text-align:center;font-size:13px;color:#7C897F;margin-top:8px;cursor:pointer}
</style>
