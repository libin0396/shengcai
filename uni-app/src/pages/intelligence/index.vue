<template>
  <view class="intel-page">
    <SiteHeader active="intelligence"/>
    <view class="wrap">
      <view class="intro"><view><text class="eyebrow">真实经验 · AI 情报</text><view class="title">发现值得看的 AI 实战。</view><view class="subtitle">从案例、方法到一线讨论，找到你想继续探索的方向。</view></view><button @click="go('/pages/simulate/index')">先体验项目 →</button></view>
      <view class="layout"><view class="main">
        <view class="toolbar"><input v-model="query" placeholder="搜索标题、作者或关键词" confirm-type="search"/><picker :range="sortLabels" :value="sortIndex" @change="changeSort"><view class="sort">{{sortLabels[sortIndex]}} ⌄</view></picker></view>
        <scroll-view scroll-x class="categories" :show-scrollbar="false"><view class="category-row"><button v-for="c in categories" :key="c.id" :class="{active:category===c.id}" @click="category=c.id;limit=20">{{c.label}}</button><button :class="{active:onlySaved}" @click="onlySaved=!onlySaved;limit=20">{{onlySaved?'✓ ':''}}只看收藏</button></view></scroll-view>
        <view class="list-head"><text>{{filtered.length}} 篇 AI 内容</text><text>{{feedMeta.lastSuccessLabel?'上次更新 '+feedMeta.lastSuccessLabel:'更新状态待确认'}}</text></view>
        <view v-if="feedMeta.loading && !filtered.length" class="empty">正在加载内容…</view><view v-else-if="!filtered.length" class="empty">{{feedMeta.loadFailed?'暂时无法加载内容，请稍后重试。':'没有找到相关内容，换个方向或关键词试试。'}}</view>
        <view v-for="a in visible" :key="a.id" class="article" @click="openArticle(a)"><view class="article-main"><view class="article-title"><text class="tag">{{a.isDigested?'精华':'分享'}}</text>{{a.title}}</view><view class="article-summary">{{a.overview||a.summary||'查看已收录的内容摘要。'}}</view><view class="article-meta">{{a.author||'生财圈友'}} · {{formatDate(a.publishedAt)}} · {{Number(a.commentCount||0)}} 条评论</view><button v-if="matchingGame(a)" class="play-link" @click.stop="play(matchingGame(a).file)">玩相关模拟：{{matchingGame(a).name}} →</button></view><button class="star" :aria-label="isSaved(a)?'取消收藏':'收藏文章'" @click.stop="toggleSaved(a)">{{isSaved(a)?'★':'☆'}}</button></view>
        <button v-if="limit<filtered.length" class="more" @click="limit+=20">继续看更多文章 ↓</button>
      </view><view class="side"><view class="side-title">先玩再读，读得更懂。</view><view class="side-copy">挑一个方向，从真实案例出发，模拟体验关键步骤。</view><button v-for="g in games" :key="g.file" @click="play(g.file)">{{g.name}} →</button><view class="side-note">过程和金额均为模拟，不是收入预测。</view></view></view>
    </view><CampFooter/>
  </view>
</template>
<script setup>
import {computed,ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import {articles,feedMeta,isAiArticle} from '../../data/content.js';
import SiteHeader from '../../components/SiteHeader.vue';
import CampFooter from '../../components/CampFooter.vue';
import {matchArticleGame,simulationUrl} from '../../data/game-matching.js';
const categories=[{id:'all',label:'全部 AI'},{id:'miniapp',label:'小程序'},{id:'video',label:'AI 视频'},{id:'fde',label:'FDE 企业落地'},{id:'content',label:'内容创作'},{id:'agent',label:'Agent 与工具'}];
const patterns={miniapp:/小程序|mini.?app/i,video:/视频|短剧|带货|剪辑/i,fde:/(?:^|[^a-z])fde(?:$|[^a-z])|企业.*(?:落地|部署|交付)/i,content:/内容创作|自媒体|文案|写作|小红书|公众号/i,agent:/agent|智能体|工具|大模型|工作流/i};
const games=[{name:'AI 小程序副业',file:'miniapp'},{name:'AI 视频定制',file:'video'},{name:'小红书教育 PPT',file:'education-ppt'}];
const query=ref(''),category=ref('all'),onlySaved=ref(false),limit=ref(20),saved=ref([]),sortIndex=ref(0);const sortLabels=['最新','精华优先','讨论最多'];
function searchable(a){return [a.title,a.summary,a.overview,a.author,...(a.topics||[])].join(' ')}
const filtered=computed(()=>{const term=query.value.trim().toLowerCase();return articles.filter(isAiArticle).filter(a=>category.value==='all'||patterns[category.value].test(searchable(a))).filter(a=>!onlySaved.value||isSaved(a)).filter(a=>!term||searchable(a).toLowerCase().includes(term)).slice().sort((a,b)=>sortIndex.value===1?(Number(!!b.isDigested)-Number(!!a.isDigested)||Number(b.publishedAt||0)-Number(a.publishedAt||0)):sortIndex.value===2?(Number(b.commentCount||0)-Number(a.commentCount||0)||Number(b.publishedAt||0)-Number(a.publishedAt||0)):Number(b.publishedAt||0)-Number(a.publishedAt||0))});
const visible=computed(()=>filtered.value.slice(0,limit.value));
function changeSort(e){sortIndex.value=Number(e.detail.value)||0;limit.value=20}
function isSaved(a){return saved.value.includes(`article:${a.id}`)}
function toggleSaved(a){const key=`article:${a.id}`;const next=isSaved(a)?saved.value.filter(x=>x!==key):[...saved.value,key];try{uni.setStorageSync('ainpe:saved',next);saved.value=next}catch{uni.showToast({title:'收藏失败',icon:'none'})}}
onShow(()=>{try{const v=uni.getStorageSync('ainpe:saved');saved.value=Array.isArray(v)?v:[]}catch{saved.value=[]}});
function matchingGame(a){return matchArticleGame(a)}
function openArticle(a){try{uni.setStorageSync('ainpe:last-article',{id:String(a.id),openedAt:Date.now()})}catch{}uni.navigateTo({url:`/pages/article/index?id=${encodeURIComponent(String(a.id))}`})}
function go(url){uni.navigateTo({url})}
function play(file){
// #ifdef H5
const url=simulationUrl(file);if(url){window.location.href=url;return;}
// #endif
// #ifndef H5
uni.navigateTo({url:'/pages/simulate/index'});
// #endif
}
function formatDate(v){const d=new Date(Number(v)*1000+8*3600000);return Number.isNaN(d.getTime())?'时间待确认':`${d.getUTCFullYear()}/${d.getUTCMonth()+1}/${d.getUTCDate()}`}
</script>
<style scoped>
.intel-page{min-height:100vh;background:#f7f3ea;color:#17372a}.wrap{max-width:1120px;margin:auto;padding:38px 24px 60px}.intro{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:28px}.eyebrow{font-size:12px;color:#71916d;font-weight:700}.title{font-size:34px;font-weight:850;line-height:1.2;margin-top:10px}.subtitle{font-size:14px;color:#748777;margin-top:10px}.intro button{margin:0;background:#ee5a24;color:#fff;font-size:13px;font-weight:700;padding:0 16px;line-height:42px;white-space:nowrap}.layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:24px}.main{background:#fff;border:1px solid #e4e7df;border-radius:9px;min-width:0;overflow:hidden}.toolbar{display:flex;gap:12px;padding:18px;border-bottom:1px solid #edf0e9}.toolbar input{flex:1;min-width:0;height:42px;background:#f7f9f4;border:1px solid #dce7d9;border-radius:6px;padding:0 12px;font-size:14px}.sort{white-space:nowrap;padding:12px;border:1px solid #dce7d9;border-radius:6px;font-size:13px;color:#476b50}.categories{white-space:nowrap;border-bottom:1px solid #edf0e9}.category-row{display:inline-flex;gap:8px;padding:14px}.category-row button{margin:0;line-height:32px;font-size:12px;padding:0 12px;background:#f3f7f0;color:#65816a;border-radius:20px}.category-row button.active{background:#174e34;color:white}.category-row button:after,.star:after,.play-link:after{border:0}.list-head{display:flex;justify-content:space-between;gap:12px;color:#93a393;font-size:11px;padding:14px 20px}.article{display:flex;gap:12px;border-top:1px solid #edf1eb;padding:19px 20px}.article-main{min-width:0;flex:1}.article-title{color:#1d3d2b;font-weight:750;font-size:16px;line-height:1.5}.tag{font-size:11px;color:#668a63;border:1px solid #d9e9d3;border-radius:4px;padding:2px 5px;margin-right:8px}.article-summary{font-size:13px;line-height:1.65;color:#758879;margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.article-meta{font-size:11px;color:#9aaa9a;margin-top:9px}.star{background:transparent;color:#69946c;font-size:24px;line-height:28px;padding:0 4px;margin:0}.play-link{padding:0;margin:10px 0 0;display:inline-block;font-size:12px;line-height:24px;color:#d45421;background:transparent;font-weight:700}.side{align-self:start;padding:22px;border-radius:9px;background:#0f3e2b;color:#f1f7ed}.side-title{font-size:20px;font-weight:800}.side-copy,.side-note{font-size:12px;line-height:1.7;color:#b1cbb8;margin:12px 0}.side button{margin:8px 0 0;line-height:40px;font-size:13px;text-align:left;background:#1f513a;color:#e7f4e8;padding:0 12px}.more,.empty{text-align:center;padding:22px;color:#79937c;font-size:13px}.more{background:#fff;color:#226b43;width:100%;line-height:1.5}.more:after{border:0}@media(max-width:760px){.wrap{padding:26px 16px 40px}.title{font-size:27px}.intro{align-items:flex-start;flex-direction:column}.layout{grid-template-columns:1fr}.side{order:initial}.toolbar{padding:12px}.article{padding:16px 14px}.article-title{font-size:15px}.side button{display:inline-block;margin-right:6px}}
</style>
