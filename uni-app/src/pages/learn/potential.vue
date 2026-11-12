<template>
  <view class="page">
    <view class="back" role="button" @tap="back">‹ 返回</view>
    <view v-if="mode==='intro'" class="panel intro-panel">
      <view class="eyebrow">AI 潜力卡</view>
      <view class="title">发现适合你的<br/>AI 学习方向</view>
      <view class="description">回答 5 个轻松的问题，获得一张属于你的潜力卡。没有标准答案，按现在的兴趣选择就好。</view>
      <view class="notice">测试和学习记录保存在当前设备，不需要登录，也不会上传。</view>
      <button class="primary" @tap="start">{{hasDraft?'继续测试':'开始测试'}}</button>
      <view class="small">{{potentialDisclaimer}}</view>
    </view>
    <view v-else-if="mode==='quiz'" class="panel">
      <view class="eyebrow">AI 潜力测试</view>
      <view class="question-number">第 {{index+1}} / {{questions.length}} 题</view>
      <view class="progress"><view class="progress-fill" :style="{width:((index+1)/questions.length*100)+'%'}"></view></view>
      <view class="question">{{currentQuestion.prompt}}</view>
      <view class="description">选一个最接近你现在想法的选项。</view>
      <view v-for="option in currentQuestion.options" :key="option.id" class="option" :class="{'selected':draft[currentQuestion.id]===option.id}" @tap="choose(currentQuestion.id,option.id)">
        <text class="option-dot">{{draft[currentQuestion.id]===option.id?'●':'○'}}</text><text class="option-text">{{option.text}}</text>
      </view>
      <view class="buttons"><button class="secondary" @tap="previous">{{index===0?'稍后再测':'上一题'}}</button><button class="primary next" :disabled="!draft[currentQuestion.id]" :class="{'disabled':!draft[currentQuestion.id]}" @tap="next">{{index===questions.length-1?'查看潜力卡':'下一题'}}</button></view>
      <view class="small">可随时返回修改；答案只保存在当前设备。</view>
    </view>
    <view v-else-if="result" class="result">
      <view class="eyebrow">我的 AI 潜力卡</view>
      <view class="result-card">
        <view class="result-stage">成长阶段 · {{result.stage}} 级</view>
        <view class="result-name">{{result.card.name}}</view>
        <view class="result-description">{{result.card.description}}</view>
        <view v-if="result.stage>1" class="origin">最初获得：{{result.initialCard.name}}</view>
      </view>
      <view class="panel next-panel">
        <view class="section-title">接下来可以试试</view>
        <view v-for="item in recommendations" :key="item.kind+item.id" class="recommend" @tap="openRecommendation(item)"><view class="recommend-copy"><text class="recommend-type">{{item.kind==='guide'?'跟着做':'快捷提示词'}}</text><text class="recommend-title">{{item.title}}</text></view><text class="arrow">›</text></view>
        <view v-if="!recommendations.length" class="description">还可以到教程列表，选一件感兴趣的事。</view>
        <button class="secondary all-guides" @tap="openGuides">看看全部教程</button>
      </view>
      <view class="panel next-panel">
        <view class="section-title">成长记录</view>
        <view class="description">已自主标记完成 {{result.completedCount}} 篇不同教程。{{result.nextThreshold!==null?'累计完成 '+result.nextThreshold+' 篇可进入下一阶段。':'已到达第 4 阶段，可以继续探索更多教程。'}}</view>
        <view class="small">{{completionDisclaimer}}</view>
      </view>
      <view class="small result-disclaimer">{{potentialDisclaimer}}</view>
      <button class="secondary retry" @tap="retake">修改答案 / 重新测试</button>
    </view>
  </view>
</template>

<script setup>
import {computed,ref} from 'vue';
import {onLoad,onShow} from '@dcloudio/uni-app';
import guides from '../../data/mini-guides.json';
import {miniAids} from '../../data/mini-aids.js';
import {potentialQuestions,potentialDisclaimer,completionDisclaimer,evaluatePotential,resolvePotentialProgress} from '../../data/mini-potential.js';
const KEY='ainpe_mini_potential_v1', LEARNING='ainpe_mini_learning_v1';
const questions=potentialQuestions,mode=ref('intro'),index=ref(0),draft=ref({}),submitted=ref({}),result=ref(null),initialized=ref(false);
const currentQuestion=computed(()=>questions[index.value]||questions[0]);
const hasDraft=computed(()=>questions.some(q=>Boolean(draft.value[q.id])));
const recommendations=computed(()=>{
  const c=result.value?.card;if(!c)return [];
  const gs=(c.guideIds||[]).map(id=>guides.find(g=>g.id===id)).filter(Boolean).map(g=>({id:g.id,title:g.title,kind:'guide'}));
  const as=(c.aidIds||[]).map(id=>miniAids.find(a=>a.id===id)).filter(Boolean).map(a=>({id:a.id,title:a.title,kind:'aid'}));
  return [...gs,...as];
});
function read(key,fallback){try{return uni.getStorageSync(key)||fallback}catch{return fallback}}
function persist(value){try{uni.setStorageSync(KEY,value);return true}catch{uni.showToast({title:'保存失败，请重试',icon:'none'});return false}}
function refreshResult(){try{const next=resolvePotentialProgress(submitted.value,read(LEARNING,{}),guides);result.value=next.status==='complete'?next:null}catch{result.value=null}}
onLoad(()=>{
  const saved=read(KEY,{});submitted.value=saved&&typeof saved.answers==='object'?saved.answers:{};
  draft.value=saved&&typeof saved.draftAnswers==='object'?saved.draftAnswers:{};
  refreshResult();mode.value=result.value?'result':'intro';initialized.value=true;
});
onShow(()=>{if(initialized.value&&mode.value==='result')refreshResult()});
function start(){mode.value='quiz';index.value=Math.max(0,questions.findIndex(q=>!draft.value[q.id]));}
function choose(questionId,optionId){draft.value={...draft.value,[questionId]:optionId};persist({answers:submitted.value,draftAnswers:draft.value})}
function previous(){if(index.value>0){index.value--;return}mode.value=result.value?'result':'intro'}
function next(){
  if(!draft.value[currentQuestion.value.id])return;
  if(index.value<questions.length-1){index.value++;return}
  const checked=evaluatePotential(draft.value);if(checked.status!=='complete'){uni.showToast({title:'请先完成全部问题',icon:'none'});return}
  const answers={...draft.value};if(!persist({answers,draftAnswers:{}}))return;
  submitted.value=answers;draft.value={};refreshResult();mode.value='result';
}
function retake(){draft.value={...submitted.value};index.value=0;mode.value='quiz'}
function openRecommendation(item){uni.navigateTo({url:item.kind==='guide'?'/pages/learn/guide?id='+encodeURIComponent(item.id):'/pages/learn/library?id='+encodeURIComponent(item.id)})}
function openGuides(){uni.redirectTo({url:'/pages/learn/guides'})}
function back(){uni.navigateBack({fail:()=>uni.redirectTo({url:'/pages/learn/mine'})})}
</script>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;background:#f3f4f6;color:#17202e;padding:12px 16px calc(36px + env(safe-area-inset-bottom))}.back{display:inline-flex;align-items:center;min-height:44px;font-size:14px;color:#5c6e86;font-weight:700}.panel{padding:20px;border:1px solid #e5e9f1;border-radius:14px;background:#fff}.intro-panel{padding:24px 20px}.eyebrow{font-size:12px;color:#2849e9;font-weight:800}.title{font-size:26px;font-weight:850;line-height:1.35;margin-top:14px}.description{font-size:14px;line-height:1.7;color:#68788f;margin-top:10px}.notice{margin-top:20px;padding:12px;border-radius:9px;background:#f1f4fb;color:#63748e;font-size:12px;line-height:1.7}.primary,.secondary{box-sizing:border-box;border:0;border-radius:10px;font-size:14px;font-weight:700;line-height:44px;margin:0}.primary::after,.secondary::after{border:0}.primary{background:#2849e9;color:#fff}.intro-panel .primary{width:100%;margin-top:18px}.secondary{background:#eef1f7;color:#526278}.small{font-size:12px;line-height:1.7;color:#8491a2;margin-top:14px}.question-number{margin-top:20px;font-size:13px;font-weight:700;color:#657691}.progress{height:5px;background:#e9edf4;border-radius:4px;margin-top:9px;overflow:hidden}.progress-fill{height:100%;background:#2849e9;border-radius:4px}.question{font-size:21px;line-height:1.4;font-weight:800;margin-top:24px}.option{display:flex;align-items:center;gap:10px;min-height:48px;box-sizing:border-box;padding:12px;margin-top:10px;background:#f7f8fb;border:1px solid #e4e9f0;border-radius:10px;font-size:14px;color:#34445d}.option.selected{background:#eef2ff;border-color:#7289fa;color:#2849e9;font-weight:700}.option-dot{width:16px;color:#7185c1}.option-text{flex:1;line-height:1.5}.buttons{display:flex;gap:10px;margin-top:22px}.buttons .secondary{flex:1}.buttons .next{flex:2}.primary.disabled{background:#dfe4ef;color:#98a2b2}.result{padding-top:4px}.result-card{margin-top:12px;padding:24px 20px;border:1px solid #cfdbff;border-radius:15px;background:#eaf0ff}.result-stage{font-size:12px;color:#4763b6;font-weight:700}.result-name{font-size:28px;line-height:1.3;font-weight:850;color:#19377e;margin-top:12px}.result-description{font-size:14px;line-height:1.7;color:#5d7193;margin-top:8px}.origin{font-size:12px;color:#7182a3;margin-top:16px}.next-panel{margin-top:14px}.section-title{font-size:17px;font-weight:800}.recommend{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid #eef0f3}.recommend-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:5px}.recommend-type{font-size:11px;color:#7687a0}.recommend-title{font-size:14px;line-height:1.4;font-weight:750}.arrow{font-size:22px;color:#2849e9}.all-guides{margin-top:14px;width:100%}.result-disclaimer{margin:16px 3px}.retry{width:100%;margin-top:8px}
</style>
