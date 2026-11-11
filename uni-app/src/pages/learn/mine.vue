<template>
  <view class="mine" :style="{paddingTop: top + 'px'}">
    <view class="head"><view class="brand-mark">↗</view><text>AINPE实战情报站</text></view>
    <view class="content">
      <view class="title">我的</view>
      <view class="intro">学习记录保存在当前设备</view>
      <view class="section-title">继续学习</view>
      <view v-if="recent.length" class="list">
        <view v-for="item in recent" :key="item.id" class="row" @tap="openResume(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="meta">已完成 {{item.done}} / {{item.total}} 步</text><text class="action">继续学习 →</text></view>
        </view>
      </view>
      <view v-else class="empty"><text class="empty-title">从一件小事开始</text><text class="empty-text">完成的步骤会记录在这里，方便下次接着做。</text><button class="primary" @tap="openGuides">看看有哪些教程</button></view>
      <view class="section-title">我的收藏</view>
      <view v-if="favorites.length" class="list">
        <view v-for="item in favorites" :key="item.id" class="row" @tap="open(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="action">查看教程 →</text></view>
        </view>
      </view>
      <view v-else class="empty"><text class="empty-title">还没有收藏教程</text><text class="empty-text">看到想以后再做的内容，可以在教程里收藏。</text></view>
      <view class="section-title">帮助与反馈</view>
      <view class="list"><view class="row feedback-row" @tap="openFeedback"><view class="copy"><text class="name">意见反馈</text><text class="meta">告诉我们哪些地方需要改进</text></view><text class="action">前往 →</text></view></view>
      <view class="notice">记录和收藏保存在当前设备，不会自动与网站同步。</view>
    </view>
    <MiniNav active="saved" />
  </view>
</template>
<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
const recent=ref([]),favorites=ref([]);
let top=0;try{top=Number((typeof wx!=='undefined'&&typeof wx.getWindowInfo==='function'?wx.getWindowInfo():uni.getSystemInfoSync()).statusBarHeight)||0}catch{}
function read(key,fallback){try{return uni.getStorageSync(key)||fallback}catch{return fallback}}
onShow(()=>{
  const progress=read('ainpe_mini_learning_v1',{}), saved=read('ainpe_mini_favorites_v1',[]);
  recent.value=guides.flatMap(g=>{const p=progress&&typeof progress==='object'?progress[g.id]:null;const total=(g.steps||[]).length;const done=Array.isArray(p?.completedSteps)?new Set(p.completedSteps.filter(i=>Number.isInteger(i)&&i>=0&&i<total)).size:0;return done?[{...g,done,total,updatedAt:p.updatedAt||''}]:[]}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  favorites.value=guides.filter(g=>Array.isArray(saved)&&saved.includes(g.id));
});
function open(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)})}
function openResume(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)+'&resume=1'})}
function openFeedback(){uni.navigateTo({url:'/pages/learn/find?feedback=1'})}
function openGuides(){uni.redirectTo({url:'/pages/learn/guides'})}
</script>
<style scoped>
.mine{min-height:100vh;box-sizing:border-box;background:#f3f4f6;color:#17202e;padding-bottom:calc(90px + env(safe-area-inset-bottom))}.head{height:48px;display:flex;align-items:center;gap:9px;padding:0 110px 0 16px;background:#fff;font-size:16px;font-weight:800}.brand-mark{width:30px;height:30px;border-radius:8px;background:#ffc83d;display:flex;align-items:center;justify-content:center;font-size:22px;color:#112d25}.content{padding:24px 16px}.title{font-size:27px;font-weight:800}.intro{font-size:13px;color:#758091;margin-top:5px}.section-title{font-size:19px;font-weight:800;margin:28px 0 12px}.list{background:#fff;border-radius:14px;overflow:hidden}.row{display:flex;gap:12px;padding:14px;border-bottom:1px solid #edf0f3}.row:last-child{border-bottom:0}.feedback-row{align-items:center}.cover{width:74px;height:74px;flex:none;border-radius:10px;background:#eef1f5}.copy{min-width:0;display:flex;flex-direction:column;gap:6px}.feedback-row .copy{flex:1}.name{font-weight:750;font-size:15px;line-height:1.4}.meta{color:#758091;font-size:12px}.action{color:#2849e9;font-size:13px;font-weight:700}.empty{background:#fff;border-radius:14px;padding:18px}.empty-title,.empty-text{display:block}.empty-title{font-size:15px;font-weight:750}.empty-text{font-size:13px;color:#758091;line-height:1.6;margin-top:6px}.primary{display:inline-block;margin:14px 0 0;background:#2849e9;color:#fff;font-size:13px;line-height:38px;padding:0 14px;border-radius:9px}.notice{color:#758091;font-size:12px;line-height:1.6;margin-top:24px}
</style>
