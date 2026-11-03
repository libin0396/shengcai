import discovery from './discovery.json';
import projectSnapshot from './projects.json';

export const UPDATED_LABEL = '2026.11.02 · 资料快照';
export const EVENTS = discovery.events.map(e=>e.id===discovery.featuredEventId?{...e,coverImg:'/assets/fde-cover.jpg'}:e);
export const ARTICLES = discovery.articles;
export const FEATURED_EVENT = EVENTS.find(e => e.id === discovery.featuredEventId);
export const PROJECTS = projectSnapshot.items.map(p => ({ ...p, id:p.projectId, tags:[...new Set([...p.platformMenus.map(t=>t.name),...(/AI|GPT|智能体/.test(p.name+' '+p.summary)?['AI']:[]),...(/小程序/.test(p.name)?['小程序']:[])])] }));
export const formatMoney = n => Number(n)>=10000 ? `${+(Number(n)/10000).toFixed(2)}万` : Number(n).toLocaleString('zh-CN');
export const formatMinutes = n => Number(n)>=60 ? `${+(Number(n)/60).toFixed(1)} 小时` : `${n} 分钟`;
export function asDate(ts){return new Date(typeof ts==='number'&&ts<1e12?ts*1000:ts);}
export function dateLabel(ts){return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short'}).format(asDate(ts));}
export function timeLabel(ts){return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(asDate(ts));}
export function eventStatus(e){const now=new Date();if(/CANCEL/.test(e.lifecycleStatus||''))return '已取消';if(/ENDED|FINISHED|COMPLETED/.test(e.lifecycleStatus||''))return '已结束';if(e.startTime!=null&&asDate(e.startTime)<now)return '已开始';if(e.full===true)return '名额已满';if(e.submitEnd&&asDate(e.submitEnd)<now)return '报名已截止';return e.lifecycleStatus==='UPCOMING'?'即将开始':'近期活动';}
export function downloadCalendar(e){
  const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp=t=>asDate(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AINPE//Events//ZH','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:scys-${e.id}@ainpe.local`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(e.startTime)}`,`SUMMARY:${esc(e.name)}`,`LOCATION:${esc((e.city||'')+(e.district||''))}`,`URL:${new URL("/events",window.location.origin).href}`,'END:VEVENT','END:VCALENDAR'];
  const u=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download=`AINPE-${e.id}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
