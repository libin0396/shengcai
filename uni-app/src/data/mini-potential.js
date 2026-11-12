/* Interest exploration and locally self-reported learning progress only.
 * No storage, network, personal data, skill assessment or earnings prediction.
 */
export const potentialDisclaimer = '这是兴趣探索和自主学习记录，不是能力认证，也不能预测收益。所有教程都可自由选择。';
export const completionDisclaimer = '升级依据是在本机由你主动标记完成的教程步骤；系统无法核验你是否完成了实际操作。';

// Adjustable draft: cumulative distinct tutorials with all steps self-marked.
// These are growth stages and do not define tutorial difficulty or lock content.
export const defaultStageThresholds = Object.freeze([0, 1, 3, 5]);

const card = (id, name, stage, description, guideIds, nextId, aidIds=[]) => ({id,name,stage,description,guideIds,aidIds,nextId});
export const potentialCards = [
  card('plan','AI小管家',1,'你想从整理任务和想法开始。',['meeting-notes'],'structured'),
  card('record','AI划重点',1,'你想把零散信息整理出重点。',['meeting-notes'],'structured'),
  card('message','AI嘴替',1,'你想试试把自己的想法说清楚。',[],'communication',['reply']),
  card('narrator','AI讲故事',1,'你想试试把想法组织成故事。',['video-script'],'content'),
  card('notes','AI分享家',1,'你想把亲身经历整理成文字。',['content-notes'],'content'),
  card('visual','AI小画家',1,'你想试试把想法变成一张图。',['product-poster'],'visual_explore'),
  card('movie','AI小导演',1,'你对画面、镜头和短片感兴趣。',['short-drama'],'story'),
  card('child','AI故事伴',1,'你想用故事和家人一起探索。',['huiben'],'education'),
  card('lesson','AI课代表',1,'你想把学习内容讲得更清楚。',['kejian'],'education'),
  card('curious','AI尝鲜官',1,'你想从一个小练习开始探索。',['huiben','meeting-notes'],'structured'),
  card('structured','AI整理家',2,'你正在尝试整理信息、梳理步骤。',['meeting-notes'],'structure_path'),
  card('communication','AI表达家',2,'你正在尝试用文字表达想法。',[],'expression_path',['reply']),
  card('content','AI创作家',2,'你正在尝试把想法整理成内容。',['video-script','content-notes'],'expression_path'),
  card('visual_explore','AI画手',2,'你正在尝试制作和检查画面。',['product-poster'],'visual_path'),
  card('story','AI拍片家',2,'你正在探索用镜头表达故事。',['short-drama','video-script'],'visual_path'),
  card('education','AI陪学家',2,'你正在探索有助于学习和讲解的作品。',['kejian','huiben'],'learning_path'),
  card('structure_path','AI归纳家',3,'你持续探索整理信息的方法。',['meeting-notes'],'structure_journey'),
  card('expression_path','AI文字家',3,'你持续探索文字和内容表达。',['content-notes','video-script'],'expression_journey'),
  card('visual_path','AI影像家',3,'你持续探索图片和视频制作。',['product-poster','short-drama'],'visual_journey'),
  card('learning_path','AI学习家',3,'你持续探索学习材料和故事创作。',['kejian','huiben'],'learning_journey'),
  card('structure_journey','AI大管家',4,'你已留下多篇教程的自主完成记录，可以继续探索整理方法。',['meeting-notes'],null),
  card('expression_journey','AI表达官',4,'你已留下多篇教程的自主完成记录，可以继续探索内容表达。',['video-script','content-notes'],null),
  card('visual_journey','AI创意官',4,'你已留下多篇教程的自主完成记录，可以继续探索画面创作。',['short-drama','product-poster'],null),
  card('learning_journey','AI共学官',4,'你已留下多篇教程的自主完成记录，可以继续探索学习作品。',['kejian','huiben'],null)
];

const option = (id, text, type) => ({id,text,type});
export const potentialQuestions = [
  {id:'start', prompt:'现在想让 AI 帮你做哪件小事？', options:[
    option('a','整理今天要做的事','plan'),option('b','把一条消息写清楚','message'),option('c','试着做一张图片','visual'),option('d','和孩子编个小故事','child')]},
  {id:'help', prompt:'面对一份新任务，你更想先得到什么？', options:[
    option('a','把重点整理出来','record'),option('b','把想法变成一段故事','narrator'),option('c','把内容变成一份课件','lesson'),option('d','看看故事可以拍成什么样','movie')]},
  {id:'choose', prompt:'下面哪一件事更吸引你试一试？', options:[
    option('a','把自己的经历写成一篇笔记','notes'),option('b','先做一个小练习熟悉 AI','curious'),option('c','列一个清晰的待办清单','plan'),option('d','给孩子做一个绘本','child')]},
  {id:'outcome', prompt:'做完后，你最想得到哪种结果？', options:[
    option('a','一段适合发送的文字','message'),option('b','一份能看懂的会议纪要','record'),option('c','一张经过检查的宣传图','visual'),option('d','一份讲解清楚的学习材料','lesson')]},
  {id:'next', prompt:'如果只能先选一件，你现在最想从哪里开始？', options:[
    option('a','整理一个视频脚本','narrator'),option('b','写一篇分享笔记','notes'),option('c','尝试制作短片','movie'),option('d','挑一篇入门教程先试试','curious')]}
];

function choicesOf(answers) {
  const input=answers && typeof answers==='object' && !Array.isArray(answers) ? answers : {};
  return potentialQuestions.map(q=>q.options.find(o=>o.id===input[q.id])||null);
}

/** Returns a stage-1 card for every fully answered test; no judgement is made. */
export function evaluatePotential(answers) {
  const choices=choicesOf(answers), answeredCount=choices.filter(Boolean).length;
  if(answeredCount!==potentialQuestions.length) return {status:'incomplete',answeredCount,total:potentialQuestions.length};
  const counts=Object.create(null);
  choices.forEach(choice=>{counts[choice.type]=(counts[choice.type]||0)+1});
  const highest=Math.max(...Object.values(counts));
  // Resolve a tie by the user's latest relevant choice, not by an invented score.
  const type=[...choices].reverse().find(choice=>counts[choice.type]===highest).type;
  return {status:'complete',answeredCount,total:potentialQuestions.length,card:potentialCards.find(x=>x.stage===1&&x.id===type)};
}

/** Count only real tutorial IDs whose every step was actively self-marked. */
export function completedTutorialIds(progress, guides) {
  const records=progress && typeof progress==='object' && !Array.isArray(progress)?progress:{};
  const complete=new Set();
  for(const guide of Array.isArray(guides)?guides:[]){
    if(!guide||typeof guide.id!=='string'||!Array.isArray(guide.steps)||!guide.steps.length) continue;
    const steps=records[guide.id]?.completedSteps;
    if(!Array.isArray(steps)) continue;
    const marked=new Set(steps.filter(i=>Number.isInteger(i)&&i>=0&&i<guide.steps.length));
    if(marked.size===guide.steps.length) complete.add(guide.id);
  }
  return [...complete];
}

/** Current card is derived from test result and cumulative local self-marks. */
export function resolvePotentialProgress(answers, progress, guides, thresholds=defaultStageThresholds) {
  const result=evaluatePotential(answers);
  if(result.status!=='complete') return result;
  if(!Array.isArray(thresholds)||thresholds.length!==4||thresholds[0]!==0||thresholds.some((n,i)=>!Number.isInteger(n)||n<0||(i>0&&n<=thresholds[i-1]))) throw new TypeError('invalid stage thresholds');
  const completedIds=completedTutorialIds(progress,guides);
  let stage=1;
  while(stage<4&&completedIds.length>=thresholds[stage]) stage++;
  let current=result.card;
  for(let nextStage=2;nextStage<=stage;nextStage++){
    current=potentialCards.find(x=>x.stage===nextStage&&x.id===current.nextId);
    if(!current) throw new Error('missing potential card path');
  }
  return {status:'complete',initialCard:result.card,card:current,stage,completedCount:completedIds.length,completedIds,nextThreshold:stage<4?thresholds[stage]:null};
}
