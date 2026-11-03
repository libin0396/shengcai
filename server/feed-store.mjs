import {readFile, mkdir, writeFile, rename, unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {SYNC_INTERVAL_MINUTES,SYNC_STALE_MINUTES} from '../src/sync-schedule.js';

export const DEFAULT_ROOT=fileURLToPath(new URL('../',import.meta.url));
const SECRET=/^(?:access[_-]?token|refresh[_-]?token|authorization|authorization[_-]?code|code[_-]?verifier|client[_-]?secret|cookie|callback[_-]?uri|redirect[_-]?uri|password|secret|bearer)$/i;
const SAFE_MESSAGE='本次同步未完成，继续展示上次成功更新的内容。';
const fail=()=>{throw new Error('Feed validation failed');};
function object(v){if(!v||typeof v!=='object'||Array.isArray(v))fail();return v;}
function checkSecrets(v,depth=0){if(depth>15)fail();if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(SECRET.test(k))fail();checkSecrets(x,depth+1);}}
function text(v,max=1000,required=false){if(v==null&&!required)return undefined;if(typeof v!=='string')fail();const s=v.replace(/<[^>]*>/g,'').trim();if((required&&!s)||s.length>max)fail();return s;}
function id(v){if(typeof v!=='string'||!/^\d+$/.test(v))fail();return v;}
function finite(v,{required=false}={}){if(v==null&&!required)return undefined;if(typeof v!=='number'||!Number.isFinite(v)||v<0)fail();return v;}
function epoch(v,options={}){const n=finite(v,options);if(n!==undefined&&(!Number.isInteger(n)||!Number.isFinite(new Date(n*1000).getTime())))fail();return n;}
function bool(v){if(v==null)return false;if(typeof v!=='boolean')fail();return v;}
function time(v,{nullable=false}={}){if(v==null&&nullable)return null;if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))fail();return new Date(v).toISOString();}
function list(v,max=500){if(!Array.isArray(v)||v.length>max)fail();return v;}
function url(v,{asset=false,optional=false}={}){if(v==null||v===''){if(optional)return undefined;fail();}if(typeof v!=='string')fail();if(asset&&/^\/assets\/[a-z\d._/-]+$/i.test(v)&&!v.includes('..'))return v;let u;try{u=new URL(v);}catch{fail();}if(u.protocol!=='https:'||u.username||u.password)fail();const sourceHost=u.hostname==='scys.com';const assetHost=u.hostname==='search01.shengcaiyoushu.com';if(!sourceHost&&!(asset&&assetHost))fail();for(const k of u.searchParams.keys())if(SECRET.test(k)||/^code$/i.test(k))fail();return u.href;}
function compact(v){return Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined));}
const labels=v=>list(v||[],20).map(x=>text(x,80,true));
function article(v){object(v);return compact({id:id(v.id),entityType:text(v.entityType,50,true),title:text(v.title,300,true),summary:text(v.summary,1200)||'',overview:text(v.overview,2000),author:text(v.author,150),avatar:url(v.avatar,{asset:true,optional:true}),sourceUrl:url(v.sourceUrl),publishedAt:epoch(v.publishedAt,{required:true}),isDigested:bool(v.isDigested),isHot:bool(v.isHot),likeCount:finite(v.likeCount),commentCount:finite(v.commentCount),topics:labels(v.topics),kind:text(v.kind,30)});}
function event(v){object(v);return compact({id:id(v.id),name:text(v.name,300,true),title:text(v.title,300)||text(v.name,300,true),description:text(v.description,20000)||'',summary:text(v.summary,2000)||'',city:text(v.city,100)||'',district:text(v.district,100)||'',province:text(v.province,100),startTime:epoch(v.startTime,{required:true}),submitEnd:epoch(v.submitEnd),lifecycleStatus:text(v.lifecycleStatus,50),url:url(v.url),coverImg:url(v.coverImg,{asset:true,optional:true}),typeText:text(v.typeText,80),source:'生财有术',avgCost:finite(v.avgCost),joinCount:finite(v.joinCount),remainStock:finite(v.remainStock),full:Boolean(v.full),isDigested:bool(v.isDigested),isHhj:bool(v.isHhj)});}
function comment(v){object(v);return compact({id:id(v.id),articleId:id(v.articleId),articleTitle:text(v.articleTitle,300),author:text(v.author,150),text:text(v.text,3000,true),viewpoint:text(v.viewpoint,50),publishedAt:epoch(v.publishedAt),likeCount:finite(v.likeCount),sourceUrl:url(v.sourceUrl),topic:text(v.topic,80,true),excerpt:true});}
function guides(v){object(v);const result={};for(const [k,g] of Object.entries(v)){if(!/^[a-z0-9-]{1,40}$/.test(k))fail();object(g);result[k]=compact({intro:text(g.intro,3000),activityTakeaways:g.activityTakeaways===undefined?undefined:list(g.activityTakeaways,20).map(t=>compact({title:text(t.title,300,true),description:text(t.description,2000),sourceUrl:url(t.sourceUrl,{optional:true})})),audience:g.audience===undefined?undefined:labels(g.audience),readingPath:g.readingPath===undefined?undefined:labels(g.readingPath),officialRegistrationUrl:url(g.officialRegistrationUrl,{optional:true}),sourceUrl:url(g.sourceUrl,{optional:true})});}return result;}
function unique(items){if(new Set(items.map(x=>x.id)).size!==items.length)fail();return items;}
export function validateFeed(input){
 object(input);checkSecrets(input);if(input.version!==1)fail();
 const articles=unique(list(input.articles).map(article));const events=unique(list(input.events).map(event));if(!articles.length&&!events.length)fail();
 const articleIds=new Set(articles.map(x=>x.id));const hotArticleIds=list(input.hotArticleIds||[],500).map(id);if(hotArticleIds.some(x=>!articleIds.has(x)))fail();
 const trendingTopics=list(input.trendingTopics||[],30).map(t=>{object(t);const articleIdsForTopic=list(t.articleIds||[],500).map(id);if(articleIdsForTopic.some(x=>!articleIds.has(x)))fail();return compact({id:text(t.id,80,true),label:text(t.label,100,true),count:finite(t.count,{required:true}),hotCount:finite(t.hotCount)||0,articleIds:articleIdsForTopic});});
 const featuredEventId=input.featuredEventId==null?null:id(input.featuredEventId);if(featuredEventId&&!events.some(e=>e.id===featuredEventId))fail();
 const sync=object(input.sync);if(!['ok','partial','error'].includes(sync.status))fail();
 return {version:1,updatedAt:time(input.updatedAt),fetchedAt:time(input.fetchedAt),events,articles,hotArticleIds:[...new Set(hotArticleIds)],trendingTopics,featuredEventId,topicGuides:guides(input.topicGuides||{}),comments:unique(list(input.comments||[]).map(comment)),sync:{status:sync.status,lastAttemptAt:time(sync.lastAttemptAt,{nullable:true}),lastSuccessAt:time(sync.lastSuccessAt,{nullable:true}),intervalMinutes:SYNC_INTERVAL_MINUTES,message:text(sync.message,500)||'',counts:{articles:articles.length,events:events.length,hotArticles:hotArticleIds.length}}};
}
function snapshotPath(root){return path.join(root,'data','live-feed.json');}
export async function bootstrapFeed({root=DEFAULT_ROOT}={}){
 const [discovery,knowledge]=await Promise.all(['discovery','knowledge'].map(async name=>JSON.parse(await readFile(path.join(root,'src',name+'.json'),'utf8'))));
 const date=knowledge.updatedAt+'T00:00:00.000Z';
 return validateFeed({version:1,updatedAt:date,fetchedAt:date,events:discovery.events,articles:knowledge.articles,hotArticleIds:[],trendingTopics:[],featuredEventId:discovery.featuredEventId,topicGuides:knowledge.topicGuides,comments:knowledge.comments,sync:{status:'error',lastAttemptAt:null,lastSuccessAt:null,intervalMinutes:SYNC_INTERVAL_MINUTES,message:'尚无自动同步结果，展示初始资料。'}});
}
export async function readFeed({root=DEFAULT_ROOT}={}){try{return validateFeed(JSON.parse(await readFile(snapshotPath(root),'utf8')));}catch{return bootstrapFeed({root});}}
async function atomicWrite(feed,root){const target=snapshotPath(root);await mkdir(path.dirname(target),{recursive:true});const temp=target+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(feed,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});await rename(temp,target);}finally{await unlink(temp).catch(()=>{});}}
let queue=Promise.resolve();
function serialized(fn){const run=queue.then(fn,fn);queue=run.catch(()=>{});return run;}
export async function publishFeed(input,{root=DEFAULT_ROOT,now=new Date()}={}){const feed=validateFeed(input);const publishedAt=now.toISOString();if(Date.parse(feed.fetchedAt)>now.getTime()+5*60*1000)fail();return serialized(async()=>{const status=feed.sync.status;if(status==='error')throw new Error('Use failure mode to retain content');feed.sync.lastAttemptAt=publishedAt;feed.sync.lastSuccessAt=publishedAt;feed.sync.message=status==='partial'?'部分来源暂未更新，保留对应上次内容。':'已通过生财 MCP 自动更新。';await atomicWrite(feed,root);return feed;});}
export async function recordFeedFailure(_message,{root=DEFAULT_ROOT,now=new Date()}={}){return serialized(async()=>{const feed=await readFeed({root});feed.sync={...feed.sync,status:'error',lastAttemptAt:now.toISOString(),message:SAFE_MESSAGE};await atomicWrite(feed,root);return feed;});}
export async function getFeedStatus({root=DEFAULT_ROOT,now=new Date()}={}){const feed=await readFeed({root});return {...feed.sync,updatedAt:feed.updatedAt,fetchedAt:feed.fetchedAt,stale:!feed.sync.lastSuccessAt||now.getTime()-Date.parse(feed.sync.lastSuccessAt)>SYNC_STALE_MINUTES*60*1000};}
