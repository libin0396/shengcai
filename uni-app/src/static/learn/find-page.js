/* 查询和提示词填空只在本机处理；资料快照通过固定地址只读获取。 */
(function(){
  var L=window.Learn;L.chrome('find');
  var tutorialFirst=!!(window.AINPE_SITE_MODE&&window.AINPE_SITE_MODE.tutorialFirst);
  if(tutorialFirst){var intro=L.$('.find-intro');if(intro)intro.textContent='搜索站内教程和提示词，找一件你想做的事。'}
  var AIDS=window.AINPE_AIDS||[];
  // 每张卡的关键词（用户常说的话）
  var KW={
    notice:['通知','合同','看不懂','文件','公告','说明书','协议','条款','政策'],
    reply:['消息','请假','催款','拒绝','回复','回消息','微信消息','开口','道歉','借钱'],
    summary:['文章','长文','总结','太长','重点','没空看','概括','读完'],
    homework:['作业','题目','做题','试题','辅导','数学题','语文题','英语题','不会讲','讲题','孩子学习'],
    menu:['吃什么','菜单','买菜','炒菜','做菜','晚饭','做饭','冰箱','菜谱','食谱','早餐','午饭'],
    meeting:['会议','纪要','开会','会议记录','会议笔记'],
    excel:['表格','公式','excel','数据','wps','统计'],
    trip:['去哪玩','出去玩','周末','旅游','出游','带娃','攻略','行程','景点'],
    caption:['朋友圈','文案','配文','配一句','照片','小红书','发什么'],
    learnai:['第一次用','不会用ai','不会用豆包','不知道怎么用ai','不知道怎么用豆包','新手用ai','怎么用ai','问什么']
  };
  // 想做成一件事 → 跟着做
  var PROJ=[
    {page:'kejian.html?from=find',title:'给孩子做一份课件',kw:['课件','教案','ppt','备课','上课','讲课','逐字稿']},
    {page:'huiben.html?from=find',title:'和孩子做一本绘本',kw:['绘本','儿童故事','睡前故事','亲子画画','插画','童话']}
  ];
  var CHIPS=['AI 短剧','短视频脚本','商品宣传图','辅导作业','做课件','做绘本'];

  var form=L.$('#fsearch'),inp=L.$('#fq'),res=L.$('#fres'),chips=L.$('#fchips');
  var latestSearch=0;
  // 只读取现有公开快照，绝不把查询文本放在网络请求中；不会触发生财采集。
  var feedPromise=tutorialFirst?Promise.resolve({ok:true,data:{articles:[]}}):Promise.race([
    Promise.resolve().then(function(){return fetch('/api/feed',{method:'GET',credentials:'same-origin',cache:'no-store'})}).then(function(r){if(!r.ok)throw new Error('feed');return r.json()}).then(function(data){if(!data||!Array.isArray(data.articles))throw new Error('feed');return {ok:true,data:data}}).catch(function(){return {ok:false}}),
    new Promise(function(resolve){setTimeout(function(){resolve({ok:false})},5000)})
  ]);

  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
  // 通用词（如「笔记」）不能压过更具体的「会议笔记」。
  function matchGuides(q,all){
    var generic=['笔记','图文','生图'];
    var hits=all.map(function(g){
      var words=(g.keywords||[]).map(norm).filter(function(w){return w&&generic.indexOf(w)<0&&q.indexOf(w)>=0});
      var best=words.reduce(function(n,w){return Math.max(n,w.length)},0);
      return {guide:g,best:best};
    }).filter(function(x){return x.best>0});
    // 没有具体词命中时，再用泛词兜底，避免只搜“笔记”时漏掉教程。
    if(!hits.length){
      hits=all.map(function(g){
        var words=(g.keywords||[]).map(norm).filter(function(w){return generic.indexOf(w)>=0&&q.indexOf(w)>=0});
        return {guide:g,best:words.reduce(function(n,w){return Math.max(n,w.length)},0)};
      }).filter(function(x){return x.best>0});
    }
    return hits.sort(function(a,b){return b.best-a.best}).slice(0,4).map(function(x){return x.guide});
  }
  function score(q,words,extra){
    var s=0;words.forEach(function(w){if(q.indexOf(norm(w))>=0)s+=w.length>1?2:1});
    if(extra&&norm(extra).indexOf(q)>=0&&q.length>=3)s+=3;
    return s;
  }
  function match(raw){
    var q=norm(raw);if(!q)return {aids:[],proj:null};
    var proj=null,best=0;
    PROJ.forEach(function(p){
      if(/短剧|视频|影视|分镜/.test(q)&&p.page.indexOf('huiben')===0&&!/绘本/.test(q))return;
      var s=score(q,p.kw,p.title);if(s>best){best=s;proj=p}
    });
    var specialized=/短剧|视频|小程序|课件|绘本|分镜|智能体|工作流|获客|出海|游戏站/i.test(q);
    var aids=AIDS.filter(function(a){return !(specialized&&(a.id==='learnai'||(a.id==='caption'&&!/朋友圈|配文/.test(q))))}).map(function(a){return {a:a,s:score(q,KW[a.id]||[],a.title+a.when)}})
      .filter(function(x){return x.s>0}).sort(function(x,y){return y.s-x.s}).map(function(x){return x.a});
    return {aids:aids,proj:proj};
  }

  // 提示词里的【】变成填空
  function slots(prompt){
    var out=[],seen={};prompt.replace(/【([^】]+)】/g,function(m,inner){if(!seen[m]){seen[m]=1;out.push(m)}return m});return out;
  }
  // 名字优先取【】前面那句「xxx：」，没有就取【】里第一个短词
  // 自动取不好的几个，直接写死名字
  var NAMED={'【30】':'几分钟','【WPS / Excel】':'用的软件','【比如 姓名】':'A 列是','【比如 部门】':'B 列是','【比如 报销金额】':'C 列是','【1 天 / 2 天】':'玩几天','【比如 2 个大人 1 个 6 岁孩子】':'一起去的','【多少元】':'预算'};
  function label(m,prompt){
    var t=m.slice(1,-1).trim();
    if(NAMED[m])return {text:NAMED[m],big:false,hint:t};
    if(/粘贴|写在这里|写下来/.test(t))return {text:/题目/.test(t)?'题目':/写下来/.test(t)?'写在这里':'粘贴原文',big:true,hint:''};
    var before=prompt.slice(0,prompt.indexOf(m)).split(/[\n。；]/).pop(),lead=(before.match(/([^：:，,\s]{1,6})[：:]\s*$/)||[])[1];
    var first=t.replace(/^比如\s*/,'').split(/[，,、\/\s]+/)[0];
    return {text:lead||(first&&first.length<=6&&!/^比如/.test(t)?first:'填这里'),big:false,hint:t};
  }
  function filled(prompt,vals){
    return prompt.replace(/【([^】]+)】/g,function(m){var v=vals[m];return v&&v.trim()?v.trim():m});
  }
  function hl(prompt,vals){
    return L.esc(prompt).replace(/【([^】]+)】/g,function(m){var raw=m.replace(/&amp;/g,'&');var v=vals[raw];return v&&v.trim()?'<mark>'+L.esc(v.trim())+'</mark>':'<mark class="todo">'+m+'</mark>'});
  }


  function dateLabel(value){
    var t=Date.parse(value||'');if(!Number.isFinite(t))return '';
    var d=new Date(t+8*3600000);
    return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')+' · 北京时间';
  }
  async function render(raw){
    var q=String(raw||'').trim().slice(0,40),serial=++latestSearch;
    if(!q){res.innerHTML='';return}
    res.innerHTML='<p class="find-source">正在查找站内资料…</p>';
    var feed=await feedPromise,r=match(q);
    var extra=window.AINPEFindSearch.search(q,feed.ok?feed.data.articles:[],tutorialFirst?[]:(window.AINPE_FIND_CASES||[]));
    var qnorm=norm(q),allGuides=window.AINPE_GUIDES||[];
    var guides=matchGuides(qnorm,allGuides);
    // 泛化的“做视频”不一定是短剧；给出相关教程供选择，并保留需求反馈。
    var relatedGuides=!guides.length&&/短片|视频制作|做视频|制作视频|剪视频|剪个视频|视频剪辑|ai视频/.test(qnorm)
      ?allGuides.filter(function(g){return g.id==='short-drama'||g.id==='video-script'}):[];
    var direct=!!(r.aids.length||r.proj||guides.length),related=!!(relatedGuides.length||extra.cases.length||(!tutorialFirst&&extra.simulation));
    // 统计以非空提交次数计；快照不可用时不统计，避免误记无结果。
    if(serial!==latestSearch){if(feed.ok&&window.AINPEFindFeedback)window.AINPEFindFeedback.onSearch(direct||related,null,!direct&&related);return}
    var html='';
    if(!feed.ok)html+='<p class="find-partial">部分站内资料暂时无法读取，下面显示当前设备已有的内容。</p>';
    if(!direct&&!related){
      html+='<div class="card"><b class="h3">暂时没找到站内相关内容</b><p class="note">换个词试试，或先看看已有的教程和提示词。你也可以在下方自愿提交想补充的方向。</p><a class="btn ln sm" href="guides.html">浏览教程</a> <a class="btn ln sm" href="jijiu.html">看看实用提示词</a></div>';
    }
    if(extra.isShortDrama&&!guides.some(function(g){return g.id==='short-drama'}))html+='<p class="find-partial">短剧分步教程暂未找到，可以试试其他关键词。</p>';
    if(guides.length){
      html+='<h2 class="find-group-title">跟着做教程</h2><div class="find-result-list">'+guides.map(function(g){return '<a class="find-result-item" href="guide.html?id='+encodeURIComponent(g.id)+'"><small>'+L.esc(g.category)+' · 分步教程</small><b>'+L.esc(g.title)+'</b><span>'+L.esc(g.intro)+'</span><span class="find-go">查看步骤 ›</span></a>'}).join('')+'</div>';
    }
    if(relatedGuides.length){
      html+='<h2 class="find-group-title">也许能帮到你</h2><p class="find-source">暂时没有完全匹配的教程，可以先看看这些相关方向。</p><div class="find-result-list">'+relatedGuides.map(function(g){return '<a class="find-result-item" href="guide.html?id='+encodeURIComponent(g.id)+'"><small>'+L.esc(g.category)+' · 相关教程</small><b>'+L.esc(g.title)+'</b><span>'+L.esc(g.intro)+'</span><span class="find-go">查看步骤 ›</span></a>'}).join('')+'</div>';
    }
    if(r.proj&&(!r.aids.length||score(norm(q),r.proj.kw)>=2)){
      html+='<a class="fproj" href="'+r.proj.page+'"><small>想做成一件事</small><b>'+L.esc(r.proj.title)+'</b><span>跟着做 ›</span></a>';
    }
    if(r.aids.length){
      var a=r.aids[0],sl=slots(a.prompt);
      html+='<p class="fcount">找到 '+r.aids.length+' 个用法</p>';
      html+='<div class="card fbest"><div class="fhd"><span class="em" aria-hidden="true">'+L.aidIcon(a.id)+'</span><b>'+L.esc(a.title)+'</b>'+(Array.isArray(a.tags)?a.tags.map(function(t){return '<i class="find-tag">'+L.esc(t)+'</i>'}).join(''):'')+'</div>';
      if(sl.length){
        html+='<b class="flab">填一下</b><div class="ffill">'+sl.map(function(m,i){var lb=label(m,a.prompt);
          return '<label class="ff'+(lb.big?' big':'')+'"><span>'+L.esc(lb.text)+'</span>'+(lb.big?'<textarea data-k="'+i+'" rows="3" placeholder="'+L.esc(lb.hint||'粘贴在这里')+'"></textarea>':'<input data-k="'+i+'" placeholder="'+L.esc(lb.hint)+'">')+'</label>'}).join('')+'</div>';
      }
      html+='<b class="flab">拼好的这句话</b><div class="prompt dark fout" id="fout"></div>';
      html+='<button type="button" class="btn pri block" id="fcopy" style="margin-top:12px">复制提示词</button><div class="find-next"><b>接下来怎么用？</b><ol><li>打开你常用的 AI 对话工具。</li><li>在输入框长按或粘贴刚才复制的内容，补全【】里的信息。</li><li>发送后检查回答，不合适可以告诉 AI 哪里需要修改。</li></ol><p>涉及隐私的信息，请先删除或换成代称。</p></div></div>';
      if(r.aids.length>1){
        html+='<p class="fcount">也可能是</p><div class="fmore">'+r.aids.slice(1,4).map(function(x){return '<a href="jijiu.html#'+x.id+'"><span aria-hidden="true">'+L.aidIcon(x.id)+'</span>'+L.esc(x.title)+'<i>›</i></a>'}).join('')+'</div>';
      }
    }
    if(extra.cases.length){
      html+='<h2 class="find-group-title">相关案例与帖子</h2><div class="find-result-list">'+extra.cases.map(function(c){
        return '<a class="find-result-item" href="/#/pages/article/index?id='+encodeURIComponent(c.id)+'"><small>'+L.esc(c.kind)+'</small><b>'+L.esc(c.title)+'</b><span class="find-go">站内查看 ›</span></a>';
      }).join('')+'</div>';
    }
    if(extra.simulation&&!tutorialFirst){
      html+='<h2 class="find-group-title">相近项目体验</h2><a class="find-result-item" href="'+L.esc(extra.simulation.path)+'"><small>模拟体验</small><b>'+L.esc(extra.simulation.title)+'</b><span>'+L.esc(extra.simulation.note)+'</span><span class="find-go">开始体验 ›</span></a>';
    }
    if(feed.ok&&!tutorialFirst){var updated=dateLabel(feed.data.sync&&feed.data.sync.lastSuccessAt||feed.data.updatedAt);html+='<p class="find-source">资料'+(updated?'上次更新 '+L.esc(updated):'更新时间待确认')+' · 自动更新已暂停</p>'}
    html+='<div id="find-feedback-mount"></div>';
    res.innerHTML=html;
    if(r.aids.length){
      var a=r.aids[0],sl=slots(a.prompt);
      var vals={},out=L.$('#fout');
      function upd(){out.innerHTML=hl(a.prompt,vals)}
      L.$$('[data-k]',res).forEach(function(el){el.addEventListener('input',function(){vals[sl[+el.getAttribute('data-k')]]=el.value;upd()})});
      upd();
      L.$('#fcopy').addEventListener('click',function(){
        var text=filled(a.prompt,vals);
        L.copy(text,/【/.test(text)?'已复制，记得把【】换成你的内容':'已复制，打开 AI 对话工具粘贴');
        L.track('aid_copy',{page:'learn',game:'find',tier:a.id});
      });
    }
    if(window.AINPEFindFeedback)window.AINPEFindFeedback.onSearch(direct||related,L.$('#find-feedback-mount'),!direct&&related,!feed.ok);
  }

  chips.innerHTML=CHIPS.map(function(c){return '<button type="button" class="chip gray">'+c+'</button>'}).join('');
  L.$$('button',chips).forEach(function(b){b.addEventListener('click',function(){inp.value=b.textContent;render(b.textContent)})});
  form.addEventListener('submit',function(e){e.preventDefault();render(inp.value);inp.blur()});
  // 本机临时传递首页输入，读取后立即清除，不放进任何 URL。
  var q='';try{q=sessionStorage.getItem('ainpe:find-once')||'';sessionStorage.removeItem('ainpe:find-once')}catch(_){}
  var fixed={homework:'辅导作业',leave:'写请假条',reply:'一条不好开口的消息'};
  var key='';try{key=new URLSearchParams(location.search).get('quick')||''}catch(_){};if(!Object.prototype.hasOwnProperty.call(fixed,key))key='';
  if(!q&&key)q=fixed[key];
  q=q.slice(0,40);
  if(q){inp.value=q;render(q)}
  L.track('learn_view',{page:'learn',game:'find'});
})();
