/* 找用法：用户说一句遇到的事，在本机从用法库里找最合适的一张，填空后拼好提示词。
   不接任何 AI 接口；输入的文字不上传，统计只记录复制了哪一张卡。 */
(function(){
  var L=window.Learn;L.chrome('find');
  var AIDS=window.AINPE_AIDS||[];
  // 每张卡的关键词（用户常说的话）
  var KW={
    notice:['通知','合同','看不懂','文件','公告','说明书','协议','条款','政策'],
    reply:['消息','请假','催款','催','拒绝','回复','回消息','微信','领导','老师','开口','道歉','怎么说','借钱'],
    summary:['文章','长文','总结','太长','重点','没空看','概括','读完'],
    homework:['作业','题','辅导','数学','语文','英语','不会讲','讲题','孩子学习'],
    menu:['吃','菜','晚饭','做饭','冰箱','菜谱','食谱','早餐','午饭'],
    meeting:['会议','纪要','记录','开会','录音','笔记'],
    excel:['表格','公式','excel','数据','wps','统计'],
    trip:['玩','周末','旅游','出去','出游','带娃','攻略','行程','景点'],
    caption:['朋友圈','文案','配文','配一句','照片','小红书','发什么'],
    learnai:['第一次','不会用','不知道','问什么','怎么用','豆包','deepseek','入门','ai']
  };
  // 想做成一件事 → 跟着做
  var PROJ=[
    {page:'kejian.html?from=find',title:'给孩子做一份课件',kw:['课件','教案','ppt','备课','上课','讲课','逐字稿']},
    {page:'huiben.html?from=find',title:'和孩子做一本绘本',kw:['绘本','故事','睡前','画画','插画','童话']}
  ];
  var CHIPS=['写请假条','辅导作业','看不懂的通知','晚饭吃什么','做课件','做绘本'];

  var form=L.$('#fsearch'),inp=L.$('#fq'),res=L.$('#fres'),chips=L.$('#fchips');

  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
  function score(q,words,extra){
    var s=0;words.forEach(function(w){if(q.indexOf(norm(w))>=0)s+=w.length>1?2:1});
    if(extra&&norm(extra).indexOf(q)>=0&&q.length>=2)s+=3;
    return s;
  }
  function match(raw){
    var q=norm(raw);if(!q)return {aids:[],proj:null};
    var proj=null,best=0;
    PROJ.forEach(function(p){var s=score(q,p.kw,p.title);if(s>best){best=s;proj=p}});
    var aids=AIDS.map(function(a){return {a:a,s:score(q,KW[a.id]||[],a.title+a.when)}})
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

  function render(q){
    var r=match(q);
    if(!q){res.innerHTML='';return}
    if(!r.aids.length&&!r.proj){
      res.innerHTML='<div class="card"><b class="h3">暂时没找到，换句话试试</b><p class="note">或者翻翻用法库。</p><a class="btn ln sm" style="margin-top:10px" href="jijiu.html">打开用法库</a></div>';
      return;
    }
    var html='';
    if(r.proj&&(!r.aids.length||score(norm(q),r.proj.kw)>=2)){
      html+='<a class="fproj" href="'+r.proj.page+'"><small>想做成一件事</small><b>'+L.esc(r.proj.title)+'</b><span>跟着做 ›</span></a>';
    }
    if(r.aids.length){
      var a=r.aids[0],sl=slots(a.prompt);
      html+='<p class="fcount">找到 '+r.aids.length+' 个用法</p>';
      html+='<div class="card fbest"><div class="fhd"><span class="em" aria-hidden="true">'+L.aidIcon(a.id)+'</span><b>'+L.esc(a.title)+'</b>'+(a.lv?'<i class="lv lv'+a.lv+'">'+a.lv+'</i>':'')+'</div>';
      if(sl.length){
        html+='<b class="flab">填一下</b><div class="ffill">'+sl.map(function(m,i){var lb=label(m,a.prompt);
          return '<label class="ff'+(lb.big?' big':'')+'"><span>'+L.esc(lb.text)+'</span>'+(lb.big?'<textarea data-k="'+i+'" rows="3" placeholder="'+L.esc(lb.hint||'粘贴在这里')+'"></textarea>':'<input data-k="'+i+'" placeholder="'+L.esc(lb.hint)+'">')+'</label>'}).join('')+'</div>';
      }
      html+='<b class="flab">拼好的这句话</b><div class="prompt dark fout" id="fout"></div>';
      html+='<button type="button" class="btn pri block" id="fcopy" style="margin-top:12px">复制提示词</button></div>';
      if(r.aids.length>1){
        html+='<p class="fcount">也可能是</p><div class="fmore">'+r.aids.slice(1,4).map(function(x){return '<a href="jijiu.html#'+x.id+'"><span aria-hidden="true">'+L.aidIcon(x.id)+'</span>'+L.esc(x.title)+'<i>›</i></a>'}).join('')+'</div>';
      }
      res.innerHTML=html;
      var vals={},out=L.$('#fout');
      function upd(){out.innerHTML=hl(a.prompt,vals)}
      L.$$('[data-k]',res).forEach(function(el){el.addEventListener('input',function(){vals[sl[+el.getAttribute('data-k')]]=el.value;upd()})});
      upd();
      L.$('#fcopy').addEventListener('click',function(){
        var text=filled(a.prompt,vals);
        L.copy(text,/【/.test(text)?'已复制，记得把【】换成你的内容':'已复制，去豆包粘贴就行');
        L.track('aid_copy',{page:'learn',game:'find',tier:a.id});
      });
    }else res.innerHTML=html;
  }

  chips.innerHTML=CHIPS.map(function(c){return '<button type="button" class="chip gray">'+c+'</button>'}).join('');
  L.$$('button',chips).forEach(function(b){b.addEventListener('click',function(){inp.value=b.textContent;render(b.textContent)})});
  form.addEventListener('submit',function(e){e.preventDefault();render(inp.value);inp.blur()});
  // 本机临时传递首页输入，读取后立即清除，不放进任何 URL。
  var q='';try{q=sessionStorage.getItem('ainpe:find-once')||'';sessionStorage.removeItem('ainpe:find-once')}catch(_){}
  var fixed={homework:'辅导作业',leave:'写请假条'};
  var key='';try{key=new URLSearchParams(location.search).get('quick')||''}catch(_){};if(!Object.prototype.hasOwnProperty.call(fixed,key))key='';
  if(!q&&key)q=fixed[key];
  q=q.slice(0,40);
  if(q){inp.value=q;render(q)}
  L.track('learn_view',{page:'learn',game:'find'});
})();
