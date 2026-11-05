<template>
  <view v-if="active" class="compare"><text class="eyebrow">选择适合自己的方式</text><text class="heading">先体验，或了解直接加入</text><view class="choices"><view class="choice"><text class="choice-title">3 天体验营</text><text class="description">先了解机会和路径，再尝试完成一个成果。活动安排以体验营入口为准。</text><button @tap="toCamp">了解体验营 →</button></view><view class="choice"><text class="choice-title">直接了解生财有术</text><text class="description">查看会员加入方式，费用、权益和适用条件请以入口说明为准。</text><JoinOffer variant="inline" from="camp" /></view></view></view>
</template>
<script setup>
import {ref,onMounted,onUnmounted} from 'vue';
import JoinOffer from './JoinOffer.vue';
const withinPeriod=()=>Date.now()>=Date.parse('2026-11-01T00:00:00+08:00')&&Date.now()<Date.parse('2026-11-12T00:00:00+08:00');
const active=ref(withinPeriod()); let timer; onMounted(()=>{timer=setInterval(()=>{active.value=withinPeriod()},60000)}); onUnmounted(()=>clearInterval(timer));
function toCamp(){uni.pageScrollTo({scrollTop:0,duration:250})}
</script>
<style scoped>
.compare{padding:24px;background:#fff;border:1px solid #e8e4d9;border-radius:14px;margin:22px 0;color:#173a29}.eyebrow,.heading,.choice-title,.description{display:block}.eyebrow{font-size:11px;color:#7b9b7d}.heading{font-size:21px;font-weight:800;margin:7px 0 16px}.choices{display:grid;grid-template-columns:1fr 1fr;gap:12px}.choice{border:1px solid #e1eadc;border-radius:10px;padding:16px;background:#fbfcf9}.choice-title{font-weight:800;font-size:16px}.description{font-size:13px;color:#718476;line-height:1.7;margin-top:8px}.choice>button{margin:15px 0 0;background:#f15a24;color:white;font-size:13px;line-height:42px}.choice :deep(.join-offer){margin:12px 0 0}.choice :deep(.join-offer__eyebrow),.choice :deep(.join-offer__title){display:none}@media(max-width:700px){.compare{padding:18px}.choices{grid-template-columns:1fr}}
</style>
