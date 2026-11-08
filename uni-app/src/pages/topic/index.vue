<template><view><SiteHeader :active="active"/><view class="wrap"><view class="hero"><text class="tag">AINPE · 专题</text><text class="title">{{title}}</text><text class="desc">{{description}}</text><button class="topic-action" @click="goSimulation">探索模拟项目 →</button></view><view class="section"><text class="heading">实战文章与一线反馈</text><text class="muted">已收录 {{filtered.length}} 篇 · {{feedMeta.source}}</text></view><view v-for="item in filtered" :key="item.id" class="row" @click="openArticle(item)"><view class="row-top"><text class="kind">{{item.kind || '分享'}}</text><text class="small">一位生财圈友</text></view><text class="article-title">{{item.title}}</text><text class="summary">{{item.overview||item.summary}}</text><view class="row-end"><text>查看站内导读 →</text><text @click.stop="toggle(item)">{{isSaved(item)?'已收藏':'收藏'}}</text></view></view><view v-if="!filtered.length" class="empty">暂未收录相关内容。</view></view><CampFooter/><SiteFooter /></view></template>
<script setup>
import SiteFooter from '../../components/SiteFooter.vue';
import {computed,ref} from 'vue';
import {onLoad,onShow} from '@dcloudio/uni-app';
import SiteHeader from '../../components/SiteHeader.vue';
import CampFooter from '../../components/CampFooter.vue';
import {articles,isAiArticle,feedMeta} from '../../data/content.js';
import {getSaved,setSaved} from '../../data/storage.js';
const slug=ref('fde'),saved=ref([]);
onLoad(o=>{const s=o.slug||o.topic;if(['fde','ai-video','ai-cases'].includes(s))slug.value=s});onShow(()=>{saved.value=getSaved()});
const active=computed(()=>slug.value==='fde'?'fde':'ai-cases');
const title=computed(()=>({'fde':'FDE · 把 AI 做进真实业务','ai-video':'AI 视频 · 从创作到实践','ai-cases':'AI 实战案例'}[slug.value]));
const description=computed(()=>({'fde':'从实际需求出发，看企业 AI 落地的案例、交付和讨论。','ai-video':'了解 AI 视频的创作方法、案例和经验。','ai-cases':'在真实案例中，看看别人怎么找到问题、动手实践。'}[slug.value]));
const filtered=computed(()=>articles.filter(a=>isAiArticle(a)&&(slug.value==='ai-cases'||(a.topics||[]).includes(slug.value)||(slug.value==='fde'?/FDE/i.test(a.title):/AI.*视频|视频.*AI/i.test(a.title)))));
function isSaved(a){return saved.value.includes(`article:${a.id}`)}
function toggle(a){const key=`article:${a.id}`;saved.value=isSaved(a)?saved.value.filter(x=>x!==key):[...saved.value,key];setSaved(saved.value)}
function openArticle(a){uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(a.id)}`})}
function goSimulation(){uni.navigateTo({url:'/pages/simulate/index'})}
</script>
<style scoped>.wrap{max-width:1100px;margin:auto;padding:35rpx 28rpx;color:#183d2b}.hero{background:#183c2c;color:#f4f8ef;padding:58rpx;border-radius:12rpx}.tag{font-size:22rpx;color:#c4de95}.title,.desc{display:block}.title{font-size:55rpx;font-weight:750;margin:15rpx 0;line-height:1.3}.desc{font-size:27rpx;color:#c0d0ba;line-height:1.7}.topic-action{display:inline-block;margin:24rpx 0 0;background:#d6ec9c;color:#21422f;font-size:24rpx;line-height:2.8}.section{display:flex;justify-content:space-between;align-items:center;margin:45rpx 0 20rpx}.heading{font-size:35rpx;font-weight:700}.muted,.small{font-size:23rpx;color:#829880}.row{background:#fff;padding:25rpx;border:1px solid #e1e9dc;border-radius:9rpx;margin-bottom:12rpx}.row-top,.row-end{display:flex;justify-content:space-between;gap:12rpx}.kind{font-size:21rpx;color:#648965}.article-title,.summary{display:block}.article-title{font-size:29rpx;line-height:1.5;font-weight:700;margin:12rpx 0}.summary{font-size:24rpx;color:#718676;line-height:1.7}.row-end{font-size:23rpx;color:#4e7b55;margin-top:18rpx}.empty{color:#81947d;padding:40rpx}@media(max-width:600px){.hero{padding:35rpx}.title{font-size:39rpx}.section{align-items:start;gap:8rpx;flex-direction:column}}</style>
