<template>
  <view class="page">
    <view class="intro">
      <view class="eyebrow">AI 实用教程</view>
      <view class="title">选一件事，跟着做出来。</view>
      <view class="description">从生活和工作的小事开始，每篇都有步骤和提示词。</view>
    </view>
    <view class="section">
      <view class="heading">挑一个你想做的</view>
      <scroll-view class="filters" scroll-x :show-scrollbar="false">
        <view class="filter-row"><view v-for="filter in filters" :key="filter" class="filter" :class="{'selected': active === filter}" @tap="active = filter">{{ filter }}</view></view>
      </scroll-view>
      <view v-if="filtered.length" class="cards">
        <view v-for="guide in filtered" :key="guide.id" class="card" role="link" @tap="openGuide(guide.id)">
          <view class="cover-wrap"><image class="cover" :src="guide.cover" mode="aspectFill" :alt="guide.coverAlt" lazy-load/><text class="cover-label">{{guide.coverLabel}}</text></view>
          <view class="card-text"><text class="badge">{{guide.category}} · {{guide.badge}}</text><view class="card-title">{{guide.title}}</view><view class="card-intro">{{guide.intro}}</view><view class="action">查看步骤 →</view></view>
        </view>
      </view>
      <view v-else class="empty">这个分类暂时没有内容，看看其他方向吧。</view>
    </view>
    <view class="bottom-note">教程中提到的 AI 工具可能有额度或费用限制，以工具内说明为准。</view>
    <MiniNav active="learn"/>
  </view>
</template>
<script setup>
import {computed,ref} from 'vue';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
const active=ref('全部');
const filters=['全部','工作','学习','内容创作'];
function group(g){if(g.id==='meeting-notes')return '工作';if(g.id==='kejian'||g.id==='huiben')return '学习';return '内容创作'}
const filtered=computed(()=>active.value==='全部'?guides:guides.filter(g=>group(g)===active.value));
function openGuide(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)})}
</script>
<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:26px 16px calc(84px + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}
.intro{padding:4px 2px 18px}.eyebrow{font-size:12px;font-weight:700;color:#3758d3}.title{font-size:26px;line-height:1.35;font-weight:800;margin-top:10px}.description{font-size:14px;line-height:1.7;color:#637287;margin-top:8px}
.section{padding-top:10px}.heading{font-size:20px;font-weight:800}.filters{width:100%;margin:14px 0}.filter-row{display:flex;gap:8px;white-space:nowrap}.filter{display:inline-flex;align-items:center;justify-content:center;padding:8px 15px;border-radius:18px;background:#fff;border:1px solid #e5e8ee;font-size:13px;color:#5f6d80}.filter.selected{background:#294be8;border-color:#294be8;color:#fff;font-weight:700}
.cards{display:flex;flex-direction:column;gap:12px}.card{display:flex;align-items:flex-start;gap:13px;padding:14px;background:#fff;border:1px solid #e7eaf0;border-radius:14px}.cover-wrap{flex:0 0 96px;position:relative;width:96px;height:106px;border-radius:10px;overflow:hidden;background:#edf0f5}.cover{width:100%;height:100%}.cover-label{position:absolute;left:4px;bottom:4px;padding:2px 4px;border-radius:4px;background:rgba(20,29,39,.7);color:#fff;font-size:9px}.card-text{flex:1;min-width:0}.badge{display:inline-block;padding:3px 6px;background:#eef2ff;border-radius:5px;font-size:10px;font-weight:700;color:#3b55c4}.card-title{font-size:16px;font-weight:800;line-height:1.35;margin-top:7px}.card-intro{font-size:12px;line-height:1.5;color:#718096;margin-top:5px}.action{font-size:13px;font-weight:700;color:#2849e9;margin-top:8px}.empty{padding:22px;background:#fff;border-radius:12px;color:#718096;font-size:14px}.bottom-note{padding:20px 3px;color:#7d8998;font-size:12px;line-height:1.6}
</style>
