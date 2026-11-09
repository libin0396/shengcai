/* 本机搜索：仅使用已公开案例标题与同源快照，不上传查询。 */
(function(root){
  'use strict';
  var groups=[
    {id:'video',words:['短剧','短视频','视频','影视','动画','剪辑','分镜','拍片'],topics:['video'],sim:'video',title:'AI 视频定制',note:'体验视频定制接单，并非短剧制作教程'},
    {id:'miniapp',words:['小程序','微信小程序','miniapp'],topics:['miniapp'],sim:'miniapp',title:'AI 小程序副业',note:'体验从需求到上线推广'},
    {id:'slides',words:['课件','教案','ppt','教学资料','教育资料'],topics:['education-ppt'],sim:'education-ppt',title:'小红书教育 PPT',note:'体验教育资料的制作与检查'},
    {id:'agent',words:['agent','智能体','工作流','第二大脑','知识库'],topics:['agent'],sim:'brain',title:'AI 第二大脑',note:'体验整理素材与内容流程'},
    {id:'traffic',words:['获客','引流','找客户'],topics:['fde'],sim:null},
    {id:'overseas',words:['海外','出海','热词','游戏站','独立站'],topics:['overseas'],sim:'trends',title:'海外热词游戏站',note:'体验海外网站项目关键环节'}
  ];
  var simPaths={video:'/static/simulation-games/video.html',miniapp:'/static/simulation-games/miniapp.html','education-ppt':'/static/simulation-games/education-ppt.html',brain:'/static/simulation-games/voyage-lab.html?project=brain',trends:'/static/simulation-games/voyage-lab.html?project=trends'};
  var ai=/\b(?:ai|gpt|claude|codex|cursor|gemini|grok|agent|fde|mcp|llm)\b|人工智能|智能体|大模型|豆包|可灵|即梦|seedance|deepseek|comfyui/i;
  var excluded=/线下组局|同城(?:聚会|活动)|线下(?:活动|聚会|沙龙|大会|大课)|(?:活动|大会|沙龙|聚会).{0,12}(?:报名|招募|开启|通知)|破解|绕过.{0,6}(?:限制|收费|封禁)|白嫖|薅羊毛/i;
  // 不在搜索结果中暴露金额；不能可靠识别的收益标题直接略过。
  var earningsNumber=/(?:收入|变现|利润|收益|净收|签单|业绩|gmv|销售额|营收|流水|回款|月入|年入|日入|奖金|稿费|分红|到账|赚).{0,8}[\d零一二两三四五六七八九十百千万亿几数]|[\d零一二两三四五六七八九十百千万亿]+\s*(?:万|元|美元|美金|大洋|块钱|块|刀|[wk]).{0,5}(?:收入|变现|利润|收益|签单|营收|到账|赚)|(?:拿到|获得|赢得|领取).{0,4}(?:[¥￥$]\s*)?\d+\s*(?:美元|美金|大洋|元|块钱|块|刀)/i;
  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
  function groupFor(q){q=norm(q);return groups.filter(function(g){return g.words.some(function(w){return q.indexOf(norm(w))>=0})})}
  function search(query,feed,cases){
    var q=norm(query);if(!q)return {cases:[],simulation:null,isShortDrama:false};
    var hits=groupFor(q),words=[];hits.forEach(function(g){g.words.forEach(function(w){if(q.indexOf(norm(w))>=0&&words.indexOf(norm(w))<0)words.push(norm(w))})});
    if(q.length>=2&&words.indexOf(q)<0)words.push(q);
    var rows=[],seen={};
    (Array.isArray(cases)?cases:[]).forEach(function(c){
      if(!c||!/^\d{1,30}$/.test(String(c.id))||!c.title)return;
      var title=String(c.title),direct=words.some(function(w){return norm(title).indexOf(w)>=0});
      var related=hits.some(function(g){return (c.topics||[]).some(function(t){return g.topics.indexOf(t)>=0})});
      if((direct||related)&&!seen[c.id]&&!earningsNumber.test(title)){
        seen[c.id]=1;rows.push({id:String(c.id),title:title,kind:'完整解读',direct:direct});
      }
    });
    (Array.isArray(feed)?feed:[]).forEach(function(a){
      if(!a||!/^\d{1,30}$/.test(String(a.id))||seen[a.id])return;
      var title=String(a.title||'').replace(/^标题\s*[：:]\s*/,'').trim();
      if(!title||title.length>240||!ai.test(title)||excluded.test(title)||earningsNumber.test(title))return;
      var direct=words.some(function(w){return norm(title).indexOf(w)>=0});
      if(direct){seen[a.id]=1;rows.push({id:String(a.id),title:title,kind:'帖子导读',direct:true})}
    });
    rows.sort(function(a,b){return Number(b.direct)-Number(a.direct)});
    var g=hits.filter(function(x){return !!x.sim})[0],simulation=g?{title:g.title,note:g.note,path:simPaths[g.sim]}:null;
    return {cases:rows.slice(0,8),simulation:simulation,isShortDrama:q.indexOf('短剧')>=0};
  }
  root.AINPEFindSearch={search:search};
})(typeof window==='undefined'?globalThis:window);
