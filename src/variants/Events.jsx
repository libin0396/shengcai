import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookmarkSimple, CalendarBlank, Check, Clock, MapPin, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import './events.css';

const SNAPSHOT_NOW = new Date('2026-11-02T00:00:00+08:00').getTime();
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function timestamp(value) {
  if (!value) return null;
  const numeric = Number(value);
  const result = Number.isFinite(numeric) && numeric > 0 ? numeric * (numeric < 1e12 ? 1000 : 1) : new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function dateParts(value) {
  const time = timestamp(value);
  if (!time) return { month: '待定', day: '—', weekday: '', time: '', date: '时间待公布', key: '待公布' };
  const local = new Date(time + 8 * 3600000);
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return {
    month, day, weekday: WEEKDAYS[local.getUTCDay()],
    time: `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`,
    date: `${local.getUTCMonth() + 1}月${local.getUTCDate()}日`,
    key: `${local.getUTCFullYear()}-${month}-${day}`,
  };
}

function cleanText(value = '') {
  return String(value).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function exportCalendar(event, notify) {
  const start = timestamp(event.startTime);
  if (!start) { notify?.('这场活动暂未公布具体时间，请查看原文。'); return; }
  const utc = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escape = (value = '') => cleanText(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AINPE//Events//ZH', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.id || start}@ainpe.events`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(start)}`, `SUMMARY:${escape(event.name)}`, `LOCATION:${escape([event.city, event.district].filter(Boolean).join(' '))}`, `URL:${new URL('/events', window.location.origin).href}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.name || 'AINPE活动'}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify?.('日历文件已下载，可导入 Apple、Google 或 Outlook 日历。');
}

function SaveButton({ app, event, className = '' }) {
  const saved = app.isSaved(event, 'event');
  return <button className={`evt-save ${saved ? 'evt-is-saved' : ''} ${className}`} onClick={() => app.onSave(event, 'event')} aria-label={saved ? `取消收藏${event.name}` : `收藏${event.name}`} title={saved ? '已收藏，点击取消' : '收藏活动'}><BookmarkSimple size={19} weight={saved ? 'fill' : 'regular'} /></button>;
}

export default function Events({ app }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('全部城市');
  const [scope, setScope] = useState('upcoming');
  const [posterVisible, setPosterVisible] = useState(true);
  const events = app.events || [];
  const feature = app.featuredEvent || events[0];
  const cities = useMemo(() => [...new Set(events.map((event) => event.city).filter(Boolean))].sort((a, b) => a.startsWith('北京') ? -1 : b.startsWith('北京') ? 1 : a.localeCompare(b, 'zh')), [events]);
  const filtered = useMemo(() => events.filter((event) => {
    const start = timestamp(event.startTime);
    const text = `${event.name} ${cleanText(event.description)} ${event.city || ''} ${event.district || ''} ${event.typeText || ''}`.toLowerCase();
    return (scope === 'all' || !start || start >= SNAPSHOT_NOW) && (city === '全部城市' || event.city === city) && text.includes(query.trim().toLowerCase());
  }).sort((a, b) => (timestamp(a.startTime) || Infinity) - (timestamp(b.startTime) || Infinity)), [events, scope, city, query]);
  const groups = useMemo(() => {
    const grouped = new Map();
    filtered.forEach((event) => {
      const date = dateParts(event.startTime);
      if (!grouped.has(date.key)) grouped.set(date.key, { date, events: [] });
      grouped.get(date.key).events.push(event);
    });
    return [...grouped.values()];
  }, [filtered]);
  const featureDate = dateParts(feature?.startTime);
  const deadline = dateParts(feature?.submitEnd);
  const nextCount = events.filter((event) => !timestamp(event.startTime) || timestamp(event.startTime) >= SNAPSHOT_NOW).length;
  const resetFilters = () => { setQuery(''); setCity('全部城市'); setScope('upcoming'); };

  return <div className="evt-page">
    <header className="evt-header">
      <a className="evt-brand" href="/" aria-label="AINPE 首页">AINPE<span className="evt-brand-dot" /></a>
      <nav className="evt-nav" aria-label="主导航">
        <a href="/">发现灵感</a><a className="evt-nav-active" href="/events" aria-current="page">走进现场</a><a href="/workspace">我的工作台{app.savedCount > 0 && <span className="evt-nav-count">{app.savedCount}</span>}</a>
      </nav>
      <span className="evt-header-note">给行动者的 AI 情报站</span>
    </header>

    <main className="evt-main">
      <section className="evt-intro">
        <div><p className="evt-eyebrow"><span /> MEET IN REAL LIFE</p><h1>好想法，现场见。</h1><p className="evt-intro-copy">从屏幕前出发，找到你的下一场连接。</p></div>
        <div className="evt-intro-index"><span>NOVEMBER</span><strong>2026<span> / 11</span></strong><small>{nextCount} 场待探索活动 <ArrowDownMark /></small></div>
      </section>

      {feature && <section className="evt-feature" aria-label="本周关注活动">
        <div className="evt-feature-date"><span className="evt-label">本周关注 / FEATURED</span><div className="evt-date-number">{featureDate.day}</div><div className="evt-feature-day"><span>{featureDate.month}月 / {featureDate.weekday}</span><strong>{featureDate.time || '时间待定'}</strong></div></div>
        <div className="evt-feature-body"><div className="evt-feature-top"><span className="evt-feature-tag"><span /> 即将开始</span><SaveButton app={app} event={feature} /></div><div className="evt-feature-location"><MapPin size={15} />{[feature.city, feature.district].filter(Boolean).join(' · ') || '地点见原文'}</div><h2>{feature.name}</h2><p className="evt-feature-description">{cleanText(feature.description) || '把对 AI 的好奇带到现场，了解活动安排，与同行交流。'}</p><div className="evt-feature-actions"><button className="evt-primary" onClick={() => app.onOpen(feature, 'event')}>查看活动详情 <ArrowUpRight size={19} /></button><button className="evt-calendar-btn" onClick={() => exportCalendar(feature, app.onNotify)}><CalendarBlank size={18} /> 加入日历</button></div>{feature.submitEnd && <p className="evt-deadline"><Clock size={13} /> 报名截止 {deadline.date} {deadline.time}<span>活动信息以原文为准</span></p>}</div>
        {posterVisible && <button className="evt-feature-poster" onClick={() => app.onOpen(feature, 'event')} aria-label={`查看${feature.name}海报与详情`}><img src="/assets/fde-cover.jpg" alt={`${feature.name}活动海报`} onError={() => setPosterVisible(false)} /><span>查看活动详情 <ArrowUpRight size={15} /></span></button>}
      </section>}

      <section className="evt-explorer" aria-labelledby="evt-explorer-heading">
        <div className="evt-section-heading"><div><span className="evt-label">THE EVENT CALENDAR</span><h2 id="evt-explorer-heading">把下一站，排进日程。</h2></div><span className="evt-snapshot"><span /> {app.updatedLabel || '2026.11.02 数据快照'}</span></div>
        <div className="evt-toolbar"><div className="evt-search"><MagnifyingGlass size={19} /><input aria-label="搜索活动" placeholder="搜索活动、城市或关键词" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={16} /></button>}</div><div className="evt-scope" aria-label="活动时间范围"><button className={scope === 'upcoming' ? 'evt-selected' : ''} onClick={() => setScope('upcoming')} aria-pressed={scope === 'upcoming'}>即将开始</button><button className={scope === 'all' ? 'evt-selected' : ''} onClick={() => setScope('all')} aria-pressed={scope === 'all'}>全部活动</button></div></div>
        <div className="evt-city-filters"><span className="evt-filter-label"><MapPin size={15} /> 城市</span>{['全部城市', ...cities].map((item) => <button key={item} className={city === item ? 'evt-city-active' : ''} onClick={() => setCity(item)} aria-pressed={city === item}>{item}</button>)}<span className="evt-result-count">{filtered.length} 场活动</span></div>
        {(query || city !== '全部城市' || scope === 'all') && <div className="evt-applied-filters" aria-label="已选筛选条件"><span>已筛选</span>{query && <button onClick={() => setQuery('')} aria-label="移除关键词筛选">“{query}” <X size={13} /></button>}{city !== '全部城市' && <button onClick={() => setCity('全部城市')} aria-label="移除城市筛选">{city} <X size={13} /></button>}{scope === 'all' && <button onClick={() => setScope('upcoming')} aria-label="恢复即将开始活动">全部活动 <X size={13} /></button>}<button className="evt-clear-filters" onClick={resetFilters}>全部清除</button></div>}
        <div className="evt-calendar-layout"><div className="evt-event-list" aria-live="polite">
          {groups.length ? groups.map(({ date, events: groupEvents }) => <div className="evt-date-group" key={date.key}>
            <div className="evt-group-date"><strong>{date.day}</strong><span>{date.month === '待定' ? '时间待定' : `${Number(date.month)}月 ${date.weekday}`}</span></div>
            <div className="evt-group-events">{groupEvents.map((event) => {
              const past = timestamp(event.startTime) && timestamp(event.startTime) < SNAPSHOT_NOW;
              return <article key={event.id} className="evt-event-row"><div className="evt-event-topline"><span className={`evt-event-type ${past ? 'evt-past' : ''}`}>{past ? '往期信息' : event.typeText || '线下活动'}</span><span className="evt-event-time"><Clock size={13} />{dateParts(event.startTime).time || '待公布'} 开始</span><SaveButton app={app} event={event} /></div><button className="evt-event-title" onClick={() => app.onOpen(event, 'event')}><h3>{event.name}</h3><ArrowUpRight size={21} /></button><p className="evt-event-summary">{cleanText(event.description) || '查看活动详情，了解日程与报名信息。'}</p>{event.submitEnd && <p className="evt-row-deadline">报名截止 {dateParts(event.submitEnd).date} {dateParts(event.submitEnd).time}</p>}<div className="evt-event-bottom"><span><MapPin size={14} />{[event.city, event.district].filter(Boolean).join(' · ') || '地点见原文'}</span><button onClick={() => exportCalendar(event, app.onNotify)}><Plus size={15} /> 加入日历</button></div></article>;
            })}</div>
          </div>) : <div className="evt-empty"><MagnifyingGlass size={32} weight="light" /><h3>暂时没有找到这场连接</h3><p>换一个关键词，或看看其他城市的活动。</p><button onClick={resetFilters}>重置筛选 <ArrowRight size={16} /></button></div>}
        </div><aside className="evt-aside"><div className="evt-week"><div className="evt-week-heading"><span>这一周</span><strong>11.02 — 11.08</strong></div><div className="evt-week-days">{['一', '二', '三', '四', '五', '六', '日'].map((label, index) => <div key={label} className={index === 5 ? 'evt-week-highlight' : index === 0 ? 'evt-week-today' : ''}><span>{label}</span><strong>{index + 2}</strong>{index === 5 && <i />}</div>)}</div><p><span className="evt-week-event-dot" />周六，北京见。</p></div><div className="evt-aside-note"><CalendarBlank size={24} weight="light" /><h3>先留个时间，<br />让好事发生。</h3><p>收藏感兴趣的活动，在工作台集中查看；加入日历，把出发写进计划。</p><a href="/workspace">去我的工作台 <ArrowUpRight size={16} /></a></div><div className="evt-source-note"><Check size={16} /><p>信息来自公开活动收录。<br />时间、地点与报名以活动原文为准。</p></div></aside></div>
      </section>
      <section className="evt-bottom-link"><div><span>KEEP THE MOMENTUM</span><h2>见完人，继续做点事。</h2><p>看看真实项目和一线经验，让灵感走到下一步。</p></div><a href="/">回到发现 <ArrowUpRight size={23} /></a></section>
    </main>
    <footer className="evt-footer"><a className="evt-brand" href="/">AINPE<span className="evt-brand-dot" /></a><span>保持好奇，保持行动。</span><button onClick={app.onSourceInfo}>关于数据与来源 <ArrowUpRight size={14} /></button><small>© 2026 AINPE</small></footer>
  </div>;
}

function ArrowDownMark() { return <ArrowRight size={15} className="evt-turn-arrow" />; }
