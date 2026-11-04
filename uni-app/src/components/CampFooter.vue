<template><view class="camp-footer"><view class="camp-inner"><image class="poster" :src="campaign.posterUrl" mode="widthFix" @click="open"/><view><text class="eyebrow">下一步 · 动手试试</text><text class="title">把看到的方法，变成自己的实践。</text><text class="desc">了解生财有术三天体验营，具体安排以活动入口为准。</text><button class="button" @click="open">了解三天体验营 →</button></view></view></view></template>
<script setup>
import {campaign} from '../data/content.js';
function open(){uni.navigateTo({url:'/pages/camp/index'});}
</script>
<style scoped>.camp-footer{background:#143b2c;color:#f5f9ec;padding:38rpx 28rpx;margin-top:60rpx}.camp-inner{max-width:1000px;margin:auto;display:flex;gap:28rpx;align-items:center}.poster{width:142rpx;flex-shrink:0;border-radius:6rpx}.eyebrow,.title,.desc{display:block}.eyebrow{color:#b7d985;font-size:22rpx}.title{font-size:34rpx;font-weight:700;margin:10rpx 0}.desc{color:#c1d4be;font-size:24rpx;line-height:1.6}.button{display:inline-block;background:#d9ed9a;color:#203e29;font-size:24rpx;line-height:2.8;margin:18rpx 0 0;padding:0 24rpx}</style>
