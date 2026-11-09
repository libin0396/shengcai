<template>
  <view class="tutorial-only-gate">
    <SiteHeader />
    <view class="tutorial-only-content">
      <text class="tutorial-only-title">先从教程开始</text>
      <text class="tutorial-only-description">这里暂时以 AI 用法和动手教程为主，选择一个你想做的事情开始吧。</text>
      <button class="tutorial-only-action" @tap="openTutorials">查看教程</button>
      <navigator class="tutorial-only-home" url="/pages/discover/index">返回首页</navigator>
    </view>
    <SiteFooter />
  </view>
</template>
<script setup>
import SiteHeader from './SiteHeader.vue';
import SiteFooter from './SiteFooter.vue';
import {openLearn} from '../data/game-matching.js';
function openTutorials(){if(!openLearn('index.html'))uni.redirectTo({url:'/pages/discover/index'})}
</script>
<style scoped>
.tutorial-only-gate{min-height:100vh;background:#f3f4f6;color:#161a23}
.tutorial-only-content{max-width:620px;margin:0 auto;padding:64px 24px}
.tutorial-only-title,.tutorial-only-description{display:block}
.tutorial-only-title{font-size:28px;font-weight:800;line-height:1.3}
.tutorial-only-description{font-size:15px;line-height:1.8;margin:12px 0 24px;color:#5f6675}
.tutorial-only-action{margin:0;background:#2b44e6;color:#fff;font-weight:700;font-size:15px}
.tutorial-only-home{margin-top:18px;color:#2b44e6;font-size:14px;text-align:center}
</style>
