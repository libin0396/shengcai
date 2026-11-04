import feed from './feed.json';
import siteConfig from './site-config.json';
import verifiedOfflineEvents from './verified-offline-events.json';
import eventReviewData from './event-reviews.json';
import {reactive} from 'vue';
export {isAiArticle,matchesAiCategory} from './article-categories.js';

// Snapshot from the existing local AINPE feed. It does not imply a live sync.
export const articles=reactive(feed.articles || []);
export const events=reactive([...(feed.events || []),...verifiedOfflineEvents.filter(v=>!(feed.events||[]).some(e=>String(e.id)===String(v.id)))]);
export const eventReviews=eventReviewData;
export const comments=reactive(feed.comments || []);
export const trendingTopics=reactive(feed.trendingTopics || []);
export const hotArticleIds=reactive(feed.hotArticleIds || []);
export const topicGuides=reactive(feed.topicGuides || {});
function successLabel(value){if(!value)return '';const d=new Date(new Date(value).getTime()+8*3600000);if(Number.isNaN(d.getTime()))return '';return `${d.getUTCMonth()+1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} · 北京时间`}
const syncSucceeded=status=>status==='success'||status==='ok';
export const feedMeta=reactive({updatedAt:feed.updatedAt,fetchedAt:feed.fetchedAt,sync:feed.sync,lastSuccessLabel:successLabel(feed.sync?.lastSuccessAt),source:'已保存资料',statusText:syncSucceeded(feed.sync?.status)?'最近同步成功':'最近同步未完成，保留上次内容',loading:false,loadAttempted:false,loadFailed:false});
let loading=false;
export function refreshFeed(){
 if(loading)return;loading=true;feedMeta.loading=true;feedMeta.loadFailed=false;
 let endpoint='/api/feed';
 // #ifdef MP-WEIXIN
 endpoint='https://ainpe.aisen.xin/api/feed';
 // #endif
 uni.request({url:endpoint,method:'GET',timeout:10000,success(res){
  const data=res.data;
  if(res.statusCode!==200||!data||!Array.isArray(data.articles)||!data.articles.length||!Array.isArray(data.events)){feedMeta.source='已保存内容';feedMeta.statusText='资料暂不可用，显示已保存内容';feedMeta.loadFailed=true;return}
  articles.splice(0,articles.length,...data.articles);
  const extra=verifiedOfflineEvents.filter(v=>!data.events.some(e=>String(e.id)===String(v.id)));
  events.splice(0,events.length,...data.events,...extra);
  if(Array.isArray(data.comments))comments.splice(0,comments.length,...data.comments);
  if(Array.isArray(data.trendingTopics))trendingTopics.splice(0,trendingTopics.length,...data.trendingTopics);
  if(Array.isArray(data.hotArticleIds))hotArticleIds.splice(0,hotArticleIds.length,...data.hotArticleIds);
  if(data.topicGuides&&typeof data.topicGuides==='object')Object.assign(topicGuides,data.topicGuides);
  Object.assign(feedMeta,{updatedAt:data.updatedAt,fetchedAt:data.fetchedAt,sync:data.sync,lastSuccessLabel:successLabel(data.sync?.lastSuccessAt),source:'已连接资料服务',statusText:syncSucceeded(data.sync?.status)?'最近同步成功':'最近同步未完成，保留上次内容'});
 },fail(){feedMeta.source='已保存内容';feedMeta.statusText='暂时无法连接，显示已保存内容';feedMeta.loadFailed=true},complete(){loading=false;feedMeta.loading=false;feedMeta.loadAttempted=true}});
}
export const campaign={...siteConfig.campaign,posterUrl:'/static/assets/ai-camp-poster.jpg',qrUrl:null};
export const contact={...siteConfig.contact,qrUrl:'/static/assets/wechat-contact.jpg'};
