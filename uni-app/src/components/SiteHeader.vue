<template>
  <view class="site-header" :class="{'tutorial-nav': tutorialFirst}" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="site-header-main">
      <view class="site-brand" role="link" tabindex="0" aria-label="返回首页" @tap="go('/pages/discover/index')" @keydown.enter.prevent="go('/pages/discover/index')" @keydown.space.prevent="go('/pages/discover/index')">
        <view class="site-brand-mark">↗</view>
        <view class="site-brand-name"><text class="site-brand-cn">{{tutorialFirst ? 'AI 教程站' : 'AI 实战情报站'}}</text><text class="site-brand-en">AINPE.</text></view>
      </view>
      <scroll-view scroll-x class="site-nav-scroll" :show-scrollbar="false" :scroll-into-view="active ? 'site-nav-'+active : ''" :scroll-with-animation="true">
        <view class="site-nav" aria-label="主导航">
          <button v-for="link in links" :id="'site-nav-'+link.key" :key="link.key" class="site-nav-item" role="link" tabindex="0" :class="['n-'+link.key,{ 'is-current': isCurrent(link) }]" :aria-current="isCurrent(link) ? 'page' : null" @tap="goLink(link)" @keydown.enter.prevent="goLink(link)" @keydown.space.prevent="goLink(link)">{{ link.label }}</button>
        </view>
      </scroll-view>
      <view class="site-actions">
        <button v-if="!tutorialFirst" class="site-contact" @tap="contactOpen = true">联系站长</button>
        <!-- #ifdef H5 -->
        <button v-if="!hideCamp && !tutorialFirst" :class="['site-camp',{'has-banner':hasBanner}]" @tap="go('/pages/camp/index?from=header')">了解生财</button>
        <!-- #endif -->
      </view>
    </view>
    <view v-if="contactOpen && !tutorialFirst" class="site-contact-overlay" @tap="contactOpen = false">
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
import {tutorialFirst} from '../site-mode.js';
import {track} from '../data/track.js';
import {openLearn} from '../data/game-matching.js';
import { ref, onMounted, onUnmounted } from 'vue';
const props = defineProps({ active: { type: String, default: '' }, hideCamp: { type: Boolean, default: false }, hasBanner: { type: Boolean, default: false } });
const contactOpen = ref(false);
// #ifdef H5
function escapeContact(e){if(e.key==='Escape') contactOpen.value=false}
onMounted(()=>window.addEventListener('keydown',escapeContact));
onUnmounted(()=>window.removeEventListener('keydown',escapeContact));
// #endif
let statusBarHeight = 0;
// #ifdef MP-WEIXIN
try { statusBarHeight = Number(uni.getSystemInfoSync().statusBarHeight) || 0; } catch {}
// #endif
// 网页顶栏按这个顺序；手机底部只放 5 个（真人案例收进首页），「找用法」放中间并突出
const originalLinks = [
  { key: 'discover', label: '首页', url: '/pages/discover/index' },
  { key: 'library', label: '用法库', learn: 'jijiu.html' },
  { key: 'learn', label: tutorialFirst ? '教程' : '跟着做', learn: tutorialFirst ? 'guides.html' : 'index.html' },
  { key: 'intelligence', also: ['topic','events','simulate','article'], label: '真人案例', url: '/pages/intelligence/index' },
  { key: 'find', label: '找用法', learn: 'find.html' },
  { key: 'saved', label: '我的', url: '/pages/saved/index' },
];
const links = tutorialFirst ? [
  { key: 'discover', label: '首页', url: '/pages/discover/index' },
  { key: 'learn', label: '跟着做', learn: 'guides.html' },
  { key: 'find', label: '搜索', learn: 'find.html' },
  { key: 'library', label: '快捷提示词', learn: 'jijiu.html' },
  { key: 'saved', label: '我的', url: '/pages/saved/index' },
] : originalLinks;
function isCurrent(link) { return props.active === link.key || (link.also || []).includes(props.active); }
function goLink(link) { if (link.learn) { if (!openLearn(link.learn)) go('/pages/discover/index'); } else go(link.url); }
function go(url) { uni.navigateTo({ url, fail: () => uni.redirectTo({ url }) }); }
function copyWechat() { uni.setClipboardData({ data: 'Yandati4', success:()=>track('contact_copy',{from:'header'}) }); }
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
.site-camp { padding:0 15px; margin:0; line-height:34px; height:34px; background:transparent; border:1px solid #93b4a0; border-radius:20px; color:#eef5e5; font-weight:700; font-size:12px; }
.site-camp.played { background:#f35b26; border-color:#f35b26; color:#fff; }
.site-nav-scroll { flex:1; min-width:0; white-space:nowrap; }
.site-nav { display:flex; align-items:center; gap:23px; width:max-content; min-width:100%; }
.site-nav-item { margin:0; padding:22px 0 19px; border:0; border-bottom:3px solid transparent; border-radius:0; background:transparent; line-height:20px; font-size:13px; font-weight:600; color:#b4c9bb; }
.site-nav-item::after { border:0; }
.site-nav-item.is-current { border-bottom-color:#ffcd55; color:#fff; }
.site-nav-item:focus-visible { outline:2px solid #ffcd55; outline-offset:-2px; }
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
@media(max-width:480px) { .site-nav { width:100%; gap:8px; justify-content:space-between; } .site-nav-item { flex-shrink:0; white-space:nowrap; font-size:12px; } }
@media(max-width:360px) { .site-header-main { padding-left:12px; padding-right:12px; gap:4px; } .site-brand { gap:6px; } .site-brand-mark { width:30px; height:30px; font-size:20px; } .site-brand-cn { font-size:13px; } .site-actions { gap:4px; } .site-contact { padding:0 2px; font-size:10px; } .site-camp { padding:0 9px; font-size:11px; } }
@media(max-width:700px) { .site-header-main{padding:9px 16px;min-height:54px;flex-wrap:nowrap}.site-nav-scroll{position:fixed;z-index:95;left:0;right:0;bottom:0;width:100%;background:#082d20;box-shadow:0 -4px 16px #0002;padding:0 8px env(safe-area-inset-bottom);overflow:hidden}.site-nav{display:flex;width:100%;min-width:100%;gap:0;justify-content:space-between}.site-nav-item{flex:1;min-width:0;min-height:52px;padding:8px 2px;border-bottom:0;border-top:3px solid transparent;line-height:20px;text-align:center;font-size:12px}.site-nav-item.is-current{border-top-color:#ffcd55;border-bottom-color:transparent}.site-contact{font-size:11px} }
/* A+：白底顶栏，蓝色表示当前位置 */
.site-header{background:#fff;color:#161A23;border-bottom:1px solid #E6E8EC}
.site-brand-cn{color:#161A23}.site-brand-en{color:#9AA0AC}
.site-contact{color:#5F6675}
.site-camp{border-color:#D5D8DE;color:#161A23}
.site-nav-item{color:#9AA0AC}
.site-nav-item.is-current{border-bottom-color:#2B44E6;color:#2B44E6}
.site-nav-item:focus-visible{outline-color:#2B44E6}
@media(max-width:700px){.site-header{border-bottom:0}.site-nav-scroll{background:#fff;box-shadow:none;border-top:1px solid #E6E8EC}.site-nav-item{color:#9AA0AC}.site-nav-item.is-current{border-top-color:#2B44E6;color:#2B44E6;font-weight:800}}
/* 首页最上面已经有生财横幅，手机上不再重复显示顶栏按钮 */
@media(max-width:700px){.site-camp.has-banner{display:none}}
/* V49 导航：网页上「找用法」是一个浅蓝按钮；手机底部 5 个入口，「找用法」在中间凸起 */
.site-nav-item.n-find{padding:0 14px;margin:15px 0;height:36px;line-height:36px;border:0;border-radius:12px;background:#ECEFFE;color:#2B44E6;font-weight:800}
.site-nav-item.n-find.is-current{border:0}
@media(max-width:700px){
  .site-nav-item.n-intelligence{display:none}
  .site-nav-item.n-discover{order:1}.site-nav-item.n-library{order:2}.site-nav-item.n-find{order:3}.site-nav-item.n-learn{order:4}.site-nav-item.n-saved{order:5}
  .site-nav-item.n-find{flex:1;margin:0;height:auto;min-height:52px;padding:8px 2px;line-height:20px;background:transparent;border-radius:0;border-top:3px solid transparent;color:#2B44E6;position:relative;padding-top:30px}
  .site-nav-item.n-find::before{content:'';position:absolute;left:50%;top:2px;width:25px;height:25px;margin-left:-12.5px;border-radius:50%;background:#2B44E6 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-4-4'/%3E%3C/svg%3E") center/15px no-repeat}
  .site-nav-scroll{overflow:visible}
}
/* 手机端图标与文字一起提供清楚的导航线索。 */
@media(max-width:700px){
  .site-nav-item:not(.n-find){position:relative;min-height:58px;padding:31px 2px 6px;line-height:18px;border-top:0;font-weight:600}
  .site-nav-item:not(.n-find).is-current{border-top:0;color:#2b44e6}
  .site-nav-item:not(.n-find)::before{content:'';position:absolute;left:50%;top:7px;width:21px;height:21px;margin-left:-10.5px;background-position:center;background-size:21px;background-repeat:no-repeat;opacity:.72}
  .site-nav-item:not(.n-find).is-current::before{opacity:1;filter:invert(20%) sepia(90%) saturate(4451%) hue-rotate(231deg) brightness(94%)}
  .site-nav-item.n-discover::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23778292' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 10.4 12 3l9 7.4V21h-6.2v-6.2H9.2V21H3z'/%3E%3C/svg%3E")}
  .site-nav-item.n-library::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23778292' stroke-width='1.8' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='7' height='7' rx='1.3'/%3E%3Crect x='14' y='3' width='7' height='7' rx='1.3'/%3E%3Crect x='3' y='14' width='7' height='7' rx='1.3'/%3E%3Crect x='14' y='14' width='7' height='7' rx='1.3'/%3E%3C/svg%3E")}
  .site-nav-item.n-learn::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23778292' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 20h5v-5h5v-5h5V5h3'/%3E%3C/svg%3E")}
  .site-nav-item.n-saved::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23778292' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.2'/%3E%3Cpath d='M5 20v-1.2c0-3.4 3.2-5.5 7-5.5s7 2.1 7 5.5V20'/%3E%3C/svg%3E")}
  .site-nav-item.n-find{min-height:58px;padding-top:31px}
  .site-nav-item.n-find::before{top:3px;width:26px;height:26px;margin-left:-13px;background-size:16px}
}
/* 教程站：把分步动手放到前面，搜索仍保留独立入口。 */
@media(min-width:701px){
  .tutorial-nav .site-nav-item.n-find{padding:22px 0 19px;margin:0;height:auto;line-height:20px;border-bottom:3px solid transparent;border-radius:0;background:transparent;color:#9AA0AC;font-weight:600}
  .tutorial-nav .site-nav-item.n-find.is-current{border-bottom-color:#2B44E6;color:#2B44E6}
}
@media(max-width:700px){
  .tutorial-nav .site-nav-item.n-discover{order:1}
  .tutorial-nav .site-nav-item.n-learn{order:2;color:#5369a8;font-weight:800}
  .tutorial-nav .site-nav-item.n-find{order:3;color:#778292;font-weight:600}
  .tutorial-nav .site-nav-item.n-library{order:4}
  .tutorial-nav .site-nav-item.n-saved{order:5}
  .tutorial-nav .site-nav-item.n-learn::before{opacity:1;filter:invert(20%) sepia(90%) saturate(4451%) hue-rotate(231deg) brightness(94%)}
  .tutorial-nav .site-nav-item.n-learn.is-current{color:#2B44E6}
  .tutorial-nav .site-nav-item.n-find::before{top:7px;width:21px;height:21px;margin-left:-10.5px;border-radius:0;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23778292' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-4-4'/%3E%3C/svg%3E") center/21px no-repeat}
  .tutorial-nav .site-nav-item.n-find.is-current{color:#2B44E6;font-weight:800}
  .tutorial-nav .site-nav-item.n-find.is-current::before{filter:invert(20%) sepia(90%) saturate(4451%) hue-rotate(231deg) brightness(94%)}
}
</style>
