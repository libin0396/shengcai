<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="page">
    <view class="intro"><view class="eyebrow">AINPE实战情报站</view><view class="title">找用法</view></view>
    <view class="ai-row">
      <image class="ai-ava" :class="'st-' + aiState" :src="aiFace" mode="aspectFill" />
      <view class="ai-say"><text class="ai-who">小A</text><text class="ai-t">{{aiText}}</text></view>
    </view>
    <view class="search-box">
      <input class="search-input" v-model="query" maxlength="40" confirm-type="search" placeholder="你想用 AI 做什么？" @confirm="search" />
      <button class="search-button" @tap="search">搜索</button>
    </view>
    <view class="chips"><text v-for="item in suggestions" :key="item" class="chip" @tap="choose(item)">{{item}}</text></view>
    <view class="lib-entry" @tap="goLibrary"><text>没想好问什么？</text><text class="lib-go">看看快捷提示词 ›</text></view>
    <view v-if="searched" class="results">
      <template v-if="guideResults.length || aidResults.length">
        <view v-if="guideResults.length" class="section-title">跟着做</view>
        <view v-for="item in guideResults" :key="item.id" class="result-card" @tap="openGuide(item.id)">
          <view class="tag">{{item.category || '分步教程'}}</view><view class="result-title">{{item.title}}</view>
          <view class="result-desc">{{item.intro}}</view><view class="action">查看步骤 →</view>
        </view>
        <view v-if="aidResults.length" class="section-title">快捷提示词</view>
        <view v-for="item in aidResults" :key="item.id" class="result-card" @tap="openAid(item.id)">
          <view class="result-title">{{item.title}}</view><view class="result-desc">{{item.when}}</view><view class="action">查看提示词 →</view>
        </view>
      </template>
      <view v-else class="empty"><view class="empty-title">暂时没找到相关内容</view><view class="result-desc">换个词试试，也可以先看看已有的教程和提示词。</view><view class="empty-actions"><button @tap="goGuides">浏览教程</button><button @tap="goLibrary">快捷提示词</button></view>
        <view class="feedback-title">希望我们补充什么？</view>
        <view class="feedback-desc">自愿选择一个方向提交，只发送所选分类；不会自动通知你。</view>
        <picker :range="feedbackCategories" range-key="label" :value="feedbackIndex" @change="chooseFeedback"><view class="feedback-picker">{{feedbackIndex<0?'请选择方向':feedbackCategories[feedbackIndex].label}}　⌄</view></picker>
        <button class="feedback-button" :class="{'is-disabled':feedbackIndex<0||feedbackPending}" :disabled="feedbackIndex<0||feedbackPending" @tap="submitFeedback">{{feedbackPending?'提交中…':'提交需求'}}</button>
        <view v-if="feedbackStatus" class="feedback-status" aria-live="polite">{{feedbackStatus}}</view>
      </view>
    </view>
    <view v-else class="hint"><view class="hint-title">可以试着搜</view><view class="result-desc">比如“做课件”“会议笔记”或“AI 短剧”。</view></view>
    <view id="feedback-form" class="opinion">
      <view class="feedback-title opinion-title">问题的解法没找到？</view>
      <view class="feedback-desc">告诉我们你想用 AI 解决什么，我们会筛选合适的问题补充内容。</view>
      <textarea class="opinion-input" v-model="opinion" maxlength="30" placeholder="说说你想用 AI 解决的问题（最多 30 字）" />
      <button class="feedback-button" :class="{'is-disabled':!opinion.trim()||opinionPending}" :disabled="!opinion.trim()||opinionPending" @tap="submitOpinion">{{opinionPending?'提交中…':'提交'}}</button>
      <view v-if="opinionStatus" class="feedback-status" aria-live="polite">{{opinionStatus}}</view>
    </view>
    <MiniNav active="find" />
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="page">
    <view class="intro"><view class="eyebrow">AINPE实战情报站</view><view class="title">找用法</view></view>
    <view class="ai-row">
      <image class="ai-ava" :class="'st-' + aiState" :src="aiFace" mode="aspectFill" />
      <view class="ai-say"><text class="ai-who">小A</text><text class="ai-t">{{aiText}}</text></view>
    </view>
    <view class="search-box">
      <input class="search-input" v-model="query" maxlength="40" confirm-type="search" placeholder="你想用 AI 做什么？" @confirm="search" />
      <button class="search-button" @tap="search">搜索</button>
    </view>
    <view class="chips"><text v-for="item in suggestions" :key="item" class="chip" @tap="choose(item)">{{item}}</text></view>
    <view class="lib-entry" @tap="goLibrary"><text>没想好问什么？</text><text class="lib-go">看看快捷提示词 ›</text></view>
    <view v-if="searched" class="results">
      <template v-if="guideResults.length || aidResults.length">
        <view v-if="guideResults.length" class="section-title">跟着做</view>
        <view v-for="item in guideResults" :key="item.id" class="result-card" @tap="openGuide(item.id)">
          <view class="tag">{{item.category || '分步教程'}}</view><view class="result-title">{{item.title}}</view>
          <view class="result-desc">{{item.intro}}</view><view class="action">查看步骤 →</view>
        </view>
        <view v-if="aidResults.length" class="section-title">快捷提示词</view>
        <view v-for="item in aidResults" :key="item.id" class="result-card" @tap="openAid(item.id)">
          <view class="result-title">{{item.title}}</view><view class="result-desc">{{item.when}}</view><view class="action">查看提示词 →</view>
        </view>
      </template>
      <view v-else class="empty"><view class="empty-title">暂时没找到相关内容</view><view class="result-desc">换个词试试，也可以先看看已有的教程和提示词。</view><view class="empty-actions"><button @tap="goGuides">浏览教程</button><button @tap="goLibrary">快捷提示词</button></view>
        <view class="feedback-title">希望我们补充什么？</view>
        <view class="feedback-desc">自愿选择一个方向提交，只发送所选分类；不会自动通知你。</view>
        <picker :range="feedbackCategories" range-key="label" :value="feedbackIndex" @change="chooseFeedback"><view class="feedback-picker">{{feedbackIndex<0?'请选择方向':feedbackCategories[feedbackIndex].label}}　⌄</view></picker>
        <button class="feedback-button" :class="{'is-disabled':feedbackIndex<0||feedbackPending}" :disabled="feedbackIndex<0||feedbackPending" @tap="submitFeedback">{{feedbackPending?'提交中…':'提交需求'}}</button>
        <view v-if="feedbackStatus" class="feedback-status" aria-live="polite">{{feedbackStatus}}</view>
      </view>
    </view>
    <view v-else class="hint"><view class="hint-title">可以试着搜</view><view class="result-desc">比如“做课件”“会议笔记”或“AI 短剧”。</view></view>
    <view class="privacy">搜索内容只在当前设备上匹配，不会上传；会匿名记录是否找到结果，用于改进内容。</view>
    <view id="feedback-form" class="opinion">
      <view class="feedback-title opinion-title">没找到想解决的问题？</view>
      <view class="feedback-desc">告诉我们你想用 AI 解决什么，我们会筛选合适的问题补充内容。请不要填写姓名、电话等个人信息。你主动提交的问题将发送给站长，约 30 天后删除；不会自动通知你。</view>
      <textarea class="opinion-input" v-model="opinion" maxlength="200" placeholder="说说你想用 AI 解决的问题（最多 200 字）" />
      <button class="feedback-button" :class="{'is-disabled':!opinion.trim()||opinionPending}" :disabled="!opinion.trim()||opinionPending" @tap="submitOpinion">{{opinionPending?'提交中…':'提交问题'}}</button>
      <view v-if="opinionStatus" class="feedback-status" aria-live="polite">{{opinionStatus}}</view>
    </view>
    <MiniNav active="find" />
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

import {ref,computed} from 'vue';
import {onLoad,onReady} from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
import {miniAids} from '../../data/mini-aids.js';
import {matchAids,matchGuides} from '../../data/mini-search-data.js';
import {A_FACES} from '../../data/ai-core.js';
const query=ref(''),searched=ref(false),guideResults=ref([]),aidResults=ref([]),feedbackIndex=ref(-1),feedbackPending=ref(false),feedbackStatus=ref('');
const opinion=ref(''),opinionPending=ref(false),opinionStatus=ref('');let showFeedback=false;
const suggestions=['AI 短剧','短视频脚本','商品宣传图','辅导作业','做课件','做绘本'];
const feedbackCategories=[{label:'AI 短剧',value:'drama'},{label:'AI 视频',value:'video'},{label:'办公与工作',value:'office'},{label:'内容创作',value:'content'},{label:'教育与学习',value:'education'},{label:'其他',value:'other'}];
const FEEDBACK_URL='https://ainpe.aisen.xin/api/mini-feedback';
function sendEvent(kind,value,success,fail){uni.request({url:FEEDBACK_URL,method:'POST',header:{'content-type':'application/json'},data:{kind,value},timeout:8000,success:r=>{if(r.statusCode===202&&r.data?.ok===true){if(success)success()}else if(fail)fail()},fail:()=>{if(fail)fail()}})}
function search(){const q=query.value.trim().slice(0,40);feedbackIndex.value=-1;feedbackStatus.value='';if(!q){searched.value=false;guideResults.value=[];aidResults.value=[];return}guideResults.value=matchGuides(q,guides);aidResults.value=matchAids(q,miniAids);searched.value=true;sendEvent('search',guideResults.value.length||aidResults.value.length?'hit':'miss');uni.hideKeyboard()}
function chooseFeedback(e){const i=Number(e.detail?.value);feedbackIndex.value=Number.isInteger(i)&&i>=0&&i<feedbackCategories.length?i:-1;feedbackStatus.value=''}
function submitFeedback(){if(feedbackPending.value||feedbackIndex.value<0)return;feedbackPending.value=true;feedbackStatus.value='';sendEvent('feedback',feedbackCategories[feedbackIndex.value].value,()=>{feedbackPending.value=false;feedbackStatus.value='已收到你的方向反馈，我们会参考完善内容。'},()=>{feedbackPending.value=false;feedbackStatus.value='暂时提交失败，请稍后重试。'})}
function submitOpinion(){const message=opinion.value.trim();if(opinionPending.value||!message)return;if(message.length>30){opinionStatus.value='最多填写 30 字。';return}opinionPending.value=true;opinionStatus.value='';sendEvent('message',message,()=>{opinionPending.value=false;opinion.value='';opinionStatus.value='已收到你的问题，我们会参考并筛选适合补充的内容。'},()=>{opinionPending.value=false;opinionStatus.value='暂时提交失败，请稍后重试。'})}
onLoad(options=>{showFeedback=options?.feedback==='1'});
onReady(()=>{if(showFeedback)uni.pageScrollTo({selector:'#feedback-form',duration:0})});
function choose(value){query.value=value;search()}
// 小A 看结果换表情：没搜时打招呼，找到了开心，没找到歪头
const aiState=computed(()=>!searched.value?'idle':(guideResults.value.length||aidResults.value.length)?'found':'miss');
const aiFace=computed(()=>aiState.value==='miss'?A_FACES.confused:A_FACES.happy);
const aiText=computed(()=>aiState.value==='idle'?'你遇到了什么事？说一句，我帮你找一篇跟着做的教程，或一句能复制给 AI 的话。':aiState.value==='found'?'找到了，挑一个看看。提示词复制到你常用的 AI 里用。':'没找到完全对得上的。换个说法试试，或者告诉我们你想做什么。');
function openGuide(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)})}
function openAid(id){uni.navigateTo({url:'/pages/learn/library?id='+encodeURIComponent(id)})}
function goGuides(){uni.navigateTo({url:'/pages/learn/guides'})}
function goLibrary(){uni.navigateTo({url:'/pages/learn/library'})}

// #endif
// #ifndef MP-WEIXIN

import {ref,computed} from 'vue';
import {onLoad,onReady} from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import guides from '../../data/mini-guides.json';
import {miniAids} from '../../data/mini-aids.js';
import {matchAids,matchGuides} from '../../data/mini-search-data.js';
import {A_FACES} from '../../data/ai-core.js';
const query=ref(''),searched=ref(false),guideResults=ref([]),aidResults=ref([]),feedbackIndex=ref(-1),feedbackPending=ref(false),feedbackStatus=ref('');
const opinion=ref(''),opinionPending=ref(false),opinionStatus=ref('');let showFeedback=false;
const suggestions=['AI 短剧','短视频脚本','商品宣传图','辅导作业','做课件','做绘本'];
const feedbackCategories=[{label:'AI 短剧',value:'drama'},{label:'AI 视频',value:'video'},{label:'办公与工作',value:'office'},{label:'内容创作',value:'content'},{label:'教育与学习',value:'education'},{label:'其他',value:'other'}];
const FEEDBACK_URL='https://ainpe.aisen.xin/api/mini-feedback';
function sendEvent(kind,value,success,fail){uni.request({url:FEEDBACK_URL,method:'POST',header:{'content-type':'application/json'},data:{kind,value},timeout:8000,success:r=>{if(r.statusCode===202&&r.data?.ok===true){if(success)success()}else if(fail)fail()},fail:()=>{if(fail)fail()}})}
function search(){const q=query.value.trim().slice(0,40);feedbackIndex.value=-1;feedbackStatus.value='';if(!q){searched.value=false;guideResults.value=[];aidResults.value=[];return}guideResults.value=matchGuides(q,guides);aidResults.value=matchAids(q,miniAids);searched.value=true;sendEvent('search',guideResults.value.length||aidResults.value.length?'hit':'miss');uni.hideKeyboard()}
function chooseFeedback(e){const i=Number(e.detail?.value);feedbackIndex.value=Number.isInteger(i)&&i>=0&&i<feedbackCategories.length?i:-1;feedbackStatus.value=''}
function submitFeedback(){if(feedbackPending.value||feedbackIndex.value<0)return;feedbackPending.value=true;feedbackStatus.value='';sendEvent('feedback',feedbackCategories[feedbackIndex.value].value,()=>{feedbackPending.value=false;feedbackStatus.value='已收到你的方向反馈，我们会参考完善内容。'},()=>{feedbackPending.value=false;feedbackStatus.value='暂时提交失败，请稍后重试。'})}
function submitOpinion(){const message=opinion.value.trim();if(opinionPending.value||!message)return;opinionPending.value=true;opinionStatus.value='';sendEvent('message',message,()=>{opinionPending.value=false;opinion.value='';opinionStatus.value='已收到你的问题，我们会参考并筛选适合补充的内容。'},()=>{opinionPending.value=false;opinionStatus.value='暂时提交失败，请稍后重试。'})}
onLoad(options=>{showFeedback=options?.feedback==='1'});
onReady(()=>{if(showFeedback)uni.pageScrollTo({selector:'#feedback-form',duration:0})});
function choose(value){query.value=value;search()}
// 小A 看结果换表情：没搜时打招呼，找到了开心，没找到歪头
const aiState=computed(()=>!searched.value?'idle':(guideResults.value.length||aidResults.value.length)?'found':'miss');
const aiFace=computed(()=>aiState.value==='miss'?A_FACES.confused:A_FACES.happy);
const aiText=computed(()=>aiState.value==='idle'?'你遇到了什么事？说一句，我帮你找一篇跟着做的教程，或一句能复制给 AI 的话。':aiState.value==='found'?'找到了，挑一个看看。提示词复制到你常用的 AI 里用。':'没找到完全对得上的。换个说法试试，或者告诉我们你想做什么。');
function openGuide(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)})}
function openAid(id){uni.navigateTo({url:'/pages/learn/library?id='+encodeURIComponent(id)})}
function goGuides(){uni.navigateTo({url:'/pages/learn/guides'})}
function goLibrary(){uni.navigateTo({url:'/pages/learn/library'})}

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:44rpx 32rpx calc(76px + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}.eyebrow{font-size:23rpx;color:#71809a;font-weight:700}.title{font-size:52rpx;line-height:1.2;font-weight:800;margin-top:14rpx}.subtitle,.result-desc{font-size:26rpx;line-height:1.65;color:#718097}.subtitle{margin-top:12rpx}.search-box{display:flex;align-items:center;background:#fff;border:2rpx solid #e2e6ed;border-radius:24rpx;margin-top:34rpx;padding:10rpx}.search-input{min-width:0;flex:1;font-size:29rpx;padding:0 14rpx;height:78rpx}.search-button{margin:0;flex:none;background:#2849e9;color:#fff;font-size:27rpx;font-weight:700;line-height:78rpx;height:78rpx;padding:0 26rpx;border-radius:18rpx}.search-button::after,.empty-actions button::after{border:0}.chips{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:20rpx}.chip{background:#fff;color:#5e6c82;font-size:24rpx;font-weight:600;border-radius:40rpx;padding:12rpx 20rpx}.section-title{margin:38rpx 0 16rpx;font-size:32rpx;font-weight:800}.result-card,.empty,.hint{margin-top:16rpx;padding:26rpx;background:#fff;border-radius:22rpx;border:1rpx solid #e5eaf1}.result-title,.empty-title,.hint-title{font-weight:800;font-size:30rpx;line-height:1.4}.result-desc{margin-top:9rpx}.tag{font-size:22rpx;color:#2c53d7;margin-bottom:8rpx}.action{margin-top:14rpx;color:#2849e9;font-size:25rpx;font-weight:700}.empty{margin-top:32rpx}.empty-actions{display:flex;gap:16rpx;margin-top:20rpx}.empty-actions button{margin:0;line-height:68rpx;font-size:24rpx;color:#2849e9;background:#edf1ff;padding:0 22rpx;border-radius:12rpx}.hint{margin-top:34rpx}
.feedback-title{margin-top:30rpx;padding-top:25rpx;border-top:1rpx solid #e6e9ef;font-weight:800;font-size:28rpx}.feedback-desc,.feedback-status{margin-top:10rpx;color:#718097;font-size:23rpx;line-height:1.6}.feedback-picker{margin-top:16rpx;padding:18rpx;border:1rpx solid #dce3ee;border-radius:12rpx;color:#42536c;font-size:25rpx}.feedback-button{margin:16rpx 0 0;background:#2849e9;color:#fff;font-size:25rpx;line-height:72rpx;border-radius:12rpx}.feedback-button.is-disabled{background:#e6eaf3;color:#8c96a6}.feedback-button::after{border:0}
.opinion{margin-top:36rpx;padding:26rpx;background:#fff;border:1rpx solid #e5eaf1;border-radius:22rpx}.opinion-title{margin:0;padding:0;border:0}.opinion-input{box-sizing:border-box;width:100%;height:110rpx;min-height:110rpx;margin-top:18rpx;padding:16rpx;border:1rpx solid #dce3ee;border-radius:12rpx;font-size:25rpx;line-height:1.6}
.ai-row{display:flex;align-items:flex-end;gap:12px;margin:8px 0 14px}
.ai-ava{flex:none;width:64px;height:64px;border-radius:50%;box-shadow:0 0 0 3px #fff;animation:findBob 2.6s ease-in-out infinite}
.ai-ava.st-found{animation:findJump .7s ease 2}
.ai-ava.st-miss{animation:findTilt 1.1s ease-in-out 2}
.ai-say{flex:1;min-width:0;display:flex;flex-direction:column;background:#eceffe;border-radius:18px 18px 18px 6px;padding:10px 13px}
.ai-who{font-size:12px;font-weight:900;color:#2849e9}.ai-t{font-size:14px;font-weight:700;line-height:1.55;color:#172033}
.lib-entry{display:flex;justify-content:space-between;align-items:center;margin-top:16rpx;padding:22rpx 26rpx;border-radius:22rpx;background:#fff;color:#637287;font-size:26rpx}
.lib-go{color:#2849e9;font-weight:800}
@keyframes findBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes findJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}
@keyframes findTilt{0%,100%{transform:rotate(0)}30%{transform:rotate(-10deg)}70%{transform:rotate(8deg)}}

/* #endif */
/* #ifndef MP-WEIXIN */

.page{min-height:100vh;box-sizing:border-box;padding:44rpx 32rpx calc(168rpx + env(safe-area-inset-bottom));background:#f3f4f6;color:#172033}.eyebrow{font-size:23rpx;color:#71809a;font-weight:700}.title{font-size:52rpx;line-height:1.2;font-weight:800;margin-top:14rpx}.subtitle,.result-desc{font-size:26rpx;line-height:1.65;color:#718097}.subtitle{margin-top:12rpx}.search-box{display:flex;align-items:center;background:#fff;border:2rpx solid #e2e6ed;border-radius:24rpx;margin-top:34rpx;padding:10rpx}.search-input{min-width:0;flex:1;font-size:29rpx;padding:0 14rpx;height:78rpx}.search-button{margin:0;flex:none;background:#2849e9;color:#fff;font-size:27rpx;font-weight:700;line-height:78rpx;height:78rpx;padding:0 26rpx;border-radius:18rpx}.search-button::after,.empty-actions button::after{border:0}.chips{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:20rpx}.chip{background:#fff;color:#5e6c82;font-size:24rpx;font-weight:600;border-radius:40rpx;padding:12rpx 20rpx}.section-title{margin:38rpx 0 16rpx;font-size:32rpx;font-weight:800}.result-card,.empty,.hint{margin-top:16rpx;padding:26rpx;background:#fff;border-radius:22rpx;border:1rpx solid #e5eaf1}.result-title,.empty-title,.hint-title{font-weight:800;font-size:30rpx;line-height:1.4}.result-desc{margin-top:9rpx}.tag{font-size:22rpx;color:#2c53d7;margin-bottom:8rpx}.action{margin-top:14rpx;color:#2849e9;font-size:25rpx;font-weight:700}.empty{margin-top:32rpx}.empty-actions{display:flex;gap:16rpx;margin-top:20rpx}.empty-actions button{margin:0;line-height:68rpx;font-size:24rpx;color:#2849e9;background:#edf1ff;padding:0 22rpx;border-radius:12rpx}.hint{margin-top:34rpx}.privacy{margin-top:40rpx;text-align:center;color:#8793a3;font-size:22rpx;line-height:1.6}
.feedback-title{margin-top:30rpx;padding-top:25rpx;border-top:1rpx solid #e6e9ef;font-weight:800;font-size:28rpx}.feedback-desc,.feedback-status{margin-top:10rpx;color:#718097;font-size:23rpx;line-height:1.6}.feedback-picker{margin-top:16rpx;padding:18rpx;border:1rpx solid #dce3ee;border-radius:12rpx;color:#42536c;font-size:25rpx}.feedback-button{margin:16rpx 0 0;background:#2849e9;color:#fff;font-size:25rpx;line-height:72rpx;border-radius:12rpx}.feedback-button.is-disabled{background:#e6eaf3;color:#8c96a6}.feedback-button::after{border:0}
.opinion{margin-top:36rpx;padding:26rpx;background:#fff;border:1rpx solid #e5eaf1;border-radius:22rpx}.opinion-title{margin:0;padding:0;border:0}.opinion-input{box-sizing:border-box;width:100%;min-height:160rpx;margin-top:18rpx;padding:16rpx;border:1rpx solid #dce3ee;border-radius:12rpx;font-size:25rpx;line-height:1.6}
.ai-row{display:flex;align-items:flex-end;gap:12px;margin:8px 0 14px}
.ai-ava{flex:none;width:64px;height:64px;border-radius:50%;box-shadow:0 0 0 3px #fff;animation:findBob 2.6s ease-in-out infinite}
.ai-ava.st-found{animation:findJump .7s ease 2}
.ai-ava.st-miss{animation:findTilt 1.1s ease-in-out 2}
.ai-say{flex:1;min-width:0;display:flex;flex-direction:column;background:#eceffe;border-radius:18px 18px 18px 6px;padding:10px 13px}
.ai-who{font-size:12px;font-weight:900;color:#2849e9}.ai-t{font-size:14px;font-weight:700;line-height:1.55;color:#172033}
.lib-entry{display:flex;justify-content:space-between;align-items:center;margin-top:16rpx;padding:22rpx 26rpx;border-radius:22rpx;background:#fff;color:#637287;font-size:26rpx}
.lib-go{color:#2849e9;font-weight:800}
@keyframes findBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes findJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}
@keyframes findTilt{0%,100%{transform:rotate(0)}30%{transform:rotate(-10deg)}70%{transform:rotate(8deg)}}

/* #endif */
</style>
