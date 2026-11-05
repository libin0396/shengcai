<template>
  <view class="detail-page">
    <SiteHeader active="intelligence" />
    <view class="detail-shell">
      <view class="back" @click="goBack">← 返回文章</view>
      <view v-if="article" class="article-layout">
        <view class="main-column">
          <view class="article-header"><view class="source-label">● 来源：生财有术 <text>{{ article.isDigested ? '精华文章' : '圈友分享' }}</text></view><view class="headline">{{ article.title }}</view><view class="byline">{{ article.author || '生财圈友' }} · {{ formatDate(article.publishedAt) }} · {{ article.kind || '分享' }}</view></view>
          <template v-if="study">
            <view class="intro-card case-overview"><view class="intro-label">案例解读 <text>站方整理 · 作者自述</text></view><view class="intro-title">一句话看懂</view><view class="intro-body">{{study.oneLiner}}</view><view class="number-grid"><view v-for="n in study.numbers" :key="n.label" class="number-card" :class="{'undisclosed':!n.value}"><text class="number-label">{{n.label}}</text><text class="number-value">{{n.value || '未披露'}}</text><text class="number-note">{{n.note}}</text></view></view></view>
            <view class="intro-card case-section"><view class="intro-label">01 · 项目是什么</view><view class="intro-title">从真实需求出发</view><view v-for="row in projectRows" :key="row[0]" class="fact-row"><text>{{row[0]}}</text><text>{{row[1] || '未披露'}}</text></view></view>
            <view class="intro-card case-section"><view class="intro-label">02 · 作者从哪里开始</view><view class="intro-title">先看条件，再看结果</view><view v-for="row in startRows" :key="row[0]" class="fact-row"><text>{{row[0]}}</text><text>{{row[1] || '未披露'}}</text></view></view>
            <view class="intro-card case-section"><view class="intro-label">03 · 具体怎么做</view><view class="intro-title">拆开关键步骤</view><view v-for="(step,i) in study.steps" :key="step.title" class="case-step"><text class="case-step-number">{{String(i+1).padStart(2,'0')}}</text><view><text class="case-step-title">{{step.title}}</text><text class="case-step-detail">{{step.detail}}</text></view></view></view>
            <view class="intro-card case-section"><view class="intro-label">04 · 结果与踩坑</view><view class="intro-title">过程中的困难</view><view v-for="pit in study.pitfalls" :key="pit.title" class="pitfall"><text class="case-step-title">{{pit.title}}</text><text class="case-step-detail">{{pit.detail}}</text></view></view>
            <view class="intro-card judgement"><view class="intro-label">05 · 站方判断 · 不是原帖内容</view><view class="intro-title">适合谁，开始前想什么？</view><view v-for="(line,i) in study.judgement.fitFor" :key="'fit'+i" class="judgement-line">适合参考：{{line}}</view><view v-for="(line,i) in study.judgement.thinkFirst" :key="'think'+i" class="judgement-line">开始前：{{line}}</view></view>
          </template>
          <view v-else class="intro-card"><view class="intro-label">AINPE 案例导读 <text>基于已收录资料整理</text></view><template v-if="expandedSummary"><view class="intro-title">这篇内容讲了什么</view><view class="intro-body">{{ expandedSummary.what }}</view><view class="intro-title">做法与观察</view><view class="intro-body">{{ expandedSummary.how }}</view><view class="intro-title">阅读时需要注意</view><view class="intro-body">{{ expandedSummary.note }}</view></template><template v-else><view class="intro-title">短摘要 · 资料不足</view><view class="intro-body">{{ displaySummary }}</view></template><view class="intro-note">目前展示的是已收录导读或部分摘要；具体步骤、结果和完整语境请以原帖为准。</view></view>
          <view v-if="isAiArticle(article)" class="practice"><view class="camp-kicker">从看到做到 · 模拟体验</view><view class="practice-title">{{matchingGame ? `读完，亲手试一次：${matchingGame.name}` : '先体验一个 AI 项目'}}</view><view class="practice-copy">情境与反馈为模拟，可以先动手尝试，再判断下一步。</view><button class="play-action" @click="openSimulation">{{matchingGame ? '玩相关模拟 →' : '查看模拟项目 →'}}</button></view>
          <view v-if="isProjectArticle && !(study && matchingGame)" class="reservation"><view class="section-heading">想体验这篇文章中的项目？</view><view class="section-hint">表达兴趣，帮助我们了解下一步想体验的方向。</view><button class="reserve-button" :disabled="reserveLoading || reserved || !reservationAvailable" @click="reserve">{{ reserved ? '已预约体验' : reserveLoading ? '正在记录…' : '预约体验这个项目' }}</button><view class="reserve-meta">{{ reservationAvailable ? (reservationCount > 0 ? `已有 ${reservationCount} 条预约记录。` : '欢迎第一个预约。') + '同一浏览器仅计一次，不收联系方式，也不会自动通知。' : '预约统计暂不可用，请稍后再试。' }}</view></view>
          <view v-else-if="isEventArticle" class="reservation"><view class="section-heading">想了解线下活动？</view><view class="section-hint">在站内浏览已收录的活动信息和参与方式。</view><button class="reserve-button" @click="openEvents">查看线下活动</button></view>
          <view class="actions"><button class="save" @click="toggleSaved">{{ saved ? '★ 已收藏' : '☆ 收藏' }}</button><button class="source" @click="openSource">加入生财，查看完整文章 ↗</button></view>
          <view class="camp" @click="openCamp"><image :src="campaign.posterUrl" mode="aspectFit" class="camp-image"/><view><view class="camp-kicker">下一步 · 动手试试</view><view class="camp-title">把读过的，变成亲手做过的。</view><view class="camp-copy">想开始实践？了解 AI 成万事 · 三天体验营，具体安排以入口说明为准。</view><view class="camp-link">了解体验营 ↗</view></view></view>
          <view v-if="related.length" class="related"><view class="related-label">KEEP EXPLORING</view><view class="section-heading">接着看看相关案例</view><view class="section-hint">根据共同话题推荐</view><view v-for="item in related" :key="item.id" class="related-row" @click="openArticle(item)"><view><text class="related-title">{{ item.title }}</text><text class="related-meta">{{ item.author || '生财圈友' }} · {{ item.kind || '分享' }}</text></view><text class="related-arrow">↗</text></view></view>
          <view class="footnote">{{study ? '本页是站方解读，不是原文转载；数字为作者自述，本站未独立核实。' : '内容基于已收录资料整理，完整语境与参与条件请以原始来源为准。'}}收藏保存在当前设备。</view>
        </view>
        <view class="side-column"><view class="side-card"><view class="side-eyebrow">先玩再读，读得更懂</view><view class="side-title">看见机会，<br/>也试着迈出一步。</view><view class="side-copy">从案例中了解做法，再亲手体验项目里的关键步骤。</view><view class="side-link" @click="openSimulation">{{matchingGame ? `玩相关模拟：${matchingGame.name} ↗` : '看看模拟项目 ↗'}}</view></view></view>
      </view>
      <view v-else-if="feedMeta.loading || !feedMeta.loadAttempted" class="not-found"><view>正在加载文章…</view><text>请稍候。</text></view>
      <view v-else-if="feedMeta.loadFailed" class="not-found"><view>暂时无法加载文章</view><text>请检查网络连接后重试。</text><button @click="refreshFeed">重新加载</button></view>
      <view v-else class="not-found"><view>暂未找到这篇文章</view><text>它可能不在当前已收录的资料中。</text><button @click="goBack">返回文章列表</button></view>
    </view>
  </view>
</template>

<script setup>
import {computed, ref, onMounted, onUnmounted} from 'vue';
import {onLoad, onShow} from '@dcloudio/uni-app';
import {articles, campaign, isAiArticle, feedMeta, refreshFeed} from '../../data/content.js';
import summaries from '../../data/article-summaries.json';
import SiteHeader from '../../components/SiteHeader.vue';
import {matchArticleGame,simulationUrl} from '../../data/game-matching.js';
import {caseById,caseAsArticle} from '../../data/case-studies.js';

const id=ref('');
const savedIds=ref([]);
const study=computed(()=>caseById(id.value));
const article=computed(()=>study.value ? caseAsArticle(study.value) : (Array.isArray(articles)?articles:[]).find(item=>String(item.id)===id.value));
const projectRows=computed(()=>study.value ? [['项目',study.value.project.what],['面向谁',study.value.project.audience],['怎样获客',study.value.project.acquisition],['收入方式',study.value.project.revenueModel]] : []);
const startRows=computed(()=>study.value ? [['职业与状态',study.value.start.occupation],['相关经验',study.value.start.experience],['每天时间',study.value.start.dailyTime],['启动预算',study.value.start.budget]] : []);
const storageKey=computed(()=>`article:${id.value}`);
const saved=computed(()=>savedIds.value.includes(storageKey.value));
const expandedSummary=computed(()=>summaries[id.value]||null);
const displaySummary=computed(()=>{const s=String(article.value?.overview||article.value?.summary||'').trim();return s ? /[。！？.!?…]$/.test(s)?s:`${s}…` : '当前暂无可展示的摘要。';});
const matchingGame=computed(()=>study.value?.simulation || matchArticleGame(article.value));
const isEventArticle=computed(()=>/(线下|聚会|组局|大会|沙龙|夜话)/i.test(String(article.value?.title||'')));
const isProjectArticle=computed(()=>!!article.value && isAiArticle(article.value) && !isEventArticle.value && (article.value.kind==='案例'||/(项目|副业|变现|获客|带货|接单|营收|收入|小程序|工具|工作流|智能体|开发|搭建|视频制作|创作)/i.test(`${article.value.title||''} ${article.value.summary||''}`)));
const reserveLoading=ref(false), reserved=ref(false), reservationCount=ref(0), reservationAvailable=ref(false);
let reservationEnabled=false;
// #ifdef H5
reservationEnabled=true;
// #endif
function api(options){return new Promise((resolve,reject)=>uni.request({...options,timeout:8000,success:r=>r.statusCode>=200&&r.statusCode<300?resolve(r.data):reject(new Error('unavailable')),fail:reject}));}
async function loadReservation(){reservationAvailable.value=false;reserved.value=false;reservationCount.value=0;if(!reservationEnabled||!/^\d{1,30}$/.test(id.value))return;const current=id.value;try{const d=await api({url:'/api/reservations',method:'GET'});const key=`article:${current}`;if(!d||d.countUnit!=='browser'||!Array.isArray(d.mine)||!d.counts||typeof d.counts!=='object')throw Error();const count=d.counts[key]??0;if(!Number.isInteger(count)||count<0)throw Error();if(id.value!==current)return;reservationCount.value=count;reserved.value=d.mine.includes(key);reservationAvailable.value=true;}catch{reservationAvailable.value=false;}}
async function reserve(){if(!reservationAvailable.value||reserveLoading.value||reserved.value)return;reserveLoading.value=true;const current=id.value;try{const key=`article:${current}`;const d=await api({url:'/api/reservations',method:'POST',header:{'Content-Type':'application/json'},data:{projectId:key}});if(d?.projectId!==key||d.reserved!==true||d.countUnit!=='browser'||!Number.isInteger(d.count)||d.count<0)throw Error();if(id.value!==current)return;reservationCount.value=d.count;reserved.value=true;}catch{reservationAvailable.value=false;uni.showToast({title:'预约未完成，请稍后再试',icon:'none'});}finally{reserveLoading.value=false;}}
const related=computed(()=>{
  if(!article.value)return [];
  if(study.value)return study.value.related.map(x=>caseById(x)).filter(Boolean).map(caseAsArticle);
  const topics=new Set((Array.isArray(article.value.topics)?article.value.topics:[]).filter(topic=>topic!=='community'));
  if(!topics.size)return [];
  return (Array.isArray(articles)?articles:[]).filter(item=>String(item.id)!==id.value&&isAiArticle(item)&&(item.topics||[]).some(topic=>topics.has(topic))).slice(0,3);
});
function loadLocal(){try{const ids=uni.getStorageSync('ainpe:saved');savedIds.value=Array.isArray(ids)?ids:[];}catch{savedIds.value=[];}}
onLoad(options=>{id.value=String(options?.id||'');loadLocal();loadReservation();});
onShow(()=>{if(id.value){loadLocal();loadReservation();}});
// #ifdef H5
function syncArticleFromHash(){const hash=window.location.hash;const q=hash.indexOf('?');if(q<0||hash.slice(0,q)!=='#/pages/article/index')return;const next=new URLSearchParams(hash.slice(q+1)).get('id')||'';if(next!==id.value){id.value=next;loadLocal();if(next)loadReservation();}}
onMounted(()=>window.addEventListener('hashchange',syncArticleFromHash));
onUnmounted(()=>window.removeEventListener('hashchange',syncArticleFromHash));
// #endif
function toggleSaved(){const next=saved.value?savedIds.value.filter(key=>key!==storageKey.value):[...savedIds.value,storageKey.value];try{uni.setStorageSync('ainpe:saved',next);savedIds.value=next;uni.showToast({title:saved.value?'已收藏':'已取消收藏',icon:'none'});}catch{uni.showToast({title:'保存失败，请检查存储空间',icon:'none'});}}
function goBack(){const pages=getCurrentPages();if(pages.length>1)uni.navigateBack();else uni.reLaunch({url:'/pages/discover/index'});}
function openCamp(){uni.navigateTo({url:'/pages/camp/index?from=article'});}
function openEvents(){uni.navigateTo({url:'/pages/events/index'});}
function openSimulation(){
if(study.value?.simulation?.url){uni.navigateTo({url:study.value.simulation.url});return;}
// #ifdef H5
if(matchingGame.value){const url=simulationUrl(matchingGame.value.file);if(url){window.location.href=url;return;}}
// #endif
uni.navigateTo({url:'/pages/simulate/index'});
}
function openSource(){const source=String(article.value?.sourceUrl||'');uni.navigateTo({url:`/pages/camp/index?from=article&source=${encodeURIComponent(source)}`});}
function openArticle(item){try{uni.setStorageSync('ainpe:last-article',{id:String(item.id),openedAt:Date.now()});}catch{}uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(String(item.id))}`});}
function formatDate(value){const d=new Date(Number(value)*1000+8*3600000);return Number.isNaN(d.getTime())?'时间待确认':`${d.getUTCFullYear()}年${d.getUTCMonth()+1}月${d.getUTCDate()}日`;}
</script>

<style scoped>
.detail-page{min-height:100vh;background:#f4f3ee;color:#1d3d2e}.detail-shell{max-width:1200px;margin:0 auto;padding:32rpx 28rpx 130rpx}.back{font-size:24rpx;color:#7b927b;margin:0 0 28rpx}.article-layout{display:flex;gap:28rpx}.main-column{flex:1;min-width:0}.side-column{display:none}.article-header{padding:24rpx 0 32rpx}.source-label{font-size:21rpx;color:#799966;font-weight:700}.source-label text{font-weight:400;color:#98a790;padding-left:12rpx}.headline{font-size:43rpx;font-weight:800;line-height:1.35;color:#1a3528;margin:20rpx 0}.byline{font-size:22rpx;color:#94a18f}.intro-card,.discussion,.personal,.related{background:#fff;border:1px solid #e0e8dd;border-radius:12rpx;padding:28rpx;margin-bottom:22rpx}.intro-label{font-size:20rpx;font-weight:750;color:#648b59}.intro-label text{font-size:19rpx;color:#9ba99a;font-weight:400;margin-left:14rpx}.intro-title,.section-heading{font-size:29rpx;font-weight:750;color:#244631;margin-top:18rpx}.intro-body{font-size:26rpx;line-height:1.85;color:#405a47;margin-top:16rpx;white-space:pre-wrap}.intro-note{border-top:1px solid #e9eee6;margin-top:24rpx;padding-top:18rpx;font-size:21rpx;line-height:1.65;color:#91a18c}.section-heading{margin-top:0}.section-heading text{font-size:20rpx;color:#94a78f;font-weight:400}.section-hint{font-size:21rpx;color:#93a191;line-height:1.6;margin-top:10rpx}.comment{border-top:1px solid #edf0eb;margin-top:22rpx;padding-top:20rpx}.comment-meta{display:flex;gap:14rpx;font-size:22rpx;color:#365c40;font-weight:700}.comment-angle{font-size:19rpx;color:#90a18c;font-weight:400}.comment-text{border-left:4rpx solid #cfe0c4;padding-left:18rpx;margin-top:12rpx;color:#617966;font-size:23rpx;line-height:1.75;white-space:pre-wrap}.notes{width:100%;box-sizing:border-box;margin-top:18rpx;padding:18rpx;background:#f7faf4;border:1px solid #dfeadb;border-radius:8rpx;font-size:24rpx;line-height:1.6;color:#2e4c36;height:160rpx}.personal-row{display:flex;align-items:center;gap:15rpx;font-size:22rpx;color:#7b9079;margin-top:18rpx;flex-wrap:wrap}.picker-value{padding:11rpx 20rpx;border:1px solid #dfe9d8;border-radius:7rpx;background:#f7faf4;color:#426a45}.personal-hint{margin-left:auto;color:#9da996;font-size:19rpx}.actions{display:flex;gap:14rpx;margin:22rpx 0}.actions button{margin:0;padding:0 23rpx;border-radius:8rpx;font-size:23rpx;line-height:68rpx}.actions button:after{border:0}.save{background:#fff;color:#446c49;border:1px solid #dce8d7}.source{background:#254d36;color:#fff}.camp{display:flex;align-items:center;gap:24rpx;padding:24rpx;background:#ecf4e8;border:1px solid #d7e8d0;border-radius:12rpx;margin:25rpx 0}.camp-image{width:110rpx;height:240rpx;flex-shrink:0}.camp-kicker,.related-label{font-size:19rpx;color:#7d9e70;font-weight:700;letter-spacing:1rpx}.camp-title{font-size:29rpx;font-weight:750;margin-top:8rpx}.camp-copy{font-size:21rpx;color:#7e917b;line-height:1.7;margin-top:8rpx}.camp-link{color:#34724a;font-size:23rpx;font-weight:700;margin-top:13rpx}.related{margin-top:28rpx}.related .section-heading{margin-top:8rpx}.related-row{display:flex;align-items:center;justify-content:space-between;gap:20rpx;border-top:1px solid #edf1e9;padding:20rpx 0}.related-row:first-of-type{margin-top:18rpx}.related-title,.related-meta{display:block}.related-title{font-size:24rpx;color:#2d4c38;line-height:1.5}.related-meta{font-size:19rpx;color:#9ca99b;margin-top:6rpx}.related-arrow{font-size:26rpx;color:#90a789}.footnote{font-size:19rpx;line-height:1.7;color:#9ba998;text-align:center;margin-top:35rpx}.not-found{padding:80rpx 20rpx;text-align:center;font-size:32rpx;font-weight:700}.not-found text{display:block;font-weight:400;font-size:23rpx;color:#839485;margin:20rpx}.not-found button{width:260rpx;background:#254d36;color:#fff;font-size:24rpx}.side-card{background:#173c2c;color:#f1f7e9;border-radius:12rpx;padding:28rpx}.side-eyebrow{font-size:18rpx;letter-spacing:1rpx;color:#a7ca83}.side-title{font-size:31rpx;font-weight:750;line-height:1.5;margin:20rpx 0}.side-copy{font-size:22rpx;line-height:1.7;color:#bed0b8}.side-link{color:#d9f293;font-size:22rpx;margin-top:22rpx}@media(min-width:900px){.side-column{display:block;width:250px;flex-shrink:0}.headline{font-size:32px}.intro-body{font-size:16px}.detail-shell{padding-left:28px;padding-right:28px}}
.reservation{background:#fff;border:1px solid #e0e8dd;border-radius:12rpx;padding:28rpx;margin-bottom:22rpx}.reserve-button{display:inline-block;margin:20rpx 0 0;padding:0 24rpx;background:#f05b27;color:#fff;font-size:24rpx;line-height:68rpx}.reserve-button[disabled]{color:#8a998b;background:#e8ede7}.reserve-meta{font-size:21rpx;line-height:1.6;color:#89998a;margin-top:12rpx}.practice{margin:0 0 22rpx;padding:24rpx 28rpx;border-radius:12rpx;background:#eef5e8;border:1px solid #dce9d4}.practice-title{font-size:28rpx;font-weight:750;margin-top:9rpx;color:#264b32}.practice-copy{font-size:21rpx;line-height:1.7;color:#799079;margin-top:7rpx}
@media(min-width:768px){.back,.source-label,.byline,.intro-label,.intro-label text,.intro-note,.section-heading text,.section-hint,.comment-meta,.comment-angle,.personal-hint,.camp-kicker,.related-label,.related-meta,.footnote,.side-eyebrow{font-size:12px}.intro-title,.section-heading,.camp-title,.side-title{font-size:20px}.practice-title{font-size:18px}.practice-copy,.comment-text,.notes,.personal-row,.picker-value,.actions button,.camp-copy,.camp-link,.related-title,.side-copy,.side-link{font-size:14px}}

.play-action{display:inline-block;margin:12px 0 0;padding:0 16px;line-height:40px;background:#ee5a24;color:#fff;font-size:13px;font-weight:750;border-radius:6px}.play-action:after{border:0}
.number-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:22px}.number-card{display:flex;flex-direction:column;gap:6px;padding:15px;border-radius:7px;background:#f1f7ee;min-width:0}.number-card.undisclosed{border:1px dashed #cfd8c8;background:#fbfbf8}.number-label,.number-note,.number-value{display:block;overflow-wrap:anywhere}.number-label,.number-note{font-size:12px;line-height:1.5;color:#738674}.number-value{font-size:18px;line-height:1.35;font-weight:800;color:#155d3c}.case-section{padding:24px}.fact-row{display:grid;grid-template-columns:100px minmax(0,1fr);gap:12px;padding:12px 0;border-top:1px solid #edf1eb;font-size:14px;line-height:1.7}.fact-row:first-of-type{margin-top:16px}.fact-row>text:first-child{color:#7f9180}.case-step{display:flex;gap:14px;margin-top:18px}.case-step-number{flex:0 0 30px;color:#ce6a36;font-weight:800;font-size:13px}.case-step-title,.case-step-detail{display:block}.case-step-title{font-size:15px;font-weight:750;color:#294b35;line-height:1.5}.case-step-detail,.judgement-line{font-size:14px;line-height:1.8;color:#526e59;margin-top:7px}.pitfall{background:#fff5e9;border-left:3px solid #ef9c5d;padding:15px;margin-top:14px}.judgement{background:#f5f2fb;border-color:#e4dcf4}.judgement .intro-label{color:#77629b}.judgement-line{margin-top:12px}@media(max-width:700px){.number-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.number-card{padding:12px}.number-value{font-size:16px}.case-section{padding:20px 16px}.fact-row{grid-template-columns:78px minmax(0,1fr)}}
</style>
