
const projects={
  books:{name:'AI 视频带货',source:'生财有术《AI 视频带货》2026 年 8 月航海',lead:'从账号、选品到发布复盘，模拟经营一个 AI 图书带货账号。',path:['账号准备','挑选商品','制作视频','发布测试','复盘调整'],start:{label:'你的账号面向谁？',placeholder:'例如：想提升表达能力的职场新人'},checks:[{title:'先选一个能清楚说出受众的商品',options:[['选择一本能解决明确问题的书',0,'选品清晰，更容易判断观众是否需要。'],['只看佣金，不看是否适合读者',-550,'佣金并不能替代需求；先确认受众和商品的匹配。'],['换三个不相关品类一起做',-400,'方向太散，不利于看清哪类内容有效。']]},{title:'制作第一条视频，先完成哪一步？',options:[['先写清问题和商品相关卖点，再做画面',0,'先让内容和商品产生联系，再设计画面。'],['大量生成画面，上线后再找卖点',-500,'没有围绕需求组织内容，可能只收获播放。'],['直接照搬夸大的效果承诺',-900,'缺乏依据的承诺会伤害信任，也有平台风险。']]},{title:'发布一段时间后，播放不错但点击偏少，你会？',options:[['检查内容与商品是否匹配，再调整呈现',0,'先对照播放与点击，找到可能的断点。'],['马上扩大预算，不看数据',-650,'流量未转化时先加预算，可能扩大损失。'],['什么也不看，连续发布同样内容',-400,'没有复盘就很难知道问题发生在哪里。']]}],exercise:{title:'亲手写一条视频开头',label:'用一句话说出读者遇到的问题',placeholder:'例如：每天忙到很晚，却总觉得时间不够用？',min:8},result:'检查：是否说清受众、问题与商品之间的联系？'},
  brain:{name:'AI 第二大脑 · 内容创作',source:'生财有术《AI 第二大脑 - 内容创作系统》2026 年 8 月航海',lead:'从确定方向到整理素材、形成选题，模拟搭建一个内容创作工作流。',path:['定位','搜集素材','提炼规律','创作内容','发布复盘'],start:{label:'你想长期帮助哪类读者？',placeholder:'例如：刚开始使用 AI 的个体经营者'},checks:[{title:'给素材库挑一个组织方式',options:[['按主题保存，并标明来源与用途',0,'以后能按主题找到素材，也更容易核对来源。'],['所有内容堆在一个文件里',-350,'素材难以检索，长期复用成本会上升。'],['只收集热门内容，不记录出处',-550,'缺少来源容易丢失上下文，也不利于核实。']]},{title:'准备第一批选题时，你会？',options:[['从读者的问题和已有素材中提出具体选题',0,'将读者问题和现有素材结合，更容易写出可用内容。'],['让 AI 随便写十个标题，不检查内容',-450,'没有核实需求和素材，选题容易空泛。'],['只围绕自己想说的，不考虑读者',-350,'观点可能有价值，但读者不一定能理解为什么要看。']]},{title:'一篇内容发布后反响平平，下一步？',options:[['回看选题、表达与反馈，调整下一篇',0,'保留可观察的信息，便于逐轮改进。'],['不分析原因，重新换所有方向',-400,'方向频繁变化会让你难以判断改进是否有效。'],['复制未经核验的热门案例充数',-700,'未经核验的内容可能误导读者。']]}],exercise:{title:'动手写一个具体选题',label:'写清楚：帮谁解决什么问题',placeholder:'例如：新手怎样整理每天收到的 AI 信息？',min:8},result:'检查：这条选题是否写明读者、问题和能够采取的行动？'},
  trends:{name:'AI 热词游戏站',source:'生财有术《AI 产品（国外-热词游戏站）》2026 年 8 月航海',lead:'从判断热词到搭建页面、查看数据，模拟做一个面向海外用户的项目站。',path:['判断热词','调研需求','规划页面','搭建上线','观察数据'],start:{label:'你想帮游戏玩家解决什么问题？',placeholder:'例如：帮新手找到常见关卡攻略'},checks:[{title:'发现一个游戏热词，接下来怎么做？',options:[['先查看玩家具体在搜什么，再评估需求',0,'先确认用户问题，有助于决定页面该做什么。'],['只看热度立刻购买多个域名',-600,'没确认需求和投入，可能在早期增加不必要成本。'],['完全复制其他网站页面',-900,'重复内容缺乏独立价值，也可能侵犯权利。']]},{title:'准备网站内容，哪个做法更可靠？',options:[['围绕一个具体问题组织页面，并核对资料',0,'页面目的清楚，内容也更容易检查。'],['用 AI 一次生成大量未经核对的页面',-650,'错误与重复内容会降低用户信任。'],['首页只放广告，没有实用信息',-700,'用户得不到帮助，很难继续使用。']]},{title:'上线后发现访问少，你会？',options:[['检查页面是否可访问、内容是否回答问题，再看数据',0,'先排查基础问题，再决定如何优化。'],['立刻追加广告和付费工具',-500,'问题未确定前持续投入，可能增加成本。'],['不看数据，认为站点已经失败',-350,'缺少信息时不容易判断是否需要调整。']]}],exercise:{title:'亲手规划一个页面',label:'写下页面要解决的一个具体问题',placeholder:'例如：新手如何通过第一关？',min:6},result:'检查：页面是否只解决一个清晰的问题，用户能否找到答案？'}
};
const key=new URLSearchParams(location.search).get('project');const P=projects[key];const app=document.getElementById('app');let step=0,choice=[null,null,null],audience='',draft='',work={};
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function begin(){step=1;render();window.scrollTo(0,0)}
const samples=[
  '模拟访谈 A：一位新手说，每天保存许多 AI 信息，却找不到上周看过的内容。',
  '模拟观察 B：一位创作者把资料按主题整理，并记录出处，写稿时更容易回查。',
  '模拟记录 C：一个团队发现，只有收藏没有自己的观点，选题时仍需重新整理。'
];
const trendExamples=['新手关卡攻略','每日文字谜题玩法','游戏角色培养指南'];
function field(name,label,placeholder,kind){const value=esc(work[name]||'');return '<div class="field"><label for="w-'+name+'">'+label+'</label>'+(kind==='textarea'?'<textarea id="w-'+name+'" data-work="'+name+'" maxlength="300" placeholder="'+placeholder+'">'+value+'</textarea>':'<input id="w-'+name+'" data-work="'+name+'" maxlength="160" value="'+value+'" placeholder="'+placeholder+'">')+'</div>'}
function previewValue(value){return (value||'').trim()||'（待填写）'}
function composeDraft(){
 if(key==='books')return '面向：'+previewValue(audience)+'\n开场：'+previewValue(work.opening)+'\n商品卖点：'+previewValue(work.selling)+'\n行动提示：'+previewValue(work.action);
 if(key==='brain')return '目标读者：'+previewValue(audience)+'\n'+samples.map((_,i)=>'素材 '+(i+1)+'｜来源：'+previewValue(work['source'+i])+'｜主题：'+previewValue(work['theme'+i])+'\n可复用观点：'+previewValue(work['insight'+i])).join('\n')+'\n选题：'+previewValue(work.topic);
 return '示例方向：'+previewValue(work.trend)+'\n目标用户问题：'+previewValue(audience)+'\n英文标题：'+previewValue(work.pageTitle)+'\n英文描述：'+previewValue(work.pageDescription);
}
function captureWork(){document.querySelectorAll('[data-work]').forEach(el=>{work[el.dataset.work]=el.value})}
function workspaceMarkup(){
 let html='<p>根据下面的模拟素材完成草稿；内容只在当前页面使用，不会真实发布或提交。</p>';
 if(key==='books'){
   html+='<div class="hint"><strong>模拟商品卡 · 时间管理入门书</strong><br>示例受众：想安排好工作与生活的上班族。示例卖点：书中提供可填写的每日计划模板。此卡为本站虚构素材，不代表真实商品或效果。</div>';
   html+=field('opening','开场：说出观众遇到的问题','例如：每天忙到很晚，却总觉得时间不够用？','textarea');
   html+=field('selling','卖点：介绍一个与问题相关的内容','例如：这本书里有一页能直接填写的每日计划模板。','textarea');
   html+=field('action','行动提示：邀请观众做什么','例如：想了解更多，可以先看看书籍介绍。','textarea');
 }else if(key==='brain'){
   html+='<div class="hint">以下三条均为本站虚构的模拟素材，请为每条记录来源、主题和可复用观点。</div>';
   samples.forEach((sample,i)=>{html+='<div class="box" style="margin-top:16px;padding:16px"><strong>素材 '+(i+1)+'</strong><p>'+sample+'</p>'+field('source'+i,'来源','例如：模拟访谈 A')+field('theme'+i,'主题','例如：信息整理')+field('insight'+i,'可复用观点','例如：记录出处方便以后核对','textarea')+'</div>'});
   html+=field('topic','从上面的素材写一个具体选题','例如：新手怎样整理每天收到的 AI 信息？','textarea');
 }else{
   html+='<div class="hint">下面是本站虚构的三个方向，仅用于练习，不含真实热度、搜索量或收入数据。</div><div class="field"><label for="w-trend">选择一个模拟方向</label><select id="w-trend" data-work="trend" style="display:block;width:100%;padding:12px;border:1px solid #c9d8ca;border-radius:7px;font:inherit;margin-top:10px"><option value="">请选择</option>'+trendExamples.map(x=>'<option value="'+esc(x)+'"'+(work.trend===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div>';
   html+=field('pageTitle','英文页面标题','例如：Beginner Guide to Daily Word Puzzles');
   html+=field('pageDescription','英文页面描述','例如：Find simple tips to understand and enjoy daily word puzzles.','textarea');
 }
 if(key==='trends')html+='<div class="box" style="background:#fff;padding:16px;overflow-wrap:anywhere"><strong>搜索结果样式预览（模拟）</strong><p style="font-size:13px;color:#546e5b;margin:14px 0 3px">example.com › guide · 示例地址</p><div id="preview-title" style="color:#2454a5;font-size:20px;line-height:1.35"></div><p id="preview-description" style="font-size:14px;line-height:1.5;margin:6px 0 0;color:#495b50"></p></div>';
 else html+='<div class="box" style="background:#f6faf3;padding:16px"><strong>草稿预览</strong><pre id="work-preview" style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.7;color:#365842;margin-bottom:0"></pre></div>';
 return html;
}
function requiredWork(){if(key==='books')return ['opening','selling','action'];if(key==='brain')return ['source0','theme0','insight0','source1','theme1','insight1','source2','theme2','insight2','topic'];return ['trend','pageTitle','pageDescription']}
function attachWork(){function update(){captureWork();if(key==='trends'){document.getElementById('preview-title').textContent=previewValue(work.pageTitle);document.getElementById('preview-description').textContent=previewValue(work.pageDescription)}else document.getElementById('work-preview').textContent=composeDraft()}document.querySelectorAll('[data-work]').forEach(el=>{el.addEventListener('input',update);el.addEventListener('change',update)});update()}
function render(){
 if(!P){app.innerHTML='<div class="box"><h1>项目暂不可用</h1><a href="/#/pages/simulate/index">返回项目列表</a></div>';return}
 document.title=P.name+' · AI 项目模拟';
 if(step===0){app.innerHTML='<div class="tag">项目体验 · 约 3–5 分钟</div><h1>'+P.name+'</h1><p>'+P.lead+'</p><div class="steps">'+P.path.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="box"><b>先从一个小任务开始</b><p>填写项目想法，处理三个关键环节，再完成一份可以复制的草稿。最后查看本局复盘。</p><p class="notice">项目步骤参考 '+P.source+'。模拟素材、客户、数值、扣减和结果均为游戏设定，不是作者真实收益或收入预测。</p><button class="action" id="start">开始体验 →</button></div>';document.getElementById('start').onclick=begin;return}
 if(step<=5){
  let percent=Math.round(step/5*100),content='';
  if(step===1)content='<h2>先确定你的起点</h2><p>一个具体对象能帮你把后面的操作串起来。</p><div class="field"><label for="answer">'+P.start.label+'</label><input id="answer" value="'+esc(audience)+'" placeholder="'+P.start.placeholder+'" maxlength="120"></div><div class="hint">仅在当前页面使用，不会提交或公开。</div>';
  else if(step<=4){let idx=step-2,C=P.checks[idx];content='<h2>'+C.title+'</h2><p>每个动作会影响本局的模拟结果；后面可以回到这一步重选。</p><div class="opts">'+C.options.map((x,i)=>'<button data-choice="'+i+'" class="'+(choice[idx]===i?'on':'')+'">'+x[0]+'</button>').join('')+'</div>'}
  else content='<h2>'+({books:'亲手写一条带货脚本',brain:'整理三条素材并写选题',trends:'制作一个搜索结果预览'}[key])+'</h2>'+workspaceMarkup();
  app.innerHTML='<div class="tag">'+P.name+' · 第 '+step+' / 5 步</div><div class="bar"><i style="width:'+percent+'%"></i></div><div class="box">'+content+'<p class="error" id="error" role="status"></p><div class="buttons"><button class="action alt" id="back">← 上一步</button><button class="action" id="next">'+(step===5?'查看本局复盘':'下一步 →')+'</button></div></div>';
  document.querySelectorAll('[data-choice]').forEach(el=>el.onclick=()=>{choice[step-2]=Number(el.dataset.choice);render()});
  if(step===5)attachWork();
  document.getElementById('back').onclick=()=>{if(step===1)audience=document.getElementById('answer').value;else if(step===5)captureWork();step--;render();window.scrollTo(0,0)};
  document.getElementById('next').onclick=()=>{
   if(step===1){audience=document.getElementById('answer').value.trim();if(!audience){document.getElementById('error').textContent='先填写你的想法，再继续。';return}}
   if(step>=2&&step<=4&&choice[step-2]===null){document.getElementById('error').textContent='先完成当前步骤，再继续。';return}
   if(step===5){captureWork();const missing=requiredWork().find(x=>!(work[x]||'').trim());if(missing){document.getElementById('error').textContent='请先填写各项内容，再查看复盘。';document.querySelector('[data-work="'+missing+'"]').focus();return}draft=composeDraft()}
   step++;render();window.scrollTo(0,0)
  };return
 }
 const sum=choice.reduce((n,i,j)=>n+P.checks[j].options[i][1],0),amount=Math.max(0,3000+sum);
 app.innerHTML='<div class="tag">项目复盘 · 模拟结果</div><h1>你的 '+P.name+' 体验报告</h1><div class="box"><span class="notice">游戏假设的起点 ¥3,000，依据本局选择扣减</span><div class="score">¥'+amount+'</div><p class="notice">这是人为设计的模拟数值，不是行业均值、实际收入或收益预测。草稿填写状态不影响这个数字。</p>'+choice.map((i,j)=>'<div class="feedback"><b>'+P.checks[j].options[i][0]+'</b><small>'+P.checks[j].options[i][2]+'（模拟 '+(P.checks[j].options[i][1]||0)+' 元）</small></div>').join('')+'<div class="feedback"><b>你完成的草稿</b><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;color:#536f5c">'+esc(draft)+'</pre><button class="action alt" id="copy-draft">复制草稿</button><p class="notice" id="copy-status" role="status"></p><textarea id="copy-fallback" aria-label="手动复制草稿" readonly hidden></textarea></div><div class="buttons"><button class="action alt" id="again">再来一次</button><a class="action alt" href="/#/pages/simulate/index">返回模拟项目</a></div><p class="notice">参考：'+P.source+'；本体验为 AINPE 独立设计，与官方课程或报名不等同。</p></div><div id="shareHost"></div><div class="box camp"><img src="/static/assets/ai-camp-poster.jpg" alt="三天体验营完整海报"><div><b>想进一步了解 AI 实战？</b><p>查看三天体验营完整海报，活动安排以入口说明为准。</p><a href="/#/pages/camp/index">了解三天体验营 →</a></div></div>';
 if(window.AINPEShare){const losses=choice.map((i,j)=>P.checks[j].options[i]).filter(x=>x[1]<0);window.AINPEShare.mount({host:document.getElementById('shareHost'),project:P.name,result:'体验完成',days:null,amount:amount,seed:null,talents:[],issues:losses.map(x=>x[2]).slice(0,3),pitCount:losses.length,completed:'3 个关键决策与 1 项任务',url:location.href})}
 document.getElementById('copy-draft').onclick=()=>{const status=document.getElementById('copy-status'),fallback=document.getElementById('copy-fallback');function manual(){fallback.hidden=false;fallback.value=draft;fallback.focus();fallback.select();status.textContent='请手动复制上方已选中的草稿。'}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(draft).then(()=>{status.textContent='草稿已复制。'},manual);else manual()};
 document.getElementById('again').onclick=()=>{step=0;choice=[null,null,null];audience='';draft='';work={};render();window.scrollTo(0,0)};
}
render();
