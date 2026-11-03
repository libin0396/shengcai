// Data-only transformation. Fetching and authorization stay in Codex MCP tools.
import {SYNC_INTERVAL_MINUTES} from '../src/sync-schedule.js';
const TOPIC_LABELS = {fde:'FDE','ai-video':'AI 视频',agent:'Agent','ai-growth':'AI 获客',community:'更多热门'};
const KNOWN_TOPICS = new Set(Object.keys(TOPIC_LABELS));
const SECRET_QUERY = /^(?:access_token|refresh_token|authorization|authorization_code|code|code_verifier|client_secret|cookie|callback_uri|redirect_uri|token|api_key)$/i;
const DAY = 86400;
const ENTITIES = {amp:'&',lt:'<',gt:'>',nbsp:' ',quot:'"',apos:"'",ldquo:'“',rdquo:'”',lsquo:'‘',rsquo:'’',ndash:'–',mdash:'—',rarr:'→',larr:'←',harr:'↔',hellip:'…',bull:'•',middot:'·'};

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(match,entity)=>{
    if (entity[0] !== '#') return ENTITIES[entity.toLowerCase()] ?? match;
    const point = entity[1].toLowerCase()==='x' ? parseInt(entity.slice(2),16) : parseInt(entity.slice(1),10);
    return Number.isInteger(point) && point>0 && point<=0x10ffff && !(point>=0xd800&&point<=0xdfff) ? String.fromCodePoint(point) : '�';
  });
}

function text(value, max = 120) {
  if (typeof value !== 'string') return '';
  return [...decodeEntities(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
    .replace(/\b(?:access_token|refresh_token|code_verifier|client_secret|callback_uri|authorization_code|cookie)\s*[:=]\s*[^\s,;，；]+/gi,'[已隐去敏感字段]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,'[已隐去凭据]')
    .replace(/\s+/g,' ').trim()].slice(0,max).join('');
}

function id(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) ? value : null;
}

function seconds(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 946684800 && n < 4102444800 ? Math.floor(n) : null;
}

function number(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : 0; }

function url(value, asset = false) {
  if (asset && typeof value === 'string' && /^\/assets\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp)$/.test(value)) return value;
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const allowed = asset ? ['search01.shengcaiyoushu.com','scys.com'] : ['scys.com'];
    if (!allowed.includes(u.hostname) || [...u.searchParams.keys()].some(k=>SECRET_QUERY.test(k))) return null;
    return value;
  } catch { return null; }
}

function topicsFor(title, summary, menuIds, previous = []) {
  const out = previous.filter(t=>KNOWN_TOPICS.has(t) && t !== 'community');
  const copy = `${title} ${summary}`;
  if (/\bfde\b|前线部署|前沿部署|企业.{0,10}(?:AI落地|AI 落地)|AI.{0,8}企业落地/i.test(copy)) out.push('fde');
  // Menu 2882664 was resolved from the authorized SCYS listMenu result.
  if (/AI.{0,5}视频|视频.{0,5}AI|AI.{0,5}短剧|AI.{0,5}广告|AI.{0,5}模特/i.test(copy) || String(menuIds||'').split(/[\s,]+/).includes('2882664')) out.push('ai-video');
  if (/agent|智能体|自动化|工作流|mcp/i.test(copy)) out.push('agent');
  if (/获客|引流|营销|销售|流量增长/.test(copy)) out.push('ai-growth');
  return [...new Set(out.length ? out : ['community'])];
}

function articleKey(a) { return `${a.entityType}:${a.id}`; }

function previousArticle(raw) {
  const articleId = id(raw?.id);
  const entityType = typeof raw?.entityType === 'string' && /^[a-z][a-z0-9_]{0,40}$/.test(raw.entityType) ? raw.entityType : 'xq_topic';
  const title = text(raw?.title,240), sourceUrl = url(raw?.sourceUrl), publishedAt = seconds(raw?.publishedAt);
  if (!articleId || !title || !sourceUrl || !publishedAt) return null;
  const summary = text(raw.summary), overview = text(raw.overview,350);
  return {id:articleId,entityType,title,summary,author:text(raw.author,80),avatar:url(raw.avatar,true),sourceUrl,publishedAt,
    isDigested:raw.isDigested === true || raw.isDigested === 1,likeCount:number(raw.likeCount),commentCount:number(raw.commentCount),
    topics:topicsFor(title,summary,'',Array.isArray(raw.topics)?raw.topics:[]),kind:text(raw.kind,20)||'分享',...(overview?{overview}:{})};
}

function normalizeArticle(wrapper, existing) {
  const raw = wrapper?.topicDTO, user = wrapper?.topicUserDTO;
  if (!raw || typeof raw !== 'object') return null;
  const articleId = id(raw.entityId), entityType = raw.entityType;
  if (!articleId || typeof entityType !== 'string' || !/^[a-z][a-z0-9_]{0,40}$/.test(entityType)) return null;
  const title = text(raw.showTitle,240), summary = text(raw.articleContent), sourceUrl = url(wrapper.detailUrl), publishedAt = seconds(raw.gmtCreate);
  if (!title || !sourceUrl || !publishedAt) return null;
  const prior = existing.get(`${entityType}:${articleId}`);
  return {id:articleId,entityType,title,summary,author:text(user?.name,80)||prior?.author||'生财圈友',avatar:url(user?.avatar,true)||prior?.avatar||null,
    sourceUrl,publishedAt,isDigested:raw.isDigested===true||raw.isDigested===1,likeCount:number(raw.likeCount),commentCount:number(raw.commentsCount),
    topics:topicsFor(title,summary,raw.menuIds,prior?.topics||[]),kind:prior?.kind||(/教程|SOP|步骤|实操|手册/i.test(title)?'教程':/复盘|案例/.test(title)?'案例':'分享'),
    ...(prior?.overview?{overview:prior.overview}:{})};
}

function normalizeEvent(raw, nowSeconds, fromPrevious = false) {
  const eventId = id(raw?.partyId ?? raw?.id), name = text(raw?.name,240), sourceUrl = url(raw?.url), startTime = seconds(raw?.startTime);
  if (!eventId || !name || !sourceUrl || !startTime) return null;
  if ((!fromPrevious && raw.partyStatus !== 'APPROVED') || (raw.partyStatus && raw.partyStatus !== 'APPROVED')) return null;
  const description = text(raw.description,1000);
  if (/XX:XX|[XＸ]{2}\s*(?:业务|行业|话题)|具体画像\s*\d|主话题[：:]?\s*[「“]?[XＸ]{2}/i.test(description)) return null;
  const submitEnd = seconds(raw.submitEnd);
  let lifecycleStatus = ['UPCOMING','ENDED','CANCELLED','CANCELED','FINISHED','COMPLETED','STARTED'].includes(raw.lifecycleStatus) ? raw.lifecycleStatus : (startTime>nowSeconds?'UPCOMING':'STARTED');
  if (lifecycleStatus === 'UPCOMING' && startTime <= nowSeconds) lifecycleStatus = 'STARTED';
  return {id:eventId,name,title:name,description,summary:text(description),city:text(raw.city,60),district:text(raw.district,60),province:text(raw.province,60),
    startTime,submitEnd,lifecycleStatus,url:sourceUrl,coverImg:url(raw.coverImg,true),typeText:text(raw.typeText,40),source:'生财有术',partyStatus:'APPROVED',
    isHhj:raw.isHhj===true,isDigested:raw.isDigested===true,avgCost:number(raw.avgCost),joinCount:number(raw.joinCount),remainStock:number(raw.remainStock),full:raw.full===true||raw.remainStock===0};
}

function available(event, now) {
  return event.startTime > now && (!event.submitEnd || event.submitEnd > now) && !/ENDED|FINISHED|COMPLETED|CANCEL/.test(event.lifecycleStatus) && !event.full;
}

function eventPriority(event) { return /\bFDE\b|前线部署|AI|智能体|自动化|工作流/i.test(`${event.name} ${event.description}`) ? 1 : 0; }

function sanitizeGuide(guide) {
  if (!guide || typeof guide !== 'object' || Array.isArray(guide)) return {};
  const out = {};
  for (const key of ['fde','ai-video']) {
    const value = guide[key]; if (!value || typeof value !== 'object') continue;
    const result = {};
    if (text(value.intro,500)) result.intro=text(value.intro,500);
    if (Array.isArray(value.readingPath)) result.readingPath=value.readingPath.map(t=>text(t,150)).filter(Boolean).slice(0,8);
    if (Array.isArray(value.audience)) result.audience=value.audience.map(t=>text(t,150)).filter(Boolean).slice(0,8);
    if (Array.isArray(value.activityTakeaways)) result.activityTakeaways=value.activityTakeaways.map(t=>({title:text(t?.title,150),description:text(t?.description,400),sourceUrl:url(t?.sourceUrl)})).filter(t=>t.title&&t.sourceUrl).slice(0,8);
    if (url(value.officialRegistrationUrl)) result.officialRegistrationUrl=url(value.officialRegistrationUrl);
    if (url(value.sourceUrl)) result.sourceUrl=url(value.sourceUrl);
    out[key]=result;
  }
  return out;
}

function sanitizeComments(values, articles) {
  const validIds = new Set(articles.map(a=>a.id));
  return (Array.isArray(values)?values:[]).map(c=>({id:id(c?.id),articleId:id(c?.articleId),articleTitle:text(c?.articleTitle,240),author:text(c?.author,80),text:text(c?.text,650),
    viewpoint:['提醒与疑问','实践经验','交流观点'].includes(c?.viewpoint)?c.viewpoint:'交流观点',publishedAt:seconds(c?.publishedAt),likeCount:number(c?.likeCount),sourceUrl:url(c?.sourceUrl),
    topic:['fde','ai-video'].includes(c?.topic)?c.topic:null,excerpt:true})).filter(c=>c.id&&validIds.has(c.articleId)&&c.text&&c.sourceUrl&&c.topic).slice(0,100);
}

/** Normalize one complete MCP collection. Missing query arrays are failures, not empty success. */
export function normalizeFeed({events,latest,hot,topicArticles=[],previous={},now=new Date().toISOString()}={}) {
  if (![events,latest,hot].every(Array.isArray)) throw new TypeError('events, latest and hot query results must be arrays');
  if (!Array.isArray(topicArticles) || topicArticles.some(t=>!Array.isArray(t?.items))) throw new TypeError('topicArticles results must contain items arrays');
  const date = new Date(now); if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid synchronization time');
  const fetchedAt = date.toISOString(), nowSeconds=Math.floor(date.getTime()/1000), cutoff=nowSeconds-30*DAY;
  const existing = new Map((Array.isArray(previous.articles)?previous.articles:[]).map(previousArticle).filter(Boolean).map(a=>[articleKey(a),a]));
  const merged = new Map(existing);
  const fresh = [...topicArticles.flatMap(t=>t.items),...latest,...hot];
  for (const wrapper of fresh) { const a=normalizeArticle(wrapper,existing); if (a && a.publishedAt<=nowSeconds+300) merged.set(articleKey(a),a); }
  const protectedIds = new Set((previous.comments||[]).map(c=>String(c.articleId)));
  const sorted = [...merged.values()].sort((a,b)=>b.publishedAt-a.publishedAt||articleKey(a).localeCompare(articleKey(b)));
  const articles=sorted.filter((a,index)=>index<300||a.overview||protectedIds.has(a.id));
  const articleKeys=new Set(articles.map(articleKey));
  const hotArticles = new Map();
  for (const wrapper of hot) {const a=normalizeArticle(wrapper,existing);if(a&&a.publishedAt>=cutoff&&a.publishedAt<=nowSeconds+300&&articleKeys.has(articleKey(a)))hotArticles.set(articleKey(a),merged.get(articleKey(a))||a);}
  const hotArticleIds=[...new Set([...hotArticles.values()].map(a=>a.id))];
  const hotIds = new Set(hotArticleIds);
  for (const article of articles) article.isHot=hotIds.has(article.id);
  const trendingTopics=Object.entries(TOPIC_LABELS).map(([topicId,label])=>{
    const matches=[...hotArticles.values()].filter(a=>a.topics.includes(topicId));const articleIds=[...new Set(matches.map(a=>a.id))];
    return {id:topicId,label,count:articleIds.length,hotCount:articleIds.length,articleIds};
  }).filter(t=>t.count>0).sort((a,b)=>b.count-a.count||Object.keys(TOPIC_LABELS).indexOf(a.id)-Object.keys(TOPIC_LABELS).indexOf(b.id));
  const eventMap=new Map();
  // Retain past known events for reference; never retain a future event omitted by a complete fresh query.
  for (const raw of (Array.isArray(previous.events)?previous.events:[])) {const e=normalizeEvent(raw,nowSeconds,true);if(e&&e.startTime<=nowSeconds)eventMap.set(e.id,e);}
  for (const raw of events) {const e=normalizeEvent(raw,nowSeconds);if(e)eventMap.set(e.id,e);}
  const normalizedEvents=[...eventMap.values()].sort((a,b)=>{
    const aFuture=a.startTime>nowSeconds&&!/CANCEL/.test(a.lifecycleStatus),bFuture=b.startTime>nowSeconds&&!/CANCEL/.test(b.lifecycleStatus);
    return aFuture!==bFuture?Number(bFuture)-Number(aFuture):aFuture?a.startTime-b.startTime:b.startTime-a.startTime;
  }).slice(0,100);
  const candidates=normalizedEvents.filter(e=>available(e,nowSeconds));
  const featured=candidates.find(e=>e.id==='10533')||candidates.sort((a,b)=>eventPriority(b)-eventPriority(a)||a.startTime-b.startTime)[0];
  return {version:1,updatedAt:fetchedAt,fetchedAt,events:normalizedEvents,articles,hotArticleIds,trendingTopics,featuredEventId:featured?.id||null,
    topicGuides:sanitizeGuide(previous.topicGuides),comments:sanitizeComments(previous.comments,articles),
    sync:{status:'ok',lastAttemptAt:fetchedAt,lastSuccessAt:fetchedAt,intervalMinutes:SYNC_INTERVAL_MINUTES,message:'已通过生财 MCP 更新活动与话题',counts:{events:normalizedEvents.length,articles:articles.length,hotArticles:hotArticleIds.length}}};
}
