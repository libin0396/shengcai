// Only offer a direct match when the title names the corresponding project.
export function matchArticleGame(article) {
  const t=String(article?.title || '');
  if(/线下|聚会|组局|小局|大会|沙龙|夜话|活动/i.test(t)) return null;
  if(/(?:教育|小红书).*(?:ppt|课件|资料)|(?:ppt|课件).*(?:教育|小红书)/i.test(t)) return {name:'小红书教育 PPT',file:'education-ppt'};
  if(/(?:热词|海外).*(?:游戏站|网站|建站|独立站)|游戏站.*(?:热词|海外)/i.test(t)) return {name:'海外热词游戏站',file:'trends'};
  if(/第二大脑|素材库.*内容|内容.*(?:工作流|知识库)/i.test(t)) return {name:'AI 第二大脑',file:'brain'};
  if(/(?:视频|图书|短视频).*(?:带货|挂车)|(?:带货).*(?:视频|图书)/i.test(t)) return {name:'AI 视频带货',file:'books'};
  if(/小程序|mini.?app/i.test(t)) return {name:'AI 小程序副业',file:'miniapp'};
  if(/(?:视频|短视频).*(?:定制|接单|客户|交付)|(?:定制|接单).*(?:视频|短视频)/i.test(t)) return {name:'AI 视频定制',file:'video'};
  return null;
}
export function simulationUrl(file) {
  if(['miniapp','video','education-ppt'].includes(file))return `/static/simulation-games/${file}.html`;
  if(['books','brain','trends'].includes(file))return `/static/simulation-games/voyage-lab.html?project=${file}`;
  return '';
}

// 游戏地址只能进入本站已发布的模拟项目，参数由相应游戏自行处理。
export function isGamePath(path) {
  return /^\/static\/simulation-games\/(?:miniapp|video|education-ppt|voyage-lab)\.html(?:\?[^#]*)?$/.test(String(path || ''));
}
// Learning pages also use a fixed allowlist; do not permit arbitrary web-view destinations.
export function isLearnPath(path) {
  return /^\/static\/learn\/(?:index|kejian|huiben|jijiu|find|guides|guide|home|meiri-ai|xue-ai|wode|zuo)\.html(?:\?[^#]*)?$/.test(String(path || ''));
}
export function openGame(path) {
  const p=String(path||'');
  if(!isGamePath(p) && !isLearnPath(p)) return false;
  // #ifdef H5
  window.location.href=p;return true;
  // #endif
  // #ifndef H5
  uni.navigateTo({url:'/pages/simulate/play?u='+encodeURIComponent(p)});return true;
  // #endif
}

export function openLearn(page='index.html') {
  const p='/static/learn/'+String(page || 'index.html');
  return isLearnPath(p) && openGame(p);
}
