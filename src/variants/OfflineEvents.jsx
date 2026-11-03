import {useMemo, useState} from 'react';
import {ArrowDown, ArrowRight, ArrowUpRight, BookmarkSimple, CalendarBlank, CaretDown, Clock, MapPin, MagnifyingGlass, X} from '@phosphor-icons/react';
import {asDate, dateLabel, timeLabel} from '../ainpe-data.js';
import SiteHeader from '../components/SiteHeader.jsx';
import stories from '../offline-stories.json';
import {mergeVerifiedOfflineEvents} from '../verified-offline-events.js';
import './offline-events.css';

const validDate = value => value != null && Number.isFinite(asDate(value).getTime());
const isEnded = event => /ENDED|FINISHED|COMPLETED/.test(event.lifecycleStatus || '');
const isCancelled = event => /CANCEL/.test(event.lifecycleStatus || '');
const hasStarted = event => validDate(event.startTime) && asDate(event.startTime) < new Date();
const aiTopic = /(?:^|[^a-z])ai(?=$|[^a-z]|ppt|agent|video)|人工智能|智能体|大模型|生成式|AIGC|GPT|Claude|Codex|Gemini|Grok|Cursor|Copilot|OpenAI|DeepSeek|豆包|通义千问|文心一言|(?:^|[^a-z])(?:FDE|Agent|MCP|LLM)(?=$|[^a-z])|workbuddy|seedance|comfyui|minimax/i;
export function isAiEvent(event){
 const title=`${event.name||''} ${event.typeText||''}`;
 if(aiTopic.test(title))return true;
 const intro=String(event.summary||event.description||'').slice(0,300);
 return /(?:本期|本次|本场|活动|聚会|分享|主题|从).{0,16}(?:AI|人工智能|智能体|大模型|FDE|Agent|MCP)/i.test(intro);
}
const isFlagship = event => {
 const title=String(event.name||'');
 if(String(event.id)==='10533')return true;
 if(/大会前[夜夕]|会前|会后|聚餐|晚餐|早餐|饭局/.test(title))return false;
 return /大会|峰会|大课|论坛|公开课|主题课|训练营|游学/.test(`${title} ${event.typeText||''}`);
};
const cleanCity = city => String(city || '').trim().replace(/市$/, '');
function activityStatus(event) {
 if(isCancelled(event))return '已取消';
 if(isEnded(event))return '已结束';
 if(/ONGOING|IN_PROGRESS/.test(event.lifecycleStatus||''))return '进行中';
 if(hasStarted(event))return '已开始 · 状态待核实';
 if(event.full === true)return '名额已满';
 if(event.submitEnd && validDate(event.submitEnd) && asDate(event.submitEnd) < new Date())return '报名已截止';
 return '即将开始';
}
function compareActive(a,b){
 const aStarted=hasStarted(a),bStarted=hasStarted(b);
 if(aStarted!==bStarted)return aStarted?-1:1;
 return aStarted?asDate(b.startTime)-asDate(a.startTime):asDate(a.startTime)-asDate(b.startTime);
}
// Keep each distinct event in one city group. Unknown completion is never
// treated as an ended event or as evidence that registration is still open.
export function groupCityEvents(events,period='upcoming'){
 const groups=new Map(),seen=new Set();
 for(const event of events){
  const key=cleanCity(event.city);const id=String(event.id||'');
  if(!key||!id||seen.has(id))continue;
  seen.add(id);
  if(!groups.has(key))groups.set(key,{city:event.city,items:[]});
  groups.get(key).items.push(event);
 }
 for(const group of groups.values())group.items.sort((a,b)=>period==='past'?asDate(b.startTime)-asDate(a.startTime):asDate(a.startTime)-asDate(b.startTime));
 return [...groups.values()].sort((a,b)=>period==='past'?asDate(b.items[0].startTime)-asDate(a.items[0].startTime):asDate(a.items[0].startTime)-asDate(b.items[0].startTime));
}
function dateParts(value){
 if(!validDate(value))return {month:'日期',day:'待定',weekday:''};
 const d=asDate(value);const f=options=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',...options}).format(d);
 return {month:f({month:'long'}),day:f({day:'2-digit'}).replace('日',''),weekday:f({weekday:'short'})};
}
function CityCard({group,app,index}){
 const [expanded,setExpanded]=useState({active:false,past:false});
 const sections=[{key:'active',label:'近期与进行中',items:group.active},{key:'past',label:'已经结束',items:group.past}];
 return <article className="oe-city-card">
  <div className={`oe-city-art oe-art-${index%4}`}><div><span>同城 AI 活动 / MEETUP</span><h3>{cleanCity(group.city)}</h3></div><div className="oe-city-art-count"><strong>{group.items.length}</strong><span>场收录活动</span></div><div className="oe-art-ring" aria-hidden="true"/></div>
  <div className="oe-city-columns">{sections.map(section=><section className="oe-city-column" key={section.key} aria-label={`${cleanCity(group.city)}${section.label}`}>
   <div className="oe-city-column-heading"><span>{section.label}</span><small>{section.items.length} 场</small></div>
   {section.items.length===0?<p className="oe-city-no-events">暂无收录活动</p>:<div className="oe-city-events">{section.items.slice(0,expanded[section.key]?undefined:2).map(event=>{
   const status=activityStatus(event);const saved=app.isSaved?.(event,'event');
   return <div className="oe-city-event" key={event.id}>
    <div className="oe-event-caption"><span>{isFlagship(event)?'大会 / 主题活动':event.typeText||'线下交流'}</span><span className={status==='即将开始'||status==='进行中'?'oe-event-open':''}>{status}</span></div>
    <button className="oe-event-title" onClick={()=>app.onOpen(event,'event')}>{event.name.replace(/^([^｜|]{1,10}[市省])[｜|]/,'')}</button>
    <div className="oe-event-meta"><span><CalendarBlank size={14}/>{validDate(event.startTime)?`${dateLabel(event.startTime)} ${timeLabel(event.startTime)}`:'时间待公布'}</span>{event.district&&<span><MapPin size={14}/>{event.district}</span>}</div>
    <div className="oe-event-actions"><button onClick={()=>app.onOpen(event,'event')}>站内查看详情<ArrowRight size={14}/></button><button className={saved?'oe-event-saved':''} onClick={()=>app.onSave?.(event,'event')} aria-label={`${saved?'取消收藏':'收藏'}${event.name}`} aria-pressed={!!saved}><BookmarkSimple size={16} weight={saved?'fill':'regular'}/></button></div>
   </div>;
   })}</div>}
   {section.items.length>2&&<button className="oe-city-expand" aria-expanded={expanded[section.key]} onClick={()=>setExpanded(previous=>({...previous,[section.key]:!previous[section.key]}))}>{expanded[section.key]?'收起活动':`展开另外 ${section.items.length-2} 场`} <CaretDown size={13} className={expanded[section.key]?'oe-expanded':''}/></button>}
  </section>)}</div>
 </article>;
}

export default function OfflineEvents({app,verifiedEvents=[]}){
 const [kind,setKind]=useState('all');const [city,setCity]=useState('all');const [query,setQuery]=useState('');const [limit,setLimit]=useState(8);
 const all=useMemo(()=>mergeVerifiedOfflineEvents(app.events,verifiedEvents).filter(e=>e&&e.id&&validDate(e.startTime)&&!isCancelled(e)&&isAiEvent(e)&&String(e.city||'').trim()),[app.events,verifiedEvents]);
 const activePool=all.filter(e=>!isEnded(e));
 const archivedPool=all.filter(isEnded);
 const featured=[app.fdeEvent,app.featuredEvent].find(e=>e&&isAiEvent(e)&&!isCancelled(e)&&!isEnded(e)&&!hasStarted(e)&&activityStatus(e)==='即将开始')||null;
 const upcoming=groupCityEvents(activePool);
 const cities=[...new Set(all.map(e=>e.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
 const matches=groupCityEvents(all.filter(e=>(city==='all'||e.city===city)&&(kind==='all'||(kind==='featured'?isFlagship(e):!isFlagship(e)))&&(!query.trim()||`${e.name||''} ${e.city||''} ${e.district||''} ${e.description||''}`.toLowerCase().includes(query.trim().toLowerCase())))).map(group=>({...group,active:group.items.filter(e=>!isEnded(e)).sort(compareActive),past:group.items.filter(isEnded).sort((a,b)=>asDate(b.startTime)-asDate(a.startTime))})).sort((a,b)=>{
  if(!a.active.length)return b.active.length?1:asDate(b.past[0].startTime)-asDate(a.past[0].startTime);
  if(!b.active.length)return -1;
  return compareActive(a.active[0],b.active[0]);
 });
 const count=matches.reduce((sum,group)=>sum+group.items.length,0);
 const date=featured?dateParts(featured.startTime):null;
 return <div className="oe-page"><SiteHeader app={app} active="events" theme="dark"/>
  <main>
   <section className="oe-hero"><div className="oe-shell oe-hero-layout"><div className="oe-hero-copy"><div className="oe-kicker"><span/>从线上灵感，到线下相遇</div><h1>好想法，<br/><em>现场见。</em></h1><p>大会听观点，同城聊实战。<br/>在真实的交流里，找到一起向前的人。</p><div className="oe-hero-actions"><a href="#event-list">发现近期活动<ArrowDown size={17}/></a><a href="#event-stories">看看圈友怎么说<ArrowRight size={16}/></a></div><div className="oe-hero-stats"><div><strong>{activePool.length}</strong><span>场近期 AI 活动已收录</span></div><div><strong>{upcoming.length}</strong><span>个城市有近期活动</span></div><div className="oe-stat-note">基于当前收录资料<br/>随内容同步更新</div></div></div>
    {featured?<aside className="oe-spotlight"><div className="oe-spotlight-top"><span><i/>近期重点 / FEATURED</span><span>{activityStatus(featured)}</span></div><div className="oe-spotlight-main"><div className="oe-spotlight-date"><strong>{date.day}</strong><span>{date.month} · {date.weekday}</span></div><div className="oe-spotlight-info"><span><MapPin size={14}/>{[featured.city,featured.district].filter(Boolean).join(' · ')}</span><h2>{featured.name.replace(/^北京市[｜|]/,'')}</h2><p>带着真实问题来到现场，和同行聊方法、聊实践。</p><div><button onClick={()=>app.onOpen(featured,'event')}>站内了解活动<ArrowUpRight size={16}/></button><button className="oe-feature-camp" onClick={app.onCampaign}>了解三天体验营<ArrowRight size={15}/></button></div></div>{(String(featured.id)==='10533'||featured.coverImg)&&<img src={String(featured.id)==='10533'?'/assets/fde-cover.jpg':featured.coverImg} alt={`${featured.name}活动海报`}/>}</div><p className="oe-spotlight-source">活动信息来自生财有术 · 具体安排以活动资料为准</p></aside>:<aside className="oe-spotlight oe-spotlight-empty"><span>线下活动持续更新</span><h2>下一场相遇，<br/>从这里开始。</h2><p>先看看最近收录的同城活动与圈友分享。</p></aside>}
   </div></section>
   <div className="oe-shell oe-main"><section className="oe-event-section" id="event-list"><div className="oe-section-heading"><div><span>MEET UP · 活动日历</span><h2>下一站，去现场。</h2><p>按城市看近期 AI 活动，也看看已经结束的线下交流。</p></div><div className="oe-update"><Clock size={14}/>{app.live?.lastSuccessAt?`更新于 ${app.live.lastSuccessLabel} · 北京时间`:'显示已保存的活动资料'}</div></div>
    <div className="oe-controls"><div className="oe-overview">近期与进行中 <strong>{activePool.length}</strong><span>·</span>已经结束 <strong>{archivedPool.length}</strong></div><div className="oe-controls-right"><label className="oe-city"><MapPin size={15}/><select aria-label="选择城市" value={city} onChange={e=>{setCity(e.target.value);setLimit(8);}}><option value="all">全部城市</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select><CaretDown size={13}/></label><label className="oe-search"><MagnifyingGlass size={16}/><input aria-label="搜索线下活动" placeholder="搜索活动、城市或主题" value={query} onChange={e=>{setQuery(e.target.value);setLimit(8);}}/>{query&&<button aria-label="清空搜索" onClick={()=>setQuery('')}><X size={14}/></button>}</label></div></div>
    <div className="oe-type-row"><div aria-label="活动类型"><button aria-pressed={kind==='all'} onClick={()=>{setKind('all');setLimit(9);}}>全部类型</button><button aria-pressed={kind==='featured'} onClick={()=>{setKind('featured');setLimit(9);}}>大会与主题活动</button><button aria-pressed={kind==='meetup'} onClick={()=>{setKind('meetup');setLimit(9);}}>同城聚会</button></div><span>{matches.length} 个城市 · {count} 场活动</span></div>
    {matches.length?<><div className="oe-grid">{matches.slice(0,limit).map((group,i)=><CityCard key={cleanCity(group.city)} group={group} app={app} index={i}/>)}</div>{matches.length>limit&&<button className="oe-more" onClick={()=>setLimit(n=>n+9)}>继续看更多城市 <ArrowRight size={16}/></button>}</>:<div className="oe-empty"><MagnifyingGlass size={25}/><h3>暂时没有找到相关活动</h3><p>换个城市或关键词试试，也可以查看全部活动。</p><button onClick={()=>{setCity('all');setKind('all');setQuery('');}}>查看全部活动</button></div>}
    <p className="oe-list-note">按当前收录资料分城市展示 AI 活动。开始时间已过但未确认结束的活动会标注“状态待核实”；往期为已保存资料，并非全部历史活动。</p>
   </section>
   {stories.length>0&&<section className="oe-stories" id="event-stories"><div className="oe-section-heading"><div><span>FROM THE COMMUNITY · 圈友回顾</span><h2>圈友的线下记录。</h2><p>不同场次的真实经历与观察，带你多了解一点线下的交流。</p></div></div><div className="oe-stories-grid">{stories.map(story=><article key={story.id}><span className="oe-story-kicker">圈友回顾 / 生财有术</span><h3>{story.title}</h3><p>{story.summary}</p><div><span>{story.author||'生财圈友'} · 线下复盘摘要</span></div></article>)}</div><p className="oe-list-note">以上是不同场次的圈友个人记录摘要，不代表所有人的意见。</p></section>}
   <section className="oe-next"><div><span>从看到，到动手</span><h2>一个人开始，也可以和同行一起走。</h2><p>先看看案例，试着做出第一步。想系统了解 AI 实战，也可以看看三天体验营。</p><div><button onClick={app.onCampaign}>了解三天体验营<ArrowUpRight size={16}/></button><a href="/topics/ai-cases">先看 AI 实战案例<ArrowRight size={15}/></a></div></div>{app.campaign?.posterUrl&&<button className="oe-camp-poster" onClick={app.onCampaign} aria-label="查看三天体验营完整海报"><img src={app.campaign.posterUrl} alt="AI 成万事三天体验营完整海报，包含原推广二维码"/></button>}</section>
   <footer className="oe-footer"><span>AI 实战情报站 <b>AINPE</b></span><p>看见机会，走进真实的现场。</p><a href="/">回到发现<ArrowRight size={14}/></a></footer>
  </div></main>
 </div>;
}
