#!/usr/bin/env node
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeFeed} from './normalize-feed.mjs';
import {readFeed,publishFeed,recordFeedFailure} from '../server/feed-store.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const folders={fde:['企业AI落地','FDE'],'ai-video':['内容创作','AI视频'],agent:['AI工具与工作流'], 'ai-growth':['营销与销售','AI获客'],community:['AI行业动态']};
async function saveMaterial(parts,name,content){
 const dir=path.join(root,'资料库',...parts);await mkdir(dir,{recursive:true});
 const target=path.join(dir,name+'.md');const temporary=target+'.tmp';
 await writeFile(temporary,content,'utf8');await rename(temporary,target);
}
async function archive(feed){
 for(const article of feed.articles){
  const content=`# ${article.title}\n\n作者：${article.author||'生财圈友'}\n\n发布时间：${new Date(article.publishedAt*1000).toISOString()}\n\n${article.overview||article.summary}\n\n此处保留短导读或来源摘要，全文请回到原帖阅读。\n\n📌 来源：生财有术原帖 ${article.sourceUrl}（MCP 同步）\n🎯 应用：AINPE 文章索引与热点专题；结合原文判断具体实践。\n`;
  const topics=article.topics?.length?article.topics:['community'];
  for(const topic of topics)await saveMaterial(folders[topic]||folders.community,`${article.entityType}-${article.id}`,content);
 }
 for(const event of feed.events){
  const time=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'full',timeStyle:'short'});
  const content=`# ${event.name}\n\n活动开始：${time.format(new Date(event.startTime*1000))}（北京时间）\n\n地点：${event.city||''} ${event.district||''}\n\n报名截止：${event.submitEnd?time.format(new Date(event.submitEnd*1000))+'（北京时间）':'以原页为准'}\n\n来源状态：${event.lifecycleStatus||'以原页为准'}\n\n${event.summary||''}\n\n活动议程、费用与报名条件以原入口为准。平台收录不等同于平台主办。\n\n📌 来源：生财有术活动收录 ${event.url}（MCP 同步）\n🎯 应用：AINPE 近期活动列表与有效活动推荐。\n`;
  await saveMaterial(['活动与实践','线下活动'],`meeting-${event.id}`,content);
 }
}

async function main(){
 const args=process.argv.slice(2);if(args.length!==1)throw new Error('input_required');
 const text=await readFile(args[0],'utf8');if(text.length>4*1024*1024)throw new Error('input_large');
 const input=JSON.parse(text);const previous=await readFeed();
 // Collection time is supplied by the collector; never turn a stale failed query into a fresh success.
 if(typeof input.now!=='string'||!Number.isFinite(Date.parse(input.now))||Math.abs(Date.now()-Date.parse(input.now))>30*60*1000)throw new Error('collection_stale');
 const normalized=normalizeFeed({...input,previous});const published=await publishFeed(normalized);
 let archiveStatus='ok';try{await archive(published);}catch{archiveStatus='retry_needed';}
 process.stdout.write(JSON.stringify({status:published.sync.status,lastSuccessAt:published.sync.lastSuccessAt,counts:published.sync.counts,archiveStatus})+'\n');
}
main().catch(async()=>{await recordFeedFailure().catch(()=>{});process.stderr.write('同步未完成：已保留上次成功内容。请检查 MCP 查询结果或本机存储。\n');process.exitCode=1;});
