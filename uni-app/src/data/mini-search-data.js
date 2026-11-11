// Search and classifications are evaluated entirely on the device.
export const aidTopics={notice:['生活','工作'],reply:['生活','工作'],summary:['工作','学习'],homework:['学习'],menu:['生活'],meeting:['工作'],excel:['工作'],trip:['生活'],caption:['内容创作'],learnai:['AI入门']};
export const aidKeywords={
  notice:['通知','合同','看不懂','文件','公告','说明书','协议','条款'],
  reply:['消息','请假','催款','拒绝','回复','回消息','微信消息','开口','道歉','借钱'],
  summary:['文章','长文','总结','太长','重点','没空看','概括'],
  homework:['作业','题目','做题','试题','辅导','数学题','语文题','英语题','不会讲','讲题','孩子学习'],
  menu:['吃什么','菜单','买菜','炒菜','做菜','晚饭','做饭','冰箱','菜谱','食谱','早餐','午饭'],
  meeting:['会议','纪要','开会','会议记录','会议笔记'],
  excel:['表格','公式','excel','数据','wps','统计'],
  trip:['去哪玩','出去玩','周末','旅游','出游','带娃','攻略','行程','景点'],
  caption:['朋友圈','文案','配文','配一句','照片','小红书'],
  learnai:['第一次用','不会用ai','不会用豆包','新手用ai','怎么用ai','问什么']
};
export const topics=['全部','生活','工作','学习','内容创作','AI入门'];
export const normalized=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
export function matchAids(raw,aids){
  const q=normalized(raw); if(!q)return [];
  const specialized=/短剧|视频|小程序|课件|绘本|分镜|智能体|工作流/.test(q);
  return aids.map(a=>{
    if(specialized&&(a.id==='learnai'||(a.id==='caption'&&!/朋友圈|配文/.test(q))))return {a,score:0};
    const words=aidKeywords[a.id]||[];
    let score=words.reduce((n,w)=>n+(q.includes(normalized(w))?normalized(w).length:0),0);
    if(q.length>=2&&normalized(a.title+a.when).includes(q))score+=q.length;
    return {a,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.a);
}
export function matchGuides(raw,guides){
  const q=normalized(raw); if(!q)return [];
  const generic=['笔记','图文','生图'];
  const ranked=includeGeneric=>guides.map(g=>{
    const words=(g.keywords||[]).map(normalized).filter(w=>w&&(includeGeneric||!generic.includes(w))&&q.includes(w));
    let score=words.reduce((n,w)=>Math.max(n,w.length),0);
    if(q.length>=2&&normalized(g.title).includes(q))score=Math.max(score,q.length);
    return {g,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.g);
  const strong=ranked(false);return strong.length?strong:ranked(true);
}
