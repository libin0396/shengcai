import {isAiArticle} from './article-categories.js';

// This is an intentionally conservative discovery filter, not a statement
// that an author's claims have been verified. The four reviewed cases are
// supplied separately and never depend on these heuristics.
const EXCLUDED = /白嫖|薅羊毛|反代|绕过(?:限制|审核|封禁|付费)|破解|绕过.{0,6}收费/i;
// 原帖完整流程经核对后不适合推荐；标题和搜索摘要本身无法体现这些细节。
const EXCLUDED_IDS = new Set(['82258452224185212']);
const NON_CASE_TITLE = /线下组局|组了(?:个)?小局|同城(?:聚会|活动|沙龙)|线下(?:活动|聚会|沙龙|大会|大课)|项目沙龙|(?:航海家|FDE)大会|(?:活动|大会|沙龙|聚会|深海圈).{0,12}(?:报名|招募|开启|启动|通知)|(?:求|招募|招聘|寻找).{0,40}(?:私聊|合作|人才|方案|老师|讲师)|(?:可|欢迎|请|加我|有意).{0,6}私聊|圈友谁在|这期航海.{0,12}(?:笑了|吐槽)|(?:吐槽|争议|公告|通知|白皮书|订阅支付|代充)|(?:体感|质量).{0,18}(?:速度|太慢|太快)/i;
const PROMOTION_TITLE = /^(?:标题\s*[：:]\s*)?(?:(?:我|我们)?(?:做了|开发了|上线了|搭建了).{0,22}(?:网站|工具|系统|产品).{0,24}(?:分享|试用|思路|欢迎)|(?:分享|推荐)个?.{0,25}(?:系统|工具|网站))/i;
const CASE_SIGNAL = /复盘|实战|实操|案例|经历|经验|过程|总结|踩坑|落地|交付|接单|获客|带货|变现|收入|赚|营收|利润|订单|用户|播放|涨粉|曝光|增长|成交|上线|上架|获奖|心得|清单|小抄|工作流|(?:我|我们|有人).{0,12}(?:用|做|开发|搭建|制作|尝试|完成|跑通)|(?:用|借助|通过|利用|靠).{0,20}(?:AI|人工智能|大模型|智能体|GPT|Claude|Codex|Agent|FDE)/i;

export function isCaseLibraryItem(article){
  if(!article || typeof article!=='object' || EXCLUDED_IDS.has(String(article.id)) || !isAiArticle(article))return false;
  const title=String(article.title||'').trim();
  if(!title)return false;
  const text=[title,article.overview,article.summary,article.description].filter(Boolean).join(' ');
  if(EXCLUDED.test(text) || NON_CASE_TITLE.test(title) || PROMOTION_TITLE.test(title))return false;
  // Source `kind` is not a reliable quality label: require a concrete signal
  // in the headline rather than promoting every self-labelled post.
  return CASE_SIGNAL.test(title);
}

export function cleanCaseTitle(value){
  return String(value||'').trim().replace(/^标题\s*[：:]\s*/,'');
}

export function shortCaseSummary(value){
  const text=String(value||'').trim().replace(/^标题\s*[：:]\s*/,'');
  if(!text)return '当前资料不足，暂无法展示摘要。';
  return /[。！？.!?…]$/.test(text) ? text : `${text}…`;
}

// Recommend only reviewed cases, keeping editorial selections first.
// Broad tags alone cannot turn unrelated cases into recommendations.
export function relatedReviewedCases(study,cases,limit=3){
  if(!study || !Array.isArray(cases) || !Number.isInteger(limit) || limit<=0)return [];
  const current=String(study.id||'');
  const candidates=cases.filter(c=>c && typeof c.id==='string' && c.id!==current);
  const byId=new Map(candidates.map(c=>[c.id,c]));
  const seen=new Set([current]),result=[];
  for(const id of Array.isArray(study.related)?study.related:[]){
    const c=byId.get(id);
    if(c && !seen.has(c.id)){result.push(c);seen.add(c.id);if(result.length===limit)return result;}
  }
  const broad=new Set(['ai','content','community']);
  const topics=new Set((Array.isArray(study.topics)?study.topics:[]).filter(t=>typeof t==='string'&&!broad.has(t)));
  const ranked=candidates.filter(c=>!seen.has(c.id)).map(c=>{
    const sameCategory=!!study.category && c.category===study.category;
    const shared=new Set((Array.isArray(c.topics)?c.topics:[]).filter(t=>topics.has(t)));
    return {case:c,score:(sameCategory?3:0)+shared.size};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(Number(b.case.publishedAt)||0)-(Number(a.case.publishedAt)||0)||a.case.id.localeCompare(b.case.id));
  for(const {case:c} of ranked){if(!seen.has(c.id)){result.push(c);seen.add(c.id);if(result.length===limit)break;}}
  return result;
}
