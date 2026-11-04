<template>
  <view class="site-header" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="site-header-main">
      <view class="site-brand" @tap="go('/pages/discover/index')">
        <view class="site-brand-mark">↗</view>
        <view class="site-brand-name"><text class="site-brand-cn">AI 实战情报站</text><text class="site-brand-en">AINPE.</text></view>
      </view>
      <scroll-view scroll-x class="site-nav-scroll" :show-scrollbar="false">
        <view class="site-nav" aria-label="主导航">
          <view v-for="link in links" :key="link.key" class="site-nav-item" :class="{ 'is-current': active === link.key }" @tap="go(link.url)">{{ link.label }}</view>
        </view>
      </scroll-view>
      <view class="site-actions">
        <button class="site-contact" @tap="contactOpen = true">联系站长</button>
        <button class="site-camp" @tap="go('/pages/camp/index')">三天体验营</button>
      </view>
    </view>
    <view v-if="contactOpen" class="site-contact-overlay" @tap="contactOpen = false">
      <view class="site-contact-modal" @tap.stop>
        <view class="site-contact-head"><text>联系站长</text><button aria-label="关闭" @tap="contactOpen = false">×</button></view>
        <text class="site-contact-description">对内容或体验营有疑问，可以添加站长微信咨询。</text>
        <image class="site-contact-qr" src="/static/assets/wechat-contact.jpg" mode="aspectFit" />
        <view class="site-contact-copy"><text>微信号：Yandati4</text><button @tap="copyWechat">复制微信号</button></view>
        <text class="site-contact-note">这是站长个人微信，与体验营入口分别使用。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ active: { type: String, default: '' } });
const contactOpen = ref(false);
let statusBarHeight = 0;
// #ifdef MP-WEIXIN
try { statusBarHeight = Number(uni.getSystemInfoSync().statusBarHeight) || 0; } catch {}
// #endif
const links = [
  { key: 'discover', label: '发现', url: '/pages/discover/index' },
  { key: 'intelligence', label: 'AI 情报', url: '/pages/discover/index?section=intelligence' },
  { key: 'fde', label: 'FDE 专题', url: '/pages/topic/index?slug=fde' },
  { key: 'ai-cases', label: 'AI 实战案例', url: '/pages/topic/index?slug=ai-cases' },
  { key: 'events', label: '线下活动', url: '/pages/events/index' },
  { key: 'simulate', label: '模拟项目', url: '/pages/simulate/index' },
  { key: 'saved', label: '我的收藏', url: '/pages/saved/index' },
];
function go(url) { uni.navigateTo({ url, fail: () => uni.redirectTo({ url }) }); }
function copyWechat() { uni.setClipboardData({ data: 'Yandati4' }); }
</script>

<style scoped>
.site-header { background:#082d20; color:#eef5e5; }
.site-header-main { max-width:1240px; min-height:64px; padding:0 24px; margin:auto; display:flex; align-items:center; gap:24px; }
.site-brand { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.site-brand-mark { display:flex; align-items:center; justify-content:center; width:35px; height:35px; border-radius:7px; background:#ffcc56; color:#133426; font-size:24px; font-weight:700; }
.site-brand-name { display:flex; align-items:baseline; gap:8px; }
.site-brand-cn { font-size:17px; font-weight:700; color:#f7faf2; }
.site-brand-en { font-size:10px; font-weight:700; letter-spacing:.04em; color:#a9c096; }
.site-actions { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.site-contact { padding:0 6px; margin:0; min-width:0; line-height:34px; height:34px; font-size:12px; background:transparent; color:#cfddd0; }
.site-camp { padding:0 15px; margin:0; line-height:34px; height:34px; background:#f35b26; border-radius:20px; color:#fff; font-weight:700; font-size:12px; }
.site-nav-scroll { flex:1; min-width:0; white-space:nowrap; }
.site-nav { display:flex; align-items:center; gap:23px; width:max-content; min-width:100%; }
.site-nav-item { padding:22px 0 19px; border-bottom:3px solid transparent; font-size:13px; font-weight:600; color:#b4c9bb; }
.site-nav-item.is-current { border-bottom-color:#ffcd55; color:#fff; }
.site-contact-overlay { position:fixed; z-index:9999; inset:0; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(4,19,12,.64); }
.site-contact-modal { width:100%; max-width:390px; max-height:90vh; overflow:auto; padding:20px; border-radius:8px; background:#fff; color:#19382c; }
.site-contact-head { display:flex; justify-content:space-between; align-items:center; font-size:18px; font-weight:700; }
.site-contact-head button { margin:0; padding:0; background:transparent; line-height:28px; height:28px; font-size:25px; color:#46614e; }
.site-contact-description,.site-contact-note { display:block; font-size:12px; line-height:1.7; color:#718477; margin-top:10px; }
.site-contact-qr { display:block; width:100%; height:250px; margin:8px 0; }
.site-contact-copy { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:13px; }
.site-contact-copy button { margin:0; padding:0 10px; font-size:12px; line-height:32px; background:#ebf3e7; color:#315e3b; }
/* #ifdef MP-WEIXIN */
.site-header-main { padding-right:105px; }
.site-contact { font-size:10px; padding:0 6px; }
/* #endif */
@media(max-width:900px) { .site-header-main { padding:10px 16px 0; gap:8px; flex-wrap:wrap; justify-content:space-between; } .site-brand-cn { font-size:15px; } .site-brand-en { display:none; } .site-actions { margin-left:auto; } .site-nav-scroll { flex:0 0 100%; order:3; } .site-nav { gap:23px; } .site-nav-item { padding:12px 0 10px; } .site-contact { font-size:11px; } }
</style>
