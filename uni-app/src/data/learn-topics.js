// 「学」的专题与「我想用 AI……」分类。分类只在本地做，统计里只记类别，不上传原文。
export const learnTopics = [
  { id: 'kejian', em: '📚', name: 'AI 课件和资料', desc: '做一节课的课件，自己用或给孩子用', live: true, page: 'kejian.html' },
  { id: 'huiben', em: '🐢', name: '和孩子一起做绘本', desc: '孩子出主意，你和 AI 一起画', live: true, page: 'huiben.html' },
  { id: 'video', em: '🎬', name: 'AI 故事短片', short: '故事短片', desc: '一分钟的小故事视频' },
  { id: 'novel', em: '✍️', name: 'AI 写小说', short: '写小说', desc: '从一个点子写出第一章' },
  { id: 'tuwen', em: '📝', name: 'AI 图文号', short: '图文号', desc: '做一个持续更新的图文账号' },
  { id: 'assistant', em: '🤖', name: '你自己的 AI 助手', short: 'AI 助手', desc: '把常做的事交给它' },
];
const WANT = [
  ['kejian', /课件|PPT|ppt|教案|上课|老师|备课|讲课|资料|试卷|练习题|学案/],
  ['huiben', /绘本|故事|童话|睡前|孩子|小孩|宝宝|儿子|女儿|亲子|作文/],
  ['video', /视频|短片|短剧|剪辑|动画|抖音|视频号|vlog/i],
  ['novel', /小说|网文|写书|剧本/],
  ['tuwen', /小红书|图文|文案|公众号|朋友圈|笔记|标题/],
  ['assistant', /助手|智能体|agent|自动|表格|Excel|excel|工作|总结|会议|周报|邮件/i],
  ['money', /赚钱|副业|变现|收入|搞钱|接单/],
];
export function classifyWant(text) { const t = String(text || ''); for (const [k, re] of WANT) if (re.test(t)) return k; return 'other'; }
