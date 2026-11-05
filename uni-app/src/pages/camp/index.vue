<template>
  <view class="camp-page">
    <SiteHeader />
    <view class="hero">
      <view class="hero-inner">
        <text class="crumb" @tap="goBack">← 返回上页</text>
        <view class="hero-layout">
          <view class="hero-copy">
            <text class="eyebrow">AI 实战 · 从了解开始</text>
            <text class="title">AI 成万事<br /><text class="accent">3 天体验营</text></text>
            <text class="lead">从看懂 AI 机会，到亲手做出成果。</text>
            <text class="description">想更系统地了解 AI 实战？先看看体验营的介绍和参与方式。</text>
            <!-- #ifdef H5 -->
            <a class="primary-button hero-button hero-join" :href="campaign.targetUrl" target="_blank" rel="noopener noreferrer" @click="trackCampJoin">加入体验营企业微信 ↗</a>
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <button class="primary-button hero-button" @tap="showCampPoster">查看完整报名海报 <text>↗</text></button>
            <!-- #endif -->
            <text class="schedule">{{ campaign.scheduleLabel }}</text>
          </view>
          <view class="hero-side">
            <image class="hero-poster" :src="campaign.posterUrl" mode="widthFix" @tap="showCampPoster" />
            <text class="poster-caption">点击查看完整海报 · 微信扫码了解体验营</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content-wrap">
      <view v-if="played && played.project" class="played-note"><text>你刚体验了 {{played.project}}</text><text v-if="played.issues && played.issues.length">回顾：{{played.issues.slice(0,2).join('、')}}</text><text>下面可以了解体验营的内容，再决定是否参与。</text></view>
      <view class="main-grid">
        <view class="main-column">
          <view class="panel intro-panel">
            <text class="section-kicker">体验营介绍</text>
            <text class="section-title">3 天，迈出 AI 实战第一步</text>
            <text class="section-description">以下内容来自体验营海报，具体安排和参与方式以报名入口说明为准。</text>
            <view class="steps">
              <view v-for="(step, index) in steps" :key="step.title" class="step">
                <text class="step-number">0{{ index + 1 }}</text>
                <view class="step-copy"><text class="step-title">{{ step.title }}</text><text class="step-text">{{ step.description }}</text></view>
              </view>
            </view>
            <view class="benefits-head"><text class="section-title small-title">海报介绍</text><text class="section-description">实际内容以入口说明为准</text></view>
            <view class="benefits">
              <view v-for="benefit in benefits" :key="benefit.title" class="benefit"><text class="benefit-title">{{ benefit.title }}</text><text class="benefit-description">{{ benefit.description }}</text></view>
            </view>
          </view>
          <view class="panel faq-panel">
            <text class="section-kicker">参加前了解</text>
            <text class="section-title small-title">参加前，先了解这些</text>
            <view class="faq-item"><text class="faq-question">费用和下一期时间？</text><text class="faq-answer">以体验营入口的最新说明为准。海报上的日期不代表当前排期。</text></view>
            <view class="faq-item"><text class="faq-question">和线下活动是一回事吗？</text><text class="faq-answer">不是，线下活动有各自的时间和参与方式，请查看活动详情。</text></view>
            <view class="faq-item"><text class="faq-question">会保证赚钱吗？</text><text class="faq-answer">不会。体验营介绍和个人实际结果不同，不保证收入。</text></view>
            <view class="faq-item"><text class="faq-question">报名后有问题怎么办？</text><text class="faq-answer">可以添加站长微信交流，微信号 {{ contact.wechatId }}。</text></view>
          </view>
          <view v-if="source" class="panel source-panel">
            <text class="section-title small-title">查看资料来源</text>
            <text class="section-description">了解体验营后，可以继续查看生财原文；访问原文可能需要生财账号。</text>
            <!-- #ifdef H5 -->
            <a class="source-direct" :href="source" rel="noopener noreferrer">继续查看生财原文 ↗</a>
            <!-- #endif -->
            <button class="outline-button source-button" @tap="copySource">复制原文链接</button>
          </view>
        </view>

        <view class="side-column">
          <view class="panel join-panel">
            <text class="join-label">了解体验营</text>
            <text class="join-title">准备好动手试试？</text>
            <text class="join-description">打开企业微信了解参与方式，也可以查看完整海报并扫码。具体安排以入口说明为准。</text>
            <!-- #ifdef H5 -->
            <a class="join-link" :href="campaign.targetUrl" target="_blank" rel="noopener noreferrer" @click="trackCampJoin">打开企业微信了解 ↗</a>
            <view v-if="campQr" class="direct-qr"><img :src="campQr" alt="体验营报名二维码" /><text>微信扫码了解体验营</text></view>
            <button class="outline-button share-poster-button" :disabled="sharing" @tap="showSharePoster">{{sharing ? '正在生成海报…' : '生成分享海报'}}</button>
            <text v-if="shareError" class="share-error" role="status">{{shareError}}</text>
            <!-- #endif -->
            <image class="join-poster" :src="campaign.posterUrl" mode="widthFix" @tap="showCampPoster" />
            <button class="primary-button" @tap="showCampPoster">查看完整海报 <text>↗</text></button>
            <text class="join-hint">手机可长按海报识别二维码</text>
          </view>
          <view class="panel contact-panel">
            <view class="contact-header"><view class="contact-icon">站</view><view><text class="contact-title">有问题？联系站长</text><text class="contact-caption">报名或内容相关问题，欢迎交流</text></view></view>
            <image class="contact-qr" :src="contact.qrUrl" mode="widthFix" @tap="preview(contact.qrUrl)" />
            <view class="contact-row"><text class="contact-id">微信号 {{ contact.wechatId }}</text><button class="copy-button" @tap="copyId">复制</button></view>
          </view>
        </view>
      </view>
    </view>
    <view class="mobile-camp-bar"><view><text>AI 成万事 · 三天体验营</text><small>了解报名方式与最新安排</small></view>
      <!-- #ifdef H5 -->
      <a class="mobile-join" :href="campaign.targetUrl" target="_blank" rel="noopener noreferrer" @click="trackCampJoin">了解体验营</a>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <button @tap="showCampPoster">查看海报</button>
      <!-- #endif -->
    </view>
    <!-- #ifdef H5 -->
    <view v-if="shareOpen" class="share-overlay" @click="shareOpen=false">
      <view class="share-modal" role="dialog" aria-modal="true" aria-label="体验营分享海报" @click.stop>
        <view class="share-head"><text>体验营分享海报</text><button aria-label="关闭" @click="shareOpen=false">×</button></view>
        <text class="share-help">电脑可保存图片；手机可长按图片保存或识别二维码。</text>
        <img v-if="shareImage" :src="shareImage" alt="体验营分享海报，底部二维码用于了解体验营" class="share-preview" />
        <a v-if="shareImage" :href="shareImage" download="AINPE-体验营.png" class="join-link">保存分享海报</a>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import SiteHeader from '../../components/SiteHeader.vue';
import { campaign, contact } from '../../data/content.js';
import {track} from '../../data/track.js';
// #ifdef H5
import {makeCampQr,createCampSharePoster} from './camp-poster.js';
// #endif

const source = ref(''), played=ref(null), from=ref('direct');
const campQr=ref(''), shareOpen=ref(false), shareImage=ref(''), sharing=ref(false), shareError=ref('');
// #ifdef H5
function closeOnEscape(event){if(event.key==='Escape')shareOpen.value=false}
onMounted(()=>{try{campQr.value=makeCampQr(campaign.targetUrl).toDataURL('image/png')}catch{shareError.value='二维码暂时无法生成，请查看完整海报。'}window.addEventListener('keydown',closeOnEscape)});
onUnmounted(()=>window.removeEventListener('keydown',closeOnEscape));
async function showSharePoster(){if(sharing.value)return;sharing.value=true;shareError.value='';try{shareImage.value=await createCampSharePoster(campaign.targetUrl);shareOpen.value=true}catch{shareError.value='分享海报生成失败，请稍后重试。'}finally{sharing.value=false}}
// #endif
function playedState(){try{return !!uni.getStorageSync('ainpe:played')}catch{return false}}
function showCampPoster(){preview(campaign.posterUrl)}
function trackCampJoin(){track('camp_join_click',{page:'camp',from:from.value,played:playedState()})}
onShow(()=>{try{let p=uni.getStorageSync('ainpe:played');if(typeof p==='string')p=JSON.parse(p);played.value=p&&typeof p==='object'?p:null}catch{played.value=null}});
const steps = [
  { title: '看机会', description: '找到适合你的方向' },
  { title: '学路径', description: '了解从零启动的步骤' },
  { title: '有人带', description: '老师 + AI Agent 答疑' },
  { title: '出成果', description: '尝试亲手做出第一个成果' },
];
const benefits = [
  { title: '2 场', description: 'AI 实战直播大课' },
  { title: '3 天', description: '实战答疑群 + 生财 AI Agent' },
  { title: '1 张', description: '生财有术 3 天体验卡' },
];
onLoad((opts) => {const f=String(opts?.from||'direct');from.value=/^[a-z0-9_-]{1,40}$/.test(f)?f:'direct';track('camp_view',{page:'camp',from:from.value,played:playedState()});try { const u = decodeURIComponent(opts.source || ''); if (/^https:\/\/(?:www\.)?scys\.com\//i.test(u)) source.value = u; } catch {} });
function preview(url) { uni.previewImage({ current: url, urls: [url] }); }
function copyId() { uni.setClipboardData({ data: contact.wechatId }); }
function copySource() { if (source.value) uni.setClipboardData({ data: source.value }); }
function goBack() { uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/discover/index' }) }); }
</script>

<style scoped>
.camp-page { min-height:100vh; background:#f7f3eb; color:#102f22; }
.source-direct { display:inline-block; margin:16px 10px 0 0; padding:10px 16px; background:#f25a20; color:#fff; border-radius:6px; font-size:14px; font-weight:700; text-decoration:none; }
.hero { background:#0b3021; color:#fff; }
.hero-inner,.content-wrap { width:100%; max-width:1120px; padding-left:24px; padding-right:24px; margin:0 auto; box-sizing:border-box; }
.hero-inner { padding-top:25px; padding-bottom:50px; }
.crumb { display:block; color:#abc2ae; font-size:12px; cursor:pointer; }
.hero-layout { display:grid; grid-template-columns:1fr 260px; gap:45px; align-items:center; padding-top:34px; }
.hero-copy { max-width:640px; }
.eyebrow,.section-kicker { display:block; color:#e9ba48; font-size:11px; font-weight:700; letter-spacing:.1em; }
.title { display:block; margin:16px 0 15px; font-size:50px; line-height:1.18; font-weight:800; letter-spacing:-.025em; }
.accent { color:#f6d059; }
.lead { display:block; font-weight:700; color:#f4f6e9; font-size:19px; line-height:1.6; }
.description { display:block; color:#bfd0c1; font-size:14px; line-height:1.8; margin-top:10px; max-width:490px; }
.primary-button,.outline-button,.copy-button { box-sizing:border-box; border:0; margin:0; }
.primary-button { width:100%; height:48px; line-height:48px; border-radius:8px; background:#f25a20; color:white; font-size:14px; font-weight:700; }
.primary-button::after,.outline-button::after,.copy-button::after { border:0; }
.primary-button text { margin-left:12px; }
.hero-button { width:216px; margin-top:23px; }
.hero-join { display:inline-block; text-align:center; text-decoration:none; }
.mobile-join { display:inline-block; padding:0 16px; border-radius:8px; background:#f25a20; color:#fff; line-height:42px; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap; }
.schedule { display:block; color:#a3bcaa; font-size:11px; line-height:1.7; margin-top:12px; }
.hero-side { display:flex; align-items:center; flex-direction:column; }
.hero-poster { display:block; width:100%; max-width:215px; border:5px solid #fff; border-radius:8px; box-sizing:border-box; box-shadow:0 14px 34px #0003; }
.poster-caption { display:block; text-align:center; font-size:11px; color:#c1d0c1; margin-top:9px; }
.content-wrap { padding-top:28px; padding-bottom:55px; }
.main-grid { display:grid; grid-template-columns:minmax(0,1fr) 310px; gap:22px; align-items:start; }
.main-column,.side-column { display:flex; flex-direction:column; gap:18px; min-width:0; }
.panel { background:#fff; border:1px solid #e9e0d1; border-radius:12px; padding:27px; box-sizing:border-box; }
.section-kicker { color:#dd7f3f; font-size:10px; }
.section-title { display:block; font-size:23px; line-height:1.35; font-weight:750; margin-top:8px; }
.small-title { font-size:19px; }
.section-description { display:block; color:#8b978a; font-size:12px; line-height:1.7; margin-top:8px; }
.steps { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px; }
.step { display:flex; align-items:center; gap:12px; padding:13px; border-radius:8px; background:#f7f3eb; min-width:0; }
.step-number { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:34px; height:34px; background:#f25a20; color:#fff; border-radius:50%; font-weight:800; font-size:13px; }
.step-copy { min-width:0; }
.step-title,.step-text { display:block; }
.step-title { font-size:14px; font-weight:700; }
.step-text { color:#8a9889; font-size:11px; line-height:1.5; margin-top:3px; }
.benefits-head { margin-top:27px; }
.benefits { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:15px; }
.benefit { min-height:89px; padding:15px; border-radius:8px; background:#e7f2e9; box-sizing:border-box; }
.benefit-title,.benefit-description { display:block; }
.benefit-title { color:#17613e; font-size:24px; font-weight:800; }
.benefit-description { color:#647c6c; font-size:11px; line-height:1.6; margin-top:5px; }
.faq-item { border-top:1px solid #eee9e0; margin-top:15px; padding-top:15px; }
.faq-question,.faq-answer { display:block; }
.faq-question { font-size:13px; font-weight:700; }
.faq-answer { color:#859288; font-size:12px; line-height:1.7; margin-top:5px; }
.join-label { display:inline-block; padding:5px 9px; border-radius:5px; color:#cb4a1c; background:#fff0e7; font-size:11px; font-weight:700; }
.join-title { display:block; font-size:20px; font-weight:750; margin-top:14px; }
.join-description { display:block; color:#788b7b; font-size:12px; line-height:1.7; margin-top:7px; }
.join-poster { display:block; width:100%; max-width:170px; margin:16px auto; border-radius:5px; }
.join-link { display:block; box-sizing:border-box; text-align:center; margin-top:14px; padding:12px; border-radius:6px; background:#ee5a24; color:white; font-size:14px; font-weight:750; text-decoration:none; }
.direct-qr {display:flex;flex-direction:column;align-items:center;gap:6px;margin:16px 0;color:#627766;font-size:12px}.direct-qr img{display:block;width:180px;height:180px;max-width:100%;object-fit:contain;image-rendering:pixelated;background:#fff}
.share-poster-button {width:100%;height:43px;line-height:41px;margin-top:7px;border:1px solid #7c9a80;background:#fff;color:#245b3e;font-size:13px}.share-error{display:block;color:#a74223;font-size:12px;margin-top:8px;line-height:1.6}
.share-overlay{position:fixed;inset:0;z-index:10000;background:rgba(4,19,12,.72);display:flex;align-items:center;justify-content:center;padding:16px}.share-modal{width:min(100%,430px);max-height:92vh;overflow:auto;box-sizing:border-box;background:white;color:#183b29;border-radius:12px;padding:20px}.share-head{display:flex;align-items:center;justify-content:space-between;font-size:17px;font-weight:750}.share-head button{margin:0;padding:0 5px;height:32px;line-height:32px;background:transparent;color:#315943;font-size:25px}.share-help{display:block;color:#718477;font-size:12px;line-height:1.7;margin:8px 0 12px}.share-preview{display:block;width:100%;height:auto;border-radius:5px}
.join-hint { display:block; color:#9ba99b; text-align:center; font-size:11px; margin-top:10px; }
.contact-header { display:flex; align-items:center; gap:11px; }
.contact-icon { display:flex; justify-content:center; align-items:center; width:37px; height:37px; flex-shrink:0; background:#e4f0e6; color:#24643e; border-radius:8px; font-weight:700; }
.contact-title,.contact-caption { display:block; }
.contact-title { font-size:14px; font-weight:700; }
.contact-caption { color:#8d9b8d; font-size:11px; margin-top:4px; }
.contact-qr { display:block; width:140px; margin:13px auto; }
.contact-row { display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid #eee9e0; padding-top:12px; }
.contact-id { font-size:12px; color:#66816b; }
.copy-button,.outline-button { border:1px solid #b6cbbb; color:#27603d; background:#fff; border-radius:6px; font-size:12px; line-height:32px; padding:0 12px; }
.source-button { display:inline-block; margin-top:15px; }
@media(max-width:700px) {
  .hero-inner,.content-wrap { padding-left:16px; padding-right:16px; }
  .hero-inner { padding-top:20px; padding-bottom:34px; }
  .hero-layout { display:block; padding-top:24px; }
  .title { font-size:36px; margin-top:14px; }
  .lead { font-size:16px; }
  .description { font-size:13px; }
  .hero-button { width:100%; }
  .hero-side { display:none; }
  .main-grid { display:flex; flex-direction:column; }
  .main-column,.side-column { width:100%; }
  .side-column { display:contents; }
  .join-panel { order:-1; }
  .panel { padding:20px; }
  .section-title { font-size:21px; }
  .small-title { font-size:18px; }
  .steps { grid-template-columns:1fr; }
  .benefit { padding:11px; }
  .benefit-title { font-size:20px; }
  .benefit-description { font-size:10px; }
}

.played-note{background:#fff4ce;border:1px solid #f1e0a0;border-radius:8px;padding:16px 18px;margin:0 0 18px;color:#695920;font-size:13px;line-height:1.7}.played-note text{display:block}.played-note text:first-child{font-weight:800;color:#453e1d}.mobile-camp-bar{display:none}@media(max-width:700px){.content-wrap{padding-bottom:100px}.mobile-camp-bar{display:flex;position:fixed;z-index:90;bottom:0;left:0;right:0;align-items:center;justify-content:space-between;gap:10px;background:#0b3021;color:white;padding:9px 16px calc(9px + env(safe-area-inset-bottom))}.mobile-camp-bar view>text,.mobile-camp-bar small{display:block}.mobile-camp-bar view>text{font-size:13px;font-weight:750}.mobile-camp-bar small{font-size:11px;color:#bdd0c1;margin-top:3px}.mobile-camp-bar button{margin:0;padding:0 15px;background:#ee5a24;color:white;font-size:13px;font-weight:750;line-height:38px}}
</style>
