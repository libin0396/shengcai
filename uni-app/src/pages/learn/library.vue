<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="page">
    <view class="eyebrow">AINPE实战情报站</view><view class="title">快捷提示词</view><view class="subtitle">日常小事，选一句提示词，复制给 AI 试试。</view>
    <view class="search-box"><input v-model="query" class="search-input" maxlength="40" placeholder="搜一搜想做的事" confirm-type="search" /></view>
    <view class="category-label">按你想做的事分类</view>
    <scroll-view scroll-x class="category-scroll" :show-scrollbar="false"><view class="categories"><text v-for="t in topics" :key="t" :class="['category',{selected:category===t}]" @tap="category=t">{{t}}</text></view></scroll-view>
    <view class="count">找到 {{filtered.length}} 个提示词</view>
    <view v-if="!filtered.length" class="empty">暂时没有找到相关提示词。换个词或分类试试。</view>
    <view v-for="item in filtered" :id="'aid-'+item.id" :key="item.id" class="aid-card">
      <view class="aid-head" @tap="toggle(item.id)"><view class="aid-main"><view class="aid-title">{{item.title}}</view><view class="aid-when">{{item.when}}</view></view><text class="arrow">{{expanded===item.id?'收起':'展开'}}</text></view>
      <view v-if="expanded===item.id" class="aid-body"><view class="hint">复制后到常用 AI 工具中使用，再把【】里的内容换成你的情况。</view><view class="prompt" selectable>{{item.prompt}}</view><button class="copy" @tap="copy(item.prompt)">复制提示词</button><view class="example-label">示例回答（仅供参考）</view><view class="example" selectable>{{item.example}}</view><view class="privacy">涉及隐私的信息，请先删除或换成代称。</view></view>
    </view>
    <view class="explore" @tap="goGuides"><view><view class="explore-title">想做成一件完整的事？</view><view class="explore-text">选一个教程，跟着步骤做。</view></view><text>去跟着做 →</text></view>
    <MiniNav active="library" />
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="page">
    <view class="eyebrow">AINPE实战情报站</view><view class="title">快捷提示词</view><view class="subtitle">日常小事，选一句提示词，复制给 AI 试试。</view>
    <view class="search-box"><input v-model="query" class="search-input" maxlength="40" placeholder="搜一搜想做的事" confirm-type="search" /></view>
    <view class="category-label">按你想做的事分类</view>
    <scroll-view scroll-x class="category-scroll" :show-scrollbar="false"><view class="categories"><text v-for="t in topics" :key="t" :class="['category',{selected:category===t}]" @tap="category=t">{{t}}</text></view></scroll-view>
    <view class="count">找到 {{filtered.length}} 个提示词</view>
    <view v-if="!filtered.length" class="empty">暂时没有找到相关提示词。换个词或分类试试。</view>
    <view v-for="item in filtered" :id="'aid-'+item.id" :key="item.id" class="aid-card">
      <view class="aid-head" @tap="toggle(item.id)"><view class="aid-main"><view class="aid-title">{{item.title}}</view><view class="aid-when">{{item.when}}</view></view><text class="arrow">{{expanded===item.id?'收起':'展开'}}</text></view>
      <view v-if="expanded===item.id" class="aid-body"><view class="hint">复制后到常用 AI 工具中使用，再把【】里的内容换成你的情况。</view><view class="prompt" selectable>{{item.prompt}}</view><button class="copy" @tap="copy(item.prompt)">复制提示词</button><view class="example-label">示例回答（仅供参考）</view><view class="example" selectable>{{item.example}}</view><view class="privacy">涉及隐私的信息，请先删除或换成代称。</view></view>
    </view>
    <view class="explore" @tap="goGuides"><view><view class="explore-title">想做成一件完整的事？</view><view class="explore-text">选一个教程，跟着步骤做。</view></view><text>去跟着做 →</text></view>
    <MiniNav active="library" />
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

import {computed,ref} from 'vue';
import {onLoad,onReady,onShow} from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import {miniAids} from '../../data/mini-aids.js';
import {aidTopics,topics,normalized} from '../../data/mini-search-data.js';
const query=ref(''),category=ref('全部'),expanded=ref('');
let directAidId='';
const filtered=computed(()=>{const q=normalized(query.value);return miniAids.filter(a=>(category.value==='全部'||(aidTopics[a.id]||[]).includes(category.value))&&(!q||normalized([a.title,a.when,a.prompt,a.example,...(a.tags||[]),...(aidTopics[a.id]||[])].join(' ')).includes(q)))});
onLoad(options=>{const id=String(options?.id||'');if(miniAids.some(a=>a.id===id))directAidId=id});
onShow(()=>{expanded.value='' });
onReady(()=>{if(directAidId)uni.pageScrollTo({selector:'#aid-'+directAidId,duration:0})});
function toggle(id){expanded.value=expanded.value===id?'':id}
function copy(text){uni.setClipboardData({data:text,success(){uni.showToast({title:'已复制',icon:'success'})}})}
function goGuides(){const url='/pages/learn/guides?complete=1';uni.navigateTo({url,fail:()=>uni.redirectTo({url})})}

// #endif
// #ifndef MP-WEIXIN

import {computed,ref} from 'vue';
import {onLoad,onReady} from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import {miniAids} from '../../data/mini-aids.js';
import {aidTopics,topics,normalized} from '../../data/mini-search-data.js';
const query=ref(''),category=ref('全部'),expanded=ref('');
const filtered=computed(()=>{const q=normalized(query.value);return miniAids.filter(a=>(category.value==='全部'||(aidTopics[a.id]||[]).includes(category.value))&&(!q||normalized([a.title,a.when,a.prompt,a.example,...(a.tags||[]),...(aidTopics[a.id]||[])].join(' ')).includes(q)))});
onLoad(options=>{const id=String(options?.id||'');if(miniAids.some(a=>a.id===id))expanded.value=id});
onReady(()=>{if(expanded.value)uni.pageScrollTo({selector:'#aid-'+expanded.value,duration:0})});
function toggle(id){expanded.value=expanded.value===id?'':id}
function copy(text){uni.setClipboardData({data:text,success(){uni.showToast({title:'已复制',icon:'success'})}})}
function goGuides(){uni.navigateTo({url:'/pages/learn/guides'})}

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:44rpx 32rpx calc(76px + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}.eyebrow{font-size:23rpx;color:#71809a;font-weight:700}.title{font-size:52rpx;line-height:1.2;font-weight:800;margin-top:14rpx}.subtitle,.aid-when,.hint,.example,.explore-text{font-size:26rpx;line-height:1.65;color:#718097}.subtitle{margin-top:12rpx}.search-box{margin-top:32rpx;padding:0 22rpx;border-radius:20rpx;border:2rpx solid #e2e6ed;background:#fff}.search-input{height:88rpx;font-size:28rpx}.category-label{margin:30rpx 0 16rpx;color:#69758a;font-size:24rpx;font-weight:700}.category-scroll{white-space:nowrap}.categories{display:flex;gap:12rpx;width:max-content;padding-bottom:6rpx}.category{padding:13rpx 22rpx;border-radius:40rpx;background:#fff;color:#617085;font-size:24rpx;white-space:nowrap}.category.selected{background:#2849e9;color:#fff;font-weight:700}.count{font-size:23rpx;color:#8793a3;margin:24rpx 0 12rpx}.aid-card,.empty{background:#fff;border:1rpx solid #e5eaf1;border-radius:20rpx;margin-bottom:14rpx}.aid-head{display:flex;align-items:center;gap:18rpx;padding:25rpx}.aid-main{flex:1;min-width:0}.aid-title,.explore-title{font-size:29rpx;font-weight:800;line-height:1.4}.aid-when{margin-top:6rpx}.arrow{flex:none;color:#2850df;font-size:23rpx;font-weight:700}.aid-body{border-top:1rpx solid #eef1f5;padding:22rpx 25rpx 28rpx}.hint{margin-bottom:16rpx}.prompt{white-space:pre-wrap;padding:22rpx;background:#f3f6ff;border-radius:16rpx;color:#25334c;font-size:26rpx;line-height:1.75;word-break:break-word}.copy{background:#2849e9;color:#fff;margin:20rpx 0 0;line-height:84rpx;border-radius:14rpx;font-size:27rpx;font-weight:700}.copy::after{border:0}.example-label{font-size:23rpx;font-weight:700;color:#65768b;margin-top:24rpx}.example{white-space:pre-wrap;margin-top:10rpx}.privacy{font-size:22rpx;color:#8793a3;margin-top:14rpx}.empty{padding:28rpx;color:#718097;font-size:26rpx;line-height:1.6}.explore{margin-top:28rpx;background:#e9eefc;padding:24rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:space-between;gap:12rpx;color:#2849e9;font-size:23rpx;font-weight:700}.explore-title{color:#243051}.explore-text{margin-top:4rpx;font-size:23rpx}

/* #endif */
/* #ifndef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:44rpx 32rpx calc(168rpx + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}.eyebrow{font-size:23rpx;color:#71809a;font-weight:700}.title{font-size:52rpx;line-height:1.2;font-weight:800;margin-top:14rpx}.subtitle,.aid-when,.hint,.example,.explore-text{font-size:26rpx;line-height:1.65;color:#718097}.subtitle{margin-top:12rpx}.search-box{margin-top:32rpx;padding:0 22rpx;border-radius:20rpx;border:2rpx solid #e2e6ed;background:#fff}.search-input{height:88rpx;font-size:28rpx}.category-label{margin:30rpx 0 16rpx;color:#69758a;font-size:24rpx;font-weight:700}.category-scroll{white-space:nowrap}.categories{display:flex;gap:12rpx;width:max-content;padding-bottom:6rpx}.category{padding:13rpx 22rpx;border-radius:40rpx;background:#fff;color:#617085;font-size:24rpx;white-space:nowrap}.category.selected{background:#2849e9;color:#fff;font-weight:700}.count{font-size:23rpx;color:#8793a3;margin:24rpx 0 12rpx}.aid-card,.empty{background:#fff;border:1rpx solid #e5eaf1;border-radius:20rpx;margin-bottom:14rpx}.aid-head{display:flex;align-items:center;gap:18rpx;padding:25rpx}.aid-main{flex:1;min-width:0}.aid-title,.explore-title{font-size:29rpx;font-weight:800;line-height:1.4}.aid-when{margin-top:6rpx}.arrow{flex:none;color:#2850df;font-size:23rpx;font-weight:700}.aid-body{border-top:1rpx solid #eef1f5;padding:22rpx 25rpx 28rpx}.hint{margin-bottom:16rpx}.prompt{white-space:pre-wrap;padding:22rpx;background:#f3f6ff;border-radius:16rpx;color:#25334c;font-size:26rpx;line-height:1.75;word-break:break-word}.copy{background:#2849e9;color:#fff;margin:20rpx 0 0;line-height:84rpx;border-radius:14rpx;font-size:27rpx;font-weight:700}.copy::after{border:0}.example-label{font-size:23rpx;font-weight:700;color:#65768b;margin-top:24rpx}.example{white-space:pre-wrap;margin-top:10rpx}.privacy{font-size:22rpx;color:#8793a3;margin-top:14rpx}.empty{padding:28rpx;color:#718097;font-size:26rpx;line-height:1.6}.explore{margin-top:28rpx;background:#e9eefc;padding:24rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:space-between;gap:12rpx;color:#2849e9;font-size:23rpx;font-weight:700}.explore-title{color:#243051}.explore-text{margin-top:4rpx;font-size:23rpx}

/* #endif */
</style>
