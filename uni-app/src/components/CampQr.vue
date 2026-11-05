<template>
  <view :class="['camp-scan', {'camp-scan--light': light}]">
    <!-- #ifdef H5 -->
    <template v-if="qr">
      <img :src="qr" :style="{width: size+'px',height: size+'px'}" alt="三天体验营报名二维码" class="camp-scan-image" />
      <text v-if="!compact" class="camp-scan-hint">用微信扫码，或在微信内长按识别</text>
      <a v-if="!isWechat && !compact" :href="qr" download="三天体验营报名二维码.png" class="camp-scan-save">保存二维码图片</a>
      <text v-if="!isWechat && !compact" class="camp-scan-hint">也可长按图片保存，再打开微信扫一扫</text>
    </template>
    <button v-else class="camp-scan-fallback" @click="showPoster">查看完整报名海报</button>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <button class="camp-scan-fallback" @tap="showPoster">查看完整报名海报</button>
    <text class="camp-scan-hint">查看海报中的报名二维码</text>
    <!-- #endif -->
  </view>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import {campaign} from '../data/content.js';
// #ifdef H5
import {makeCampQr} from '../pages/camp/camp-poster.js';
// #endif
const props=defineProps({size:{type:Number,default:120},light:{type:Boolean,default:false},compact:{type:Boolean,default:false}});
const qr=ref(''),isWechat=ref(false);
// #ifdef H5
onMounted(()=>{try{isWechat.value=/MicroMessenger/i.test(navigator.userAgent);qr.value=makeCampQr(campaign.targetUrl).toDataURL('image/png')}catch{qr.value=''}});
// #endif
function showPoster(){uni.previewImage({current:campaign.posterUrl,urls:[campaign.posterUrl]});}
</script>

<style scoped>
.camp-scan{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;color:#526b5b;text-align:center}
.camp-scan--light{color:#edf5e9}
.camp-scan-image{display:block;max-width:100%;object-fit:contain;image-rendering:pixelated;background:white;border-radius:5px}
.camp-scan-hint{display:block;font-size:12px;line-height:1.5}
.camp-scan-save{color:inherit;text-decoration:underline;font-size:12px;line-height:1.5}
.camp-scan-fallback{margin:0;padding:8px 12px;background:#fff;color:#18553a;border-radius:7px;font-size:13px;line-height:1.5}
.camp-scan-fallback::after{border:0}
</style>
