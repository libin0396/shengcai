import {ArrowRight,ArrowUpRight,CalendarBlank,MapPin,UsersThree} from '@phosphor-icons/react';
import {asDate,dateLabel,timeLabel} from '../ainpe-data.js';
import './fde-opportunity-hero.css';

function isOpenFdeEvent(event){
 if(!event||!/FDE/i.test(event.name||'')||/ENDED|FINISHED|COMPLETED|CANCEL/.test(event.lifecycleStatus||''))return false;
 if(event.partyStatus&&event.partyStatus!=='APPROVED')return false;
 const start=asDate(event.startTime).getTime();
 if(!Number.isFinite(start)||start<=Date.now())return false;
 if(event.submitEnd){const deadline=asDate(event.submitEnd).getTime();if(!Number.isFinite(deadline)||deadline<=Date.now())return false;}
 if(event.full===true||(event.full==null&&event.remainStock!=null&&Number.isFinite(Number(event.remainStock))&&Number(event.remainStock)<=0))return false;
 return true;
}
function parts(event){
 const date=asDate(event.startTime);
 return {
  day:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',day:'2-digit'}).format(date).replace('日',''),
  month:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long'}).format(date),
  weekday:new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',weekday:'short'}).format(date),
 };
}
export default function FdeOpportunityHero({app,editorial}){
 const event=[app.fdeEvent,app.featuredEvent].find(isOpenFdeEvent)||null;
 const date=event?parts(event):null;
 const isBeijingConference=String(event?.id)==='10533';
 const poster=event?(isBeijingConference?'/assets/fde-cover.jpg':event.coverImg||null):null;
 const posterLink=event?(isBeijingConference?'/assets/fde-poster.jpg':poster||event.url):null;
 const registration=event?(app.registrationUrl?.(event)||event.url):'/topics/fde';
 const primaryLabel=event?(/大会/.test(event.name)?'查看大会与报名':'查看活动与报名'):'先看 FDE 实战';
 const eyebrow=typeof editorial?.heroEyebrow==='string'?editorial.heroEyebrow:'FDE · 下一步，去现场';
 return <section className={`foh-hero ${event?'foh-has-event':'foh-topic-only'}`} aria-labelledby="foh-title">
  <div className="foh-main">
   <p className="foh-eyebrow"><span aria-hidden="true"/>{eyebrow}</p>
   <h1 id="foh-title">下一站，<em>FDE。</em><br/><span>把 AI 做进真实生意。</span></h1>
   <p className="foh-description">企业 AI 落地的机会，藏在真实业务问题里。<br className="foh-desktop-break"/>{event?'想入局，或已在做，都可以来现场和同行聊获客、交付与协作。':'从真实案例与一线经验里，找到自己能切入、能交付的位置。'}</p>
   <div className="foh-goals" aria-label="交流方向"><span><UsersThree size={15}/>同行交流</span><i/><span>实战拆解</span><i/><span>资源连接</span></div>
   {isBeijingConference&&editorial?.conference&&<p className="foh-program">{editorial.conference.program}<a href={editorial.conference.sourceUrl} target="_blank" rel="noreferrer">议题来源<ArrowUpRight size={12}/></a></p>}
   <div className="foh-actions"><a className="foh-primary" href={registration} {...(event?{target:'_blank',rel:'noreferrer'}:{})}>{primaryLabel}<ArrowUpRight size={19} weight="bold"/></a><a className="foh-secondary" href={event?'/topics/fde':'/events'}>{event?'先看 FDE 实战':'查看近期线下活动'}<ArrowRight size={17}/></a></div>
   {event?<div className="foh-event-band"><div className="foh-date" aria-label={`${dateLabel(event.startTime)} ${timeLabel(event.startTime)} 北京时间`}><strong aria-hidden="true">{date.day}</strong><div aria-hidden="true"><span>{date.month} · {date.weekday}</span><b>{timeLabel(event.startTime)} 开始</b></div></div><div className="foh-location"><span><MapPin size={14}/>{[event.city,event.district].filter(Boolean).join(' · ')||'地点见原活动页'}</span>{event.submitEnd&&<small>报名截止 {new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'}).format(asDate(event.submitEnd))} {timeLabel(event.submitEnd)}</small>}<small>北京时间 · 具体安排以生财原页为准</small></div><a className="foh-library-jump" href="#knowledge-library">继续看实战与讨论<ArrowRight size={14}/></a></div>:<p className="foh-no-event-note">先看真实案例与圈友反馈，再找到适合自己的参与方式。</p>}
  </div>
  <div className="foh-visual">
   {poster?<figure className="foh-poster"><a href={posterLink} target="_blank" rel="noreferrer" aria-label={`查看${event.name}完整原海报`}><img src={poster} alt={`${event.name}原活动海报`} loading="eager"/></a><figcaption><span>{event.name.replace(/^北京市[｜|]/,'')}</span><a href={posterLink} target="_blank" rel="noreferrer">原活动海报<ArrowUpRight size={12}/></a></figcaption></figure>:event?<div className="foh-date-poster"><span>下一场 FDE 交流</span><strong>{date.day}</strong><p>{date.month} · {date.weekday}</p><div><CalendarBlank size={17}/>{timeLabel(event.startTime)} · 北京时间</div><h2>{event.name}</h2></div>:<div className="foh-topic-poster"><span>FDE 实战专题</span><strong>把机会<br/>看具体。</strong><p>从一个真实问题，<br/>找到你能参与的切入点。</p><a href="/topics/fde">方法 / 案例 / 一线讨论<ArrowUpRight size={18}/></a></div>}
  </div>
 </section>;
}
