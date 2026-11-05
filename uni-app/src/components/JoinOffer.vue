<template>
  <view v-if="offerActive && (variant !== 'bar' || (!dismissed && visible))" :class="['join-offer', `join-offer--${variant}`]">
    <view class="join-offer__copy">
      <text class="join-offer__eyebrow">另一种参与方式</text>
      <text class="join-offer__title">想直接了解生财有术？<text v-if="variant === 'bar'"> · 推广</text></text>
      <text v-if="offerActive" class="join-offer__detail">生财当期公告：新圈友活动价 ¥2,965（原价 ¥3,365），截至 2026 年 11 月 11 日 23:59（北京时间）。</text><text class="join-offer__detail">推广入口；优惠、费用和权益以领取页面说明为准。</text>
    </view>
    <view class="join-offer__actions">
      <!-- #ifdef H5 -->
      <a class="join-offer__button" :href="joinUrl" rel="noopener noreferrer" @click="trackJoin">了解直接加入 ↗</a>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <button class="join-offer__button" @tap="copyLink">复制加入链接</button>
      <!-- #endif -->
      <button v-if="variant !== 'bar'" class="join-offer__qr-toggle" @tap="showQr = !showQr">{{ showQr ? '收起二维码' : '扫码了解' }}</button>
    </view>
    <view v-if="showQr && variant !== 'bar'" class="join-offer__qr"><image :src="qr" mode="aspectFit" show-menu-by-longpress /><text>微信扫码或长按识别</text></view>
    <button v-if="variant === 'bar'" class="join-offer__close" aria-label="关闭推荐" @tap="dismiss">×</button>
  </view>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {track} from '../data/track.js';
const props = defineProps({variant:{type:String,default:'card'}, visible:{type:Boolean,default:true}, from:{type:String,default:'camp'}});
const joinUrl = 'https://t.zsxq.com/6dPqb';
const showQr = ref(false), dismissed = ref(false), now=ref(Date.now());
const offerActive=computed(()=>now.value >= Date.parse('2026-11-01T00:00:00+08:00') && now.value < Date.parse('2026-11-12T00:00:00+08:00'));
let clock; onMounted(()=>{clock=setInterval(()=>{now.value=Date.now()},60000)});onUnmounted(()=>clearInterval(clock));
const qr = '/static/assets/membership-join-qr.gif';
try { dismissed.value = !!uni.getStorageSync('ainpe:join-offer-dismissed'); } catch {}
function dismiss(){dismissed.value=true;try{uni.setStorageSync('ainpe:join-offer-dismissed',true)}catch{}}
function trackJoin(){track('outbound_click',{target:'join',from:props.from})}
function copyLink(){uni.setClipboardData({data:joinUrl})}
</script>
<style scoped>
.join-offer{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:19px 21px;margin:22px 0;background:#edf4e9;border:1px solid #cbdcc8;border-radius:13px;color:#153d2b}.join-offer__copy{flex:1;min-width:190px}.join-offer__eyebrow,.join-offer__title,.join-offer__detail{display:block}.join-offer__eyebrow{font-size:11px;color:#66866d;font-weight:700}.join-offer__title{font-size:17px;font-weight:800;margin-top:5px}.join-offer__detail{font-size:12px;line-height:1.6;color:#728a78;margin-top:5px}.join-offer__actions{display:flex;align-items:center;gap:8px}.join-offer__button{display:inline-block;box-sizing:border-box;background:#175c39;color:white;text-align:center;text-decoration:none;border-radius:7px;padding:10px 14px;line-height:22px;font-size:13px;font-weight:700;white-space:nowrap;margin:0}.join-offer__qr-toggle{margin:0;padding:0 9px;background:transparent;color:#236b45;font-size:12px;line-height:40px;white-space:nowrap}.join-offer__qr{flex-basis:100%;display:flex;align-items:center;gap:12px;font-size:12px;color:#567660}.join-offer__qr image{width:116px;height:116px;background:#fff}.join-offer--inline{padding:14px 16px;margin:16px 0}.join-offer--bar{position:fixed;z-index:80;left:50%;bottom:18px;transform:translateX(-50%);width:min(660px,calc(100% - 32px));box-sizing:border-box;margin:0;padding:12px 44px 12px 16px;box-shadow:0 7px 28px #102c2030;background:#f5faf2}.join-offer--bar .join-offer__detail,.join-offer--bar .join-offer__eyebrow{display:none}.join-offer--bar .join-offer__title{margin:0;font-size:14px}.join-offer__close{position:absolute;right:8px;top:5px;margin:0;padding:0 6px;background:transparent;color:#577561;font-size:22px;line-height:30px}@media(max-width:700px){.join-offer{gap:10px;padding:15px}.join-offer__copy{min-width:0;flex-basis:100%}.join-offer__actions{width:100%}.join-offer__button{flex:1}.join-offer--bar{bottom:calc(64px + env(safe-area-inset-bottom));flex-wrap:nowrap;gap:8px;padding:10px 36px 10px 12px}.join-offer--bar .join-offer__copy{flex:1}.join-offer--bar .join-offer__actions{width:auto}.join-offer--bar .join-offer__button{padding:7px 9px;font-size:12px}.join-offer--bar .join-offer__title{font-size:12px;line-height:1.4}}
</style>
