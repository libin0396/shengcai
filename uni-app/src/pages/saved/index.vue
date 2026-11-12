<template>
  <view class="page"><SiteHeader active="saved"/><view class="wrap">
    <view class="my-heading"><view class="my-heading-icon" aria-hidden="true"></view><view><text class="title">我的</text><text class="hint">学习记录保存在当前设备</text></view></view>
    <view class="made">
      <view class="block-head"><view><text class="block-title">我的学习记录</text><text class="block-sub">上次学到哪里，从这里继续</text></view></view>
      <!-- #ifdef H5 -->
      <view v-if="made.length" class="made-list">
        <button v-for="item in made" :key="item.page" class="made-row" @click="openLearn(item.page)"><view class="made-visual"><image v-if="item.cover" :src="item.cover" mode="aspectFill"/><view v-else class="made-visual-fallback"><text>{{item.badge}}</text></view></view><view class="made-copy"><text class="made-badge">{{item.badge}}</text><text class="made-name">{{item.title}}</text><text class="made-sub">{{item.detail}}</text><text class="made-continue">继续学习 <text aria-hidden="true">→</text></text></view></button>
      </view>
      <view v-else class="made-empty"><view class="made-empty-icon" aria-hidden="true">↗</view><view><text class="made-empty-title">从一件小事开始</text><text class="made-empty-hint">学过的教程会出现在这里，方便下次继续。</text><button class="made-btn" @click="openLearn('guides.html')">看看有哪些教程 →</button></view></view>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <view class="made-empty"><text>小程序暂时无法读取网页里的学习记录，可进入专题继续查看。</text><button class="made-btn" @click="openLearn('guides.html')">去学习</button></view>
      <!-- #endif -->
    </view>
    <view v-if="tutorialFirst" class="my-settings">
      <text class="block-title">帮助与反馈</text>
      <view class="setting-list">
        <button class="setting-row" role="button" tabindex="0" @click="openLearn('find.html')" @keydown.enter.prevent="openLearn('find.html')" @keydown.space.prevent="openLearn('find.html')"><view><text class="setting-name">遇到问题？找用法</text><text class="setting-desc">用一句话找到适合的教程或提示词</text></view><text class="setting-arrow">›</text></button>
        <!-- #ifdef H5 -->
        <button class="setting-row" role="button" tabindex="0" @click="openFeedback" @keydown.enter.prevent="openFeedback" @keydown.space.prevent="openFeedback"><view><text class="setting-name">意见反馈</text><text class="setting-desc">告诉我们哪里还可以做得更好</text></view><text class="setting-arrow">›</text></button>
        <!-- #endif -->
      </view>
    </view>
    <view v-if="!tutorialFirst" class="my-summary"><view><text>{{history.length}}</text><small>场模拟记录</small></view><view><text>{{unlocked.size}} / 24</text><small>已点亮人格</small></view><view><text>{{remainingGames}}</text><small>个项目尚未体验</small></view><view><text>{{savedArticles.length}}</text><small>篇收藏文章</small></view></view>
    <view v-if="!tutorialFirst" class="collection">
      <view class="block-head"><view><text class="block-title">我的副业人格图鉴</text></view><text>{{unlocked.size}} / 24</text></view>
      <view class="persona-group-head hidden-group-head"><text>✦ 隐藏人格</text><text>{{hiddenUnlocked}} / 6</text></view>
      <text class="persona-group-note">{{hiddenUnlocked>=6 ? '6 种隐藏人格已全部解锁！' : (hiddenUnlocked ? `还有 ${6-hiddenUnlocked} 种未解锁，` : '共 6 种隐藏人格，') + '特定天赋组合才能解锁。'}}</text>
      <view class="persona-grid hidden-persona-grid">
        <view v-for="p in hiddenPersonas" :key="p.index" class="persona-cell hidden-persona" :class="{unlocked:unlocked.has(p.index)}">
          <view class="persona-icon"><image v-if="unlocked.has(p.index)" :src="p.icon" mode="aspectFit"/><text v-else>?</text></view>
          <text class="persona-name">{{unlocked.has(p.index)?p.name:'隐藏人格'}}</text><text v-if="unlocked.has(p.index)" class="hidden-badge">隐藏</text>
        </view>
      </view>
      <view class="persona-group-head ordinary-group-head"><text>普通人格</text><text>{{unlocked.size - hiddenUnlocked}} / 18</text></view>
      <view class="persona-grid">
        <view v-for="p in ordinaryPersonas" :key="p.index" class="persona-cell" :class="{unlocked:unlocked.has(p.index)}">
          <view class="persona-icon"><image v-if="unlocked.has(p.index)" :src="p.icon" mode="aspectFit"/><text v-else>?</text></view><text class="persona-name">{{unlocked.has(p.index)?p.name:'待解锁'}}</text>
        </view>
      </view>
    </view>
    <PosterGallery v-if="!tutorialFirst" ref="gallery" :history="history" @replay="replay" @simulate="goSimulate" />
    <view v-if="!tutorialFirst"><view class="block-head saved-head"><view><text class="block-title">我的收藏</text></view></view>
    <view class="tabs"><button :class="{on:tab==='article'}" @click="tab='article'">文章 {{savedArticles.length}}</button><button :class="{on:tab==='event'}" @click="tab='event'">线下活动 {{savedEvents.length}}</button></view>
    <view v-if="tab==='article'"><view v-for="a in savedArticles" :key="a.id" class="row" @click="openArticle(a)"><text class="kind">{{a.kind || '分享'}} · 一位生财圈友</text><text class="name">{{cleanCaseTitle(a.title)}}</text><text class="summary">{{hideEarningsFigures(a.overview||a.summary)}}</text><view class="row-bottom"><text>查看导读 →</text><text @click.stop="remove('article',a)">取消收藏</text></view></view><view v-if="!savedArticles.length" class="empty">还没有收藏文章。<button @click="goDiscover">去发现</button></view></view>
    <view v-else><view v-for="e in savedEvents" :key="e.id" class="row"><text class="kind">{{e.city}} · {{e.typeText || '活动'}}</text><text class="name">{{e.name}}</text><text class="summary">{{e.summary||e.description}}</text><view class="row-bottom"><text @click="goEvents">在线下活动页查看 →</text><text @click="remove('event',e)">取消收藏</text></view></view><view v-if="!savedEvents.length" class="empty">还没有收藏线下活动。<button @click="goEvents">查看线下活动</button></view></view></view>
    <view class="data-notice">网站统计记录匿名浏览器的页面、按钮操作及粗略前台活跃时间，不收集搜索等输入原文，统计记录最多保留约 90 天。<text v-if="!tutorialFirst">若你自愿提交排行榜，昵称、人格和模拟成绩会公开展示，约 7 天后删除，也可在本设备删除。</text>自愿提交的意见会供站长查看，约 30 天后删除；请不要填写个人信息。</view>
  </view><CampFooter from="mine"/><SiteFooter /></view>
</template>
<script setup>
import {tutorialFirst} from '../../site-mode.js';
// #ifdef H5
import '../../static/learn/guides-data.js';
// #endif
import SiteFooter from '../../components/SiteFooter.vue';
import {computed,ref} from 'vue';import {onShow,onHide} from '@dcloudio/uni-app';
import PosterGallery from '../../components/PosterGallery.vue';
import SiteHeader from '../../components/SiteHeader.vue';import {openGame,openLearn} from '../../data/game-matching.js';import CampFooter from '../../components/CampFooter.vue';
import {articles,events} from '../../data/content.js';import {getSaved,setSaved} from '../../data/storage.js';import personas from '../../data/personas.json';
import {caseStudies,caseAsArticle} from '../../data/case-studies.js';
import {cleanCaseTitle,hideEarningsFigures} from '../../data/case-library.mjs';
const tab=ref('article'),saved=ref([]),history=ref([]),seenHidden=ref([]),gallery=ref(null),learnProgress=ref({}),guideProgress=ref([]);
const made=computed(()=>{
  const all=learnProgress.value, items=[];
  const k=all.kejian;
  if(k && typeof k==='object' && !Array.isArray(k) && Object.keys(k).length){
    const level=Number(k.level)||0;
    items.push({page:'kejian.html?tab=practice',badge:'课件',cover:'/static/learn/img/boat.jpg',title:'AI 课件练习',detail:k.done?'练习已完成':level>0?`进行到第 ${Math.min(level,5)} 关`:k.basicDone?'教程已标记完成':'已开始学习'});
  }
  const h=all.huiben;
  if(h && typeof h==='object' && !Array.isArray(h) && Object.keys(h).length){
    items.push({page:'huiben.html?tab=practice',badge:'绘本',cover:'/static/learn/img/girl.jpg',title:'AI 绘本故事示例',detail:h.done?'故事示例已完成':h.basicDone?'教程已标记完成':'已开始学习'});
  }
  return [...items,...guideProgress.value];
});
function loadLearnProgress(){
  // #ifdef H5
  try{const data=JSON.parse(window.localStorage.getItem('ainpe:learn')||'{}');learnProgress.value=data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{learnProgress.value={}}
  guideProgress.value=(window.AINPE_GUIDES||[]).flatMap(guide=>{
    try{
      const steps=Array.isArray(guide.steps)?guide.steps:[];
      const done=JSON.parse(window.localStorage.getItem('ainpe:guide:'+guide.id)||'{}');
      if(!done || typeof done!=='object' || Array.isArray(done))return [];
      const count=steps.filter((_,index)=>done[index]===true).length;
      return count?[{page:'guide.html?id='+encodeURIComponent(guide.id),badge:'教程',title:guide.title,detail:count===steps.length?'步骤已全部标记完成':`已完成 ${count} / ${steps.length} 步`}]:[];
    }catch{return []}
  });
  // #endif
}

function readLocal(key){try{let v=uni.getStorageSync(key);if(typeof v==='string')return v?JSON.parse(v):null;return v||null}catch{return null}}
function openFeedback(event){
  // #ifdef H5
  const button=document.getElementById('ainpe-feedback-launch');
  if(button){button._ainpeFeedbackOpener=event?.currentTarget;button.click()}else uni.showToast({title:'反馈暂不可用，请稍后再试',icon:'none'});
  // #endif
}
onShow(()=>{
  // #ifdef H5
  if(tutorialFirst){window.location.replace('/static/learn/wode.html');return} // 教程站：「我的」用新的静态页
  // #endif
  loadLearnProgress();saved.value=getSaved();let v=readLocal('ainpe:history');if(!Array.isArray(v)){const last=readLocal('ainpe:played');v=last&&typeof last==='object'?[last]:[]}history.value=v.filter(x=>x&&typeof x==='object').slice(0,50);const seen=readLocal('ainpe:hidden-seen');seenHidden.value=Array.isArray(seen)?seen.filter(index=>Number.isInteger(index)&&index>=18&&index<24):[];gallery.value?.resume()});
onHide(()=>gallery.value?.pause());
const ordinaryPersonas=personas.slice(0,18).map((persona,index)=>({...persona,index}));
const hiddenPersonas=personas.slice(18,24).map((persona,index)=>({...persona,index:index+18}));
const unlocked=computed(()=>new Set([...seenHidden.value,...history.value.map(record=>{
  if(record.personaIndex!==null&&record.personaIndex!==undefined&&record.personaIndex!==''){
    const index=Number(record.personaIndex);if(Number.isInteger(index)&&index>=0&&index<24)return index;
  }
  return typeof record.persona==='string'?personas.findIndex(persona=>persona.name===record.persona):-1;
}).filter(index=>index>=0&&index<24)]));
const hiddenUnlocked=computed(()=>hiddenPersonas.filter(persona=>unlocked.value.has(persona.index)).length);
function gameName(record){const raw=String(record?.game||'').replace(/\.html$/,'');if(raw==='voyage-lab'){const p=String(record?.project||'');return /带货/.test(p)?'books':/第二大脑/.test(p)?'brain':/热词/.test(p)?'trends':''}return raw}
const remainingGames=computed(()=>Math.max(0,6-new Set(history.value.map(gameName).filter(x=>['miniapp','video','education-ppt','books','brain','trends'].includes(x))).size));
const savedArticles=computed(()=>{const curated=caseStudies.map(caseAsArticle),ids=new Set(curated.map(a=>a.id));return [...curated,...articles.filter(a=>!ids.has(String(a.id)))].filter(a=>saved.value.includes(`article:${a.id}`))});
const savedEvents=computed(()=>events.filter(e=>saved.value.includes(`event:${e.id}`)));
function formatPlayed(value){const d=new Date(new Date(value).getTime()+8*3600000);return Number.isNaN(d.getTime())?'时间未记录':`${d.getUTCFullYear()}/${d.getUTCMonth()+1}/${d.getUTCDate()}`}
function remove(t,item){saved.value=saved.value.filter(k=>k!==`${t}:${item.id}`);setSaved(saved.value)}
function openArticle(a){uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(a.id)}`})}
function goSimulate(){uni.navigateTo({url:'/pages/simulate/index'})}
function replay(record){
const game=gameName(record),classic=['miniapp','video','education-ppt'],other=['books','brain','trends'];if(classic.includes(game)&&openGame(`/static/simulation-games/${game}.html`))return;if(other.includes(game)&&openGame(`/static/simulation-games/voyage-lab.html?project=${game}`))return;
goSimulate()}
function goDiscover(){uni.redirectTo({url:'/pages/discover/index'})}function goEvents(){uni.redirectTo({url:'/pages/events/index'})}
</script>
<style scoped>
.page{min-height:100vh;background:#F3F4F6;color:#161A23}.wrap{max-width:1050px;margin:auto;padding:32px 20px 45px}.title,.subtitle,.hint{display:block}.title{font-size:32px;font-weight:800}.subtitle{font-size:14px;line-height:1.7;color:#5F6675;margin-top:8px}.hint{font-size:12px;color:#9AA0AC;margin-top:5px}.my-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.my-summary view{background:#fff;border:1px solid #E6E8EC;border-radius:8px;padding:15px}.my-summary text,.my-summary small{display:block}.my-summary text{font-size:22px;font-weight:800;color:#2B44E6}.my-summary small{font-size:12px;color:#9AA0AC;margin-top:5px}.collection{background:#fff;border:1px solid #E6E8EC;border-radius:8px;padding:20px;margin:15px 0}.block-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#9AA0AC;margin-bottom:16px}.block-title,.block-sub{display:block}.block-title{font-size:19px;color:#161A23;font-weight:800}.block-sub{font-size:12px;color:#9AA0AC;margin-top:5px}.persona-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}.persona-cell{min-width:0;border:1px solid #F3F4F6;border-radius:7px;background:#F3F4F6;text-align:center;padding:10px 4px;color:#9AA0AC;font-size:11px}.persona-cell.unlocked{background:#F3F4F6;border-color:#E6E8EC;color:#2B44E6}.persona-icon{display:flex;align-items:center;justify-content:center;margin:0 auto 7px;border-radius:50%;width:32px;height:32px;background:#F3F4F6;color:#9AA0AC;font-size:20px;font-weight:800}.unlocked .persona-icon{background:#2B44E6;color:#FFC83D}.persona-icon image{width:25px;height:25px}.history-row{display:flex;align-items:center;gap:8px;border-top:1px solid #F3F4F6;padding:12px 0}.history-info{flex:1;min-width:0}.history-title,.history-meta{display:block}.history-title{font-size:14px;font-weight:750;color:#5F6675}.history-meta{font-size:12px;color:#9AA0AC;margin-top:5px}.history-row button{margin:0;padding:0 10px;line-height:32px;font-size:12px;background:#F3F4F6;color:#2B44E6;white-space:nowrap}.record-overlay{position:fixed;inset:0;z-index:9999;background:#07150dcc;display:flex;align-items:center;justify-content:center;padding:20px}.record-modal{position:relative;background:white;border-radius:8px;padding:25px;max-width:480px;width:100%;max-height:85vh;overflow:auto}.record-close{position:absolute;right:12px;top:10px;background:transparent;font-size:25px;line-height:1;padding:0}.record-label,.record-title,.record-project,.record-amount,.record-disclaimer,.record-issues text{display:block}.record-label{font-size:12px;color:#9AA0AC}.record-title{font-size:22px;font-weight:800;margin-top:12px}.record-project,.record-disclaimer{font-size:12px;color:#9AA0AC;line-height:1.6;margin-top:8px}.record-amount{font-size:20px;font-weight:800;color:#2B44E6;margin-top:14px}.record-issues{background:#ECEFFE;padding:14px;margin-top:14px;font-size:13px;line-height:1.6}.record-issues text{margin:5px 0}.record-replay{margin:16px 0 0;padding:0 14px;display:inline-block;background:#2B44E6;color:white;font-size:13px;line-height:38px}.saved-head{margin-top:35px}.tabs{display:flex;gap:8px;margin:14px 0}.tabs button{margin:0;background:#F3F4F6;color:#5F6675;font-size:13px;line-height:36px}.tabs button.on{background:#5F6675;color:#fff}.row{background:#fff;border:1px solid #E6E8EC;border-radius:8px;padding:16px;margin-bottom:8px}.kind{font-size:12px;color:#9AA0AC}.name,.summary{display:block}.name{font-size:16px;font-weight:700;line-height:1.5;margin:8px 0}.summary{font-size:13px;line-height:1.7;color:#5F6675}.row-bottom{display:flex;justify-content:space-between;color:#5F6675;font-size:12px;margin-top:12px}.empty{padding:20px;color:#9AA0AC;background:#ECEFFE;font-size:13px;line-height:1.7}.empty button{margin:10px 0 0;display:inline-block;background:#E6E8EC;color:#5F6675;font-size:13px;line-height:36px}.data-notice{margin:20px 0;font-size:12px;line-height:1.7;color:#5F6675}@media(max-width:700px){.my-summary{grid-template-columns:repeat(2,1fr)}.persona-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.history-row{flex-wrap:wrap}.history-info{flex-basis:100%}}
.persona-group-head{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:800;line-height:1.5}.hidden-group-head{color:#966913}.ordinary-group-head{margin:21px 0 10px;color:#5F6675}.persona-group-note{display:block;margin:4px 0 10px;color:#5F6675;font-size:12px;line-height:1.5}.hidden-persona-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.hidden-persona.persona-cell{position:relative;min-height:92px;background:#fffbef;border-color:#FFC83D;color:#5F6675}.hidden-persona .persona-icon{background:#fff8e4;border:1.5px dashed #d4ae52;color:#b68a24}.hidden-persona.persona-cell.unlocked{background:linear-gradient(145deg,#261f0c,#161A23);border-color:#c79b37;color:#FFC83D;box-shadow:0 0 18px #cba14338}.hidden-persona.unlocked .persona-icon{background:linear-gradient(145deg,#44300a,#161A23);border:2px solid #FFC83D;box-shadow:0 0 0 3px #b78a3b55,0 0 14px #e3bc4a88}.persona-name{display:block;line-height:1.4;overflow-wrap:anywhere}.hidden-badge{display:inline-block;margin-top:4px;padding:1px 5px;border-radius:8px;background:#FFC83D;color:#6d4a0a;font-size:10px;line-height:1.4}@media(max-width:700px){.hidden-persona-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* 我在「学」里做过的 */
.made{margin-top:18px;background:#fff;border-radius:18px;padding:16px}
.made-list{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.made-row{display:flex;width:100%;margin:0;align-items:center;gap:12px;padding:10px 0;border:0;border-top:1px solid #E6E8EC;border-radius:0;background:transparent;text-align:left;line-height:1.4;cursor:pointer}.made-row::after{border:0}
.made-row:first-child{border-top:0}
.made-badge{flex:none;font-size:11px;font-weight:900;color:#161A23;background:#FFC83D;border-radius:8px;padding:2px 8px}
.made-copy{flex:1;min-width:0}
.made-name{display:block;font-size:15px;font-weight:800;color:#161A23}
.made-sub{display:block;font-size:12px;color:#5F6675;margin-top:2px}
.made-go{color:#9AA0AC;font-size:18px}
.made-empty{display:flex;align-items:center;gap:12px;margin-top:6px;font-size:13.5px;color:#5F6675;line-height:1.6}
.made-btn{flex:none;margin:0;line-height:1.5;background:#2B44E6;color:#fff;font-weight:800;font-size:14px;border-radius:12px;padding:8px 16px;cursor:pointer}

/* 教程站个人页：记录与操作都以真实状态为准。 */
.wrap{max-width:900px;padding:42px 24px 72px}
.my-heading{display:flex;align-items:center;gap:16px}
.my-heading-icon{width:48px;height:48px;flex:none;border-radius:15px;background:#161A23 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.2'/%3E%3Cpath d='M5.5 20v-1.6c0-3 2.8-5.1 6.5-5.1s6.5 2.1 6.5 5.1V20'/%3E%3C/svg%3E") center/27px no-repeat}
.my-heading .title{font-size:28px;line-height:1.2}
.my-heading .hint{color:#727b8a;margin-top:6px}
.made{background:transparent;padding:0;margin-top:38px;border-radius:0}
.made .block-head{margin-bottom:16px}
.made-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0}
.made-row,.made-row:first-child{display:flex;flex-direction:column;align-items:stretch;gap:0;overflow:hidden;border:1px solid #e6e8ec;border-radius:16px;background:#fff;padding:0;text-align:left}
.made-visual{height:128px;background:#e9edfa;overflow:hidden}
.made-visual image{display:block;width:100%;height:100%}
.made-visual-fallback{display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(145deg,#edf1ff,#e0e7fa)}
.made-visual-fallback text{padding:6px 12px;border-radius:8px;background:#fff;color:#2b44e6;font-weight:800;font-size:14px}
.made-copy{padding:15px 16px 16px}
.made-badge{display:inline-block;margin-bottom:8px;background:#eef1ff;color:#2b44e6;font-size:11px;border-radius:6px;padding:3px 7px}
.made-name{font-size:15px;line-height:1.4}
.made-sub{min-height:18px;color:#687385;margin-top:6px;line-height:1.5}
.made-continue{display:block;color:#2b44e6;font-size:13px;font-weight:750;margin-top:12px}
.made-empty{background:#fff;border:1px solid #e6e8ec;border-radius:16px;padding:22px;gap:16px;margin:0}
.made-empty-icon{width:50px;height:50px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:14px;color:#2b44e6;background:#eef1ff;font-size:28px;font-weight:800}
.made-empty-title,.made-empty-hint{display:block}
.made-empty-title{font-size:16px;color:#161a23;font-weight:800}
.made-empty-hint{font-size:13px;color:#697387;margin:5px 0 12px}
.made-btn{display:inline-block;padding:8px 13px;font-size:13px;border-radius:9px}
.my-settings{margin-top:38px}
.setting-list{margin-top:14px;background:#fff;border:1px solid #e6e8ec;border-radius:16px;overflow:hidden}
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin:0;padding:16px 18px;text-align:left;line-height:1.4;border:0;border-radius:0;background:#fff}
.setting-row+.setting-row{border-top:1px solid #eceef2}.setting-row::after{border:0}
.setting-name,.setting-desc{display:block}.setting-name{font-size:15px;color:#161a23;font-weight:750}.setting-desc{font-size:12px;color:#747e8e;margin-top:4px}.setting-arrow{font-size:22px;color:#9aa0ac}
.data-notice{color:#697587;margin-top:28px}
@media(max-width:700px){.wrap{padding:24px 16px calc(112px + env(safe-area-inset-bottom))}.my-heading-icon{width:44px;height:44px;border-radius:13px}.my-heading .title{font-size:24px}.made,.my-settings{margin-top:30px}.made-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.made-visual{height:105px}.made-copy{padding:12px}.made-name{font-size:14px}.made-empty{align-items:flex-start;padding:18px}.made-empty-icon{width:42px;height:42px;font-size:24px}}
@media(max-width:350px){.made-list{grid-template-columns:1fr}.made-visual{height:126px}}
</style>
