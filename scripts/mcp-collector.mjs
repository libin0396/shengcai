// Data-only collector. It accepts an already-authenticated MCP client; it never
// starts OAuth, reads credential storage, logs responses, or publishes a feed.
// A caller must record sync failure and keep the previous feed when this throws.
import {mkdir, open, readFile, rename, unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

const PARTY_FIELDS = ['partyId','url','name','description','coverImg','descImage','typeCode','typeText','isHhj','isDigested','startTime','province','city','district','avgCost','joinCount','remainStock','full','submitEnd','partyStatus','lifecycleStatus'];
const TOPIC_FIELDS = ['entityType','entityId','showTitle','articleContent','gmtCreate','isDigested','commentsCount','likeCount','menuIds'];
const USER_FIELDS = ['name','avatar'];
const DEFAULT_RATE_RETRIES = 3;
const SECRET_FIELD=/^(?:access[_-]?token|refresh[_-]?token|authorization|authorization[_-]?code|code|code[_-]?verifier|client[_-]?secret|cookie|callback[_-]?uri|redirect[_-]?uri|token|api[_-]?key)$/i;
const QUERY_PLAN=JSON.parse(await readFile(new URL('../sync/query-plan.json',import.meta.url),'utf8'));

export class CollectionError extends Error {
  constructor(code) { super(code); this.name='CollectionError'; this.code=code; }
}
const fail = code => { throw new CollectionError(code); };
const plain = value => value && typeof value==='object' && !Array.isArray(value);
const scalar = value => value===null || typeof value==='string' || typeof value==='boolean' || (typeof value==='number' && Number.isFinite(value));
const clockDate = clock => { const d = new Date(clock()); if(!Number.isFinite(d.getTime())) fail('INVALID_CLOCK'); return d; };
function safeText(value) {
  return value.replace(/\b(?:access[_-]?token|refresh[_-]?token|authorization[_-]?code|code[_-]?verifier|client[_-]?secret|cookie|callback[_-]?uri|redirect[_-]?uri|api[_-]?key|token)["']?\s*[:=]\s*["']?[^\s,;，；"']+/gi,'[已隐去敏感字段]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,'[已隐去凭据]');
}
function safeUrl(value,{asset=false,required=false}={}) {
  if(value==null || value==='') {if(required) fail('INVALID_ITEM');return undefined;}
  if(asset && typeof value==='string' && /^\/assets\/[a-z\d._/-]+$/i.test(value) && !value.includes('..')) return value;
  try {
    const u=new URL(value);
    if(typeof value!=='string' || u.protocol!=='https:' || u.username || u.password || u.port ||
       !(u.hostname==='scys.com' || (asset && u.hostname==='search01.shengcaiyoushu.com')) ||
       [...u.searchParams.keys()].some(key=>SECRET_FIELD.test(key)) ||
       /(?:access[_-]?token|refresh[_-]?token|authorization[_-]?code|code[_-]?verifier|client[_-]?secret|callback[_-]?uri|redirect[_-]?uri|api[_-]?key|cookie|(?:^|[&#?])code)=/i.test(decodeURIComponent(u.hash))) throw new Error();
    return value;
  } catch { if(required) fail('INVALID_ITEM');return undefined; }
}

// Do not serialize nested or unexpected fields, even if a server unexpectedly
// returns them beneath an allowlisted key. IDs must not silently lose precision.
function stringId(value) {
  if(typeof value==='string' && /^[1-9]\d*$/.test(value)) return value;
  if(Number.isSafeInteger(value) && value>0) return String(value);
  fail('INVALID_ID');
}
function pickScalars(value, fields) {
  if(!plain(value)) fail('INVALID_ITEM');
  const result={};
  for(const key of fields) if(Object.hasOwn(value,key) && value[key]!==undefined && scalar(value[key])) result[key]=typeof value[key]==='string'?safeText(value[key]):value[key];
  return result;
}
function party(value) {
  const result=pickScalars(value,PARTY_FIELDS);
  result.partyId=stringId(value.partyId);
  if(typeof value.name!=='string' || !value.name.trim() || !Number.isSafeInteger(value.startTime) ||
     value.startTime<946684800 || value.startTime>=4102444800 || value.partyStatus!=='APPROVED') fail('INVALID_ITEM');
  result.url=safeUrl(value.url,{required:true});
  const cover=safeUrl(value.coverImg,{asset:true});if(cover)result.coverImg=cover;else delete result.coverImg;
  // descImage is unused by normalization and can contain untrusted nested URLs.
  delete result.descImage;
  return result;
}
function topic(value) {
  if(!plain(value) || !plain(value.topicDTO)) fail('INVALID_ITEM');
  const topicDTO=pickScalars(value.topicDTO,TOPIC_FIELDS);
  topicDTO.entityId=stringId(value.topicDTO.entityId);
  if(Array.isArray(value.topicDTO.menuIds)) topicDTO.menuIds=value.topicDTO.menuIds.map(stringId);
  const topicUserDTO=plain(value.topicUserDTO)?pickScalars(value.topicUserDTO,USER_FIELDS):{};
  const avatar=safeUrl(topicUserDTO.avatar,{asset:true});if(avatar)topicUserDTO.avatar=avatar;else delete topicUserDTO.avatar;
  const output={topicDTO,topicUserDTO};
  output.detailUrl=safeUrl(value.detailUrl,{required:true});
  return output;
}

function bodyOf(result) {
  if(!plain(result)) fail('INVALID_RESPONSE');
  if(plain(result.structuredContent)) return result.structuredContent;
  if(!Array.isArray(result.content)) fail('INVALID_RESPONSE');
  const texts=result.content.filter(item=>item?.type==='text' && typeof item.text==='string');
  if(texts.length!==1 || texts[0].text.length>8*1024*1024) fail('INVALID_RESPONSE');
  try { const value=JSON.parse(texts[0].text); if(plain(value)) return value; }
  catch { /* sanitized error below */ }
  fail('INVALID_RESPONSE');
}
function errorData(value) {
  if(!plain(value)) return null;
  const data=plain(value.error)?value.error:value;
  const retry=data.retryAfterSeconds ?? data.details?.retryAfterSeconds ?? data.data?.retryAfterSeconds;
  return {code:data.code, retryAfterSeconds:retry};
}
function delay(ms,signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted) return reject(new CollectionError('ABORTED'));
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);
    const stop=()=>{clearTimeout(timer);reject(new CollectionError('ABORTED'));};
    signal?.addEventListener('abort',stop,{once:true});
  });
}

async function call(client,name,args,{signal,sleep,maxRateRetries,maxRetryDelaySeconds}) {
  for(let retry=0;;retry++) {
    if(signal?.aborted) fail('ABORTED');
    let result;
    try { result=await client.callTool({name,arguments:args},{signal}); }
    catch(error) {
      const data=errorData(error);
      if(data?.code!=='MCP_RATE_LIMITED') fail('MCP_CALL_FAILED');
      result={isError:true,structuredContent:data};
    }
    if(result?.isError) {
      let error; try { error=errorData(bodyOf(result)); } catch { fail('MCP_CALL_FAILED'); }
      if(error?.code!=='MCP_RATE_LIMITED') fail('MCP_CALL_FAILED');
      const seconds=error.retryAfterSeconds;
      if(retry>=maxRateRetries || typeof seconds!=='number' || !Number.isFinite(seconds) || seconds<0 || seconds>maxRetryDelaySeconds) fail('RATE_LIMITED');
      try { await sleep(seconds*1000,signal); } catch { fail('ABORTED'); }
      continue;
    }
    return bodyOf(result);
  }
}
function items(result) { if(!plain(result) || !Array.isArray(result.items)) fail('INVALID_RESPONSE'); return result.items; }
function menuId(menuItems, target) {
  const normalize=s=>String(s??'').replace(/\s+/g,'').toLowerCase();
  const found=new Set();
  for(const item of menuItems) {
    if(!plain(item) || normalize(item.menuName??item.name??item.label??item.title)!==normalize(target)) continue;
    try { found.add(stringId(item.menuId??item.id)); } catch { /* use keyword fallback */ }
  }
  return found.size===1?[...found][0]:null;
}
function topicFilter(id, fallback) { return id?{includeMenuIdList:[id]}:{keyword:fallback}; }

/** Collect only the six queries in the approved plan. Never logs input/output. */
export async function collectMcpInput({client,plan=QUERY_PLAN,clock=()=>Date.now(),sleep=delay,signal,maxRateRetries=DEFAULT_RATE_RETRIES,maxRetryDelaySeconds=3600}={}) {
  if(!client || typeof client.callTool!=='function' || typeof clock!=='function' || typeof sleep!=='function' ||
     !Number.isInteger(maxRateRetries) || maxRateRetries<0 || !Number.isFinite(maxRetryDelaySeconds) || maxRetryDelaySeconds<0) fail('INVALID_ARGUMENT');
  // Values outside the approved plan require a deliberate review, not a
  // silently expanded query or a truncated "complete" activity collection.
  if(!plain(plan) || plan.lookbackDays!==30 || plan.articlePages!==3 || plan.pageSize!==10 ||
     plan.topicPages!==2 || plan.maximumActivityPages!==20) fail('INVALID_QUERY_PLAN');
  const opts={signal,sleep,maxRateRetries,maxRetryDelaySeconds};
  const started=clockDate(clock); const nowSeconds=Math.floor(started.getTime()/1000); const cutoff=nowSeconds-plan.lookbackDays*86400;
  const menus=items(await call(client,'listMenu',{},opts));
  const ai=menuId(menus,'AI'), video=menuId(menus,'AI视频');
  const events=[];
  for(let pageIndex=1;pageIndex<=plan.maximumActivityPages;pageIndex++) {
    const result=await call(client,'searchParties',{startTimeFrom:nowSeconds,partyStatuses:['APPROVED'],pageIndex,pageSize:20},opts);
    const page=items(result);if(page.length>20) fail('INVALID_RESPONSE');
    events.push(...page.map(party));
    // An absent/non-boolean hasNext must not make a partial page look complete.
    if(typeof result.hasNext!=='boolean') fail('PAGINATION_UNVERIFIED');
    if(result.total!==undefined) {
      if(!Number.isSafeInteger(result.total) || result.total<0) fail('INVALID_RESPONSE');
      if(result.total<(pageIndex-1)*20+page.length || result.hasNext!==(pageIndex*20<result.total)) fail('PAGINATION_UNVERIFIED');
    }
    if(!result.hasNext) break;
    if(page.length===0) fail('PAGINATION_UNVERIFIED');
    if(pageIndex===plan.maximumActivityPages) fail('PAGINATION_INCOMPLETE');
  }
  async function topicPages(filter,maxPages) {
    const collected=[];
    for(let pageIndex=1;pageIndex<=maxPages;pageIndex++) {
      const result=await call(client,'searchTopic',{gmtCreateStart:cutoff,orderBy:'gmt_create',displayMode:1,pageSize:plan.pageSize,pageIndex,...filter},opts);
      const page=items(result);if(page.length>plan.pageSize) fail('INVALID_RESPONSE');collected.push(...page.map(topic));
      if(result.hasNext!==undefined && typeof result.hasNext!=='boolean') fail('INVALID_RESPONSE');
      // Current searchTopic exposes `total` but no `hasNext`. Use an explicit
      // server pagination signal, not a short page alone, to decide completion.
      const hasTotal=Number.isSafeInteger(result.total) && result.total>=0;
      if(result.total!==undefined && !hasTotal) fail('INVALID_RESPONSE');
      if(result.hasNext===undefined && !hasTotal) fail('PAGINATION_UNVERIFIED');
      if(hasTotal && result.total < collected.length) fail('PAGINATION_UNVERIFIED');
      const more=result.hasNext===undefined ? pageIndex*plan.pageSize<result.total : result.hasNext;
      if(!more) break;
      if(page.length<plan.pageSize) fail('PAGINATION_UNVERIFIED');
    }
    return collected;
  }
  const latest=await topicPages(topicFilter(ai,'AI'),plan.articlePages);
  const hot=await topicPages({...topicFilter(ai,'AI'),isHot:true},plan.articlePages);
  const fde=await topicPages({keyword:'FDE'},1);
  const aiVideo=await topicPages(topicFilter(video,'AI视频'),plan.topicPages);
  const completed=clockDate(clock);
  if(completed.getTime()<started.getTime() || completed.getTime()-started.getTime()>30*60*1000) fail('COLLECTION_EXPIRED');
  return {now:completed.toISOString(),events,latest,hot,topicArticles:[{slug:'fde',items:fde},{slug:'ai-video',items:aiVideo}]};
}

/** Write a completed collection atomically, with owner-only access. */
export async function saveMcpInput(input, stagingDirectory) {
  if(!plain(input) || !Array.isArray(input.events) || !Array.isArray(input.latest) || !Array.isArray(input.hot) ||
     !Array.isArray(input.topicArticles) || typeof input.now!=='string' || !path.isAbsolute(stagingDirectory||'')) fail('INVALID_ARGUMENT');
  if(!Number.isFinite(Date.parse(input.now)) || input.topicArticles.length!==2 ||
     new Set(input.topicArticles.map(group=>group?.slug)).size!==2 ||
     !input.topicArticles.every(group=>['fde','ai-video'].includes(group?.slug) && Array.isArray(group.items))) fail('INVALID_ARGUMENT');
  // Reapply the allowlist at the storage boundary as well as at collection.
  const clean={now:new Date(input.now).toISOString(),events:input.events.map(party),latest:input.latest.map(topic),hot:input.hot.map(topic),
    topicArticles:input.topicArticles.map(group=>({slug:group.slug,items:group.items.map(topic)}))};
  const serialized=JSON.stringify(clean);
  if(Buffer.byteLength(serialized)>4*1024*1024) fail('INPUT_TOO_LARGE');
  await mkdir(stagingDirectory,{recursive:true,mode:0o700});
  const target=path.join(stagingDirectory,'mcp-input.json');
  const temporary=path.join(stagingDirectory,`.mcp-${randomUUID()}.tmp`);
  try {
    const file=await open(temporary,'wx',0o600);
    try { await file.writeFile(serialized,'utf8'); } finally { await file.close(); }
    await rename(temporary,target);
  } catch { fail('STAGING_FAILED'); }
  finally { await unlink(temporary).catch(()=>{}); }
  return target;
}
