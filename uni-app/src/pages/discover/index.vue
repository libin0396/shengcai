<template>
  <view class="discover-page">
    <!-- #ifdef H5 -->
    <view class="learn-banner" role="link" tabindex="0" @click="openCampBar"><text class="lb-tag">生财有术</text><text>想用 AI 赚钱？看看真人怎么做</text><text class="lb-go">›</text></view>
    <!-- #endif -->
    <SiteHeader active="discover" :has-banner="true" />
    <view class="home-a">
      <view class="ha-hero">
      <view class="ha-title">让普通人，<br/>也能用 AI 做成事</view>
      <view class="ha-sub">从一份课件、一本绘本开始，跟着步骤，做出你的第一个作品。</view>
      <!-- #ifdef H5 -->
      <view class="ha-search" id="tour-search" role="search">
        <input v-model="findQ" class="ha-input" maxlength="40" placeholder="你遇到了什么事？" aria-label="你遇到了什么事" confirm-type="search" @confirm="goFind"/>
        <button class="ha-send" @click="goFind">找用法</button>
      </view>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <view class="ha-search" id="tour-search"><text class="ha-input">遇到什么事？打开后输入</text><button class="ha-send" @click="goFind">找用法</button></view>
      <!-- #endif -->
      <view class="ha-chips"><text v-for="c in quick" :key="c.label" role="link" tabindex="0" @click="goQuick(c)" @keydown.enter.prevent="goQuick(c)">{{c.label}}</text></view>
      <view class="ha-trust"><text><text class="ck">✓</text>零基础也能开始</text><text><text class="ck">✓</text>跟着步骤做</text><text><text class="ck">✓</text>提示词可复制</text></view>
      <!-- #ifdef H5 -->
      <text class="ha-replay" role="button" tabindex="0" @click="replayTour" @keydown.enter.prevent="replayTour">第一次来？看看怎么用 ›</text>
      <!-- #endif -->
      </view>
      <view class="ha-feature" id="tour-make" role="link" tabindex="0" @click="openLearnPage('kejian.html?from=start')">
        <view class="ha-pic"><image src="/static/learn/img/boat.jpg" mode="aspectFill" class="ha-img"/><text class="ha-tag">成品示例</text></view>
        <view class="ha-ladder"><text class="on">初级 · 看教程</text><text>中级 · 5 关练习</text><text>高级</text></view>
        <view class="ha-tx"><text class="ha-name">给孩子做一份课件</text><text class="ha-desc">教案、逐字稿、3 页插画，手机就能做</text><view class="ha-cta">开始做</view></view>
      </view>
      <view class="ha-duo">
        <view class="ha-mini" role="link" tabindex="0" @click="openLearnPage('huiben.html')"><view class="ha-pic"><image src="/static/learn/img/girl.jpg" mode="aspectFill" class="ha-mimg"/><text class="ha-tag">成品示例</text></view><view class="ha-mtx"><text class="ha-mname">和孩子做绘本</text><text class="ha-mdesc">4 页 · 孩子当作者</text></view></view>
        <view class="ha-vote"><text class="ha-vt">还在做 · 投一票</text><view class="ha-vs"><text v-for="t in learnTopics.filter(x=>!x.live)" :key="t.id" :class="{on:votes.includes(t.id)}" @click="vote(t)">{{t.short||t.name}}</text></view></view>
      </view>
      <view class="ha-aid" id="tour-lib" role="link" tabindex="0" @click="openLearnPage('jijiu.html')"><view><text class="ha-aidt">用法库</text><text class="ha-aidd">平时的小事，复制提示词就能用</text></view><text class="ha-arrow">›</text></view>
      <view class="ha-aid ha-aid2" role="link" tabindex="0" @click="navigate('/pages/simulate/index')"><view><text class="ha-aidt">项目模拟</text><text class="ha-aidd">体验项目决策和可能遇到的问题</text></view><text class="ha-arrow">›</text></view>
    </view>
    <view class="content-shell">
      <view class="highlights-grid">
        <view class="highlight-block case-block-home"><view class="block-title"><view><view class="section-title">看看真人怎么做的</view><view class="section-subtitle">精选案例匿名展示，数字取大概；详情以原帖为准</view></view><text @click="scrollToIntelligence">进入情报 →</text></view><view class="home-cases"><view v-for="(item,index) in featuredArticles" :key="item.id" class="home-case" :class="{'third-case':index===2}"><view class="home-case-main" @click="openArticle(item)"><view class="home-case-tags"><text>{{item.direction}}</text><text>完整解读</text></view><view class="home-case-title">{{item.title}}</view><view class="home-case-start">起点：{{item.start?.occupation || '作者未披露'}}</view><view class="home-case-numbers"><view v-for="n in publicNumbers(item.numbers).slice(0,2)" :key="n.label"><text>{{n.value || '未披露'}}</text><text>{{n.label}} · 作者自述</text></view></view><view class="home-case-by">{{item.author}} · 生财有术</view></view><view v-if="item.simulation" class="home-case-play" @click="goCaseGame(item)"><text>▶</text><view><view>玩同款：{{item.simulation.name}}</view></view><text>开始 →</text></view></view></view><view v-if="!featuredArticles.length" class="highlight-empty">暂无已收录的 AI 内容。</view></view>
        <view class="highlight-block"><view class="block-title"><view><view class="section-title">近期线下活动</view></view><text @click="navigate('/pages/events/index')">全部活动 →</text></view><view class="highlight-list"><view class="conference-link" @click="openFeaturedFde"><view class="conference-copy"><text class="conference-label">{{featuredFdeLabel}}</text><view class="conference-name">{{featuredFdeTitle}}</view><view class="conference-detail">{{featuredFdeStatus}}</view></view><view class="conference-actions"><button v-if="conference" @click.stop="navigate('/pages/topic/index?topic=fde')">FDE 专题</button><button @click.stop="openFeaturedFde">{{conference ? '查看资料 →' : '进入专题 →'}}</button></view></view><view v-for="item in upcomingEvents" :key="item.id" class="highlight-row" @click="navigate('/pages/events/index')"><view class="event-date"><text>{{eventMonth(item.startTime)}}月</text><text>{{eventDay(item.startTime)}}</text></view><view class="highlight-content"><view class="highlight-title">{{ item.name }}</view><view class="highlight-meta">{{ item.city }} · {{ eventTime(item.startTime) }}（北京时间）</view></view><text class="row-arrow">›</text></view><view v-if="!upcomingEvents.length" class="highlight-empty">暂未收录即将开始的 AI 活动，可查看全部活动。</view><view class="highlight-footer" @click="navigate('/pages/events/index')">查看城市活动与详情 →</view></view></view>
      </view>
      <CampFooter from="home" />
      <view class="footer-note">内容来自生财有术，以原帖为准</view>
    </view>
  <SiteFooter :space-for-promo="true" :show-icp="true" /></view>
</template>

<script setup>
import SiteFooter from '../../components/SiteFooter.vue';
import {computed, ref, onMounted, onUnmounted} from 'vue';
import {onLoad, onShow, onHide, onPageScroll} from '@dcloudio/uni-app';
import GameCover from '../../components/GameCover.vue';
import {openGame, openLearn} from '../../data/game-matching.js';
import {learnTopics} from '../../data/learn-topics.js';
import {articles, campaign, events, feedMeta, isAiArticle, matchesAiCategory} from '../../data/content.js';
import SiteHeader from '../../components/SiteHeader.vue';
import CampFooter from '../../components/CampFooter.vue';
import {track} from '../../data/track.js';
import {caseStudies, caseAsArticle, publicNumbers} from '../../data/case-studies.js';

const showJoinBar=ref(false);
onPageScroll(e=>{showJoinBar.value=e.scrollTop>barThreshold()});
function barThreshold(){try{return Math.max(600,(document.documentElement.scrollHeight-window.innerHeight)*0.5)}catch{return 1200}}
// #ifdef H5
function updateJoinBar(){showJoinBar.value=window.scrollY>600}
onMounted(()=>{window.addEventListener('scroll',updateJoinBar,{passive:true});updateJoinBar()});
let tourMounted=false,tourScript=null,tourPendingForce=false,tourTimer=null;
const tourSteps=[
  {sel:'#tour-search',title:'遇到事，搜这里',text:'说一句你遇到的事，找一句能复制给 AI 的提示词。'},
  {sel:'#tour-make',title:'想做成一件事，从这里开始',text:'跟着步骤，做出你的第一个作品。'},
  {sel:'#tour-lib',title:'用法库',text:'平时的小事，打开一张，复制就行。'},
  {sel:'.site-nav-scroll',title:'随时回到这里',text:'首页、用法库、找用法、跟着做、我的。'},
];
function loadTour(force){
  const run=()=>{if(!tourMounted)return;if(window.AINPETour)window.AINPETour.start(tourSteps,{force});};
  if(window.AINPETour){run();return;}
  tourPendingForce=tourPendingForce||force;
  if(tourScript)return;
  const el=document.createElement('script');tourScript=el;el.src='/static/learn/tour.js';
  el.onload=()=>{tourScript=null;if(!tourMounted||!window.AINPETour)return;const replay=tourPendingForce;tourPendingForce=false;clearTimeout(tourTimer);tourTimer=setTimeout(()=>{if(tourMounted)window.AINPETour.start(tourSteps,{force:replay})},replay?0:700);};
  el.onerror=()=>{tourScript=null;tourPendingForce=false;};document.body.appendChild(el);
}
onShow(()=>{document.title='AI 实战情报站';tourMounted=true;loadTour(false)});
onHide(()=>{tourMounted=false;tourPendingForce=false;clearTimeout(tourTimer);window.AINPETour?.dispose();});
onUnmounted(()=>{tourMounted=false;tourPendingForce=false;clearTimeout(tourTimer);window.removeEventListener('scroll',updateJoinBar);window.AINPETour?.dispose();});
// #endif
function replayTour(){
  // #ifdef H5
  loadTour(true);
  // #endif
}
const people=[{label:'上班族',value:'全职上班'},{label:'学生',value:'学生'},{label:'宝妈宝爸',value:'全职宝妈宝爸'},{label:'自由职业',value:'自由职业'},{label:'待业中',value:'待业'}];
const life=ref('');
const playedGames=ref([]);
const games=[
  {id:'miniapp',title:'AI 小程序副业',description:'从需求到上线推广，看看关键环节怎么衔接。'},
  {id:'video',title:'AI 视频定制',description:'接一单，从客户需求走到作品交付。'},
  {id:'education-ppt',title:'小红书教育 PPT',description:'当一次课件质检员，找出需要修正的地方。'},
];
// 按身份给出不同的探索起点，不作为技能、时间或收益判断。
const recommendations={
  '全职上班':{order:['education-ppt','miniapp','video'],reason:'从选题、检查到上架，先体验一遍内容制作流程。'},
  '学生':{order:['video','education-ppt','miniapp'],reason:'从一份客户需求开始，看看如何制作样片并交付。'},
  '全职宝妈宝爸':{order:['education-ppt','video','miniapp'],reason:'先试着整理一份教育资料，再看看如何检查和上架。'},
  '自由职业':{order:['video','miniapp','education-ppt'],reason:'用模拟订单体验需求沟通、样片制作和交付。'},
  '待业':{order:['miniapp','video','education-ppt'],reason:'从需求到上线推广，完整了解一个产品项目的关键环节。'},
};
const recommendation=computed(()=>recommendations[life.value] || null);
const recommendedGames=computed(()=>recommendation.value ? recommendation.value.order.map(id=>games.find(game=>game.id===id)).filter(Boolean) : games);
const recommendationReason=computed(()=>recommendation.value?.reason || '');
const categories=[{id:'all',label:'全部 AI'},{id:'cases',label:'实战案例'},{id:'tools',label:'工具与教程'},{id:'content',label:'内容创作'},{id:'development',label:'开发与 FDE'}];
const selectedCategory=ref('all');
const query=ref('');
const onlySaved=ref(false);
const limit=ref(20);
const saved=ref([]);
const allArticles=Array.isArray(articles)?articles:[];
const aiArticles=computed(()=>allArticles.filter(isAiArticle));
const aiTotal=computed(()=>aiArticles.value.length);
const featuredArticles=computed(()=>caseStudies.slice(0,3));
const eventAI=/(?:^|[^a-z])ai(?=$|[^a-z]|ppt|agent|video)|人工智能|智能体|大模型|生成式|AIGC|GPT|Claude|Codex|Gemini|Grok|Cursor|Copilot|OpenAI|DeepSeek|豆包|通义千问|文心一言|(?:^|[^a-z])(?:FDE|Agent|MCP|LLM)(?=$|[^a-z])|workbuddy|seedance|comfyui|minimax/i;
const now=ref(Date.now());
let clockTimer;
onMounted(()=>{clockTimer=setInterval(()=>{now.value=Date.now()},60000)});
onUnmounted(()=>{if(clockTimer)clearInterval(clockTimer)});
const conference=computed(()=>events.find(e=>String(e?.id)==='10533')||null);
const featuredFdeLabel=computed(()=>conference.value?'FDE · 线下大会':'FDE · 实战专题');
const featuredFdeTitle=computed(()=>conference.value?.name||'FDE 实战与同行交流');
const featuredFdeStatus=computed(()=>{const e=conference.value;if(!e)return '企业 AI 落地 · 案例与讨论';if(/CANCEL/i.test(e.lifecycleStatus||''))return '活动已取消 · 查看大会资料';if(/ENDED|FINISHED|COMPLETED/i.test(e.lifecycleStatus||''))return '活动已结束 · 查看大会资料';if(Number(e.startTime)>0&&Number(e.startTime)*1000<=now.value)return '活动状态以大会资料为准';if(Number(e.submitEnd)>0&&Number(e.submitEnd)*1000<now.value)return '报名已截止 · 查看大会资料';if(e.full)return '资料显示名额已满 · 查看大会资料';const when=Number(e.startTime)>0?eventTime(e.startTime)+'（北京时间）':'';return [e.city,when,'报名与名额以入口说明为准'].filter(Boolean).join(' · ')});
function openFeaturedFde(){navigate(conference.value?'/pages/events/index?view=conference':'/pages/topic/index?topic=fde')}
const upcomingEvents=computed(()=>{const seen=new Set();return [...events].filter(e=>e&&e.city&&Number(e.startTime)*1000>now.value&&String(e.id)!=='10533'&&!/CANCEL|ENDED|FINISHED|COMPLETED/i.test(e.lifecycleStatus||'')&&eventAI.test(`${e.name||''} ${e.typeText||''}`)).sort((a,b)=>Number(a.startTime)-Number(b.startTime)).filter(e=>{if(seen.has(e.city))return false;seen.add(e.city);return true}).slice(0,3)});
function eventDate(t){return new Date(Number(t)*1000+8*3600000)}
function eventMonth(t){return eventDate(t).getUTCMonth()+1}
function eventDay(t){return eventDate(t).getUTCDate()}
function eventTime(t){const d=eventDate(t);return `${d.getUTCMonth()+1}月${d.getUTCDate()}日 ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`}
function scrollToIntelligence(){navigate('/pages/intelligence/index')}
function goCaseGame(item){
  const id=item.simulation?.file;
  const url=['books','brain','trends'].includes(id)?`voyage-lab.html?project=${encodeURIComponent(id)}&start=1`:`${encodeURIComponent(id)}.html?start=1`;
  if(!openGame(`/static/simulation-games/${url}`))navigate('/pages/simulate/index');
}
const findQ=ref('');const votes=ref([]);try{const v=uni.getStorageSync('ainpe:votes');if(Array.isArray(v))votes.value=v}catch{}
function vote(t){if(votes.value.includes(t.id)){uni.showToast({title:'本设备已标记',icon:'none'});return}votes.value=[...votes.value,t.id];try{uni.setStorageSync('ainpe:votes',votes.value)}catch{}track('want_submit',{page:'home',game:t.id});uni.showToast({title:'已在本机标记',icon:'none'})}
function openLearnPage(page){if(!openLearn(page))uni.showToast({title:'暂时打不开，稍后再试',icon:'none'})}
const quick=[{label:'做课件',page:'kejian.html?from=home'},{label:'做绘本',page:'huiben.html?from=home'},{label:'辅导作业',id:'homework'},{label:'写请假条',id:'leave'}];
function goFind(){
  // #ifdef H5
  const value=String(findQ.value||'').trim().slice(0,40);
  try{if(value)sessionStorage.setItem('ainpe:find-once',value);else sessionStorage.removeItem('ainpe:find-once')}catch{if(value){uni.showToast({title:'无法传递内容，请检查浏览器设置',icon:'none'});return}}
  findQ.value='';
  // #endif
  openLearnPage('find.html');
}
function goQuick(c){if(c.page)openLearnPage(c.page);else { try { sessionStorage.removeItem('ainpe:find-once') } catch {} openLearnPage('find.html?quick='+c.id) }}
function openCampBar(){track('outbound_click',{target:'camp',from:'home_bar'});navigate('/pages/camp/index?from=home_bar')}
function startFirst(){const g=recommendedGames.value[0];if(g)goGame(g.id);else navigate('/pages/simulate/index')}
function goGame(name){
  if(!openGame(`/static/simulation-games/${name}.html?start=1${life.value?'&life='+encodeURIComponent(life.value):''}`))navigate('/pages/simulate/index');
}
onLoad(options=>{
  if(options?.section==='intelligence'){uni.redirectTo({url:'/pages/intelligence/index'});return;}
  let played=false;try{played=!!uni.getStorageSync('ainpe:played')}catch{}
  let from=options?.from;
  // #ifdef H5
  try{const url=new URL(window.location.href);if(url.searchParams.getAll('from').length===1 && url.searchParams.get('from')==='persona_qr'){from='persona_qr';url.searchParams.delete('from');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash)}}catch{}
  // #endif
  track('site_view',from==='persona_qr'?{page:'home',played,from:'persona_qr'}:{page:'home',played});
});
const filteredArticles=computed(()=>{
  const keyword=query.value.trim().toLowerCase();
  return aiArticles.value.filter(a=>matchesAiCategory(a,selectedCategory.value))
    .filter(a=>!onlySaved.value||saved.value.includes(`article:${a.id}`))
    .filter(a=>!keyword||[a.title,a.author,a.summary,a.overview].some(value=>String(value||'').toLowerCase().includes(keyword)))
    .sort((a,b)=>Number(b.publishedAt||0)-Number(a.publishedAt||0));
});
const visibleArticles=computed(()=>filteredArticles.value.slice(0,limit.value));
const freshness=computed(()=>`${feedMeta.source||'已保存资料'} · ${feedMeta.lastSuccessLabel?`上次成功 ${feedMeta.lastSuccessLabel}`:'成功时间未记录'} · ${feedMeta.statusText||'等待连接'}`);
function refreshSaved(){try{const value=uni.getStorageSync('ainpe:saved');saved.value=Array.isArray(value)?value:[];let history=uni.getStorageSync('ainpe:history');if(typeof history==='string')history=JSON.parse(history);playedGames.value=Array.isArray(history)?history.map(item=>item.game):[];}catch{saved.value=[];playedGames.value=[];}}
onShow(refreshSaved);
function selectCategory(category){selectedCategory.value=category;limit.value=20;}
function isSaved(a){return saved.value.includes(`article:${a.id}`);}
function toggleSaved(a){const key=`article:${a.id}`;const next=isSaved(a)?saved.value.filter(x=>x!==key):[...saved.value,key];try{uni.setStorageSync('ainpe:saved',next);saved.value=next;uni.showToast({title:isSaved(a)?'已收藏':'已取消收藏',icon:'none'});}catch{uni.showToast({title:'保存失败，请检查存储空间',icon:'none'});}}
function navigate(url){uni.navigateTo({url});}
function openCamp(){navigate('/pages/camp/index?from=home')}
function openArticle(a){try{uni.setStorageSync('ainpe:last-article',{id:String(a.id),openedAt:Date.now()});}catch{}uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(String(a.id))}`});}
function formatDate(value){const d=new Date(Number(value)*1000+8*3600000);return Number.isNaN(d.getTime())?'时间待确认':`${d.getUTCFullYear()}/${d.getUTCMonth()+1}/${d.getUTCDate()}`;}
</script>

<style scoped>
.discover-page{min-height:100vh;background:#f4f3ee;color:#1b3a2d}.feature{background:#142a20;padding:28rpx 34rpx;color:#fff}.feature-top{display:flex;align-items:center;gap:22rpx}.feature-content{flex:1;min-width:0}.feature-image{width:110rpx;height:145rpx;flex-shrink:0;border:1px solid #809374;border-radius:6rpx}.feature-label{font-size:20rpx;color:#cbe98d;font-weight:700}.feature-heading{font-size:30rpx;line-height:1.3;font-weight:800;margin-top:10rpx}.feature-copy{font-size:21rpx;color:#becdb9;margin-top:8rpx;line-height:1.55}.feature-toggle{font-size:20rpx;color:#d4ed91;white-space:nowrap}.feature-more{padding:20rpx 0 4rpx 132rpx;font-size:23rpx;line-height:1.65;color:#bfcfbd}.feature-link{display:inline-block;color:#d4ed91;font-size:24rpx;font-weight:700;margin-top:12rpx}.feature-legend{font-size:18rpx;color:#859b82;margin-top:8rpx}.content-shell{max-width:1280px;margin:auto;padding:40rpx 28rpx 130rpx}.section-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12rpx}.eyebrow{font-size:18rpx;letter-spacing:2rpx;font-weight:700;color:#849d7c}.section-title{font-size:36rpx;font-weight:800;margin-top:8rpx}.section-subtitle{font-size:23rpx;color:#78887a;margin-top:8rpx}.feed-status{font-size:19rpx;color:#8b9d86;white-space:nowrap}.shortcuts{display:flex;gap:16rpx;margin:26rpx 0}.shortcut{flex:1;min-width:0;display:flex;align-items:center;gap:14rpx;padding:20rpx;background:#fff;border:1px solid #dfe8dc;border-radius:12rpx}.shortcut-icon{width:56rpx;height:56rpx;line-height:56rpx;text-align:center;border-radius:12rpx;background:#e9f2e5;color:#417654;font-size:28rpx;flex-shrink:0}.shortcut-icon.orange{background:#faebdd;color:#bd743a}.shortcut-name,.shortcut-copy{display:block}.shortcut-name{font-size:25rpx;font-weight:700}.shortcut-copy{font-size:19rpx;margin-top:4rpx;color:#839486}.shortcut-arrow{margin-left:auto;color:#79947d;font-size:28rpx}.library{background:#fff;border:1px solid #dfe7dc;border-radius:14rpx;overflow:hidden}.category-scroll{width:100%;white-space:nowrap;border-bottom:1px solid #e4eae0}.categories{display:inline-flex;align-items:center;white-space:nowrap;padding:0 22rpx}.category{padding:26rpx 17rpx;font-size:23rpx;color:#798b7d;border-bottom:4rpx solid transparent}.category text{font-size:18rpx;color:#9cac98}.category.selected{color:#174b35;border-bottom-color:#264e36;font-weight:750}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16rpx;padding:20rpx 24rpx;background:#fbfcf8;border-bottom:1px solid #e8ede4}.filter-buttons{display:flex;gap:12rpx;white-space:nowrap}.filter-button{font-size:22rpx;color:#839280;padding:12rpx}.filter-button.active{background:#eaf2e5;color:#2e643e;border-radius:8rpx}.search{flex:1;max-width:350rpx;min-width:0;background:#fff;border:1px solid #dfe8db;border-radius:8rpx;font-size:22rpx;padding:12rpx 14rpx;height:40rpx;color:#304d39}.result-note{padding:18rpx 26rpx;color:#98a792;font-size:19rpx}.article{display:flex;gap:14rpx;padding:24rpx 26rpx;border-top:1px solid #edf0ea}.article-main{flex:1;min-width:0}.article-title{font-size:27rpx;line-height:1.5;font-weight:750;color:#243d31}.tag{font-size:18rpx;color:#72976c;border:1px solid #dce9d7;border-radius:5rpx;padding:3rpx 6rpx;margin-right:10rpx;font-weight:400}.article-summary{font-size:22rpx;line-height:1.7;color:#7b8b7e;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:9rpx}.article-meta{font-size:19rpx;color:#9ba99b;margin-top:11rpx}.article-meta text{padding:0 5rpx}.save-button{font-size:38rpx;color:#759b70;padding:4rpx 6rpx}.load-more,.empty{text-align:center;font-size:23rpx;color:#64836b;padding:28rpx}.camp{display:flex;align-items:center;gap:28rpx;margin-top:28rpx;padding:25rpx;background:#eaf3e5;border:1px solid #d8e7d0;border-radius:12rpx}.camp-image{width:110rpx;height:240rpx;flex-shrink:0}.camp-kicker{font-size:19rpx;color:#7b9c6c;font-weight:700}.camp-title{font-size:29rpx;font-weight:750;margin:10rpx 0}.camp-copy{font-size:21rpx;color:#728873;line-height:1.6}.camp-link{font-size:23rpx;color:#326e45;font-weight:700;margin-top:15rpx}.footer-note{font-size:19rpx;line-height:1.6;color:#9bac98;text-align:center;margin:28rpx 0}@media(min-width:768px){.feature{padding-left:max(32px,calc((100% - 1180px)/2));padding-right:max(32px,calc((100% - 1180px)/2))}.content-shell{padding-left:28px;padding-right:28px}.article-title{font-size:16px}.article-summary{font-size:14px}}@media(max-width:450px){.feature-top{gap:12rpx}.feature-image{width:85rpx;height:120rpx}.feature-heading{font-size:26rpx}.feature-copy{font-size:19rpx}.feature-toggle{font-size:18rpx}.feature-more{padding-left:0}.section-top{align-items:flex-start;flex-direction:column}.feed-status{white-space:normal}}
.practice-card{background:#fff;border:1px solid #dfe7dc;border-radius:12rpx;padding:24rpx;margin:0 0 24rpx}.practice-card-title{font-size:27rpx;font-weight:750;color:#284b34}.practice-card-copy{font-size:21rpx;color:#829681;margin-top:8rpx}.practice-links{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:17rpx}.practice-links view{padding:12rpx 16rpx;border-radius:6rpx;background:#eff6e9;color:#467250;font-size:21rpx}
@media(min-width:768px){.feature-label{font-size:12px}.feature-heading{font-size:24px}.feature-copy,.feature-more{font-size:14px}.feature-toggle,.feature-legend,.eyebrow,.feed-status{font-size:12px}.feature-link{font-size:14px}.section-title{font-size:24px}.section-subtitle,.shortcut-name,.category,.filter-button,.search,.practice-card-title{font-size:14px}.shortcut-copy,.result-note,.article-meta,.tag,.practice-card-copy,.footer-note{font-size:12px}.shortcut-arrow{font-size:20px}.practice-links view,.camp-copy,.camp-link{font-size:14px}.camp-kicker{font-size:12px}.camp-title{font-size:20px}.load-more,.empty{font-size:14px}}

/* Homepage: warm editorial palette with compact paths to projects and information. */
.discover-page{background:#f8f4eb;color:#152f23}.home-hero{background:#eaf3e9}.hero-inner{max-width:1120px;margin:0 auto;padding:25px 24px;display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:46px;align-items:center}.hero-badge{display:inline-block;background:#ffeddf;color:#e45620;padding:7px 11px;border-radius:15px;font-size:12px;font-weight:700}.hero-title{font-size:40px;line-height:1.18;letter-spacing:-1.5px;font-weight:850;margin-top:17px;color:#142d20}.hero-desc{font-size:16px;line-height:1.8;color:#53675a;max-width:570px;margin-top:14px}.hero-points{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:20px;max-width:540px}.hero-points view{padding:9px 12px;background:#fff;border:1px solid #e7e5dc;border-radius:7px;font-size:13px;color:#5b6b5d}.hero-points text{font-weight:800;color:#e45723;margin-right:9px}.hero-actions{display:flex;gap:10px;margin-top:21px}.hero-actions button{margin:0;line-height:44px;padding:0 20px;font-size:14px;font-weight:700;border-radius:7px}.button-primary{background:#f15a24;color:white}.button-outline{background:transparent;color:#205a3d;border:1px solid #4f8065}.hero-footnote{font-size:11px;color:#829184;margin-top:11px}.hero-poster{cursor:pointer;position:relative;max-width:240px;background:#fff;padding:6px;border-radius:14px;box-shadow:0 12px 28px #24543520}.hero-poster image{display:block;width:100%;height:200px}.poster-caption{display:flex;justify-content:space-between;align-items:center;background:#0e3826;color:white;border-radius:7px;padding:12px 14px;font-size:12px}.poster-caption view text{display:block}.poster-caption view text:first-child{color:#d9e6d7;font-size:11px}.poster-caption view text+text{font-size:15px;font-weight:700;margin-top:3px}.content-shell{max-width:1120px;padding:32px 24px 80px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:12px}.section-title{font-size:24px;font-weight:800;color:#183328;margin:0}.section-subtitle{font-size:13px;color:#76877a;margin-top:7px}.section-more,.block-title>text{font-size:12px;font-weight:700;color:#235b3d;white-space:nowrap;cursor:pointer}.project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.project-card{padding:19px;background:#fff;border:1px solid #e7e3db;border-radius:8px;cursor:pointer;min-width:0}.project-card:first-child{border-color:#91b79e}.project-tag{display:inline-block;background:#e5f3e9;color:#357050;font-size:11px;font-weight:700;border-radius:4px;padding:5px 7px}.project-title{font-size:17px;font-weight:800;color:#193a29;margin-top:11px}.project-copy{color:#78887b;font-size:12px;line-height:1.7;margin-top:8px;min-height:42px}.project-link{color:#dc5a24;font-size:12px;font-weight:700;margin-top:13px}.simulation-note{font-size:11px;color:#98a193;margin-top:9px}.highlights-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:20px;margin:42px 0}.block-title{display:flex;justify-content:space-between;align-items:end;gap:10px;margin-bottom:14px}.highlight-list{background:#fff;border:1px solid #e7e3db;border-radius:8px;padding:0 15px}.highlight-row{display:flex;align-items:center;gap:11px;padding:13px 0;border-bottom:1px solid #eeede8;cursor:pointer}.highlight-row:last-child{border-bottom:0}.rank{flex:0 0 24px;height:24px;line-height:24px;text-align:center;border-radius:5px;background:#e7f2e9;color:#26704a;font-size:12px;font-weight:800}.highlight-content{flex:1;min-width:0}.highlight-title{font-size:13px;font-weight:700;color:#23392d;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.4}.highlight-meta{font-size:11px;color:#98a396;margin-top:5px}.row-arrow{color:#a1b5a4;font-size:23px}.event-date{flex:0 0 34px;text-align:center;border:1px solid #e8ece6;border-radius:6px;padding:4px 0;color:#859789;font-size:10px}.event-date text{display:block}.event-date text+text{font-size:17px;font-weight:800;color:#205b3c}.highlight-empty,.highlight-footer{padding:20px 0;color:#829385;font-size:12px;line-height:1.6}.highlight-footer{color:#286341;cursor:pointer;font-weight:700}.topic-strip{display:flex;justify-content:space-between;align-items:center;padding:17px 20px;background:#143b29;color:#d4e4d3;border-radius:7px;margin-bottom:38px;font-size:12px;cursor:pointer}.topic-strip view view{font-size:16px;color:white;font-weight:700;margin-top:4px}.section-top{scroll-margin-top:24px}.camp{margin-top:30px;padding:20px 24px;gap:20px;background:#0d3725;border:0;color:#fff;border-radius:8px}.camp-image{width:65px;height:130px}.camp-text{flex:1}.camp-title{font-size:20px;color:#fff;margin:0 0 8px}.camp-copy{font-size:13px;color:#b8d0ba}.camp-cta{padding:12px 16px;background:#f15a24;color:#fff;border-radius:7px;font-size:13px;font-weight:700;white-space:nowrap}.footer-note{font-size:11px}
@media(max-width:700px){.hero-inner{padding:30px 18px;grid-template-columns:1fr;gap:24px}.hero-title{font-size:34px;letter-spacing:-.8px}.hero-desc{font-size:14px}.hero-poster{max-width:none;display:flex;align-items:center;gap:10px;padding:8px}.hero-poster image{height:110px;width:70px;flex-shrink:0}.poster-caption{flex:1;min-height:75px}.hero-actions{display:grid;grid-template-columns:1fr 1fr}.hero-actions button{width:100%;padding:0 4px}.content-shell{padding:30px 16px 75px}.section-title{font-size:21px}.project-grid,.highlights-grid{grid-template-columns:1fr}.project-grid{gap:9px}.project-copy{min-height:0}.highlights-grid{margin:35px 0;gap:28px}.camp{padding:17px;gap:13px;flex-wrap:wrap}.camp-image{width:54px;height:112px}.camp-title{font-size:16px}.camp-copy{font-size:12px}.camp-cta{margin-left:67px}.section-top{gap:12px}.hero-points view{font-size:12px;padding:10px 7px}.hero-points text{margin-right:5px}}

.conference-link{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 10px;margin:12px 0 0;background:#fff4e7;color:#bb4e1c;border-radius:7px;font-size:12px;cursor:pointer}.conference-link>view>text{font-weight:800;font-size:13px}.conference-link>view>view{color:#927965;font-size:11px;margin-top:4px}.conference-link>text{white-space:nowrap;font-weight:700}
.hero-inner{grid-template-columns:minmax(0,1fr) 300px}.hero-poster{width:100%;max-width:300px;box-sizing:border-box}.hero-poster image{height:300px}
@media(max-width:700px){.hero-inner{grid-template-columns:1fr}.hero-poster{max-width:none}.hero-poster image{width:110px;height:220px}.poster-caption{min-height:105px}}

/* 先体验的首页结构，保留真实情报与线下活动入口 */
.home-hero{background:#0b3021;color:#f4f8ed}.hero-v2{max-width:1120px;margin:auto;padding:45px 24px 38px;box-sizing:border-box}.hero-kicker{font-size:13px;font-weight:800;color:#ffcf59}.hero-headline{font-size:44px;line-height:1.18;font-weight:850;margin-top:12px}.hero-sub{font-size:15px;line-height:1.7;color:#bcd0c2;margin-top:12px}.hero-step{font-size:15px;font-weight:750;margin-top:26px}.hero-small{color:#a4bbaa;font-weight:400;font-size:12px;margin-left:7px}.life-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.life-options button{margin:0;border:1px solid #749381;border-radius:25px;background:transparent;color:#d9e8db;font-size:13px;line-height:34px;padding:0 16px}.life-options button.selected{background:#ffcf59;color:#163529;border-color:#ffcf59}.hero-games{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.hero-game{position:relative;background:#fff;color:#173528;border-radius:9px;padding:21px;display:flex;flex-direction:column;gap:11px}.hero-game.featured{outline:2px solid #ffcf59}.hero-game-tag{align-self:flex-start;color:#715407;background:#fff1c3;font-size:11px;padding:4px 8px;border-radius:4px}.hero-game-title{font-size:19px;font-weight:800}.hero-game-copy{font-size:13px;line-height:1.65;color:#6f8074;flex:1}.hero-game button{margin:5px 0 0;background:#ee5a24;color:#fff;font-size:14px;font-weight:750;line-height:42px}.hero-game button.game-secondary{background:#fff;color:#1b6040;border:1px solid #27734d}.hero-footnote-v2{font-size:12px;color:#a4bcaa;margin-top:16px}.hero-footnote-v2 text{color:#f8d471;margin-left:8px}.how-v2{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.how-v2 view{background:#fff;border:1px solid #e7e3db;border-radius:8px;padding:16px}.how-v2 text{display:block}.how-v2 text{color:#d35b2c;font-size:11px;font-weight:750}.how-v2 .how-title{font-size:15px;font-weight:750;color:#183328;margin:6px 0}.how-v2 .how-copy{color:#8b9a8e;font-size:12px}.intel-entry{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #e4e5dd;border-radius:8px;padding:20px;margin-bottom:20px;color:#226542}.intel-entry view>text{font-size:11px;color:#86a388}.intel-entry view>view{font-weight:800;font-size:19px;margin:5px 0}.intel-entry .intel-copy{font-size:12px;color:#869787}.intel-entry>text{font-size:13px;font-weight:700}.hero-v2 button:after{border:0}@media(max-width:700px){.hero-v2{padding:30px 16px}.hero-headline{font-size:32px}.hero-games{grid-template-columns:1fr;gap:9px}.hero-game{padding:16px}.hero-game-copy{font-size:12px}.how-v2{grid-template-columns:1fr 1fr;gap:8px}.intel-entry{gap:12px}.intel-entry>text{white-space:nowrap}}
.recommendation-note{margin-top:10px;color:#c0d2c4;font-size:12px;line-height:1.6}.recommendation-reason{padding:9px 10px;border-radius:6px;background:#f8f5e9;color:#526857;font-size:12px;line-height:1.6}.hero-game.featured .hero-game-copy{flex:0}.hero-game.featured button{margin-top:auto}
.hero-game-tag{font-size:12px}
.highlights-grid{display:block}.highlights-grid>.highlight-block+.highlight-block{margin-top:42px}.home-cases{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.home-case{display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid #e5decf;border-radius:16px}.home-case-main{padding:15px;cursor:pointer;flex:1}.home-case-tags{display:flex;gap:6px}.home-case-tags text{font-size:11px;font-weight:800;color:#0e5a3a;background:#e2f1e7;padding:3px 7px;border-radius:5px}.home-case-tags text+text{background:#e4eef8;color:#2b5c8a}.home-case-title{font-weight:850;font-size:16px;line-height:1.45;margin-top:9px}.home-case-start,.home-case-by{font-size:12px;color:#829387;line-height:1.5;margin-top:8px}.home-case-numbers{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:10px}.home-case-numbers view{background:#f7f3ea;border-radius:8px;padding:8px;min-width:0}.home-case-numbers text{display:block;font-size:11px;color:#788c7d;line-height:1.4}.home-case-numbers text:first-child{color:#193c29;font-size:15px;font-weight:850}.home-case-play{display:flex;align-items:center;gap:9px;padding:12px 14px;background:#0b2e20;color:#fff;cursor:pointer}.home-case-play>text:first-child{width:30px;height:30px;line-height:30px;text-align:center;border-radius:50%;background:#ee5a24;font-size:12px}.home-case-play>view{flex:1;font-size:13px;font-weight:800}.home-case-play>view>text{display:block;font-size:11px;font-weight:400;color:#bad0c0;margin-top:3px}.home-case-play>text:last-child{font-size:12px;color:#ffc94d;font-weight:800}
.hero-v2{position:relative}.report-example{display:none}.home-section-head{display:flex;justify-content:space-between;align-items:end;gap:12px}.home-section-head>text{color:#0e5a3a;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}.home-deck-scroll{width:100%;margin-top:16px}.home-deck{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.home-deck-note{color:#84968a;font-size:12px;margin-top:12px}.highlights-grid{margin-top:48px}
@media(min-width:900px){.hero-v2{padding-right:470px;min-height:315px}.report-example{display:block;position:absolute;right:42px;top:31px;width:320px;box-sizing:border-box;padding:20px;background:#fff;border-radius:20px;color:#173b2a;transform:rotate(2deg);box-shadow:0 20px 40px #0003}.report-caption,.report-note{font-size:12px;color:#819386}.report-money{font-size:42px;line-height:1.1;font-weight:900;margin-top:10px}.report-stamp{display:inline-block;margin-top:8px;border:2px solid #ee5a24;color:#d94b1a;border-radius:8px;padding:3px 10px;font-weight:850;transform:rotate(-3deg)}.report-persona{margin:14px 0 10px;padding:12px;border-radius:10px;background:#0b2e20;color:#ffc94d;font-weight:800}}
@media(max-width:700px){.home-deck{display:flex;width:max-content;gap:12px;padding:0 2px 6px}.home-deck>*{width:280px;flex:none}.home-deck-note{font-size:11px}.home-section-head .section-title{font-size:20px}.home-section-head>text{font-size:12px}.highlights-grid{margin-top:32px}.home-cases{grid-template-columns:1fr}.home-case.third-case{display:none}}
.home-camp-actions{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0}.home-camp-primary{display:block;box-sizing:border-box;margin:0;padding:11px 15px;border-radius:7px;background:#f15a24;color:white;font-size:13px;font-weight:750;line-height:20px;text-align:center;text-decoration:none;white-space:nowrap}.home-camp-detail{margin:0;padding:0;background:transparent;color:#dcebd5;font-size:13px;line-height:26px;font-weight:700}.home-camp-detail:after{border:0}@media(max-width:700px){.home-camp-actions{width:calc(100% - 67px);align-items:stretch;margin-left:67px}.home-camp-primary,.home-camp-detail{width:100%}}

/* FDE stays in the activity list, with its current source status. */
.conference-link{margin:0 0 8px;padding:16px;background:#123d2b;color:#f1f7ec;border-radius:8px}.conference-copy{min-width:0}.conference-copy .conference-label{display:block;color:#cbe496;font-size:12px;font-weight:800}.conference-copy .conference-name{margin-top:5px;color:#fff;font-size:16px;font-weight:800;line-height:1.45}.conference-copy .conference-detail{margin-top:5px;color:#bed1bc;font-size:12px;line-height:1.5}.conference-actions{display:flex;flex-direction:column;align-items:flex-end;gap:9px;flex-shrink:0}.conference-actions button{margin:0;padding:0;background:transparent;border:0;color:#e1f0aa;white-space:nowrap;font-size:12px;font-weight:700;line-height:1.5}.conference-actions button:first-child:not(:last-child){color:#b9d2bd}
.hero-start{display:inline-block;margin:20px 0 0;padding:0 26px;line-height:50px;border-radius:999px;background:#EE5A24;color:#fff;font-size:17px;font-weight:900;border:0}
.hero-start::after{border:0}
@media(min-width:900px){.hero-v2{padding-right:24px;min-height:0}.hero-headline{max-width:720px}.hero-sub{max-width:620px}}
/* 首页 A+：白底、大图、群青蓝 */
.discover-page{background:#F3F4F6;color:#161A23}
.learn-banner{display:flex;align-items:center;gap:8px;margin:8px 12px 0;background:#161A23;color:#fff;border-radius:12px;padding:9px 12px;font-size:13px;font-weight:700;cursor:pointer}
.lb-tag{font-size:11px;font-weight:800;background:rgba(255,255,255,.12);color:#C9CFFF;border-radius:6px;padding:1px 6px}
.lb-go{margin-left:auto;color:#C9CFFF}
.home-a{max-width:640px;margin:0 auto;padding:12px 16px 8px;box-sizing:border-box}
.ha-title{font-size:28px;line-height:1.3;font-weight:800}
.ha-sub{font-size:14.5px;color:#5F6675;margin-top:6px}
.ha-feature{margin-top:16px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 14px 34px -24px rgba(22,26,35,.6);cursor:pointer}
.ha-pic{position:relative}
.ha-img{display:block;width:100%;height:200px}
.ha-mimg{display:block;width:100%;height:110px}
.ha-tag{position:absolute;left:10px;top:10px;font-size:11px;font-weight:800;color:#fff;background:rgba(22,26,35,.6);border-radius:8px;padding:2px 8px}
.ha-ladder{display:flex;gap:6px;padding:12px 16px 0;flex-wrap:wrap}
.ha-ladder text{font-size:12px;font-weight:700;color:#5F6675;background:#F3F4F6;border-radius:8px;padding:3px 8px}
.ha-ladder text.on{background:#ECEFFE;color:#2B44E6}
.ha-tx{padding:8px 16px 16px}
.ha-name{display:block;font-size:20px;font-weight:800}
.ha-desc{display:block;font-size:13.5px;color:#5F6675;margin-top:2px}
.ha-cta{margin-top:12px;background:#2B44E6;color:#fff;border-radius:14px;text-align:center;font-weight:800;font-size:16px;line-height:48px}
.ha-duo{display:grid;grid-template-columns:1.1fr .9fr;gap:10px;margin-top:10px}
.ha-mini{background:#fff;border-radius:18px;overflow:hidden;cursor:pointer}
.ha-mtx{padding:8px 12px 12px}
.ha-mname{display:block;font-size:14px;font-weight:800}
.ha-mdesc{display:block;font-size:12px;color:#5F6675}
.ha-vote{background:#E8EAEE;border-radius:18px;padding:12px}
.ha-vt{display:block;font-size:14px;font-weight:800;margin-bottom:8px}
.ha-vs text{display:inline-block;background:#fff;border-radius:99px;padding:4px 10px;margin:0 4px 6px 0;font-size:12.5px;color:#5F6675;cursor:pointer}
.ha-vs text.on{background:#2B44E6;color:#fff}
.ha-want{display:flex;gap:8px;align-items:center;margin-top:12px;background:#fff;border-radius:16px;padding:6px 6px 6px 14px}
.ha-input{flex:1;min-width:0;height:44px;font-size:15px;color:#161A23}
.ha-send{margin:0;height:40px;line-height:40px;padding:0 16px;border-radius:12px;background:#2B44E6;color:#fff;font-weight:800;font-size:14px;border:0}
.ha-send::after{border:0}
.ha-privacy{display:block;color:#76808c;font-size:11px;line-height:1.5;margin:6px 5px 0}
.ha-reply{margin-top:8px;font-size:13.5px;color:#5F6675}
.ha-go{margin-left:8px;color:#2B44E6;font-weight:800;cursor:pointer}
.ha-aid{display:flex;align-items:center;gap:10px;margin-top:12px;background:#fff;border-radius:16px;padding:14px 16px;cursor:pointer}
.ha-aidt{display:block;font-size:15px;font-weight:800}
.ha-aidd{display:block;font-size:12.5px;color:#5F6675;margin-top:2px}
.ha-arrow{margin-left:auto;font-size:20px;color:#9AA0AC}

/* A+：首页下半截（真人案例、活动）和上面统一：白卡、浅灰底、蓝色只给可点的地方 */
.discover-page .content-shell{max-width:640px;padding-top:8px}
.discover-page .section-title{color:#161A23}
.discover-page .section-subtitle{color:#9AA0AC}
.discover-page .section-more,.discover-page .block-title>text{color:#2B44E6}
.discover-page .home-case{border:0;border-radius:18px}
.discover-page .home-case-tags text{color:#2B44E6;background:#ECEFFE;border-radius:8px}
.discover-page .home-case-tags text+text{color:#5F6675;background:#F3F4F6}
.discover-page .home-case-title{color:#161A23}
.discover-page .home-case-start,.discover-page .home-case-by{color:#9AA0AC}
.discover-page .home-case-numbers view{background:#F3F4F6;border-radius:12px}
.discover-page .home-case-numbers text{color:#5F6675}
.discover-page .home-case-numbers text:first-child{color:#161A23}
.discover-page .home-case-play{background:#161A23}
.discover-page .home-case-play>text:first-child{background:#2B44E6}
.discover-page .home-case-play>view>text{color:#C9CFFF}
.discover-page .home-case-play>text:last-child{color:#C9CFFF}
.discover-page .highlight-list{border:0;border-radius:18px}
.discover-page .highlight-title{color:#161A23}
.discover-page .highlight-meta{color:#9AA0AC}
.discover-page .event-date{border-color:#E6E8EC;color:#9AA0AC;border-radius:10px}
.discover-page .event-date text+text{color:#2B44E6}
.discover-page .highlight-footer{color:#2B44E6}
.discover-page .conference-link{background:#161A23;color:#fff;border-radius:14px}
.discover-page .conference-link>view>view{color:#5F6675}
.discover-page .conference-copy .conference-name{color:#fff}
.discover-page .conference-copy .conference-label{color:#C9CFFF}
.discover-page .conference-copy .conference-detail{color:#B8BDC8}
.discover-page .conference-actions button{color:#fff}
.discover-page .conference-actions button:first-child:not(:last-child){color:#B8BDC8}
.discover-page .footer-note{color:#9AA0AC}
/* First-visit guide, matching the learning home. */
.ha-how{margin-top:14px;background:#fff;border-radius:18px;padding:14px 14px 12px}
.ha-how-t{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px;font-weight:800;color:#161A23}
.ha-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
.ha-step{display:flex;flex-direction:column;gap:2px}
.ha-n{display:inline-flex;width:22px;height:22px;border-radius:7px;background:#2B44E6;color:#fff;font-size:12px;font-weight:900;align-items:center;justify-content:center}
.ha-sb{font-size:14px;font-weight:800;color:#161A23;margin-top:4px}
.ha-ss{font-size:12px;line-height:1.5;color:#5F6675}
.ha-replay{font-size:12.5px;font-weight:700;color:#2B44E6;cursor:pointer}

/* V49 首页开场 */
.ha-title{font-size:34px;line-height:1.18;font-weight:900;letter-spacing:-.5px}
.ha-sub{font-size:15px;line-height:1.7;margin-top:10px}
.ha-search{display:flex;gap:8px;align-items:center;margin-top:16px;background:#fff;border-radius:18px;padding:6px 6px 6px 16px;box-shadow:inset 0 0 0 1.5px #E6E8EC}
.ha-search .ha-send{height:44px;line-height:44px;padding:0 18px;font-size:15px}
.ha-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ha-chips text{font-size:13px;font-weight:700;color:#5F6675;background:#fff;border-radius:99px;padding:6px 12px;cursor:pointer}
.ha-trust{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:14px;font-size:13px;font-weight:700;color:#5F6675}.ha-trust .ck{color:#2B44E6;margin-right:5px}
.home-a>.ha-replay{display:inline-block;margin-top:12px}
@media(min-width:768px){.ha-title{font-size:48px;letter-spacing:-1px}.ha-sub{font-size:17px}}
/* V50 desktop layout */
.ha-hero>.ha-replay{display:inline-block;margin-top:12px}
@media(min-width:900px){
  .home-a{max-width:1120px;padding:56px 32px 8px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);column-gap:56px;row-gap:16px;align-items:start}
  .ha-hero{grid-column:1;grid-row:1;align-self:center}
  .ha-title{font-size:56px;line-height:1.1;letter-spacing:-1.5px}
  .ha-sub{font-size:18px;max-width:520px}
  .ha-search{max-width:560px;margin-top:24px}
  .ha-feature{grid-column:2;grid-row:1;margin-top:0}
  .ha-img{height:260px}
  .ha-duo{grid-column:1 / -1;margin-top:24px;grid-template-columns:1fr 1fr;gap:16px}
  .ha-mimg{height:160px}
  #tour-lib{grid-column:1;margin-top:0}
  .ha-aid2{grid-column:2;margin-top:0}
  .discover-page .content-shell{max-width:1120px;padding-left:32px;padding-right:32px}
}
</style>
