import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeed} from '../scripts/normalize-feed.mjs';

const now='2026-11-02T18:00:00.000Z';
const timestamp=Math.floor(new Date(now).getTime()/1000);
const article=(id='82258452244481412',overrides={})=>({topicDTO:{entityType:'xq_topic',entityId:id,showTitle:'FDE 交付复盘',articleContent:'<b>业务现场的 AI 落地。</b>',gmtCreate:timestamp-100,isDigested:1,likeCount:12,commentsCount:3,...overrides},topicUserDTO:{name:'圈友',avatar:'https://search01.shengcaiyoushu.com/upload/avatar/example'},detailUrl:`https://scys.com/articleDetail/xq_topic/${id}`});
const event=(id='10533',overrides={})=>({partyId:id,name:'AI 航海家 FDE 大会',description:'真实业务交付分享。',url:`https://scys.com/meeting/detail?id=${id}`,startTime:timestamp+1000,submitEnd:timestamp+500,partyStatus:'APPROVED',lifecycleStatus:'UPCOMING',...overrides});
const input=(overrides={})=>({events:[],latest:[],hot:[],previous:{},now,...overrides});

test('keeps large decimal IDs exact, drops unsafe numeric IDs, deduplicates type plus ID',()=>{
 const a=article();const b=article(82258452244481412);const c=article();c.topicDTO.entityType='sc_topic';
 const feed=normalizeFeed(input({latest:[a,a,b,c],hot:[a,a]}));
 assert.equal(feed.articles.length,2);assert.equal(feed.articles[0].id,'82258452244481412');assert.deepEqual(feed.hotArticleIds,['82258452244481412']);
});

test('publishes only public allowlisted fields and plain short content',()=>{
 const a=article();a.access_token='not-a-real-token';a.topicDTO.secret='ignored';a.topicDTO.articleContent='<script>bad()</script><b>'+ '教'.repeat(200)+'</b>';a.topicUserDTO.cookie='ignored';
 const feed=normalizeFeed(input({latest:[a]}));const encoded=JSON.stringify(feed);
 assert.equal([...feed.articles[0].summary].length,120);assert(!/[<>]/.test(feed.articles[0].summary));assert(!encoded.includes('not-a-real-token'));assert(!encoded.includes('cookie'));assert(!encoded.includes('secret'));
 const dangerous=article('2');dangerous.detailUrl='https://scys.com/articleDetail/xq_topic/2?access_token=secret';
 const foreign=article('3');foreign.detailUrl='https://example.com/member-copy';
 assert.equal(normalizeFeed(input({latest:[dangerous,foreign]})).articles.length,0);
});

test('fresh data wins stats, curated overview/comments and verified prior topics survive',()=>{
 const current=article();const prev={id:'82258452244481412',entityType:'xq_topic',title:'旧标题',summary:'旧摘要',author:'旧作者',publishedAt:timestamp-500,sourceUrl:current.detailUrl,topics:['fde','ai-video'],overview:'整理过的导读',kind:'案例',likeCount:1,commentCount:1};
 const comment={id:'100',articleId:prev.id,articleTitle:prev.title,author:'甲',text:'原帖反馈',sourceUrl:prev.sourceUrl,topic:'fde',publishedAt:timestamp-10};
 const feed=normalizeFeed(input({latest:[current],previous:{articles:[prev],comments:[comment],topicGuides:{fde:{intro:'专题说明',readingPath:['先读案例'],secret:'removed'}}}}));
 assert.equal(feed.articles[0].title,'FDE 交付复盘');assert.equal(feed.articles[0].likeCount,12);assert.equal(feed.articles[0].overview,prev.overview);assert(feed.articles[0].topics.includes('ai-video'));assert.equal(feed.comments.length,1);assert.equal(feed.topicGuides.fde.secret,undefined);
});

test('topic search label does not falsely tag content; confirmed menu supports AI视频',()=>{
 const unrelated=article('2',{showTitle:'文旅赛道复盘',articleContent:'本地旅游经营',menuIds:'2488550'});
 const confirmed=article('3',{showTitle:'作品复盘',articleContent:'本次记录',menuIds:'2488550 2882664'});
 const feed=normalizeFeed(input({topicArticles:[{slug:'fde',items:[unrelated]},{slug:'ai-video',items:[confirmed]}]}));
 assert(!feed.articles.find(a=>a.id==='2').topics.includes('fde'));assert(feed.articles.find(a=>a.id==='3').topics.includes('ai-video'));
});

test('decodes common named and numeric entities before truncation without leaving encoded HTML',()=>{
 const a=article('1',{showTitle:'&ldquo;AI&quot;&rarr;实操&#x1F680;',articleContent:'&quot;双引号&quot; &apos;单引号&apos; &ldquo;中文&rdquo; &lsquo;引号&rsquo; &ndash; &mdash; &rarr; &#8594; &#x2192; &amp; &#x110000; &lt;script&gt;hidden()&lt;/script&gt;'});
 const feed=normalizeFeed(input({latest:[a]}));
 assert.equal(feed.articles[0].title,'“AI"→实操🚀');
 assert.equal(feed.articles[0].summary,'"双引号" \'单引号\' “中文” ‘引号’ – — → → → & �');
 const long=article('2',{articleContent:'&quot;'.repeat(121)});assert.equal(normalizeFeed(input({latest:[long]})).articles[0].summary.length,120);
});

test('trending topics reflect distinct hot sample hits in last30days only',()=>{
 const recent=article('1');const old=article('2',{gmtCreate:timestamp-31*86400});const general=article('3',{showTitle:'小店经营复盘',articleContent:'开店心得'});
 const feed=normalizeFeed(input({latest:[recent,old],hot:[recent,recent,old,general]}));
 assert.deepEqual(feed.hotArticleIds,['1','3']);assert.equal(feed.trendingTopics.find(t=>t.id==='fde').count,1);assert.equal(feed.trendingTopics.find(t=>t.id==='community').hotCount,1);assert.equal(feed.articles.length,3);
 assert.equal(feed.articles.find(a=>a.id==='1').isHot,true);assert.equal(feed.articles.find(a=>a.id==='3').isHot,true);assert.equal(feed.articles.find(a=>a.id==='2').isHot,false);
 const next=normalizeFeed(input({previous:feed,latest:[recent],hot:[]}));assert(next.articles.every(a=>a.isHot===false));
});

test('expired/full/cancelled events cannot stay featured and placeholder drafts are filtered',()=>{
 const feed=normalizeFeed(input({events:[event('10533',{submitEnd:timestamp-1}),event('2',{startTime:timestamp+3000}),event('3',{startTime:timestamp+2000,name:'本地聚餐'}),event('4',{description:'时间：XX:XX，主话题：「XX 话题」'}),event('5',{full:true}),event('6',{lifecycleStatus:'CANCELLED'})]}));
 assert.equal(feed.featuredEventId,'2');assert(!feed.events.some(e=>e.id==='4'));assert(feed.events.some(e=>e.id==='10533'));assert.equal(feed.events[0].id,'10533');
 const passed=normalizeFeed(input({events:[event('10533',{startTime:timestamp-100})]}));assert.equal(passed.featuredEventId,null);assert.equal(passed.events[0].lifecycleStatus,'STARTED');
});

test('complete fresh event query drops vanished upcoming event, retains source history',()=>{
 const priorFuture={...event('99'),id:'99'};const priorPast={...event('98',{startTime:timestamp-500}),id:'98'};
 const feed=normalizeFeed(input({previous:{events:[priorFuture,priorPast]}}));assert.deepEqual(feed.events.map(e=>e.id),['98']);assert.equal(feed.featuredEventId,null);
});

test('explicit zero remaining capacity blocks promotion while missing capacity does not',()=>{
 const feed=normalizeFeed(input({events:[event('10533',{remainStock:0}),event('2')]}));
 assert.equal(feed.events.find(e=>e.id==='10533').full,true);assert.equal(feed.events.find(e=>e.id==='2').full,false);assert.equal(feed.featuredEventId,'2');
});

test('missing result array is not mistaken for successful empty query',()=>{
 assert.throws(()=>normalizeFeed({events:[],latest:[],now}),/arrays/);assert.throws(()=>normalizeFeed(input({now:'invalid'})),/time/);
 const feed=normalizeFeed(input());assert.equal(feed.sync.status,'ok');assert.deepEqual(feed.hotArticleIds,[]);assert.equal(feed.featuredEventId,null);
});
