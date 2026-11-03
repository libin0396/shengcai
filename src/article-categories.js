// Titles provide the clearest signal of an article's subject. A mention in
// a short source summary can instead be an author's biography or an aside.
const AI_TERMS = /(?:^|[^a-z])ai(?=$|[^a-z]|ppt|agent|video)|人工智能|智能体|大模型|大语言模型|生成式|AIGC|GPT|Claude|Codex|Gemini|Grok|Cursor|Copilot|OpenAI|DeepSeek|豆包|通义千问|文心一言|(?:^|[^a-z])(?:FDE|Agent|MCP|LLM)(?=$|[^a-z])|智能助手|workbuddy|seedance|comfyui|minimax|多模型(?:协作|编排|调用|切换)/i;
const AI_IN_USE = /(?:用|使用|借助|通过|基于|利用|靠|运用|采用|接入|调用|集成|搭建|开发|构建|制作|生成|驱动|训练).{0,10}(?:AI|人工智能|智能体|大模型|AIGC|GPT|Claude|Codex|Gemini|Grok|Cursor|Copilot|DeepSeek|豆包|Agent|MCP|LLM|workbuddy|seedance|comfyui|minimax)|(?:AI|人工智能|智能体|大模型|AIGC|GPT|Claude|Codex|Gemini|Grok|Cursor|Copilot|DeepSeek|豆包|Agent|MCP|LLM|workbuddy|seedance|comfyui|minimax).{0,10}(?:做|开发|制作|生成|搭建|构建|驱动|编程|应用|训练|部署|协作)/i;
const SUBJECTS = [
  /小程序/i, /视频|短剧|影视/i, /工作流/i, /智能体|agent/i,
  /模型/i, /编程|代码/i, /知识库/i, /图片|绘画|生图/i,
  /获客/i, /工作台/i, /翻译/i, /工具|插件/i,
];

export function isAiArticle(article){
  const title=String(article.title||'');
  if(AI_TERMS.test(title))return true;
  // Require an actual use of AI and a subject shared with the headline.
  const details=[article.overview,article.summary,article.description].filter(Boolean).join(' ');
  if(!AI_TERMS.test(details))return false;
  if(/skills?/i.test(title)&&/agent\s*skills?/i.test(details))return true;
  return AI_IN_USE.test(details)&&SUBJECTS.some(subject=>subject.test(title)&&subject.test(details));
}

export function matchesAiCategory(article,category){
  if(category==='all')return true;
  const title=String(article.title||'');
  if(category==='cases')return article.kind==='案例'||/案例|复盘|实战/.test(title);
  if(category==='tools')return article.kind==='教程'||/教程|工具|插件|技能|skills?|提示词|工作流|手册|SOP|指南|实操课|实训|配置|安装|开通/i.test(title);
  if(category==='content')return /视频|短剧|自媒体|图文|生图|创作|内容创业|文案|直播|动画|剪辑|影视/i.test(title);
  if(category==='development')return /(?:^|[^a-z])fde(?=$|[^a-z])|开发|编程|代码|程序|产品化|部署|自研系统|(?:搭建|构建|开发).{0,10}系统/i.test(title);
  return false;
}
