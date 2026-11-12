<template>
<!-- #ifdef MP-WEIXIN -->

  <view class="mine" :style="{paddingTop: top + 'px'}">
    <view class="head"><view class="brand-mark">↗</view><text>AINPE实战情报站</text></view>
    <view class="content">
      <view class="title">我的</view>
      <view class="ai-lv"><AiLevelCard :xp="ai.xp" :streak="aiStreak" :plays="aiPlays" :lessons="aiLessons" :today-text="aiToday" :show-account="true" :avatar="account.avatar" :logged-in="account.loggedIn" @account="onAccountTap" /></view>
      <!-- #ifdef MP-WEIXIN -->
      <view v-if="!accountOpen && account.loggedIn && account.status.includes('冲突')" class="conflict-notice" @tap="accountOpen=true">学习记录有冲突，点击处理 ›</view>
      <view v-if="accountOpen && account.loggedIn" class="account-panel">
        <view class="account-heading"><view><text class="account-title">个人资料</text><text class="account-heading-hint">设置你的头像和昵称</text></view><button class="account-close" aria-label="关闭个人资料" @tap="accountOpen=false">×</button></view>
        <view class="profile-row">
          <view class="profile-avatar"><image v-if="account.avatar" class="profile-image" :src="account.avatar" mode="aspectFill" /><text v-else>头像</text></view>
          <view class="profile-info"><text class="profile-label">微信头像</text><text class="account-hint">选择你想展示的头像</text></view>
          <button open-type="chooseAvatar" class="profile-select" :disabled="avatarSaving" @chooseavatar="chooseAvatar">{{avatarSaving ? '保存中…' : (account.avatar ? '更换头像' : '选择头像')}}</button>
        </view>
        <view class="profile-nickname"><view class="nickname-heading"><text class="profile-label">昵称</text><text v-if="account.nickname" class="current-nickname">当前：{{account.nickname}}</text></view><view class="account-name"><input v-model="nickname" type="nickname" placeholder="选择或输入昵称" maxlength="30" /><button @tap="saveNickname">保存</button></view></view>
        <view class="account-status-row"><view class="account-status-dot" :class="{'status-warning':accountStatusWarning,'status-busy':accountStatusBusy}" /><text class="account-status">{{account.status}}</text></view>
        <button v-if="account.status.includes('冲突')" class="conflict-action" @tap="openConflict">处理同步冲突 ›</button>
        <button class="account-more" :aria-expanded="showAccountTools" @tap="showAccountTools=!showAccountTools">{{showAccountTools ? '收起账号与同步设置' : '账号与同步设置'}} <text>{{showAccountTools ? '▴' : '▾'}}</text></button>
        <view v-if="showAccountTools" class="account-tools"><button @tap="syncAccount">重新同步 <text>›</text></button><button @tap="openConflict">比较本机和云端记录 <text>›</text></button><button @tap="openBackups">查看备份记录 <text>›</text></button><button class="logout" @tap="doLogout">退出登录 <text>›</text></button></view>
        <view v-if="account.loggedIn && conflictView" class="resolve-panel">
          <text class="resolve-title">{{conflictView.heading}}</text><text class="account-hint">{{conflictView.description}}</text>
          <view v-for="choice in conflictView.choices" :key="choice.key" class="resolve-choice"><text class="resolve-title">{{choice.label}}</text><text class="account-hint">经验 {{choice.summary.xp}} · 完成 {{choice.summary.daily}} 期 · 学完 {{choice.summary.lessons}} 课 · 收藏 {{choice.summary.favorites}} 篇 · 学习 {{choice.summary.guides}} 篇</text><button class="account-button" @tap="chooseResolution(choice.key)">{{choice.label}}</button></view>
          <button class="account-exit" @tap="conflictView=null">暂不处理</button>
        </view>
        <view v-if="account.loggedIn && showBackups" class="resolve-panel"><text class="resolve-title">备份记录（{{accountBackups.length}} / 20）</text><text class="account-hint">备份保存在当前账号，只有主动删除才会移除。</text><text v-if="!accountBackups.length" class="account-hint">暂无备份</text>
          <view v-for="item in accountBackups" :key="item.id" class="resolve-choice"><text class="account-hint">{{backupTime(item.createdAt)}}</text><view class="backup-actions"><button @tap="restoreBackup(item.id,'local')">查看本机备份</button><button @tap="restoreBackup(item.id,'remote')">查看云端备份</button><button @tap="removeBackup(item.id)">删除</button></view></view>
        </view>
      </view>
      <!-- #endif -->
      <view class="ai-go"><view class="ai-go-b" hover-class="press" @tap="openDaily">{{aiTodayDone ? '今天已玩 · 再看看每日 AI' : '去玩今天的每日 AI'}}</view><view class="ai-go-b soft" hover-class="press" @tap="openLearning">去学 AI</view></view>
      <view class="section-title">学 AI 徽章<text class="section-note">已获得 {{badgeCount}} / {{badges.length}} 枚{{freshIds.length ? ' · 新拿到 ' + freshIds.length + ' 枚' : ''}}</text></view>
      <!-- 没拿到的是白章 + 一圈进度，拿到的是金章；刚拿到、第一次来看的那枚会转着弹出来，角上标「新」 -->
      <view class="badges">
        <view v-for="b in badges" :key="b.id" class="bdg" :class="{got: b.got, fresh: b.fresh}">
          <view class="bdg-art"><image class="bdg-img" :src="b.img" mode="aspectFit" :style="b.fresh ? 'animation-delay:' + b.delay + 's' : ''" /></view>
          <text v-if="b.fresh" class="bdg-new" :style="'animation-delay:' + (b.delay + 0.8) + 's'">新</text>
          <text class="bdg-n">{{b.name}}</text><text class="bdg-d">{{b.got ? '已获得' : b.detail}}</text>
        </view>
      </view>
      <view class="section-title">继续学习</view>
      <view v-if="recent.length" class="list">
        <view v-for="item in visibleRecent" :key="item.id" class="row" @tap="openResume(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="meta">已完成 {{item.done}} / {{item.total}} 步</text><text class="action">继续学习 →</text></view>
        </view>
        <button v-if="recent.length>1" class="expand" @tap="showAllRecent=!showAllRecent">{{showAllRecent?'收起学习记录':'查看更多学习记录（'+recent.length+'）'}}</button>
      </view>
      <view v-else class="empty"><text class="empty-title">从一件小事开始</text><text class="empty-text">完成的步骤会记录在这里，方便下次接着做。</text><button class="primary" @tap="openGuides">看看有哪些教程</button></view>
      <view class="potential" @tap="openPotential">
        <view class="potential-mark">✦</view><view class="potential-copy"><text class="potential-title">AI 潜力卡</text><text class="potential-desc">{{potential ? potential.card.name+' · '+potential.stage+' 级' : '做个小测试，找到你的 AI 学习方向'}}</text><text class="potential-link">{{potential?'查看我的潜力卡':'去测一测'}} →</text></view>
      </view>
      <view class="section-title">我的收藏</view>
      <view v-if="favorites.length" class="list">
        <view class="row collection-row" @tap="showFavorites=!showFavorites"><view class="copy"><text class="name">已收藏 {{favorites.length}} 篇教程</text><text class="meta">{{showFavorites?'收起收藏':'展开查看收藏'}}</text></view><text class="action">{{showFavorites?'收起':'查看'}} ›</text></view>
        <template v-if="showFavorites">
        <view v-for="item in favorites" :key="item.id" class="row" @tap="open(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="action">查看教程 →</text></view>
        </view>
        </template>
      </view>
      <view v-else class="empty"><text class="empty-title">还没有收藏教程</text><text class="empty-text">看到想以后再做的内容，可以在教程里收藏。</text></view>
      <view class="section-title">帮助与反馈</view>
      <view class="list"><view class="row feedback-row" @tap="openFeedback"><view class="copy"><text class="name">提交想解决的问题</text><text class="meta">没找到合适内容？告诉我们你希望用 AI 做什么</text></view><text class="action">前往 →</text></view></view>
    </view>
    <MiniNav active="saved" />
  </view>

<!-- #endif -->
<!-- #ifndef MP-WEIXIN -->

  <view class="mine" :style="{paddingTop: top + 'px'}">
    <view class="head"><view class="brand-mark">↗</view><text>AINPE实战情报站</text></view>
    <view class="content">
      <view class="title">我的</view>
      <view class="intro">学习记录保存在当前设备</view>
      <view class="ai-lv"><AiLevelCard :xp="ai.xp" :streak="aiStreak" :plays="aiPlays" :lessons="aiLessons" :today-text="aiToday" /></view>
      <view class="ai-go"><view class="ai-go-b" hover-class="press" @tap="openDaily">{{aiTodayDone ? '今天已玩 · 再看看每日 AI' : '去玩今天的每日 AI'}}</view><view class="ai-go-b soft" hover-class="press" @tap="openLearning">去学 AI</view></view>
      <view class="section-title">学 AI 徽章<text class="section-note">已获得 {{badgeCount}} / {{badges.length}} 枚</text></view>
      <view class="badges">
        <view v-for="b in badges" :key="b.id" class="bdg" :class="{got: b.got}">
          <view class="bdg-ic"><view class="bdg-s1" /><view class="bdg-s2" /><view class="bdg-s3" /></view>
          <text class="bdg-n">{{b.name}}</text><text class="bdg-d">{{b.got ? '已获得' : b.detail}}</text>
        </view>
      </view>
      <view class="section-title">继续学习</view>
      <view v-if="recent.length" class="list">
        <view v-for="item in visibleRecent" :key="item.id" class="row" @tap="openResume(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="meta">已完成 {{item.done}} / {{item.total}} 步</text><text class="action">继续学习 →</text></view>
        </view>
        <button v-if="recent.length>1" class="expand" @tap="showAllRecent=!showAllRecent">{{showAllRecent?'收起学习记录':'查看更多学习记录（'+recent.length+'）'}}</button>
      </view>
      <view v-else class="empty"><text class="empty-title">从一件小事开始</text><text class="empty-text">完成的步骤会记录在这里，方便下次接着做。</text><button class="primary" @tap="openGuides">看看有哪些教程</button></view>
      <view class="potential" @tap="openPotential">
        <view class="potential-mark">✦</view><view class="potential-copy"><text class="potential-title">AI 潜力卡</text><text class="potential-desc">{{potential ? potential.card.name+' · '+potential.stage+' 级' : '做个小测试，找到你的 AI 学习方向'}}</text><text class="potential-link">{{potential?'查看我的潜力卡':'去测一测'}} →</text></view>
      </view>
      <view class="section-title">我的收藏</view>
      <view v-if="favorites.length" class="list">
        <view class="row collection-row" @tap="showFavorites=!showFavorites"><view class="copy"><text class="name">已收藏 {{favorites.length}} 篇教程</text><text class="meta">{{showFavorites?'收起收藏':'展开查看收藏'}}</text></view><text class="action">{{showFavorites?'收起':'查看'}} ›</text></view>
        <template v-if="showFavorites">
        <view v-for="item in favorites" :key="item.id" class="row" @tap="open(item.id)">
          <image v-if="item.cover" class="cover" :src="item.cover" mode="aspectFill" />
          <view class="copy"><text class="name">{{item.title}}</text><text class="action">查看教程 →</text></view>
        </view>
        </template>
      </view>
      <view v-else class="empty"><text class="empty-title">还没有收藏教程</text><text class="empty-text">看到想以后再做的内容，可以在教程里收藏。</text></view>
      <view class="section-title">帮助与反馈</view>
      <view class="list"><view class="row feedback-row" @tap="openFeedback"><view class="copy"><text class="name">提交想解决的问题</text><text class="meta">没找到合适内容？告诉我们你希望用 AI 做什么</text></view><text class="action">前往 →</text></view></view>
      <view class="notice">等级、徽章、记录和收藏保存在当前设备，不会自动与网站同步。</view>
    </view>
    <MiniNav active="saved" />
  </view>

<!-- #endif -->
</template>
<script setup>
// #ifdef MP-WEIXIN

import { computed, ref, watch } from 'vue';
import { account, restoreAccount, loginAccount, logoutAccount, updateNickname, updateAvatar, syncAccount, conflictView, accountBackups, inspectAccountConflict, loadAccountBackups, inspectAccountBackup, deleteAccountBackup, chooseAccountResolution } from '../../data/mini-account.js';
import { avatarFailureText } from '../../data/mini-avatar.js';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import AiLevelCard from '../../components/AiLevelCard.vue';
import mini from '../../data/mini-ai.json';
import { loadStore as loadAi, streak as aiStreakOf, issueByDate, unitState, shortName, ymd, badgeImage, loadSeen, markSeen } from '../../data/ai-core.js';
import guides from '../../data/mini-guides.json';
import zuoData from '../../data/mini-zuo.json';
import { resolvePotentialProgress } from '../../data/mini-potential.js';
const accountOpen=ref(false),nickname=ref(''),showBackups=ref(false),showAccountTools=ref(false),loginBusy=ref(false),avatarSaving=ref(false);
const accountStatusWarning=computed(()=>/冲突|未同步|失败|未完成|不可用|发生变化|备份已满/.test(account.value.status));
const accountStatusBusy=computed(()=>/正在|准备/.test(account.value.status));
async function openConflict(){await inspectAccountConflict()}
async function openBackups(){showBackups.value=!showBackups.value;if(showBackups.value)await loadAccountBackups()}
async function restoreBackup(id,side){await inspectAccountBackup(id,side)}
async function removeBackup(id){await deleteAccountBackup(id)}
async function chooseResolution(key){await chooseAccountResolution(key)}
function backupTime(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))return '备份记录';const t=new Date(d.getTime()+8*3600000),pad=x=>String(x).padStart(2,'0');return t.getUTCFullYear()+'-'+pad(t.getUTCMonth()+1)+'-'+pad(t.getUTCDate())+' '+pad(t.getUTCHours())+':'+pad(t.getUTCMinutes())+'（北京时间）'}
async function doLogin(){if(loginBusy.value)return;loginBusy.value=true;try{await loginAccount();if(account.value.loggedIn)accountOpen.value=true;else uni.showToast({title:'登录未完成，可稍后再试',icon:'none'})}finally{loginBusy.value=false}}
function onAccountTap(){if(account.value.loggedIn)accountOpen.value=!accountOpen.value;else doLogin()}
async function doLogout(){await logoutAccount();accountOpen.value=false;showAccountTools.value=false;showBackups.value=false;nickname.value=''}
async function chooseAvatar(e){const path=e.detail?.avatarUrl;if(!path||avatarSaving.value)return;avatarSaving.value=true;try{const result=await updateAvatar(path);if(result.ok||result.reason==='changed')return;uni.showModal({title:'头像未保存',content:avatarFailureText(result.reason),showCancel:false})}catch{uni.showModal({title:'头像未保存',content:avatarFailureText('upload'),showCancel:false})}finally{avatarSaving.value=false}}
async function saveNickname(){if(!await updateNickname(nickname.value))uni.showToast({title:'昵称未能保存，请重试',icon:'none'});else uni.showToast({title:'昵称已保存',icon:'success'})}
watch(()=>account.value.status,()=>loadMine());
watch(()=>account.value.loggedIn,()=>{freshIds.value=[];loadMine()});
const recent=ref([]),favorites=ref([]),potential=ref(null),showAllRecent=ref(false),showFavorites=ref(false);
const visibleRecent=computed(()=>showAllRecent.value?recent.value:recent.value.slice(0,1));
let top=0;try{top=Number((typeof wx!=='undefined'&&typeof wx.getWindowInfo==='function'?wx.getWindowInfo():uni.getSystemInfoSync()).statusBarHeight)||0}catch{}
function read(key,fallback){try{return uni.getStorageSync(key)||fallback}catch{return fallback}}
// AI 等级卡和学 AI 徽章（记录在 ainpe_mini_ai_level_v1，规则见 data/ai-core.js）
const ai=ref(loadAi(uni)),aiProgress=ref({}),aiDay=ref(ymd(new Date()));
const aiStreak=computed(()=>aiStreakOf(ai.value,mini.meiri.ISSUES,aiDay.value));
const aiPlays=computed(()=>Object.keys(ai.value.daily).length);
const aiLessons=computed(()=>Object.keys(ai.value.lessons).length);
const aiTodayIssue=computed(()=>issueByDate(mini.meiri.ISSUES,aiDay.value));
const aiTodayDone=computed(()=>!!(aiTodayIssue.value&&ai.value.daily[aiTodayIssue.value.id]));
const aiToday=computed(()=>aiTodayIssue.value?(aiTodayDone.value?'今天的每日 AI 已完成':'今天的每日 AI 还没玩'):'今天这期还在准备');
// freshIds：拿到了但还没庆祝过的徽章（比如做完第 6 单元的作品时拿到的），进页面时弹一次，一枚接一枚
const freshIds=ref([]);
const badges=computed(()=>mini.xue.UNITS.map(u=>{const st=unitState(u,ai.value,guides,aiProgress.value),k=freshIds.value.indexOf(u.id);return {id:u.id,name:shortName(u),got:st.badge,img:badgeImage(u,st),fresh:k>=0,delay:Math.max(k,0)*0.35,detail:(u.needProjects&&st.lessons===st.total&&!st.badge)?'还差 1 件作品':st.lessons+' / '+st.total+' 节'}}));
const badgeCount=computed(()=>badges.value.filter(b=>b.got).length);
function checkFresh(){const seen=loadSeen(uni);const earned=mini.xue.UNITS.filter(u=>unitState(u,ai.value,guides,aiProgress.value).badge).map(u=>u.id);const newlyEarned=earned.filter(id=>!seen[id]);freshIds.value=[...new Set([...freshIds.value.filter(id=>earned.includes(id)),...newlyEarned])];newlyEarned.forEach(id=>markSeen(uni,id))}
function openDaily(){uni.redirectTo({url:'/pages/learn/daily'})}
function openLearning(){uni.redirectTo({url:'/pages/learn/learning'})}
function loadMine(){
  const progress=read('ainpe_mini_learning_v1',{}), saved=read('ainpe_mini_favorites_v1',[]);
  ai.value=loadAi(uni);aiProgress.value=progress;aiDay.value=ymd(new Date());checkFresh();
  recent.value=guides.flatMap(g=>{const p=progress&&typeof progress==='object'?progress[g.id]:null;const total=(g.steps||[]).length;const done=Array.isArray(p?.completedSteps)?new Set(p.completedSteps.filter(i=>Number.isInteger(i)&&i>=0&&i<total)).size:0;return done?[{...g,done,total,updatedAt:p.updatedAt||''}]:[]}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  favorites.value=guides.filter(g=>Array.isArray(saved)&&saved.includes(g.id));
  const card=read('ainpe_mini_potential_v1',{});
  try{const result=resolvePotentialProgress(card?.answers,progress,guides);potential.value=result.status==='complete'?result:null}catch{potential.value=null}
}
onShow(()=>{freshIds.value=[];loadMine(); if(account.value.loggedIn)syncAccount(); else restoreAccount()});
function open(id){uni.navigateTo({url:(zuoData.SCRIPTS[id]?'/pages/learn/zuo?id=':'/pages/learn/guide?id=')+encodeURIComponent(id)})}
function openResume(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)+'&resume=1'})}
function openFeedback(){uni.navigateTo({url:'/pages/learn/find?feedback=1'})}
function openPotential(){uni.navigateTo({url:'/pages/learn/potential'})}
function openGuides(){uni.redirectTo({url:'/pages/learn/guides'})}

// #endif
// #ifndef MP-WEIXIN

import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MiniNav from '../../components/MiniNav.vue';
import AiLevelCard from '../../components/AiLevelCard.vue';
import mini from '../../data/mini-ai.json';
import { loadStore as loadAi, streak as aiStreakOf, issueByDate, unitState, shortName, ymd } from '../../data/ai-core.js';
import guides from '../../data/mini-guides.json';
import zuoData from '../../data/mini-zuo.json';
import { resolvePotentialProgress } from '../../data/mini-potential.js';
const recent=ref([]),favorites=ref([]),potential=ref(null),showAllRecent=ref(false),showFavorites=ref(false);
const visibleRecent=computed(()=>showAllRecent.value?recent.value:recent.value.slice(0,1));
let top=0;try{top=Number((typeof wx!=='undefined'&&typeof wx.getWindowInfo==='function'?wx.getWindowInfo():uni.getSystemInfoSync()).statusBarHeight)||0}catch{}
function read(key,fallback){try{return uni.getStorageSync(key)||fallback}catch{return fallback}}
// AI 等级卡和学 AI 徽章（记录在 ainpe_mini_ai_level_v1，规则见 data/ai-core.js）
const ai=ref(loadAi(uni)),aiProgress=ref({}),aiDay=ref(ymd(new Date()));
const aiStreak=computed(()=>aiStreakOf(ai.value,mini.meiri.ISSUES,aiDay.value));
const aiPlays=computed(()=>Object.keys(ai.value.daily).length);
const aiLessons=computed(()=>Object.keys(ai.value.lessons).length);
const aiTodayIssue=computed(()=>issueByDate(mini.meiri.ISSUES,aiDay.value));
const aiTodayDone=computed(()=>!!(aiTodayIssue.value&&ai.value.daily[aiTodayIssue.value.id]));
const aiToday=computed(()=>aiTodayIssue.value?(aiTodayDone.value?'今天的每日 AI 已完成':'今天的每日 AI 还没玩'):'今天这期还在准备');
const badges=computed(()=>mini.xue.UNITS.map(u=>{const st=unitState(u,ai.value,guides,aiProgress.value);return {id:u.id,name:shortName(u),got:st.badge,detail:st.lessons+' / '+st.total+' 节'+((u.needProjects&&st.lessons===st.total&&!st.badge)?' · 差 1 件作品':'')}}));
const badgeCount=computed(()=>badges.value.filter(b=>b.got).length);
function openDaily(){uni.redirectTo({url:'/pages/learn/daily'})}
function openLearning(){uni.redirectTo({url:'/pages/learn/learning'})}
onShow(()=>{
  const progress=read('ainpe_mini_learning_v1',{}), saved=read('ainpe_mini_favorites_v1',[]);
  ai.value=loadAi(uni);aiProgress.value=progress;aiDay.value=ymd(new Date());
  recent.value=guides.flatMap(g=>{const p=progress&&typeof progress==='object'?progress[g.id]:null;const total=(g.steps||[]).length;const done=Array.isArray(p?.completedSteps)?new Set(p.completedSteps.filter(i=>Number.isInteger(i)&&i>=0&&i<total)).size:0;return done?[{...g,done,total,updatedAt:p.updatedAt||''}]:[]}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  favorites.value=guides.filter(g=>Array.isArray(saved)&&saved.includes(g.id));
  const card=read('ainpe_mini_potential_v1',{});
  try{const result=resolvePotentialProgress(card?.answers,progress,guides);potential.value=result.status==='complete'?result:null}catch{potential.value=null}
});
function open(id){uni.navigateTo({url:(zuoData.SCRIPTS[id]?'/pages/learn/zuo?id=':'/pages/learn/guide?id=')+encodeURIComponent(id)})}
function openResume(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)+'&resume=1'})}
function openFeedback(){uni.navigateTo({url:'/pages/learn/find?feedback=1'})}
function openPotential(){uni.navigateTo({url:'/pages/learn/potential'})}
function openGuides(){uni.redirectTo({url:'/pages/learn/guides'})}

// #endif
</script>
<style scoped>
/* #ifdef MP-WEIXIN */

.mine{min-height:100vh;box-sizing:border-box;background:#f3f4f6;color:#17202e;padding-bottom:calc(52px + env(safe-area-inset-bottom))}.head{height:48px;display:flex;align-items:center;gap:9px;padding:0 110px 0 16px;background:#fff;font-size:16px;font-weight:800}.brand-mark{width:30px;height:30px;border-radius:8px;background:#ffc83d;display:flex;align-items:center;justify-content:center;font-size:22px;color:#112d25}.content{padding:24px 16px}.title{font-size:27px;font-weight:800}.intro{font-size:13px;color:#758091;margin-top:5px}.section-title{font-size:19px;font-weight:800;margin:28px 0 12px}.list{background:#fff;border-radius:14px;overflow:hidden}.row{display:flex;gap:12px;padding:14px;border-bottom:1px solid #edf0f3}.row:last-child{border-bottom:0}.feedback-row,.collection-row{align-items:center}.cover{width:74px;height:74px;flex:none;border-radius:10px;background:#eef1f5}.copy{min-width:0;display:flex;flex-direction:column;gap:6px}.feedback-row .copy,.collection-row .copy{flex:1}.name{font-weight:750;font-size:15px;line-height:1.4}.meta{color:#758091;font-size:12px}.action{color:#2849e9;font-size:13px;font-weight:700}.empty{background:#fff;border-radius:14px;padding:18px}.empty-title,.empty-text{display:block}.empty-title{font-size:15px;font-weight:750}.empty-text{font-size:13px;color:#758091;line-height:1.6;margin-top:6px}.primary{display:inline-block;margin:14px 0 0;background:#2849e9;color:#fff;font-size:13px;line-height:38px;padding:0 14px;border-radius:9px}.notice{color:#758091;font-size:12px;line-height:1.6;margin-top:24px}.expand{width:100%;margin:0;background:#fff;color:#2849e9;font-size:12px;line-height:42px;border-radius:0}.expand::after{border:0}.potential{display:flex;gap:14px;align-items:center;margin-top:24px;padding:18px;background:#eaf0ff;border:1px solid #dce6ff;border-radius:14px}.potential-mark{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;border-radius:12px;background:#2849e9;color:#fff;font-size:24px}.potential-copy{display:flex;min-width:0;flex-direction:column;gap:5px}.potential-title{font-size:17px;font-weight:800;color:#172d61}.potential-desc{font-size:12px;color:#647791;line-height:1.5}.potential-link{font-size:13px;font-weight:700;color:#2849e9}
.conflict-notice{margin-top:8px;color:#a65318;font-size:13px;font-weight:700}.resolve-panel{margin-top:14px;padding:12px;border-radius:10px;background:#f4f6fc}.resolve-title{display:block;font-weight:800;font-size:14px;margin-bottom:6px}.resolve-choice{margin-top:10px;padding:10px;border-radius:8px;background:#fff}.backup-actions{display:flex;gap:5px;flex-wrap:wrap}.backup-actions button{margin:8px 0 0;padding:0 7px;font-size:11px;line-height:32px;color:#2849e9;background:#eef2ff}.account-panel{margin-top:10px;padding:16px;background:#fff;border:1px solid #e6ebf4;border-radius:16px;box-shadow:0 8px 24px rgba(29,51,105,.05)}.account-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.account-title,.account-heading-hint,.profile-label{display:block}.account-title{font-size:16px;font-weight:800;color:#172a46}.account-heading-hint{margin-top:4px;font-size:12px;color:#8290a3}.account-close{flex:none;width:32px;height:32px;line-height:30px;padding:0;margin:0;border-radius:50%;font-size:22px;font-weight:400;color:#718097;background:#f2f5f9}.profile-row{display:flex;align-items:center;gap:10px;margin-top:16px}.profile-avatar{width:54px;height:54px;flex:none;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;background:#eef2ff;color:#7182a8;font-size:12px;border:2px solid #e4ebff}.profile-image{width:100%;height:100%}.profile-info{flex:1;min-width:0}.profile-label{font-size:13px;font-weight:700;color:#2a3d57}.profile-select{flex:none;margin:0;padding:0 12px;line-height:36px;border-radius:9px;background:#eef2ff;color:#2849e9;font-size:12px;font-weight:700}.profile-nickname{margin-top:16px}.nickname-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.current-nickname{max-width:65%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#8290a3}.account-hint,.account-status{display:block;font-size:12px;color:#68788f;line-height:1.6}.account-button{margin:10px 0;background:#2849e9;color:#fff;font-size:13px;line-height:40px}.account-name{display:flex;align-items:center;gap:8px;margin-top:8px}.account-name input{flex:1;min-width:0;height:40px;padding:0 12px;border:1px solid #dbe2ee;border-radius:9px;font-size:14px}.account-name button{flex:none;margin:0;padding:0 15px;background:#2849e9;color:#fff;font-size:12px;font-weight:700;line-height:40px;border-radius:9px}.account-status-row{display:flex;align-items:flex-start;gap:7px;margin-top:14px}.account-status-dot{flex:none;width:7px;height:7px;margin-top:6px;border-radius:50%;background:#4ea475}.account-status-dot.status-warning{background:#e18a3d}.account-status-dot.status-busy{background:#6686da}.account-status{flex:1;min-width:0}.conflict-action{margin:10px 0 0;padding:0 12px;line-height:38px;font-size:12px;font-weight:700;color:#9c531e;background:#fff4e8;border-radius:9px}.account-more{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:42px;margin:12px 0 0;padding:0;border-radius:0;border-top:1px solid #edf0f4;background:transparent;color:#63748b;font-size:13px;text-align:left}.account-more text{font-size:14px;color:#8290a3}.account-tools{padding:2px 0 0}.account-tools button{display:flex;align-items:center;justify-content:space-between;width:100%;margin:0;padding:0 4px;background:transparent;color:#455c76;font-size:13px;line-height:42px;text-align:left}.account-tools button text{color:#9aa8b8;font-size:18px}.account-tools button.logout{color:#9c6666}.account-exit{margin:10px 0 0;background:#eef2ff;color:#2849e9;font-size:12px;line-height:36px}.ai-lv{margin-top:16px}
.ai-go{display:flex;gap:10px;margin-top:10px}.ai-go-b{flex:1;min-height:44px;line-height:44px;text-align:center;border-radius:14px;background:linear-gradient(155deg,#ffda68 0%,#ffc83d 65%,#f6bc30 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.58),inset 0 -1px 0 rgba(169,110,5,.12),0 5px 12px -8px rgba(120,80,7,.42);color:#112d25;font-size:14px;font-weight:800}.ai-go-b.soft{color:#112d25}
.section-note{font-size:12px;font-weight:700;color:#758091;margin-left:8px}
.badges{display:flex;flex-wrap:wrap;gap:8px}
.bdg{position:relative;width:calc((100% - 16px) / 3);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border-radius:14px;padding:12px 6px 10px;text-align:center}
.bdg-art{width:64px;height:64px;margin-bottom:2px}
.bdg-img{display:block;width:64px;height:64px}
.bdg.got .bdg-img{animation:bdgPop .5s ease both}
.bdg.fresh .bdg-img{animation:bdgIn .8s cubic-bezier(.3,1.5,.5,1) both}
.bdg-new{position:absolute;top:8px;right:8px;font-size:11px;font-weight:900;line-height:18px;color:#2b44e6;background:#eceffe;border-radius:7px;padding:0 6px;animation:bdgPop .35s ease both}
.bdg-n{font-size:13px;font-weight:900;line-height:1.3}.bdg-d{font-size:11px;font-weight:700;color:#758091}
.press{opacity:.75}
@keyframes bdgPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes bdgIn{from{transform:scale(.55) rotate(-25deg);opacity:0}to{transform:none;opacity:1}}

/* #endif */
/* #ifndef MP-WEIXIN */

.mine{min-height:100vh;box-sizing:border-box;background:#f3f4f6;color:#17202e;padding-bottom:calc(90px + env(safe-area-inset-bottom))}.head{height:48px;display:flex;align-items:center;gap:9px;padding:0 110px 0 16px;background:#fff;font-size:16px;font-weight:800}.brand-mark{width:30px;height:30px;border-radius:8px;background:#ffc83d;display:flex;align-items:center;justify-content:center;font-size:22px;color:#112d25}.content{padding:24px 16px}.title{font-size:27px;font-weight:800}.intro{font-size:13px;color:#758091;margin-top:5px}.section-title{font-size:19px;font-weight:800;margin:28px 0 12px}.list{background:#fff;border-radius:14px;overflow:hidden}.row{display:flex;gap:12px;padding:14px;border-bottom:1px solid #edf0f3}.row:last-child{border-bottom:0}.feedback-row,.collection-row{align-items:center}.cover{width:74px;height:74px;flex:none;border-radius:10px;background:#eef1f5}.copy{min-width:0;display:flex;flex-direction:column;gap:6px}.feedback-row .copy,.collection-row .copy{flex:1}.name{font-weight:750;font-size:15px;line-height:1.4}.meta{color:#758091;font-size:12px}.action{color:#2849e9;font-size:13px;font-weight:700}.empty{background:#fff;border-radius:14px;padding:18px}.empty-title,.empty-text{display:block}.empty-title{font-size:15px;font-weight:750}.empty-text{font-size:13px;color:#758091;line-height:1.6;margin-top:6px}.primary{display:inline-block;margin:14px 0 0;background:#2849e9;color:#fff;font-size:13px;line-height:38px;padding:0 14px;border-radius:9px}.notice{color:#758091;font-size:12px;line-height:1.6;margin-top:24px}.expand{width:100%;margin:0;background:#fff;color:#2849e9;font-size:12px;line-height:42px;border-radius:0}.expand::after{border:0}.potential{display:flex;gap:14px;align-items:center;margin-top:24px;padding:18px;background:#eaf0ff;border:1px solid #dce6ff;border-radius:14px}.potential-mark{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;border-radius:12px;background:#2849e9;color:#fff;font-size:24px}.potential-copy{display:flex;min-width:0;flex-direction:column;gap:5px}.potential-title{font-size:17px;font-weight:800;color:#172d61}.potential-desc{font-size:12px;color:#647791;line-height:1.5}.potential-link{font-size:13px;font-weight:700;color:#2849e9}
.ai-lv{margin-top:16px}
.ai-go{display:flex;gap:10px;margin-top:10px}.ai-go-b{flex:1;min-height:44px;line-height:44px;text-align:center;border-radius:12px;background:#2849e9;color:#fff;font-size:14px;font-weight:800}.ai-go-b.soft{background:#eaf0ff;color:#2849e9}
.section-note{font-size:12px;font-weight:700;color:#758091;margin-left:8px}
.badges{display:flex;flex-wrap:wrap;gap:8px}
.bdg{width:calc((100% - 16px) / 3);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border-radius:14px;padding:12px 6px;text-align:center}
.bdg-ic{width:44px;height:44px;border-radius:13px;background:#e6e8ec;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding-bottom:10px;box-sizing:border-box}
.bdg-s1,.bdg-s2,.bdg-s3{width:7px;border-radius:2px;background:#9aa0ac}.bdg-s1{height:8px}.bdg-s2{height:14px}.bdg-s3{height:20px}
.bdg.got .bdg-ic{background:#ffc83d;animation:bdgPop .5s ease both}.bdg.got .bdg-s1,.bdg.got .bdg-s2,.bdg.got .bdg-s3{background:#161a23}
.bdg-n{font-size:13px;font-weight:900;line-height:1.3}.bdg-d{font-size:11px;font-weight:700;color:#758091}
.press{opacity:.75}
@keyframes bdgPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}

/* #endif */
</style>
