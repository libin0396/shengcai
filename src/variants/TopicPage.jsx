import {useEffect, useState} from 'react';
import {ArrowRight, ArrowUpRight, BookmarkSimple, CalendarBlank, ChatCircleText, Check, Clock, Info, MagnifyingGlass, MapPin, PlayCircle, X} from '@phosphor-icons/react';
import {dateLabel, timeLabel, eventStatus, formatMoney} from '../ainpe-data.js';
import {isAiArticle} from '../article-categories.js';
import SiteHeader from '../components/SiteHeader.jsx';
import './topic-page.css';

const TOPICS = {
  fde: {title:'FDE', subtitle:'把 AI 带进真实业务', description:'集中看入门方法、交付案例和圈友反馈，再判断是否走进线下现场。', eyebrow:'企业 AI 落地'},
  'ai-video': {title:'AI 视频', subtitle:'从内容制作，到真实交付', description:'把制作方法、实战案例和一线讨论放在一起，少绕一点弯路。', eyebrow:'内容与制作'},
  'ai-cases': {title:'AI 实战案例', subtitle:'看看别人如何把想法做成结果', description:'从真实业务场景出发，阅读圈友的 AI 实战案例与复盘。内容按文章类型及标题关键词筛选，具体过程与结果请查看原帖。', eyebrow:'案例与复盘'},
};
const toMillis = value => typeof value === 'number' ? value < 1e12 ? value * 1000 : value : new Date(value).getTime();
function shortDate(value) {
  if (!value || !Number.isFinite(toMillis(value))) return '';
  return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'}).format(new Date(toMillis(value)));
}
function eventDateParts(value) {
  const date=new Date(toMillis(value));
  const format=options=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',...options}).format(date);
  return {day:format({day:'2-digit'}).replace('日',''),month:format({month:'long'}),weekday:format({weekday:'long'})};
}
function saved(app,item,type) { return Boolean(app.isSaved?.(item,type)); }
function Save({app,item,type='article'}) {
  const active=saved(app,item,type);
  return <button className={`tp-save ${active?'tp-save-active':''}`} aria-label={`${active?'取消收藏':'收藏'}${item.title||item.name}`} aria-pressed={active} onClick={()=>app.onSave?.(item,type)}><BookmarkSimple size={18} weight={active?'fill':'regular'}/></button>;
}
function ArticleRow({article,app,onDiscussion,commentCount}) {
  return <article className="tp-article-row">
    <div className="tp-article-core"><div className="tp-article-title-line"><span className={`tp-post-label ${article.isDigested?'tp-digested':''}`}>{article.isDigested?'精华':'分享'}</span><button className="tp-article-title" title={article.title} onClick={()=>app.onOpen(article,'article')}>{article.title}</button></div><p className="tp-article-summary">{article.overview||article.summary}</p><div className="tp-article-meta"><span>{article.author||'生财圈友'}</span>{shortDate(article.publishedAt)&&<><i/><time>{shortDate(article.publishedAt)}</time></>}<i/><span>{article.kind||'实战内容'}</span>{Number.isFinite(article.likeCount)&&<><i/><span>{article.likeCount} 赞</span></>}{Number.isFinite(article.commentCount)&&<button onClick={()=>commentCount?onDiscussion(article):app.onOpen(article,'article')} aria-label={`查看${article.title}的讨论`}><ChatCircleText size={13}/>{article.commentCount} 条评论{commentCount>0&&<span className="tp-excerpt-dot" title="已摘录代表性评论"/>}</button>}</div></div><Save app={app} item={article}/>
  </article>;
}
function CommentRow({comment,article,app}) {
  return <article className="tp-comment-row"><div className="tp-comment-top"><span className={`tp-viewpoint ${comment.viewpoint==='提醒与疑问'?'tp-viewpoint-question':''}`}>{comment.viewpoint||'交流观点'}</span><span className="tp-comment-author">{comment.author||'生财圈友'}</span>{shortDate(comment.publishedAt)&&<time>{shortDate(comment.publishedAt)}</time>}</div><blockquote>{comment.text}</blockquote><div className="tp-comment-source"><span>评论摘录 · 来自</span>{article?<button onClick={()=>app.onOpen(article,'article')}>{comment.articleTitle||article.title}</button>:<a href={comment.sourceUrl} target="_blank" rel="noreferrer">{comment.articleTitle||'生财原帖'}<ArrowUpRight size={13}/></a>}<a className="tp-comment-original" href={comment.sourceUrl} target="_blank" rel="noreferrer">查看原讨论<ArrowUpRight size={13}/></a></div></article>;
}
function Registration({app,event}) {
  const url=app.registrationUrl?.(event)||event.url;
  return <div className="tp-registration"><a href={url} target="_blank" rel="noreferrer" className="tp-primary">查看报名方式<span><ArrowUpRight size={17}/></span></a><button onClick={()=>app.onOpen(event,'event')}>查看活动详情<ArrowRight size={16}/></button></div>;
}
function ActivityRail({app,event,guide}) {
  const contact=app.contact;
  const date=eventDateParts(event.startTime);
  const copyContact=async()=>{try{await navigator.clipboard.writeText(contact.wechatId);app.onNotify?.('微信号已复制');}catch{app.onNotify?.(`请手动复制微信号：${contact.wechatId}`);}};
  return <>
    <section className="tp-event-card"><div className="tp-rail-kicker"><span>本期线下重点</span><span>{eventStatus(event)}</span></div><div className="tp-event-calendar" aria-label={dateLabel(event.startTime)}><strong>{date.day}</strong><div><span>{date.month} · {date.weekday}</span><p>{timeLabel(event.startTime)}<span>北京时间</span></p></div><CalendarBlank size={25} weight="light"/></div><h2>{event.name.replace(/^北京市[｜|]/,'')}</h2><p className="tp-event-place"><MapPin size={15}/>{event.city} · {event.district}</p>{event.submitEnd&&<p className="tp-event-deadline"><Clock size={13}/>报名截止 {shortDate(event.submitEnd)} {timeLabel(event.submitEnd)}</p>}<Registration app={app} event={event}/><p className="tp-activity-source">生财有术活动收录 · 具体安排以原页为准</p></section>
    {guide.activityTakeaways?.length>0&&<section className="tp-rail-section"><h3>去现场，重点了解什么？</h3><ul className="tp-takeaways">{guide.activityTakeaways.slice(0,4).map((t,i)=><li key={t.title||i}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{t.title}</strong><p>{t.description}</p>{t.sourceUrl&&<a href={t.sourceUrl} target="_blank" rel="noreferrer">议题来源<ArrowUpRight size={12}/></a>}</div></li>)}</ul></section>}
    {guide.audience?.length>0&&<section className="tp-rail-section"><h3>先看看，是否适合你</h3><ul className="tp-audience">{guide.audience.map((s,i)=><li key={i}><Check size={14}/><span>{s}</span></li>)}</ul></section>}
    {contact?.wechatId&&<section className="tp-contact"><h3>想先了解参与方式？</h3><p>联系站长，咨询活动与资料。</p><div><span>{contact.wechatId}</span><button onClick={copyContact}>复制微信号</button></div></section>}
  </>;
}
export default function TopicPage({app,slug='fde'}) {
  const topic=TOPICS[slug]||TOPICS.fde;
  const [view,setView]=useState('all'); const [query,setQuery]=useState(''); const [viewpoint,setViewpoint]=useState('全部观点'); const [discussionArticle,setDiscussionArticle]=useState(null); const [limit,setLimit]=useState(15);
  useEffect(()=>{setView('all');setQuery('');setViewpoint('全部观点');setDiscussionArticle(null);setLimit(15);},[slug]);
  const knowledge=app.knowledge||{}; const guide=knowledge.topicGuides?.[slug]||{};
  const allArticles=(knowledge.articles||app.articles||[]).filter(a=>{
    if(!isAiArticle(a))return false;
    if(slug==='ai-cases')return a.kind==='案例'||/案例|复盘|实战/.test(a.title||'');
    if((a.topics||[]).includes(slug))return true;
    // FDE is itself explicit evidence of an AI implementation topic, even
    // when an article has not yet received a structured topic tag.
    return slug==='fde'&&/(?:^|[^a-z])fde(?=$|[^a-z])/i.test(`${a.title||''} ${a.summary||''} ${a.overview||''}`);
  });
  const caseIds=new Set(allArticles.map(a=>String(a.id)));
  const allComments=(knowledge.comments||[]).filter(c=>caseIds.has(String(c.articleId))&&(slug==='ai-cases'||c.topic===slug));
  const articleMap=new Map(allArticles.map(a=>[String(a.id),a]));
  const keyword=query.trim().toLowerCase();
  const articles=allArticles.filter(a=>(view!=='digested'||a.isDigested)&&(view!=='community'||!a.isDigested)&&(!keyword||`${a.title} ${a.summary||''} ${a.overview||''} ${a.author||''}`.toLowerCase().includes(keyword)));
  const comments=allComments.filter(c=>(!discussionArticle||String(c.articleId)===String(discussionArticle.id))&&(viewpoint==='全部观点'||c.viewpoint===viewpoint)&&(!keyword||`${c.text} ${c.articleTitle||''} ${c.author||''}`.toLowerCase().includes(keyword)));
  const byArticle=allComments.reduce((out,c)=>{out[c.articleId]=(out[c.articleId]||0)+1;return out;},{});
  const selectedArticleCount=allArticles.filter(a=>a.isDigested).length;
  const projects=(app.projects||[]).filter(p=>slug==='ai-cases'?/\bAI\b|智能体|GPT|大模型|AI视频/i.test(`${p.name} ${p.summary}`):/视频|短剧|广告|图文带货|模特/.test(`${p.name} ${p.summary}`)).slice(0,5);
  const event=slug==='fde'?app.fdeEvent:null;
  const eventGuide=String(event?.id)==='10533'?guide:{};
  const reset=()=>{setView('all');setQuery('');setViewpoint('全部观点');setDiscussionArticle(null);setLimit(15);};
  const changeView=v=>{setView(v);setDiscussionArticle(null);setViewpoint('全部观点');setLimit(15);};
  const openDiscussion=a=>{setDiscussionArticle(a);setView('comments');setQuery('');setViewpoint('全部观点');setLimit(15);};
  const viewpoints=[...new Set(allComments.map(c=>c.viewpoint).filter(Boolean))];
  const isComments=view==='comments';
  return <div className="tp-page"><SiteHeader app={app} active={slug}/>
    <main className="tp-shell"><div className="tp-breadcrumb"><a href="/">首页</a><span>/</span><span>{slug==='ai-cases'?'案例库':'热点专题'}</span><span>/</span><strong>{topic.title}</strong></div><section className="tp-topic-intro"><div><div className="tp-topic-eyebrow">{slug==='ai-cases'?'案例库':'热点专题'}<span>·</span>{topic.eyebrow}</div><h1>{topic.title}<span>{topic.subtitle}</span></h1><p>{guide.intro||topic.description}</p></div><div className="tp-topic-stats"><strong>{allArticles.length}<span>篇文章</span></strong><strong>{allComments.length}<span>条观点摘录</span></strong></div></section>
    {event&&<section className="tp-mobile-event"><div><span>本期线下</span><strong>{event.name.replace(/^北京市[｜|]/,'')}</strong><p>{shortDate(event.startTime)} · {timeLabel(event.startTime)} · 北京时间</p></div><button onClick={()=>app.onOpen(event,'event')}>了解活动<ArrowUpRight size={15}/></button></section>}
    <div className="tp-layout"><section className="tp-main" aria-label={`${topic.title}专题内容`}><div className="tp-content-controls"><div className="tp-content-tabs" role="tablist" aria-label="专题内容类型">{[{key:'all',label:'全部文章',count:allArticles.length},{key:'digested',label:'精华文章',count:selectedArticleCount},{key:'community',label:'圈友分享',count:allArticles.length-selectedArticleCount},{key:'comments',label:'真实讨论',count:allComments.length}].map(v=><button role="tab" aria-selected={view===v.key} className={view===v.key?'tp-tab-active':''} key={v.key} onClick={()=>changeView(v.key)}>{v.label}<span>{v.count}</span></button>)}</div><form className="tp-search" role="search" onSubmit={e=>e.preventDefault()}><MagnifyingGlass size={17}/><input aria-label={`搜索${topic.title}专题`} value={query} onChange={e=>{setQuery(e.target.value);setLimit(15);}} placeholder="搜索文章、作者或观点"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="清空专题搜索"><X size={15}/></button>}</form></div>
      {!isComments&&guide.readingPath?.length>0&&<div className="tp-reading-path"><span>可以这样读</span><ol>{guide.readingPath.slice(0,4).map((s,i)=><li key={i}>{s}{i<Math.min(guide.readingPath.length,4)-1&&<ArrowRight size={11}/>}</li>)}</ol></div>}
      {isComments&&<div className="tp-discussion-toolbar"><div className="tp-viewpoint-filters" aria-label="观点类型">{['全部观点',...viewpoints].map(v=><button key={v} aria-pressed={viewpoint===v} className={viewpoint===v?'tp-filter-active':''} onClick={()=>setViewpoint(v)}>{v}</button>)}</div><p>观点来自原帖评论摘录，不代表全部圈友意见。</p></div>}
      {discussionArticle&&isComments&&<div className="tp-selected-discussion"><span>正在看：</span><strong>{discussionArticle.title}</strong><button onClick={()=>setDiscussionArticle(null)} aria-label="查看专题全部讨论"><X size={14}/></button></div>}
      {(keyword||viewpoint!=='全部观点')&&<div className="tp-query-status"><span>{isComments?comments.length:articles.length} 条匹配内容{keyword&&` · “${query}”`}</span><button onClick={()=>{setQuery('');setViewpoint('全部观点');}}>清除筛选<X size={13}/></button></div>}
      {isComments?<div className="tp-comments-list">{comments.slice(0,limit).map((c,i)=><CommentRow key={c.id||`${c.articleId}-${i}`} comment={c} article={articleMap.get(String(c.articleId))} app={app}/>)}</div>:<div className="tp-article-list">{articles.slice(0,limit).map(a=><ArticleRow key={a.id} article={a} app={app} onDiscussion={openDiscussion} commentCount={byArticle[a.id]||0}/>)}</div>}
      {(isComments?comments.length:articles.length)===0&&<div className="tp-empty"><MagnifyingGlass size={29}/><h3>{isComments&&!allComments.length?'这个专题的评论正在整理':'没有找到符合条件的内容'}</h3><p>{isComments&&!allComments.length?'先看原帖与实战文章，评论摘录有来源后再展示。':'保留了你的条件，可以换个关键词或查看全部内容。'}</p><button onClick={reset}>查看全部文章<ArrowRight size={16}/></button></div>}
      {(isComments?comments.length:articles.length)>limit&&<button className="tp-load-more" onClick={()=>setLimit(n=>n+15)}>继续看更多{isComments?'观点':'文章'}<span>还有 {(isComments?comments.length:articles.length)-limit} 条</span><ArrowRight size={15}/></button>}
      <div className="tp-list-footer"><span>文章来源与评论原文均可追溯</span><button onClick={app.onSourceInfo}>{app.live?.lastSuccessAt?`最近同步 ${app.live.lastSuccessLabel} · 北京时间`:'显示已保存资料'}<Info size={13}/></button></div>
    </section><aside className="tp-rail" aria-label="专题补充信息">{event?<ActivityRail app={app} event={event} guide={eventGuide}/>:slug==='fde'?<section className="tp-rail-section"><h3>关注下一场 FDE 交流</h3><p className="tp-rail-intro">当前没有可推荐的未截止 FDE 活动。先看方法与圈友讨论，有新活动时自动更新。</p><a href="/events" className="tp-general-event">查看其他近期活动<ArrowUpRight size={16}/></a></section>:<><section className="tp-rail-section tp-project-section"><div className="tp-rail-title"><h3>{slug==='ai-cases'?'相关 AI 项目':'把方法放进项目里'}</h3><PlayCircle size={18}/></div><p className="tp-rail-intro">{slug==='ai-cases'?'收入为历史案例月收入区间，仅供参考。':'来自项目库的相关方向，先看清投入与交付内容。'}</p><div className="tp-project-list">{projects.map(p=><article key={p.id||p.projectId}><button onClick={()=>app.onOpen(p,'project')}><strong>{p.name}</strong><ArrowUpRight size={15}/></button><p>{p.summary}</p>{slug==='ai-cases'&&Number.isFinite(p.incomeMin)&&Number.isFinite(p.incomeMax)&&p.incomeMin>0&&p.incomeMax>=p.incomeMin&&<span>预计收入参考：¥{formatMoney(p.incomeMin)}–{formatMoney(p.incomeMax)} / 月</span>}<span>启动投入参考 ¥{formatMoney(p.estimatedCost)}</span></article>)}</div>{slug==='ai-cases'&&<a href="/projects" className="tp-general-event">查看更多项目与收入参考<ArrowUpRight size={16}/></a>}</section><section className="tp-rail-section tp-subscribe-note"><h3>关注方法，也关注真实反馈</h3><p>文章中的制作路径与评论里的踩坑经验，放在一起看，判断会更完整。</p><button onClick={()=>changeView('comments')}>看看圈友讨论<ChatCircleText size={15}/></button></section><a href="/events" className="tp-general-event">看看近期线下活动<ArrowUpRight size={16}/></a></>}
      <section className="tp-source-note"><Info size={15}/><div><strong>每一条内容，都留有出处</strong><p>精华与普通分享分别标注；评论保留作者和原帖入口。收藏与阅读笔记仅保存在此浏览器。</p><button onClick={app.onSourceInfo}>了解资料来源<ArrowUpRight size={13}/></button></div></section>
    </aside></div><footer className="tp-footer"><span>AINPE · AI 实战情报站</span><p>看实战文章，听一线反馈，找到下一步。</p><a href="/">返回首页<ArrowRight size={14}/></a></footer></main></div>;
}
