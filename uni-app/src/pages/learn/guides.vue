<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="page">
    <view class="intro">
      <view class="eyebrow">AI 实用教程</view>
      <view class="title">选一件事，跟着做出来。</view>
      <view class="description">从生活和工作的小事开始，每篇都有步骤和提示词。</view>
    </view>
    <view class="section">
      <view class="heading">{{completeOnly ? '挑一个完整教程' : '挑一个你想做的'}}</view>
      <scroll-view class="filters" scroll-x :show-scrollbar="false">
        <view class="filter-row"><view v-for="filter in levels" :key="filter" class="filter" :class="{'selected': level === filter}" @tap="level = filter">{{ filter }}</view></view>
      </scroll-view>
      <scroll-view class="filters category-filters" scroll-x :show-scrollbar="false">
        <view class="filter-row"><view v-for="filter in filters" :key="filter" class="filter" :class="{'selected': active === filter}" @tap="active = filter">{{ filter }}</view></view>
      </scroll-view>
      <view v-if="filtered.length" class="cards">
        <view v-for="guide in filtered" :key="guide.id" class="card" :class="{'future':guide.kind==='future'}" @tap="openGuide(guide)">
          <view class="cover-wrap"><image class="cover" :src="guide.cover" mode="aspectFill" :alt="guide.coverAlt" lazy-load/><text class="cover-label">{{guide.coverLabel}}</text></view>
          <view class="card-text"><text class="badge">{{guide.level}} · {{guide.group}}</text><view class="card-title">{{guide.title}}</view><view class="card-intro">{{guide.intro}}</view><view class="action" :class="{'muted':guide.kind==='future'}">{{guide.kind==='future'?'筹备中':'查看步骤 →'}}</view></view>
        </view>
      </view>
      <view v-else class="empty">这个等级和分类下暂时没有内容，试试其他筛选。</view>
    </view>
    <view class="bottom-note">教程中提到的 AI 工具可能有额度或费用限制，以工具内说明为准。</view>
    <MiniNav active="learn"/>
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="page">
    <view class="intro">
      <view class="eyebrow">AI 实用教程</view>
      <view class="title">选一件事，跟着做出来。</view>
      <view class="description">从生活和工作的小事开始，每篇都有步骤和提示词。</view>
    </view>
    <view class="section">
      <view class="heading">挑一个你想做的</view>
      <scroll-view class="filters" scroll-x :show-scrollbar="false">
        <view class="filter-row"><view v-for="filter in levels" :key="filter" class="filter" :class="{'selected': level === filter}" @tap="level = filter">{{ filter }}</view></view>
      </scroll-view>
      <scroll-view class="filters category-filters" scroll-x :show-scrollbar="false">
        <view class="filter-row"><view v-for="filter in filters" :key="filter" class="filter" :class="{'selected': active === filter}" @tap="active = filter">{{ filter }}</view></view>
      </scroll-view>
      <view v-if="filtered.length" class="cards">
        <view v-for="guide in filtered" :key="guide.id" class="card" :class="{'future':guide.kind==='future'}" @tap="openGuide(guide)">
          <view class="cover-wrap"><image class="cover" :src="guide.cover" mode="aspectFill" :alt="guide.coverAlt" lazy-load/><text class="cover-label">{{guide.coverLabel}}</text></view>
          <view class="card-text"><text class="badge">{{guide.level}} · {{guide.group}}</text><view class="card-title">{{guide.title}}</view><view class="card-intro">{{guide.intro}}</view><view class="action" :class="{'muted':guide.kind==='future'}">{{guide.kind==='future'?'筹备中':guide.kind==='aid'?'看看怎么用 →':'查看步骤 →'}}</view></view>
        </view>
      </view>
      <view v-else class="empty">这个等级和分类下暂时没有内容，试试其他筛选。</view>
    </view>
    <view class="bottom-note">教程中提到的 AI 工具可能有额度或费用限制，以工具内说明为准。</view>
    <MiniNav active="learn"/>
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

import {computed,ref} from 'vue';
import {onLoad} from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
const completeOnly=ref(false);
onLoad(options=>{completeOnly.value=String(options?.complete||'')==='1'});
const active=ref('全部');
const level=ref('全部等级');
const levels=['全部等级','简单','一般','困难','超级挑战'];
const filters=['全部','生活','工作','学习','内容创作'];
function group(g){if(g.id==='meeting-notes')return '工作';if(g.id==='kejian'||g.id==='huiben')return '学习';return '内容创作'}
const cards=[
  ...guides.map(g=>({...g,kind:'guide',group:group(g)})),
  {id:'assistant',kind:'future',level:'超级挑战',group:'工作',title:'做一个自己的 AI 助手',intro:'设定任务、反复调整，做出可复用的助手。',cover:'https://ainpe.aisen.xin/static/design/ai-assistant-illustration.jpg',coverAlt:'AI 助手的示意图',coverLabel:'配图示意'}
];
const filtered=computed(()=>cards.filter(g=>(!completeOnly.value||g.kind==='guide')&&(level.value==='全部等级'||g.level===level.value)&&(active.value==='全部'||g.group===active.value)));
function openGuide(guide){if(guide.kind==='future')return;uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(guide.id)})}

// #endif
// #ifndef MP-WEIXIN

import {computed,ref} from 'vue';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
const active=ref('全部');
const level=ref('全部等级');
const levels=['全部等级','简单','一般','困难','超级挑战'];
const filters=['全部','生活','工作','学习','内容创作'];
function group(g){if(g.id==='meeting-notes')return '工作';if(g.id==='kejian'||g.id==='huiben')return '学习';return '内容创作'}
const cards=[
  {id:'reply',kind:'aid',level:'简单',group:'生活',title:'写一条不好开口的消息',intro:'告诉 AI 你的情况，试着写一条合适的消息。',cover:'https://ainpe.aisen.xin/static/design/write-message-illustration.jpg',coverAlt:'手机上写消息的示意图',coverLabel:'配图示意'},
  {id:'homework',kind:'aid',level:'一般',group:'学习',title:'陪孩子讲懂一道题',intro:'补充孩子的情况，让 AI 帮你理清讲题思路。',cover:'https://ainpe.aisen.xin/static/design/kids.jpg',coverAlt:'陪孩子学习的示意图',coverLabel:'配图示意'},
  ...guides.map(g=>({...g,kind:'guide',group:group(g)})),
  {id:'assistant',kind:'future',level:'超级挑战',group:'工作',title:'做一个自己的 AI 助手',intro:'设定任务、反复调整，做出可复用的助手。',cover:'https://ainpe.aisen.xin/static/design/ai-assistant-illustration.jpg',coverAlt:'AI 助手的示意图',coverLabel:'配图示意'}
];
const filtered=computed(()=>cards.filter(g=>(level.value==='全部等级'||g.level===level.value)&&(active.value==='全部'||g.group===active.value)));
function openGuide(guide){if(guide.kind==='future')return;const page=guide.kind==='aid'?'library':'guide';uni.navigateTo({url:'/pages/learn/'+page+'?id='+encodeURIComponent(guide.id)})}

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:26px 16px calc(76px + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}
.intro{padding:4px 2px 18px}.eyebrow{font-size:12px;font-weight:700;color:#3758d3}.title{font-size:26px;line-height:1.35;font-weight:800;margin-top:10px}.description{font-size:14px;line-height:1.7;color:#637287;margin-top:8px}
.section{padding-top:10px}.heading{font-size:20px;font-weight:800}.filters{width:100%;margin:14px 0}.filter-row{display:flex;gap:8px;white-space:nowrap}.filter{display:inline-flex;align-items:center;justify-content:center;padding:8px 15px;border-radius:18px;background:#fff;border:1px solid #e5e8ee;font-size:13px;color:#5f6d80}.filter.selected{background:#294be8;border-color:#294be8;color:#fff;font-weight:700}
.category-filters{margin-top:0}.cards{display:flex;flex-direction:column;gap:9px}.card{display:flex;align-items:flex-start;gap:11px;padding:11px;background:#fff;border:1px solid #e7eaf0;border-radius:14px}.cover-wrap{flex:0 0 78px;position:relative;width:78px;height:78px;border-radius:10px;overflow:hidden;background:#edf0f5}.cover{width:100%;height:100%}.cover-label{position:absolute;left:3px;bottom:3px;padding:2px 3px;border-radius:4px;background:rgba(20,29,39,.7);color:#fff;font-size:9px}.card-text{flex:1;min-width:0}.badge{display:inline-block;padding:3px 6px;background:#eef2ff;border-radius:5px;font-size:10px;font-weight:700;color:#3b55c4}.card-title{font-size:15px;font-weight:800;line-height:1.35;margin-top:5px}.card-intro{font-size:12px;line-height:1.45;color:#718096;margin-top:4px}.action{font-size:12px;font-weight:700;color:#2849e9;margin-top:6px}.action.muted{color:#8793a3}.empty{padding:22px;background:#fff;border-radius:12px;color:#718096;font-size:14px}.bottom-note{padding:20px 3px;color:#7d8998;font-size:12px;line-height:1.6}

/* #endif */
/* #ifndef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:26px 16px calc(84px + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}
.intro{padding:4px 2px 18px}.eyebrow{font-size:12px;font-weight:700;color:#3758d3}.title{font-size:26px;line-height:1.35;font-weight:800;margin-top:10px}.description{font-size:14px;line-height:1.7;color:#637287;margin-top:8px}
.section{padding-top:10px}.heading{font-size:20px;font-weight:800}.filters{width:100%;margin:14px 0}.filter-row{display:flex;gap:8px;white-space:nowrap}.filter{display:inline-flex;align-items:center;justify-content:center;padding:8px 15px;border-radius:18px;background:#fff;border:1px solid #e5e8ee;font-size:13px;color:#5f6d80}.filter.selected{background:#294be8;border-color:#294be8;color:#fff;font-weight:700}
.category-filters{margin-top:0}.cards{display:flex;flex-direction:column;gap:9px}.card{display:flex;align-items:flex-start;gap:11px;padding:11px;background:#fff;border:1px solid #e7eaf0;border-radius:14px}.cover-wrap{flex:0 0 78px;position:relative;width:78px;height:78px;border-radius:10px;overflow:hidden;background:#edf0f5}.cover{width:100%;height:100%}.cover-label{position:absolute;left:3px;bottom:3px;padding:2px 3px;border-radius:4px;background:rgba(20,29,39,.7);color:#fff;font-size:9px}.card-text{flex:1;min-width:0}.badge{display:inline-block;padding:3px 6px;background:#eef2ff;border-radius:5px;font-size:10px;font-weight:700;color:#3b55c4}.card-title{font-size:15px;font-weight:800;line-height:1.35;margin-top:5px}.card-intro{font-size:12px;line-height:1.45;color:#718096;margin-top:4px}.action{font-size:12px;font-weight:700;color:#2849e9;margin-top:6px}.action.muted{color:#8793a3}.empty{padding:22px;background:#fff;border-radius:12px;color:#718096;font-size:14px}.bottom-note{padding:20px 3px;color:#7d8998;font-size:12px;line-height:1.6}

/* #endif */
</style>
