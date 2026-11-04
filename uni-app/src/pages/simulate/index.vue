<template>
  <view class="sim-page">
    <SiteHeader active="simulate"/>
    <view class="sim-main">
      <view class="sim-intro">
        <text class="sim-kicker">AINPE · 模拟项目</text>
        <text class="sim-title">想做的项目，先亲手体验一次。</text>
        <text class="sim-lead">从一个任务开始，体验项目中的关键步骤，再看看不同做法带来的模拟反馈。</text>
        <text class="sim-note">方向参考生财有术往期航海与真实案例；游戏中的角色、事件和收益均为模拟，真实案例以作者自述为准。</text>
      </view>
      <!-- #ifdef H5 -->
      <view class="game-section">
        <text class="game-kicker">从一局模拟开始</text>
        <text class="sim-heading">选一个方向，亲自试一试</text>
        <text class="sim-note">体验项目中的关键决策与操作，完成后查看复盘；部分项目附真实案例。游戏数值为模拟，不能作为收入预测。</text>
        <view class="game-grid">
          <a v-for="game in newGames.slice(0,3)" :key="game.file" class="game-card" :href="gameHref(game.file)">
            <span class="game-number">{{game.number === '01' ? '推荐先试' : '项目模拟'}}</span>
            <strong class="game-title">{{game.title}}</strong>
            <span class="game-description">{{game.description}}</span>
            <span class="game-action">开始体验 <span aria-hidden="true">↗</span></span>
          </a>
        </view>
        <view class="more-games-heading"><text class="sim-heading">更多项目，也可以直接体验</text><text class="sim-note">每个方向有自己的项目流程和复盘。</text></view>
        <view class="game-grid">
          <a v-for="game in newGames.slice(3)" :key="game.file" class="game-card" :href="gameHref(game.file)">
            <span class="game-number">项目模拟</span>
            <strong class="game-title">{{game.title}}</strong>
            <span class="game-description">{{game.description}}</span>
            <span class="game-action">开始体验 <span aria-hidden="true">↗</span></span>
          </a>
        </view>
      </view>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <view class="interest-section"><text class="sim-heading">项目体验正在适配中</text><text class="sim-note">目前六个项目可在网页浏览器体验，小程序版本尚未开放。</text></view>
      <!-- #endif -->
      <view class="interest-section">
        <text class="interest-eyebrow">MORE TO EXPLORE</text>
        <text class="sim-heading">接下来还可以做什么？</text>
        <text class="sim-note">以下方向的模拟项目尚未开放；支持预约的方向可先表达兴趣。</text>
        <view class="interest-grid">
          <view v-for="item in visibleDirections" :key="item.id" class="interest-card">
            <text class="interest-name">{{item.name}}</text>
            <text class="interest-description">{{item.description}}</text>
            <view class="interest-actions">
              <button class="interest-button" :disabled="item.unavailable || loading || busy === item.id || hasInterest(item.id) || (remoteMode && !!error)" @tap="reserve(item.id)">{{item.unavailable ? '筹备中' : hasInterest(item.id) ? (remoteMode ? '已预约体验' : '已标记感兴趣') : busy === item.id ? '正在记录…' : (remoteMode ? '预约模拟体验' : '标记感兴趣')}}</button>
              <text v-if="!item.unavailable && remoteMode && !error && !loading && counts[item.id] > 0" class="interest-count">{{counts[item.id]}} 条预约记录</text>
            </view>
          </view>
        </view>
        <text v-if="remoteMode" class="interest-note">同一浏览器每个方向计一条预约记录；不收联系方式，不自动通知，不是官方航海报名。</text>
        <text v-else class="interest-note">仅保存在当前设备，站长无法收到或统计；不是官方航海报名。</text>
        <view v-if="error" class="interest-error"><text>{{error}}</text><button @tap="load">重试</button></view>
      </view>
      <SimCamp/>
    </view>
  </view>
</template>
<script setup>
import {ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import SiteHeader from '../../components/SiteHeader.vue';
import SimCamp from './SimCamp.vue';

// #ifdef H5
const newGames=[
  {number:'01',file:'miniapp.html',title:'AI 小程序副业',description:'从想法、制作到上线推广，体验一个小程序项目。'},
  {number:'02',file:'video.html',title:'AI 视频定制',description:'理解客户需求、制作样片，模拟完成视频订单。'},
  {number:'03',file:'education-ppt.html',title:'小红书教育 PPT',description:'选题、检查课件、上架，体验内容制作与销售。'},
  {number:'04',file:'voyage-lab.html?project=books',title:'AI 视频带货',description:'从账号准备、挑选商品到视频发布与复盘。'},
  {number:'05',file:'voyage-lab.html?project=brain',title:'AI 第二大脑 · 内容创作',description:'整理素材、梳理方向，写出一个具体选题。'},
  {number:'06',file:'voyage-lab.html?project=trends',title:'海外热词游戏站',description:'从用户需求、页面规划到上线复盘。'}
];
const gameHref=file=>`${import.meta.env.BASE_URL}static/simulation-games/${file}`;
// #endif
const directions=[{id:'voyage-agent',name:'AI Agent 架构师',description:'设计一个能完成任务的工作流。'},{id:'voyage-office',name:'AI 办公自动化',description:'把重复任务整理为可执行流程。'},{id:'voyage-enterprise',name:'AI 企业服务',description:'从客户问题到交付方案。'}];
const visibleDirections=directions;
const VALID=new Set(['voyage-agent','voyage-miniapp','voyage-secondbrain','voyage-office','voyage-enterprise']);
const DEVICE_KEY='ainpe:local-simulation-interests';
let remoteMode=false;
// #ifdef H5
remoteMode=true;
// #endif
const counts=ref({}),mine=ref([]),loading=ref(false),busy=ref(''),error=ref('');
const hasInterest=id=>mine.value.includes(id);
function request(options){return new Promise((resolve,reject)=>uni.request({...options,timeout:8000,success:response=>response.statusCode>=200&&response.statusCode<300?resolve(response.data):reject(new Error('unavailable')),fail:reject}));}
async function load(){
  error.value='';
  if(!remoteMode){
    try{const v=uni.getStorageSync(DEVICE_KEY);mine.value=Array.isArray(v)?v.filter(id=>VALID.has(id)):[];}catch{error.value='无法读取本设备的兴趣标记。';}
    return;
  }
  loading.value=true;
  try{
    const result=await request({url:'/api/reservations',method:'GET'});
    if(result?.countUnit!=='browser'||!Array.isArray(result.mine)||!result.counts||typeof result.counts!=='object')throw new Error('invalid');
    const checked={};
    for(const id of VALID){const n=result.counts[id]??0;if(!Number.isInteger(n)||n<0)throw new Error('invalid');checked[id]=n;}
    counts.value=checked;mine.value=result.mine.filter(id=>VALID.has(id));
  }catch{error.value='暂时无法连接预约服务，预约数未更新。';}
  finally{loading.value=false;}
}
async function reserve(id){
  if(!VALID.has(id)||loading.value||busy.value||hasInterest(id))return;
  error.value='';busy.value=id;
  try{
    if(remoteMode){
      const result=await request({url:'/api/reservations',method:'POST',header:{'Content-Type':'application/json'},data:{projectId:id}});
      if(result?.projectId!==id||result.reserved!==true||result.countUnit!=='browser'||!Number.isInteger(result.count)||result.count<0)throw new Error('invalid');
      counts.value={...counts.value,[id]:result.count};mine.value=[...mine.value,id];
    }else{
      const next=[...mine.value,id];uni.setStorageSync(DEVICE_KEY,next);mine.value=next;
    }
  }catch{error.value=remoteMode?'预约没有完成，请稍后重试。':'未能保存在本设备，请稍后重试。';}
  finally{busy.value='';}
}
onShow(load);
</script>
<style src="./simulate.css"></style>
<style scoped>
.game-section{margin:10px 0 36px}.game-kicker{display:block;margin:0 0 8px;color:#73905f;font-size:11px;font-weight:700;letter-spacing:.1em}.game-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:16px}.game-card{display:flex;min-height:160px;flex-direction:column;box-sizing:border-box;padding:20px;border:1px solid #d4e4ce;border-radius:10px;background:#f5f9ed;color:#244d35;text-decoration:none;transition:transform .18s,border-color .18s,box-shadow .18s}.game-card:hover,.game-card:focus-visible{transform:translateY(-2px);border-color:#8cb87b;box-shadow:0 8px 22px #234c2914;outline:none}.game-number{font-size:10px;letter-spacing:.08em;color:#7e9f6f;font-weight:700}.game-title{font-size:18px;margin-top:13px}.game-description{font-size:12px;line-height:1.7;margin-top:8px;color:#70876b}.game-action{font-size:13px;font-weight:700;margin-top:auto;padding-top:18px;color:#2f673c}.game-action span{margin-left:4px}@media(max-width:700px){.game-grid{grid-template-columns:1fr}.game-card{min-height:0;padding:17px}.game-action{padding-top:12px}}
.more-games-heading{margin-top:32px}.more-games-heading .sim-heading,.more-games-heading .sim-note{display:block}
.interest-section{margin:35px 0 28px}.interest-eyebrow{display:block;color:#7c9a70;font-size:11px;letter-spacing:.08em;font-weight:700;margin-bottom:6px}.interest-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.interest-card{padding:17px;border:1px solid #dce8d7;border-radius:8px;background:#fff}.interest-name,.interest-description,.interest-note{display:block}.interest-name{font-size:15px;font-weight:700;color:#294b36}.interest-description{font-size:12px;color:#789078;line-height:1.6;margin-top:7px;min-height:20px}.interest-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.interest-button{margin:0;padding:0 12px;line-height:32px;font-size:12px;font-weight:700;color:#fff;background:#285b3b;border-radius:5px}.interest-button[disabled]{color:#65876b;background:#e4eee0}.interest-count,.interest-note{font-size:11px;color:#80937d}.interest-note{margin-top:13px;line-height:1.7}.interest-error{display:flex;align-items:center;gap:10px;margin-top:10px;color:#a1533e;font-size:12px}.interest-error button{margin:0;padding:0 8px;font-size:12px;line-height:28px;color:#8e4c39;background:#f8ece6}@media(max-width:700px){.interest-grid{grid-template-columns:1fr}.interest-card{padding:15px}}
.interest-card{background:#f0f1ec;border-color:#e0e4da}.interest-name{color:#61766a}.interest-description{color:#89968d}
</style>
