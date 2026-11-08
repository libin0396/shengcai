<template>
  <view class="intel-page">
    <SiteHeader active="intelligence"/>
    <view class="wrap">
      <view class="intro"><view><view class="title">情报</view><view class="subtitle">看别人怎么做，先试玩一局，再看看线下活动。精选案例匿名展示，数字取大概；详情以原帖为准。</view><view class="intel-links"><text @click="goPage('/pages/simulate/index')">先试玩：做副业会卡在哪 ›</text><text @click="goPage('/pages/events/index')">线下活动 ›</text></view></view></view>
      <view class="layout"><view class="main">
        <view class="toolbar"><view class="search-field"><input v-model="query" placeholder="搜索标题、作者或关键词" confirm-type="search"/><button v-if="query" class="clear-search" aria-label="清空搜索" @click="query='';limit=20">×</button></view><picker :range="sortLabels" :value="sortIndex" @change="changeSort"><view class="sort">{{sortLabels[sortIndex]}} ⌄</view></picker></view>
        <view class="filter-row"><scroll-view scroll-x class="categories" :show-scrollbar="false"><view class="category-row"><button v-for="c in categories" :key="c.id" :class="{active:category===c.id}" @click="category=c.id;limit=20">{{c.label}}</button></view></scroll-view><button class="filter-toggle" :class="{active:showFilters || activeFilterCount}" :aria-expanded="showFilters" @click="showFilters=!showFilters">筛选{{activeFilterCount ? ' '+activeFilterCount : ''}} {{showFilters?'⌃':'⌄'}}</button></view>
        <view v-if="showFilters" class="extra-filters"><picker :range="starts" :value="starts.indexOf(start)" @change="changeStart"><view class="start-picker" :class="{active:start!=='全部起点'}">{{start}} ⌄</view></picker><button :class="{active:onlySaved}" @click="onlySaved=!onlySaved;limit=20">{{onlySaved?'✓ ':''}}只看收藏</button><button :class="{active:onlyFull}" @click="onlyFull=!onlyFull;limit=20">{{onlyFull?'✓ ':''}}完整解读</button><button :class="{active:onlyPlayable}" @click="onlyPlayable=!onlyPlayable;limit=20">{{onlyPlayable?'✓ ':''}}有模拟</button><button v-if="activeFilterCount" class="reset-filters" @click="resetFilters">清除附加筛选</button></view>
        <view class="list-head"><text>{{filtered.length}} 篇 AI 内容</text><text>{{feedMeta.lastSuccessLabel?'上次更新 '+feedMeta.lastSuccessLabel:'更新状态待确认'}}</text></view>
        <view v-if="feedMeta.loading && !filtered.length" class="empty">正在加载内容…</view><view v-else-if="!filtered.length" class="empty">{{feedMeta.loadFailed?'暂时无法加载内容，请稍后重试。':'没有找到相关内容，换个方向或关键词试试。'}}</view>
        <template v-if="featured.length">
          <view class="case-list-label">精选案例 · {{featured.length}} 篇完整解读 </view>
          <view class="featured-grid">
            <view v-for="a in featured" :key="a.id" class="feature-card" @click="openArticle(a)">
              <view class="feature-tags"><text>{{getCase(a).direction}}</text><text>完整解读</text><button class="star" :aria-label="isSaved(a)?'取消收藏':'收藏文章'" @click.stop="toggleSaved(a)">{{isSaved(a)?'★':'☆'}}</button></view>
              <view class="feature-title">{{a.title}}</view>
              <view class="feature-start">起点：<text>{{getCase(a).start.occupation||getCase(a).start.experience||'未披露'}}</text></view>
              <view class="featured-numbers"><view v-for="n in getCase(a).numbers.slice(0,3)" :key="n.label" :class="['feature-number',{'undisclosed':!n.value}]"><text class="feature-value">{{n.value||'未披露'}}</text><text class="feature-number-note">{{compactNumberNote(n)}}</text></view></view>
              <view class="feature-footer"><text>{{a.author}} · 作者自述</text><text class="read-link">查看解读 ›</text></view>
              <button v-if="matchingGame(a)" class="case-next playable" @click.stop="play(matchingGame(a),a.id)"><view class="case-next-main"><text class="case-next-icon">▶</text><view><text>玩相关模拟：{{matchingGame(a).name}}</text></view></view><text class="case-next-arrow">开始 →</text></button>
              <view v-else class="case-next reserve-next" @click.stop><view><text>这个方向还没有模拟</text><text class="case-next-sub">{{reservationCounts['article:'+a.id]>=10 ? reservationCounts['article:'+a.id]+' 条预约记录' : '想玩的人多了会优先考虑'}}</text></view><button :disabled="reservationBusy===String(a.id)||reservedCases.includes('article:'+a.id)" @click.stop="reserveCase(a)">{{reservedCases.includes('article:'+a.id)?'已预约':reservationBusy===String(a.id)?'记录中…':'我想玩'}}</button></view>
            </view>
          </view>
        </template>
        <view v-if="short.length" class="more-posts">
          <button class="more-posts-toggle" :aria-expanded="showShort" @click="showShort=!showShort"><text>更多帖子 <text class="more-posts-hint">（只有标题） · {{short.length}} 篇</text></text><text>{{showShort?'收起 ↑':'展开 ↓'}}</text></button>
          <view v-if="showShort" class="short-list"><view v-for="a in visible" :key="a.id" class="short-row" role="link" tabindex="0" @click="openArticle(a)" @keydown.enter.prevent="openArticle(a)"><text>{{cleanCaseTitle(a.title)}}</text><text class="short-arrow">→</text></view><button v-if="limit<short.length" class="more" @click="limit+=20">继续看更多帖子 ↓</button></view>
        </view>
      </view><view class="side"><view class="side-title">先玩再读，读得更懂。</view><button v-for="g in games" :key="g.file" @click="play(g.file)">{{g.name}} →</button><view class="side-note">过程和金额均为模拟，不是收入预测。</view></view></view>
    </view><CampFooter from="library"/>
  <SiteFooter /></view>
</template>
<script setup>
import SiteFooter from '../../components/SiteFooter.vue';
import {computed,ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
function goPage(url){uni.navigateTo({url,fail:()=>uni.redirectTo({url})})}
import {articles,feedMeta} from '../../data/content.js';
import {isCaseLibraryItem,cleanCaseTitle,shortCaseSummary} from '../../data/case-library.mjs';
import SiteHeader from '../../components/SiteHeader.vue';
import CampFooter from '../../components/CampFooter.vue';
import {matchArticleGame,simulationUrl,openGame} from '../../data/game-matching.js';
import {caseStudies,caseById,caseAsArticle} from '../../data/case-studies.js';
const categories=[{id:'all',label:'全部 AI'},{id:'miniapp',label:'AI 小程序'},{id:'development',label:'AI 产品开发'},{id:'video',label:'AI 视频'},{id:'overseas',label:'海外 AI 产品'},{id:'fde',label:'FDE 企业落地'},{id:'content',label:'内容创作'},{id:'agent',label:'Agent 与工具'}];
const patterns={miniapp:/小程序|mini.?app/i,development:/开发|编程|代码|平台|产品/i,video:/视频|短剧|动画|影视/i,overseas:/(海外|出海).*(AI|建站|游戏站|产品)|热词.*(网站|游戏站)/i,fde:/(?:^|[^a-z])fde(?:$|[^a-z])|企业.*(?:落地|部署|交付)/i,content:/内容创作|自媒体|文案|写作|小红书|公众号/i,agent:/agent|智能体|工具|大模型|工作流/i};
const starts=['全部起点','上班族','老师','有编程基础','自己有生意','零基础'];
const games=[{name:'AI 小程序副业',file:'miniapp'},{name:'AI 视频定制',file:'video'},{name:'小红书教育 PPT',file:'education-ppt'}];
const query=ref(''),category=ref('all'),start=ref('全部起点'),onlySaved=ref(false),onlyFull=ref(false),onlyPlayable=ref(false),limit=ref(20),saved=ref([]),sortIndex=ref(0),showShort=ref(false),showFilters=ref(false);
const activeFilterCount=computed(()=>Number(start.value!=='全部起点')+Number(onlySaved.value)+Number(onlyFull.value)+Number(onlyPlayable.value));
const reservationCounts=ref({}),reservedCases=ref([]),reservationBusy=ref(''),reservationAvailable=ref(false);
let reservationEnabled=false;
// #ifdef H5
reservationEnabled=true;
// #endif
function request(options){return new Promise((resolve,reject)=>uni.request({...options,timeout:8000,success:r=>r.statusCode>=200&&r.statusCode<300?resolve(r.data):reject(new Error('unavailable')),fail:reject}));}
async function loadReservations(){if(!reservationEnabled)return;try{const d=await request({url:'/api/reservations',method:'GET'});if(d?.countUnit!=='browser'||!Array.isArray(d.mine)||!d.counts||typeof d.counts!=='object')throw Error();reservationCounts.value=d.counts;reservedCases.value=d.mine;reservationAvailable.value=true;}catch{reservationAvailable.value=false;}}
async function reserveCase(a){if(!reservationEnabled){openArticle(a);return;}if(!reservationAvailable.value){uni.showToast({title:'预约暂不可用，请稍后再试',icon:'none'});return;}const id=String(a.id),key='article:'+id;if(reservationBusy.value||reservedCases.value.includes(key)||!/^\d{1,30}$/.test(id))return;reservationBusy.value=id;try{const d=await request({url:'/api/reservations',method:'POST',header:{'Content-Type':'application/json'},data:{projectId:key}});if(d?.projectId!==key||d.reserved!==true||d.countUnit!=='browser'||!Number.isInteger(d.count)||d.count<0)throw Error();reservationCounts.value={...reservationCounts.value,[key]:d.count};reservedCases.value=[...reservedCases.value,key];uni.showToast({title:'已记录你的兴趣',icon:'none'});}catch{uni.showToast({title:'预约未完成，请稍后再试',icon:'none'});}finally{reservationBusy.value='';}}const sortLabels=['最新','精华优先','讨论最多'];
function searchable(a){return [a.title,a.summary,a.overview,a.author,...(a.topics||[])].join(' ')}
const curatedIds=computed(()=>new Set(caseStudies.map(c=>c.id)));
const filtered=computed(()=>{const term=query.value.trim().toLowerCase();const combined=[...caseStudies.map(caseAsArticle),...articles.filter(a=>!curatedIds.value.has(String(a.id))&&isCaseLibraryItem(a))];return combined.filter(a=>category.value==='all'||(caseById(a.id)?.category===category.value)||(!caseById(a.id)&&patterns[category.value].test(searchable(a)))).filter(a=>start.value==='全部起点'||caseById(a.id)?.startTags.includes(start.value)).filter(a=>!onlyFull.value||!!caseById(a.id)).filter(a=>!onlyPlayable.value||!!matchingGame(a)).filter(a=>!onlySaved.value||isSaved(a)).filter(a=>!term||searchable(a).toLowerCase().includes(term)).slice().sort((a,b)=>sortIndex.value===1?(Number(!!b.isDigested)-Number(!!a.isDigested)||Number(b.publishedAt||0)-Number(a.publishedAt||0)):sortIndex.value===2?(Number(b.commentCount||0)-Number(a.commentCount||0)||Number(b.publishedAt||0)-Number(a.publishedAt||0)):Number(b.publishedAt||0)-Number(a.publishedAt||0))});
const featured=computed(()=>filtered.value.filter(a=>!!caseById(a.id)));
const short=computed(()=>filtered.value.filter(a=>!caseById(a.id)));
const visible=computed(()=>short.value.slice(0,limit.value));
function changeSort(e){sortIndex.value=Number(e.detail.value)||0;limit.value=20}
function changeStart(e){start.value=starts[Number(e.detail.value)]||starts[0];limit.value=20}
function resetFilters(){start.value=starts[0];onlySaved.value=false;onlyFull.value=false;onlyPlayable.value=false;limit.value=20}
function isSaved(a){return saved.value.includes(`article:${a.id}`)}
function toggleSaved(a){const key=`article:${a.id}`;const next=isSaved(a)?saved.value.filter(x=>x!==key):[...saved.value,key];try{uni.setStorageSync('ainpe:saved',next);saved.value=next}catch{uni.showToast({title:'收藏失败',icon:'none'})}}
onShow(()=>{try{const v=uni.getStorageSync('ainpe:saved');saved.value=Array.isArray(v)?v:[]}catch{saved.value=[]}loadReservations()});
function getCase(a){return caseById(a.id)}
function compactNumberNote(n){
  if(!n.value)return `${n.label} · 未披露`;
  const note=String(n.note||''),parts=[n.label];
  if(/回看最近一周/.test(note))parts.push('最近一周');
  else if(/一名运营/.test(note))parts.push('单名运营');
  else if(/传统新人流程/.test(note))parts.push('传统流程');
  else if(/具体月份未披露/.test(note))parts.push('月份未披露');
  if(/不是净利润|不等于净利润|非净利润|净利润.*未披露|未.*披露.*净利润|不是利润|不等于利润|不是 Agent 收入或利润/.test(note)||(/收入|变现|GMV|业绩/i.test(`${n.label} ${n.value}`)&&!String(n.label).includes('净利润')))parts.push('非净利润');
  else if(/不等于成交/.test(note))parts.push('不等于成交');
  else if(/不等于付费人数/.test(note))parts.push('不等于付费人数');
  else if(/不是平台新增开发费/.test(note))parts.push('已有订阅');
  return parts.join(' · ');
}
function matchingGame(a){const study=caseById(a.id);return study ? study.simulation : matchArticleGame(a)}
function openArticle(a){try{uni.setStorageSync('ainpe:last-article',{id:String(a.id),openedAt:Date.now()})}catch{}uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(String(a.id))}`})}
function go(url){uni.navigateTo({url})}
function play(game,caseId){
if(game?.url){uni.navigateTo({url:game.url+(caseId?(game.url.includes('?')?'&':'?')+'from='+encodeURIComponent('case:'+caseId):'')});return;}
let url=simulationUrl(game?.file || game);if(url){if(caseId)url+=(url.includes('?')?'&':'?')+'from='+encodeURIComponent('case:'+caseId);if(openGame(url))return;}
uni.navigateTo({url:'/pages/simulate/index'});
}
function formatDate(v){const d=new Date(Number(v)*1000+8*3600000);return Number.isNaN(d.getTime())?'时间待确认':`${d.getUTCFullYear()}/${d.getUTCMonth()+1}/${d.getUTCDate()}`}
</script>
<style scoped>
.intel-page{min-height:100vh;background:#f7f3ea;color:#17372a}.wrap{max-width:1120px;margin:auto;padding:38px 24px 60px}.intro{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:28px}.eyebrow{font-size:12px;color:#71916d;font-weight:700}.title{font-size:34px;font-weight:850;line-height:1.2;margin-top:10px}.subtitle{font-size:14px;color:#748777;margin-top:10px}.intro button{margin:0;background:#ee5a24;color:#fff;font-size:13px;font-weight:700;padding:0 16px;line-height:42px;white-space:nowrap}.layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:24px}.main{background:#fff;border:1px solid #e4e7df;border-radius:9px;min-width:0;overflow:hidden}.toolbar{display:flex;gap:12px;padding:18px;border-bottom:1px solid #edf0e9}.toolbar input{flex:1;min-width:0;height:42px;background:#f7f9f4;border:1px solid #dce7d9;border-radius:6px;padding:0 12px;font-size:14px}.sort{white-space:nowrap;padding:12px;border:1px solid #dce7d9;border-radius:6px;font-size:13px;color:#476b50}.categories{white-space:nowrap;border-bottom:1px solid #edf0e9}.category-row{display:inline-flex;gap:8px;padding:14px}.category-row button{margin:0;line-height:32px;font-size:12px;padding:0 12px;background:#f3f7f0;color:#65816a;border-radius:20px}.category-row button.active{background:#174e34;color:white}.category-row button:after,.star:after,.play-link:after{border:0}.list-head{display:flex;justify-content:space-between;gap:12px;color:#93a393;font-size:11px;padding:14px 20px}.article{display:flex;gap:12px;border-top:1px solid #edf1eb;padding:19px 20px}.article-main{min-width:0;flex:1}.article-title{color:#1d3d2b;font-weight:750;font-size:16px;line-height:1.5}.tag{font-size:11px;color:#668a63;border:1px solid #d9e9d3;border-radius:4px;padding:2px 5px;margin-right:8px}.article-summary{font-size:13px;line-height:1.65;color:#758879;margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.article-meta{font-size:11px;color:#9aaa9a;margin-top:9px}.star{background:transparent;color:#69946c;font-size:24px;line-height:28px;padding:0 4px;margin:0}.play-link{padding:0;margin:10px 0 0;display:inline-block;font-size:12px;line-height:24px;color:#d45421;background:transparent;font-weight:700}.side{align-self:start;padding:22px;border-radius:9px;background:#0f3e2b;color:#f1f7ed}.side-title{font-size:20px;font-weight:800}.side-copy,.side-note{font-size:12px;line-height:1.7;color:#b1cbb8;margin:12px 0}.side button{margin:8px 0 0;line-height:40px;font-size:13px;text-align:left;background:#1f513a;color:#e7f4e8;padding:0 12px}.more,.empty{text-align:center;padding:22px;color:#79937c;font-size:13px}.more{background:#fff;color:#226b43;width:100%;line-height:1.5}.more:after{border:0}@media(max-width:760px){.wrap{padding:26px 16px 40px}.title{font-size:27px}.intro{align-items:flex-start;flex-direction:column}.layout{grid-template-columns:1fr}.side{order:initial}.toolbar{padding:12px}.article{padding:16px 14px}.article-title{font-size:15px}.side button{display:inline-block;margin-right:6px}}
.case-list-label{padding:16px 20px 5px;font-size:16px;font-weight:800;color:#234a34}.case-list-label text{margin-left:8px;font-size:11px;font-weight:400;color:#8b9e8c}.featured{background:#fbfdf8}.featured-numbers{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.featured-numbers>text{background:#edf5e9;color:#3d6748;padding:5px 9px;border-radius:5px;font-size:12px;line-height:1.6}.featured-numbers small{color:#7c927b;font-size:10px}@media(max-width:760px){.case-list-label{padding:15px 14px 5px}.featured-numbers{gap:6px}}

/* Reviewed cases use the denser two-column hierarchy from the case-library design. */
.main{background:transparent;border:0;overflow:visible}.toolbar,.categories,.list-head{background:#fff}.toolbar{border:1px solid #e5decf;border-radius:12px 12px 0 0}.categories{border-left:1px solid #e5decf;border-right:1px solid #e5decf}.list-head{border:1px solid #e5decf;border-top:0;border-radius:0 0 12px 12px}.case-list-label{padding:28px 0 14px;color:#13241b}.featured-grid,.short-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.feature-card,.short-card{box-sizing:border-box;background:#fff;border:1px solid #e5decf;border-radius:12px;padding:20px;cursor:pointer}.feature-card{display:flex;flex-direction:column;min-width:0}.feature-tags{display:flex;align-items:center;gap:7px;color:#0e5a3a;font-size:11px;font-weight:700}.feature-tags>text{padding:4px 8px;border-radius:5px;background:#e2f1e7}.feature-tags>text:nth-child(2){color:#295d85;background:#e8f2fa}.feature-tags .star{margin-left:auto}.feature-title{font-size:17px;font-weight:800;line-height:1.5;color:#13241b;margin-top:12px}.feature-start{font-size:12px;line-height:1.6;color:#819083;margin-top:9px}.feature-start text{color:#365645;font-weight:650}.featured-numbers{margin-top:14px;align-items:stretch}.feature-number{display:flex;flex:1 1 100px;flex-direction:column;gap:3px;background:#f7f3ea;border-radius:8px;padding:9px;font-size:10px;line-height:1.45;color:#819083}.feature-number.undisclosed{background:transparent;border:1px dashed #c9c2b2}.feature-value{font-size:15px;font-weight:800;line-height:1.35;color:#143c2b}.feature-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:15px;font-size:11px;color:#859587}.feature-footer .play-link{margin:0;font-size:11px;line-height:1.6;text-align:right}.read-link{color:#0e5a3a;font-weight:700}.short-card{margin:0;border-style:dashed}.short-label{font-size:11px;color:#9b806a;margin-bottom:8px}.more{background:transparent}.empty{background:#fff;border-radius:10px}.side{background:#0b2e20}
@media(max-width:700px){.featured-grid,.short-grid{grid-template-columns:1fr}.feature-card,.short-card{padding:17px}.case-list-label{padding:24px 0 12px}.feature-title{font-size:16px}}
.search-field{display:flex;align-items:center;flex:1;min-width:0;background:#f7f9f4;border:1px solid #dce7d9;border-radius:6px}.toolbar .search-field input{flex:1;border:0;background:transparent;min-width:0}.clear-search{flex:none;margin:0 4px;padding:0;width:36px;height:36px;line-height:36px;background:transparent;color:#607e68;font-size:22px}.clear-search:after{border:0}.article-meta,.feature-tags,.feature-footer,.feature-footer .play-link,.feature-number,.short-label,.list-head{font-size:12px}
.case-next{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin:16px 0 0;padding:13px 14px;border-radius:9px;text-align:left;line-height:1.45}.case-next:after,.more-posts-toggle:after{border:0}.case-next view{min-width:0}.case-next text{display:block;font-size:13px;font-weight:750}.case-next .case-next-sub{margin-top:3px;font-size:11px;font-weight:400}.case-next.playable{background:#0e4a32;color:#fff}.case-next.playable .case-next-sub{color:#b4d3c2}.reserve-next{border:1px dashed #c8d6c8;background:#f8faf6;color:#496b55}.reserve-next .case-next-sub{color:#84988a}.reserve-next button{flex:none;margin:0;padding:0 12px;line-height:34px;background:#e6f0e3;color:#27593d;font-size:12px;font-weight:700}.reserve-next button:after{border:0}.reserve-next button[disabled]{background:#edf1ea;color:#839889}.more-posts{margin-top:28px;border:1px solid #e5decf;border-radius:12px;background:#fff;overflow:hidden}.more-posts-toggle{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;margin:0;padding:16px 18px;background:#fff;color:#234a34;font-size:15px;font-weight:800;text-align:left;line-height:1.5}.more-posts-hint{font-size:12px;color:#819083;font-weight:400}.short-list{border-top:1px solid #ecefe9}.short-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #edf0ea;color:#315640;font-size:14px;line-height:1.5;cursor:pointer}.short-arrow{flex:none;color:#7e9985}@media(max-width:700px){.case-next{padding:12px}.more-posts-toggle{align-items:flex-start}.more-posts-hint{display:block;margin-top:3px}}
.filter-row{display:flex;align-items:stretch;background:#fff;border-left:1px solid #e5decf;border-right:1px solid #e5decf;border-bottom:1px solid #edf0e9}.filter-row .categories{flex:1;min-width:0;width:0;border:0}.filter-toggle{flex:none;align-self:center;margin:0 10px 0 4px;padding:0 11px;line-height:34px;border:1px solid #dce7d9;border-radius:8px;background:#fff;color:#42644a;font-size:12px;white-space:nowrap}.filter-toggle:after,.extra-filters button:after{border:0}.filter-toggle.active{border-color:#8eaf8f;color:#174e34;background:#f2f7ee}.extra-filters{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:0 14px 14px;background:#fff;border-left:1px solid #e5decf;border-right:1px solid #e5decf}.extra-filters button,.start-picker{margin:0;padding:0 12px;line-height:32px;border-radius:18px;background:#f3f7f0;color:#65816a;font-size:12px;white-space:nowrap}.extra-filters button.active,.start-picker.active{background:#174e34;color:#fff}@media(max-width:700px){.wrap{padding-top:18px}.intro{margin-bottom:18px}.title{font-size:25px;margin-top:6px}.subtitle{line-height:1.5;margin-top:6px}.toolbar{padding:10px}.category-row{padding:10px}.list-head{padding:10px 14px}.case-list-label{padding:18px 0 10px}}
.feature-card{overflow:hidden}.featured-numbers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.feature-number{min-width:0}.feature-number-note{overflow-wrap:anywhere;font-size:11px;line-height:1.4}.case-next.playable{width:calc(100% + 40px);margin:16px -20px -20px;border-radius:0 0 11px 11px;background:#0e4a32}.case-next-main{display:flex;align-items:center;gap:10px;flex:1}.case-next .case-next-icon{display:flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;border-radius:50%;background:#f36b31;color:#fff;font-size:11px}.case-next-arrow{flex:none;white-space:nowrap}.case-next.playable .case-next-sub{font-size:11px}
@media(max-width:700px){.case-next.playable{width:calc(100% + 34px);margin:16px -17px -17px}.feature-number{padding:8px 6px}.feature-value{overflow-wrap:anywhere}}

/* A+：情报页白卡、浅灰底、蓝色只给可点的地方 */
.intel-page{background:#F3F4F6;color:#161A23}
.intel-page .title{color:#161A23}
.intel-page .subtitle{color:#5F6675}
.intel-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.intel-links text{display:inline-block;padding:7px 12px;border-radius:12px;background:#fff;color:#2B44E6;font-size:13px;font-weight:800;cursor:pointer}
.intel-page .intro button{background:#2B44E6;border-radius:12px}
.intel-page .toolbar,.intel-page .categories,.intel-page .list-head,.intel-page .filter-row,.intel-page .extra-filters{border-color:#E6E8EC}
.intel-page .case-list-label{color:#161A23}
.intel-page .featured{background:transparent}
.intel-page .feature-card,.intel-page .short-card{border:0;border-radius:18px}
.intel-page .feature-tags{color:#2B44E6}
.intel-page .feature-tags>text{background:#ECEFFE;border-radius:8px}
.intel-page .feature-title{color:#161A23}
.intel-page .feature-number{background:#F3F4F6;border-radius:12px}
.intel-page .read-link{color:#2B44E6}
.intel-page .more-posts{border:0;border-radius:18px}
</style>
