<template>
  <view class="page">
    <view class="back" role="button" @tap="back">‹ 返回</view>
    <template v-if="guide">
      <view class="hero">
        <view class="hero-cover"><image class="cover" :src="guide.cover" :alt="guide.coverAlt" mode="aspectFit"/><text class="cover-label">{{guide.coverLabel}}</text></view>
        <view class="badge">{{guide.category}} · {{guide.badge}}</view>
        <view class="title">{{guide.title}}</view>
        <view class="intro">{{guide.intro}}</view>
        <view class="hero-actions"><button class="favorite" @tap="toggleFavorite">{{favorite ? '★ 已收藏' : '☆ 收藏'}}</button><text class="progress">已完成 {{completed.length}} / {{guide.steps.length}} 步</text></view>
      </view>
      <view class="box"><view class="box-title">你将做出什么</view><view class="text">{{guide.outcome}}</view></view>
      <view class="box"><view class="box-title">准备工具和材料</view><view class="text">{{guide.needs}}</view><view class="note">在此查看步骤并复制提示词；生成内容需要到你自己的 AI 工具里操作。</view></view>
      <view v-if="guide.video" class="box"><view class="box-title">看看试做成片</view><video class="video" :src="mediaUrl(guide.video.src)" controls object-fit="contain" :show-center-play-btn="true"/><view class="caption">{{guide.video.caption}}</view></view>
      <view v-if="guide.evidence && guide.evidence.verified" class="box"><view class="box-title">{{guide.evidence.title}}</view><view v-if="guide.evidence.input" class="text"><text class="label">示例素材：</text>{{guide.evidence.input}}</view><view v-if="guide.evidence.process" class="text"><text class="label">怎么做：</text>{{guide.evidence.process}}</view><view v-if="guide.evidence.result" class="text"><text class="label">得到什么：</text>{{guide.evidence.result}}</view><view v-if="guide.evidence.limits" class="note">{{guide.evidence.limits}}</view>
        <view v-if="guide.exampleMedia" class="examples"><view v-for="item in guide.exampleMedia" :key="item.src" class="example"><image :src="mediaUrl(item.src)" mode="widthFix" class="step-image" lazy-load/><view class="caption">{{item.caption}}</view></view></view>
        <view v-if="guide.id==='kejian'||guide.id==='huiben'" class="document-actions"><button class="doc-button" @tap="previewDocument('pdf')">打开完整示例 PDF</button><button v-if="guide.id==='kejian'" class="doc-button" @tap="previewDocument('pptx')">打开可编辑课件 PPTX</button><view class="caption">文件将先下载到临时目录，再在微信内打开；可用右上角菜单查看分享选项。</view></view>
      </view>
      <view class="section-title">一步步来</view>
      <view v-for="(step,index) in guide.steps" :id="'guide-step-'+index" :key="index" class="box step">
        <view class="step-head"><text class="number">{{index+1}}</text><text class="step-title">{{step.title}}</text></view>
        <view class="text">{{step.action}}</view>
        <view v-if="step.prompt" class="prompt"><view class="prompt-label">可以复制的提示词</view><view class="prompt-text">{{step.prompt}}</view></view>
        <button v-if="step.prompt" class="copy" @tap="copyPrompt(step.prompt)">复制提示词</button>
        <view v-if="step.check" class="check"><text class="label">检查一下：</text>{{step.check}}</view>
        <view v-for="item in verifiedMedia(step.media)" :key="item.src" class="example"><image :src="mediaUrl(item.src)" :alt="item.alt" mode="widthFix" class="step-image" lazy-load/><view class="caption">{{item.kind}} · {{item.caption}}</view></view>
        <button class="mark" :class="{'marked': completed.includes(index)}" @tap="toggleStep(index)">{{completed.includes(index) ? '✓ 已标记完成' : '标记这一步完成'}}</button>
      </view>
      <view v-if="guide.id==='kejian'||guide.id==='huiben'" class="box"><view class="box-title">想先练习一下？</view><view class="text">{{guide.id==='kejian'?'通过五步选择练习，整理一个可复制的课件助手提示词。':'和孩子选择故事要素，看看四页预设故事示例。'}}</view><button class="doc-button" @tap="practiceOpen=!practiceOpen">{{practiceOpen?'收起练习':'打开站内练习'}}</button><MiniCoursePractice v-if="practiceOpen&&guide.id==='kejian'"/><MiniBookPractice v-if="practiceOpen&&guide.id==='huiben'"/></view>
      <view id="tutorial-complete" class="box completion"><view class="box-title">做完了吗？</view><view class="text">回到常用 AI 工具继续操作，完成后检查内容与素材的使用权限。</view><button class="other-guides" @tap="openList">再看看其他教程</button></view>
      <view class="bottom-note">学习进度和收藏保存在当前微信设备中，清除数据或更换设备后可能无法找回。</view>
    </template>
    <view v-else class="box"><view class="box-title">没有找到这篇教程</view><view class="text">可以返回列表看看其他内容。</view><button class="other-guides" @tap="openList">返回教程列表</button></view>
  </view>
</template>
<script setup>
import {computed,ref,nextTick} from 'vue';
import {onLoad,onShow,onReady} from '@dcloudio/uni-app';
import guides from '../../data/mini-guides.json';
import MiniCoursePractice from '../../components/MiniCoursePractice.vue';
import MiniBookPractice from '../../components/MiniBookPractice.vue';
const SITE='https://ainpe.aisen.xin/static/learn/';
const LEARNING='ainpe_mini_learning_v1', FAVORITES='ainpe_mini_favorites_v1';
const id=ref(''),completed=ref([]),favorite=ref(false),practiceOpen=ref(false);
let resumeRequested=false;
const guide=computed(()=>guides.find(g=>g.id===id.value));
function mediaUrl(src){if(!src)return '';return SITE+src.replace(/^\/+/, '')}
function verifiedMedia(items){return Array.isArray(items)?items.filter(item=>item.verified&&item.src):[]}
function loadState(){try{const data=uni.getStorageSync(LEARNING)||{};const record=data[id.value]||{};completed.value=Array.isArray(record.completedSteps)?record.completedSteps.filter(i=>Number.isInteger(i)&&i>=0&&(guide.value?.steps?.length||0)>i):[];const saved=uni.getStorageSync(FAVORITES)||[];favorite.value=Array.isArray(saved)&&saved.includes(id.value)}catch{completed.value=[];favorite.value=false}}
function nextPendingIndex(total,done){for(let index=0;index<total;index++)if(!done.includes(index))return index;return -1}
onLoad(options=>{id.value=typeof options?.id==='string'?options.id:'';resumeRequested=options?.resume==='1';loadState()});
onShow(()=>{if(id.value)loadState()});
onReady(()=>{if(!resumeRequested||!guide.value)return;resumeRequested=false;nextTick(()=>{const next=nextPendingIndex(guide.value.steps.length,completed.value);uni.pageScrollTo({selector:next<0?'#tutorial-complete':'#guide-step-'+next,duration:0})})});
function toggleStep(index){let steps=completed.value.includes(index)?completed.value.filter(i=>i!==index):[...completed.value,index].sort((a,b)=>a-b);try{const data=uni.getStorageSync(LEARNING)||{};data[id.value]={...(data[id.value]||{}),completedSteps:steps,updatedAt:new Date().toISOString()};uni.setStorageSync(LEARNING,data);completed.value=steps}catch{uni.showToast({title:'保存失败，请重试',icon:'none'})}}
function toggleFavorite(){try{let saved=uni.getStorageSync(FAVORITES)||[];if(!Array.isArray(saved))saved=[];saved=favorite.value?saved.filter(i=>i!==id.value):[...new Set([...saved,id.value])];uni.setStorageSync(FAVORITES,saved);favorite.value=!favorite.value}catch{uni.showToast({title:'保存失败，请重试',icon:'none'})}}
function copyPrompt(prompt){uni.setClipboardData({data:prompt,fail:()=>uni.showToast({title:'复制失败，请重试',icon:'none'})})}
function previewDocument(kind){
  const files={kejian:{pdf:'media/lesson/rain-lesson-export.pdf',pptx:'media/lesson/rain-lesson-example.pptx'},huiben:{pdf:'media/picturebook/fox-book.pdf'}};
  const path=files[id.value]?.[kind];if(!path)return;
  uni.showLoading({title:'正在准备文件'});
  uni.downloadFile({url:mediaUrl(path),success:r=>{uni.hideLoading();if(r.statusCode!==200){uni.showToast({title:'文件暂时无法下载',icon:'none'});return}uni.openDocument({filePath:r.tempFilePath,fileType:kind,showMenu:true,fail:()=>uni.showToast({title:'暂时无法打开文件',icon:'none'})})},fail:()=>{uni.hideLoading();uni.showToast({title:'文件下载失败，请检查网络',icon:'none'})}})
}
function back(){uni.navigateBack({fail:()=>uni.redirectTo({url:'/pages/learn/guides'})})}
function openList(){uni.redirectTo({url:'/pages/learn/guides',fail:()=>uni.navigateTo({url:'/pages/learn/guides'})})}
</script>
<style scoped>
.page{box-sizing:border-box;min-height:100vh;padding:14px 16px calc(36px + env(safe-area-inset-bottom));background:#f3f4f6;color:#192234}.back{display:inline-flex;align-items:center;min-height:44px;color:#536783;font-size:14px;font-weight:700}.hero{padding-bottom:8px}.hero-cover{position:relative;width:100%;height:190px;overflow:hidden;border-radius:14px;background:#e7ebf1}.cover{width:100%;height:100%}.cover-label{position:absolute;bottom:8px;left:8px;padding:3px 6px;border-radius:4px;background:rgba(20,29,39,.7);font-size:10px;color:#fff}.badge{display:inline-block;margin-top:14px;padding:5px 8px;border-radius:6px;background:#e9efff;color:#3352cf;font-size:11px;font-weight:700}.title{margin-top:9px;font-size:25px;line-height:1.3;font-weight:800}.intro{margin-top:8px;color:#65748a;font-size:14px;line-height:1.7}.hero-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}.favorite{margin:0;padding:0 12px;height:38px;line-height:38px;background:#fff;color:#3151c4;border:1px solid #dbe3f5;border-radius:8px;font-size:13px}.favorite:after,.copy:after,.mark:after,.other-guides:after,.doc-button:after{border:0}.progress{color:#718096;font-size:12px}.box{box-sizing:border-box;margin-top:14px;padding:17px;background:#fff;border:1px solid #e6e9ef;border-radius:14px}.box-title{font-size:17px;font-weight:800;line-height:1.4}.text{margin-top:9px;font-size:14px;line-height:1.75;color:#425169;white-space:pre-wrap;overflow-wrap:anywhere}.label{font-weight:700;color:#263c56}.note,.check{margin-top:12px;padding:10px 12px;border-radius:8px;background:#f1f4fb;color:#5e7088;font-size:12px;line-height:1.7;white-space:pre-wrap}.section-title{margin-top:24px;font-size:20px;font-weight:800}.step-head{display:flex;gap:10px;align-items:flex-start}.number{flex-shrink:0;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#2849e9;color:#fff;font-size:14px;font-weight:800}.step-title{font-size:16px;line-height:28px;font-weight:800}.prompt{margin-top:13px;padding:12px;background:#f3f5fb;border-radius:9px}.prompt-label{font-size:12px;font-weight:700;color:#63718a}.prompt-text{margin-top:7px;color:#26354a;font-size:13px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}.copy,.other-guides{margin:12px 0 0;background:#2849e9;color:#fff;font-size:14px;font-weight:700;border-radius:9px;line-height:44px}.doc-button{margin:12px 0 0;background:#edf2ff;color:#2849e9;font-size:13px;font-weight:700;border-radius:9px;line-height:44px}.mark{margin:13px 0 0;background:#fff;color:#52627a;font-size:13px;border:1px solid #dbe1ec;border-radius:9px;line-height:42px}.mark.marked{background:#edf6f0;border-color:#c9e4d0;color:#2a7a47}.video{width:100%;height:350px;background:#101a27;border-radius:10px;margin-top:12px}.examples{margin-top:12px}.example{margin-top:12px}.step-image{display:block;width:100%;height:auto;border-radius:9px}.caption{margin-top:6px;color:#76849a;font-size:12px;line-height:1.6}.completion{margin-top:22px}.bottom-note{margin-top:18px;color:#8692a2;font-size:12px;line-height:1.7}
</style>
