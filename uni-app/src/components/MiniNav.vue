<template>
  <view class="mini-nav" role="navigation" aria-label="主要导航">
    <view v-for="item in items" :key="item.key" class="mini-nav-item" :class="{'is-active': active === item.key}" role="link" :aria-label="item.label" @tap="go(item)">
      <text class="mini-nav-icon" aria-hidden="true">{{item.icon}}</text>
      <text class="mini-nav-label">{{item.label}}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({ active: { type: String, default: 'home' } });
const items = [
  { key: 'home', label: '首页', icon: '⌂', url: '/pages/discover/index' },
  { key: 'learn', label: '跟着做', icon: '▤', url: '/pages/learn/guides' },
  { key: 'find', label: '搜索', icon: '⌕', url: '/pages/learn/find' },
  { key: 'library', label: '快捷提示词', icon: '✧', url: '/pages/learn/library' },
  { key: 'saved', label: '我的', icon: '♙', url: '/pages/learn/mine' },
];
function go(item) {
  const pages = getCurrentPages();
  const route = pages.length ? '/' + pages[pages.length - 1].route : '';
  if (route === item.url) return;
  // These are peer sections. Replacing the current tab keeps the page stack small.
  uni.redirectTo({url:item.url, fail:()=>uni.navigateTo({url:item.url})});
}
</script>

<style scoped>
.mini-nav{position:fixed;z-index:100;left:0;right:0;bottom:0;display:flex;align-items:stretch;min-height:56px;padding-bottom:env(safe-area-inset-bottom);background:#fff;border-top:1px solid #e6e8ec;box-shadow:0 -3px 12px rgba(31,42,66,.04)}
.mini-nav-item{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:56px;color:#7f8a9b}
.mini-nav-item.is-active{color:#2849e9;font-weight:700}
.mini-nav-icon{height:24px;line-height:24px;font-size:23px}
.mini-nav-label{font-size:10px;line-height:16px;white-space:nowrap}
</style>
