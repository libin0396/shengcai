<template>
  <view class="site-header" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="site-header-main">
      <view class="site-brand" role="link" tabindex="0" aria-label="返回首页" @tap="go('/pages/discover/index')" @keydown.enter.prevent="go('/pages/discover/index')" @keydown.space.prevent="go('/pages/discover/index')">
        <view class="site-brand-mark">↗</view>
        <view class="site-brand-name"><text class="site-brand-cn">AI 实战情报站</text><text class="site-brand-en">AINPE.</text></view>
      </view>
      <scroll-view scroll-x class="site-nav-scroll" :show-scrollbar="false" :scroll-into-view="active ? 'site-nav-'+active : ''" :scroll-with-animation="true">
        <view class="site-nav" aria-label="主导航">
          <button v-for="link in links" :id="'site-nav-'+link.key" :key="link.key" class="site-nav-item" role="link" tabindex="0" :class="{ 'is-current': isCurrent(link) }" :aria-current="isCurrent(link) ? 'page' : null" @tap="goLink(link)" @keydown.enter.prevent="goLink(link)" @keydown.space.prevent="goLink(link)">{{ link.label }}</button>
        </view>
      </scroll-view>
      <view class="site-actions">
        <button class="site-contact" @tap="contactOpen = true">联系站长</button>
        <!-- #ifdef H5 -->
        <button v-if="!hideCamp" :class="['site-camp',{'has-banner':hasBanner}]" @tap="go('/pages/camp/index?from=header')">了解生财</button>
        <!-- #endif -->
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
const links = [
  { key: 'discover', label: '首页', url: '/pages/discover/index' },
  { key: 'learn', label: '学', learn: 'index.html' },
  { key: 'intelligence', also: ['topic','events','simulate','article'], label: '情报', url: '/pages/intelligence/index' },
  { key: 'saved', label: '我的', url: '/pages/saved/index' },
];
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
</style>
