<template>
  <web-view v-if="src" :src="src" />
  <view v-else class="play-err"><text>这个项目暂时打不开，回首页换一个试试。</text></view>
</template>
<script setup>
import {ref} from 'vue';
import {onLoad} from '@dcloudio/uni-app';
import {isGamePath} from '../../data/game-matching.js';
const SITE='https://ainpe.aisen.xin';
const src=ref('');
onLoad(options=>{
  let p='';try{p=decodeURIComponent(String(options?.u||''))}catch{p=''}
  // 只允许打开本站的游戏页面
  if(!isGamePath(p))return;
  src.value=SITE+p+(p.includes('?')?'&':'?')+'mp=1';
});
</script>
<style scoped>
.play-err{padding:40px 24px;font-size:15px;color:#45594D;line-height:1.7}
</style>
