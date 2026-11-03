import { useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Article, BookmarkSimple, CalendarBlank,
  Check, Compass, FolderSimple, House, MagnifyingGlass, MapPin,
  Plus, Sparkle, SquaresFour, X,
} from '@phosphor-icons/react';
import { dateLabel, timeLabel, formatMoney } from '../ainpe-data.js';
import './workspace.css';

const INTERESTS = [
  { name: '全部方向', test: null },
  { name: 'FDE', test: /fde|企业.{0,8}(落地|部署)|前线部署/i },
  { name: 'Agent', test: /agent|智能体|mcp|工作流|自动化/i },
  { name: 'AI 获客', test: /获客|引流|营销|销售|增长|小红书/i },
];
const TYPES = [
  { key: 'all', label: '全部发现' },
  { key: 'event', label: '活动' },
  { key: 'article', label: '文章' },
  { key: 'project', label: '项目' },
];
const TYPE_INFO = {
  event: { label: '线下活动', Icon: CalendarBlank },
  article: { label: '深度阅读', Icon: Article },
  project: { label: '实践项目', Icon: FolderSimple },
};
const stamp = (value) => {
  if (!value) return 0;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const n = Number(value);
    return n < 1e12 ? n * 1000 : n;
  }
  return new Date(value).getTime() || 0;
};
const titleOf = (item) => item.title || item.name || '';
const searchable = (item) => [item.name, item.title, item.description, item.summary,
  item.city, item.district, item.author, ...(item.tags || [])].join(' ');
const itemKey = (item, type) => `${type}-${item.id || item.projectId || titleOf(item)}`;
const chinaDay = (value) => value ? new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(stamp(value))) : '';

function ContentRow({ entry, app }) {
  const { item, type } = entry;
  const { Icon, label } = TYPE_INFO[type];
  const saved = app.isSaved(item, type);
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 2) : [];
  return <article className={`ws-feed-item ws-feed-${type}`}>
    <div className="ws-content-icon"><Icon size={22} weight="duotone" /></div>
    <button className="ws-item-main" aria-label={`查看${titleOf(item)}`} onClick={() => app.onOpen(item, type)}>
      <span className="ws-item-eyebrow">
        <span>{label}</span><span className="ws-dot">·</span>
        {type === 'event' ? <span>{item.city || '地点待确认'}{item.district ? ` · ${item.district}` : ''}</span> :
          type === 'article' ? <span>{item.author || '生财有术'}{item.publishedAt ? ` · ${dateLabel(item.publishedAt)}` : ''}</span> :
            <span>生财有术 · 项目库</span>}
      </span>
      <h3>{titleOf(item)} <ArrowUpRight className="ws-title-arrow" size={18} /></h3>
      <p>{item.summary || item.description || '查看来源中的完整内容与相关信息。'}</p>
      <span className="ws-item-foot">
        {type === 'event' && <span className="ws-event-time"><CalendarBlank size={14} />{dateLabel(item.startTime)} · {timeLabel(item.startTime)} 北京时间</span>}
        {type === 'project' && <>
          {item.dailyMinutes > 0 && <span>每日 {item.dailyMinutes} 分钟</span>}
          {item.estimatedCost != null && <span>启动投入 ¥{formatMoney(item.estimatedCost)}</span>}
        </>}
        {tags.map((tag, i) => <span className="ws-tag" key={typeof tag === 'string' ? tag : i}>{typeof tag === 'string' ? tag : tag.name}</span>)}
        {type === 'article' && tags.length === 0 && <span>查看全文与原始出处</span>}
      </span>
    </button>
    <button className={`ws-save ${saved ? 'ws-is-saved' : ''}`} aria-label={`${saved ? '取消收藏' : '收藏'}：${titleOf(item)}`}
      aria-pressed={saved} title={saved ? '取消收藏' : '加入我的收藏'} onClick={() => app.onSave(item, type)}>
      <BookmarkSimple size={20} weight={saved ? 'fill' : 'regular'} />
    </button>
  </article>;
}

export default function Workspace({ app }) {
  const [view, setView] = useState('discover');
  const [interest, setInterest] = useState('全部方向');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const events = app.events || [];
  const featured = app.featuredEvent || events[0];
  const all = useMemo(() => {
    const groups = [events.map(item => ({ item, type: 'event' })),
      (app.articles || []).map(item => ({ item, type: 'article' })),
      (app.projects || []).map(item => ({ item, type: 'project' }))];
    const mixed = [];
    const length = Math.max(...groups.map(group => group.length), 0);
    for (let i = 0; i < length; i++) groups.forEach(group => { if (group[i]) mixed.push(group[i]); });
    return mixed;
  }, [app.events, app.articles, app.projects]);
  const saved = all.filter(({ item, type: itemType }) => app.isSaved(item, itemType));
  const selectedInterest = INTERESTS.find(option => option.name === interest);
  const matches = all.filter(({ item, type: itemType }) => {
    if (view === 'saved' && !app.isSaved(item, itemType)) return false;
    if (selectedInterest?.test && !selectedInterest.test.test(searchable(item))) return false;
    return !query.trim() || searchable(item).toLowerCase().includes(query.toLowerCase().trim());
  });
  const visible = matches.filter(entry => type === 'all' || entry.type === type);
  const [limit, setLimit] = useState(9);
  const weekEvents = events.filter(item => {
    const day = chinaDay(item.startTime);
    return day >= '2026-11-02' && day <= '2026-11-08';
  }).sort((a, b) => stamp(a.startTime) - stamp(b.startTime));
  const switchView = next => { setView(next); setType('all'); setQuery(''); setInterest('全部方向'); setLimit(9); };
  const chooseInterest = name => { setInterest(name); setLimit(9); };
  const reset = () => { setInterest('全部方向'); setType('all'); setQuery(''); setLimit(9); };

  return <div className="ws-page">
    <aside className="ws-sidebar">
      <a className="ws-brand" href="/workspace" aria-label="AINPE 发现工作台"><SquaresFour size={29} weight="fill" /><span>AINPE<span className="ws-brand-dot">.</span></span></a>
      <div className="ws-space-label"><span className="ws-personal-avatar">A</span><span>我的发现空间<small>从发现，到行动</small></span></div>
      <nav className="ws-primary-nav" aria-label="工作台导航">
        <button className={view === 'discover' ? 'ws-nav-active' : ''} onClick={() => switchView('discover')}><Compass size={20} weight={view === 'discover' ? 'fill' : 'regular'} />发现工作台</button>
        <button className={view === 'saved' ? 'ws-nav-active' : ''} onClick={() => switchView('saved')}><BookmarkSimple size={20} weight={view === 'saved' ? 'fill' : 'regular'} />我的收藏<span className="ws-nav-count">{app.savedCount}</span></button>
      </nav>
      <div className="ws-sidebar-section"><span className="ws-sidebar-label">浏览 AINPE</span>
        <a href="/"><House size={19} />精选首页<ArrowUpRight size={14} /></a>
        <a href="/events"><CalendarBlank size={19} />线下活动<ArrowUpRight size={14} /></a>
      </div>
      <div className="ws-sidebar-section ws-sidebar-topics"><span className="ws-sidebar-label">关注的方向</span>
        {INTERESTS.slice(1).map(option => <button className={interest === option.name ? 'ws-topic-active' : ''} key={option.name} onClick={() => { setView('discover'); chooseInterest(option.name); }}><span className={`ws-topic-dot ws-topic-${option.name.split(' ')[0].toLowerCase()}`} />{option.name}<ArrowRight size={14} /></button>)}
      </div>
      <div className="ws-sidebar-bottom"><div className="ws-local-note"><BookmarkSimple size={18} /><p>把好内容留给下一步<small>收藏保存在当前浏览器</small></p></div><button className="ws-source-button" onClick={app.onSourceInfo}><span className="ws-status-dot" />内容来源与更新<ArrowUpRight size={14} /></button></div>
    </aside>

    <div className="ws-workspace">
      <header className="ws-topbar"><div><span>个人空间</span><span className="ws-breadcrumb-slash">/</span><strong>{view === 'saved' ? '我的收藏' : '发现工作台'}</strong></div><div className="ws-topbar-date"><CalendarBlank size={16} />2026年11月2日 · 周一</div><span className="ws-mobile-avatar">A</span></header>
      <main className="ws-main">
        <div className="ws-page-heading"><div><div className="ws-kicker">YOUR NEXT GOOD IDEA</div><h1>{view === 'saved' ? '把发现，变成你的下一步。' : '今天，离实战再近一步。'}</h1><p>{view === 'saved' ? `你收藏了 ${app.savedCount} 条内容。好想法，值得回来再看。` : '找到值得读的内容、值得做的项目，和值得见的人。'}</p></div><button className="ws-heading-action" onClick={() => switchView(view === 'saved' ? 'discover' : 'saved')}><BookmarkSimple size={17} />{view === 'saved' ? '继续发现' : '我的收藏'}<span>{app.savedCount}</span></button></div>

        {view === 'discover' && featured && <section className="ws-spotlight" aria-label="本周值得关注">
          <div className="ws-spotlight-copy"><div className="ws-spotlight-label"><Sparkle size={16} weight="fill" />本周值得见面<span>UPCOMING</span></div><h2>{featured.name}</h2><div className="ws-spotlight-meta"><span><CalendarBlank size={16} /><span>{dateLabel(featured.startTime)} · {timeLabel(featured.startTime)} 北京时间</span></span><span><MapPin size={16} />{featured.city || '地点待确认'}{featured.district ? ` · ${featured.district}` : ''}</span></div><p>从线上关注，到线下面对面。先了解议题，再安排你的周末。</p><button onClick={() => app.onOpen(featured, 'event')}>查看活动详情<ArrowUpRight size={17} /></button></div>
          <div className="ws-spotlight-date" aria-hidden="true"><span>2026 / NOVEMBER</span><strong>{new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(stamp(featured.startTime)))}</strong><small>{new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'Asia/Shanghai' }).format(new Date(stamp(featured.startTime)))}</small><span className="ws-timezone">活动时间 · 北京时间</span></div>
        </section>}

        <div className="ws-content-layout"><section className="ws-discovery">
          <div className="ws-section-heading"><h2>{view === 'saved' ? '我的收藏夹' : '为下一步，找一点灵感'}</h2><span>{view === 'saved' ? '仅当前浏览器' : '发现 · 阅读 · 实践'}</span></div>
          <div className="ws-filter-panel"><div className="ws-interest-row"><span className="ws-interest-label">探索方向</span><div className="ws-interest-chips">{INTERESTS.map(option => <button key={option.name} className={interest === option.name ? 'ws-chip-selected' : ''} aria-pressed={interest === option.name} onClick={() => chooseInterest(option.name)}>{option.name}{interest === option.name && <Check size={13} weight="bold" />}</button>)}</div></div>
            <div className="ws-search"><MagnifyingGlass size={19} /><input value={query} onChange={event => { setQuery(event.target.value); setLimit(9); }} placeholder="搜索感兴趣的内容、项目或活动" aria-label="搜索发现内容" />{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={15} /></button>}<span className="ws-search-hint">搜索</span></div>
          </div>
          <div className="ws-content-tabs" role="tablist" aria-label="内容类型">{TYPES.map(option => <button role="tab" aria-selected={type === option.key} className={type === option.key ? 'ws-tab-active' : ''} key={option.key} onClick={() => { setType(option.key); setLimit(9); }}>{option.label}<span>{option.key === 'all' ? matches.length : matches.filter(entry => entry.type === option.key).length}</span></button>)}</div>
          <div className="ws-feed" aria-live="polite">{visible.slice(0, limit).map(entry => <ContentRow key={itemKey(entry.item, entry.type)} entry={entry} app={app} />)}
            {!visible.length && <div className="ws-empty"><BookmarkSimple size={32} weight="duotone" /><h3>{view === 'saved' && !saved.length ? '你的好发现，从第一条收藏开始' : '换个方向，再发现一点新东西'}</h3><p>{view === 'saved' && !saved.length ? '点击内容右侧的收藏图标，稍后在这里继续。' : '当前条件下还没有内容，可以清空搜索或查看全部方向。'}</p><button onClick={view === 'saved' && !saved.length ? () => switchView('discover') : reset}>{view === 'saved' && !saved.length ? '去发现内容' : '重置筛选'}<ArrowRight size={16} /></button></div>}
          </div>
          {visible.length > limit && <button className="ws-load-more" onClick={() => setLimit(value => value + 9)}>继续探索<Plus size={17} /><span>还有 {visible.length - limit} 条内容</span></button>}
          <div className="ws-feed-footer"><span className="ws-status-dot" />内容快照 · {app.updatedLabel || '2026-11-02'}<button onClick={app.onSourceInfo}>查看来源<ArrowUpRight size={12} /></button></div>
        </section>

        <aside className="ws-right-rail">
          <section className="ws-week"><div className="ws-rail-heading"><h2>本周日程</h2><CalendarBlank size={18} /></div><div className="ws-week-label">11月2日 — 11月8日</div><div className="ws-week-days">{['一', '二', '三', '四', '五', '六', '日'].map((day, index) => {
            const date = `2026-11-${String(index + 2).padStart(2, '0')}`;
            const hasEvent = weekEvents.some(event => chinaDay(event.startTime) === date);
            return <div key={day} className={`${index === 0 ? 'ws-day-today' : ''} ${hasEvent ? 'ws-day-event' : ''}`}><span>{day}</span><strong>{String(index + 2).padStart(2, '0')}</strong><i /></div>;
          })}</div><div className="ws-schedule-list">{weekEvents.slice(0, 3).map(event => <button key={event.id || event.name} className="ws-schedule-item" onClick={() => app.onOpen(event, 'event')}><span className="ws-schedule-marker" /><span><small>{dateLabel(event.startTime)} · {timeLabel(event.startTime)}</small><strong>{event.name}</strong><span><MapPin size={12} />{event.city || '地点待确认'} · 北京时间</span></span><ArrowUpRight size={15} /></button>)}{!weekEvents.length && <p className="ws-schedule-empty">本周暂无已收录活动，去看看其他城市的见面机会。</p>}</div><a className="ws-rail-link" href="/events">浏览全部活动<ArrowRight size={15} /></a></section>

          <section className="ws-reading-list"><div className="ws-rail-heading"><h2>留给稍后的你</h2><BookmarkSimple size={18} /></div><p className="ws-rail-description">让值得看的内容，不再划走。</p>{saved.length ? <div className="ws-mini-saved">{saved.slice(0, 3).map(({ item, type: itemType }, index) => <button key={itemKey(item, itemType)} onClick={() => app.onOpen(item, itemType)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{titleOf(item)}</strong><ArrowUpRight size={14} /></button>)}</div> : <div className="ws-save-prompt"><BookmarkSimple size={26} weight="duotone" /><p>遇见有用的，先收起来。<br /><span>你的收藏会出现在这里。</span></p></div>}<button className="ws-rail-link" onClick={() => switchView('saved')}>打开我的收藏<span>{app.savedCount}<ArrowRight size={15} /></span></button></section>

          <div className="ws-about-source"><span className="ws-source-overline">CURATED, WITH CONTEXT</span><p>每个发现，都有来处。</p><small>活动、文章与项目来自生财有术的可用资料。内容为更新快照，具体安排以原始来源为准。</small><button onClick={app.onSourceInfo}>了解内容来源<ArrowUpRight size={14} /></button></div>
        </aside></div>
        <footer className="ws-footer"><span>AINPE<span> · </span>发现 AI 实战的下一步</span><span>保持好奇，开始行动。</span></footer>
      </main>
      <nav className="ws-mobile-nav" aria-label="快捷导航"><a href="/"><House size={20} /><span>精选</span></a><a href="/events"><CalendarBlank size={20} /><span>活动</span></a><button className={view === 'discover' ? 'ws-mobile-active' : ''} onClick={() => switchView('discover')}><Compass size={20} weight={view === 'discover' ? 'fill' : 'regular'} /><span>工作台</span></button><button className={view === 'saved' ? 'ws-mobile-active' : ''} onClick={() => switchView('saved')}><BookmarkSimple size={20} weight={view === 'saved' ? 'fill' : 'regular'} /><span>收藏 {app.savedCount > 0 ? app.savedCount : ''}</span></button></nav>
    </div>
  </div>;
}
