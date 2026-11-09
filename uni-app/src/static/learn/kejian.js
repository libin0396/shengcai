(function(){
  'use strict';
  var L=window.Learn,K=window.AINPE_KEJIAN,T='kejian',$=L.$,$$=L.$$,esc=L.esc;
  L.chrome('learn','kejian');
  var st=L.getState(T);
  var S={lesson:st.lesson||'yuwen3',buyer:st.buyer||'teacher',struct:st.struct||'classic',style:st.style||'huamian',wrong:st.wrong||[],level:st.level||0,ans:st.ans||{},custom:st.custom||''};
  function persist(){L.setState(T,S)}
  function lessonText(){return S.custom||K.LESSONS[S.lesson].name}

  // ---------- 分区切换 ----------
  function tab(id,scroll){
    $$('.tabs button').forEach(function(x){var on=x.dataset.tab===id;x.classList.toggle('on',on);x.setAttribute('aria-selected',on?'true':'false')});
    $$('.pane').forEach(function(p){p.hidden=p.id!==id});
    $$('.tier').forEach(function(t){t.classList.toggle('on',t.dataset.go===id)});
    if(id==='practice')renderLevel();
    if(scroll!==false)L.toTabs();
  }
  $$('.tabs button').forEach(function(x){x.addEventListener('click',function(){tab(x.dataset.tab)})});
  $$('.tier').forEach(function(t){t.addEventListener('click',function(){tab(t.dataset.go);L.track('learn_step',{page:'learn',game:T,tier:t.dataset.tier})})});
  $$('[data-goto]').forEach(function(x){x.addEventListener('click',function(){tab(x.dataset.goto)})});

  // ---------- 教程（入门） ----------
  var lessonIn=$('#lessonIn');lessonIn.value=lessonText();
  lessonIn.addEventListener('input',function(){var v=lessonIn.value.trim().slice(0,40);S.custom=v&&v!==K.LESSONS[S.lesson].name?v:'';persist();renderTutorial()});
  function promptBox(label,text){return '<div class="prompt"><small>'+esc(label)+'</small>'+esc(text)+'</div><div class="pact"><button type="button" class="btn or sm js-copy" data-text="'+esc(text)+'">复制这句话</button></div>'}
  function renderTutorial(){
    var les=lessonText();
    var p1='我要准备一节课：'+les+'。\n你是有 15 年经验的老师。先写这节课孩子要带走的 3 件事，每件一句话，写成孩子能做到的样子。\n写完停下来问我「继续吗」。';
    var p2='继续。按「导入 → 新授 → 练习 → 小结」写教案，每部分标出时长，合计 40 分钟。\n开头用一个孩子熟悉的生活场景。再写一份能直接照着念的逐字稿，标出提问和预设的孩子回答。';
    var p3='继续。写前 3 页课件，用表格：页码 | 页面标题（12 字以内） | 生图画面描述。\n画面描述只写画面，不能出现任何文字，每段 60 字以内，3 页色调一致。';
    var cards=[
      {t:'准备好两样东西',p:'一部手机和可用的 AI 工具，例如豆包 App；电脑上也可用网页版。写作、生图的额度和费用以工具说明为准。',
       pic:'<div class="flow"><span>📱 手机</span><em>+</em><span>🫘 豆包 App</span><em>=</em><span>✅ 够了</span></div><p class="note" style="text-align:center">工具的可用额度与费用以当期说明为准</p>'},
      {t:'新建对话，先让它想清楚这节课',p:'打开豆包，点「新对话」，把下面这句话粘贴进去发送。先定孩子要带走什么，后面写出来的东西才不空。',
       pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub me">我要准备一节课：'+esc(les)+'。先写孩子要带走的 3 件事……</div><div class="bub ai">好的，这节课孩子要带走的 3 件事：<br>1. 能说出课文写了哪几样东西<br>2. ……<br>继续吗？</div><div class="inputmock hl"><span>粘贴在这里</span><b>发送</b></div></div>',
       prompt:['第 1 句',p1]},
      {t:'说「继续」，让它写教案和逐字稿',p:'它问「继续吗」，你就把下面这句发过去。一次只让它写一样，比一次写完整节课具体得多。',
       pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub me">继续。按导入 → 新授 → 练习 → 小结写教案……</div><div class="bub ai">【导入 · 3 分钟】<br>「如果你有一条小船，最想划到哪儿去看看？」<br>（预设：看鱼、捡贝壳）……</div></div>',
       prompt:['第 2 句',p2]},
      {t:'写 3 页的画面，再让它直接画',p:'它写完表格后，再发一句「按第 1 页的描述直接生成图片」。第 2、3 页同样做。画面里不要有字，字之后在 PPT 里加。',
       pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub me">按第 1 页的描述直接生成图片</div><div class="bub ai" style="padding:6px"><img src="img/boat.jpg" alt="AI 生成示例：海边小木船" style="border-radius:8px"></div></div>',
       prompt:['第 3 句',p3]},
      {t:'把图片放进 PPT 并添加可编辑文字',p:'把 3 张图保存到手机，用 WPS 新建 PDF 把图放进去，再用 WPS 的「PDF 转 PPT」。在 PPT 里单独添加标题等文字，方便之后修改。',
       pic:'<div class="flow"><span>🖼️ 3 张图</span><em>→</em><span>📄 合成 PDF</span><em>→</em><span>📊 WPS 转 PPT</span><em>→</em><span>✍️ 加标题</span></div><p class="note" style="text-align:center">单独添加的文字可编辑；图片内部通常仍是图片</p>'}
    ];
    $('#tcards').innerHTML=cards.map(function(c,i){return '<article class="tcard"><div class="pic">'+c.pic+'</div><div class="txt"><h3 class="h3"><span>'+(i+1)+'</span>'+esc(c.t)+'</h3><p>'+esc(c.p)+'</p>'+(c.prompt?promptBox(c.prompt[0],c.prompt[1]):'')+'</div></article>'}).join('');
  }
  document.addEventListener('click',function(e){var x=e.target.closest&&e.target.closest('.js-copy');if(!x)return;L.copy(x.dataset.text);L.track('aid_copy',{page:'learn',game:T,tier:x.closest('#tutorial')?'basic':'pro'})});
  $('#markBasic').addEventListener('click',function(){S.basicDone=true;persist();L.setState(T,{basicDone:true});L.track('learn_done',{page:'learn',game:T,tier:'basic'});L.toast('入门完成！下一步：做出你的课件助手');setTimeout(function(){tab('practice')},600)});

  // ---------- 实操（5 关） ----------
  var TOTAL=K.LEVELS.length+1; // 选课 + 5 关 + 结束页 = 第 0..6
  function trayRender(){
    var items=['选好一节课'].concat(K.LEVELS.map(function(l){return l.tray}),['你的课件助手 skill']);
    $('#trayList').innerHTML=items.map(function(t,i){var got=i<S.level||(i===TOTAL&&S.done);return '<li class="'+(got?'got':'')+'"><i>'+(got?'✓':'')+'</i><span>'+esc(t)+'</span></li>'}).join('');
  }
  function head(n,title){var st='';for(var i=1;i<=K.LEVELS.length;i++)st+='<i class="'+(i<n?'d':i===n?'d':'')+(n===K.LEVELS.length&&S.done?' y':'')+'" style="height:'+(4+i*2)+'px"></i>';return '<div class="lvbar"><div class="stairs" aria-hidden="true">'+st+'</div><span class="lvpill">第 '+n+' 关 / '+K.LEVELS.length+'</span></div><div class="lvhead"><small>'+esc(title)+'</small></div>'}
  function renderLevel(){
    trayRender();
    var box=$('#lv');
    if(S.level===0)return renderPick(box);
    if(S.level>K.LEVELS.length)return renderEnd(box);
    var lv=K.LEVELS[S.level-1],ans=S.ans[lv.id]||[];
    var h=head(S.level,lv.title)+'<p class="lead">'+esc(lv.intro)+'</p>';
    lv.qs.forEach(function(q,qi){
      h+='<div class="q" data-q="'+qi+'"><h3 class="h3">'+esc(q.q)+'</h3><div class="opts">'+q.opts.map(function(o,oi){return '<button type="button" class="opt'+(ans[qi]===oi?' on':'')+'" data-o="'+oi+'"'+(ans[qi]!=null?' disabled':'')+'>'+String.fromCharCode(65+oi)+'. '+esc(o)+'</button>'}).join('')+'</div><div class="rv"></div></div>';
    });
    h+='<div id="lvTail"></div>';
    box.innerHTML=h;
    lv.qs.forEach(function(q,qi){if(ans[qi]!=null)reveal(lv,qi,ans[qi],true)});
    tail(lv);
    $$('.q',box).forEach(function(qel){
      var qi=+qel.dataset.q;
      $$('.opt',qel).forEach(function(btn){btn.addEventListener('click',function(){
        if(ans[qi]!=null)return;var oi=+btn.dataset.o;ans[qi]=oi;S.ans[lv.id]=ans;
        var q=lv.qs[qi];
        if(q.pref)S[q.pref]=q.vals[oi];
        if(q.rec!=null&&oi!==q.rec&&S.wrong.indexOf(lv.id)<0)S.wrong.push(lv.id);
        persist();
        $$('.opt',qel).forEach(function(x){x.disabled=true;x.classList.toggle('on',x===btn)});
        reveal(lv,qi,oi);tail(lv);
      })});
    });
  }
  function reveal(lv,qi,oi,quiet){
    var q=lv.qs[qi],el=$('.q[data-q="'+qi+'"] .rv'),h;
    if(q.pref!=null)h='<div class="learned">'+esc(q.why[oi])+'</div>';
    else{
      var good=oi===q.rec;
      h='<div class="reveal"><small>可以怎么考虑</small>'+(good?'<p><span class="ok">✓ 可以从这一步开始</span></p>':'<p><span class="warn">这一步可以再想一想：</span></p>')+'<p>'+q.why[oi]+'</p>'+(good?'':'<p><span class="ok">推荐做法：</span>'+esc(q.opts[q.rec])+'。'+q.why[q.rec]+'</p>')+(q.real?'<div class="realwho"><small>圈友怎么做的 · 作者自述</small><p>'+esc(q.real)+'</p><a href="/#/pages/camp/index?from=article&amp;source='+encodeURIComponent(q.realSource)+'">了解来源 ›</a></div>':'')+'</div>';
      if(q.cmp)h+='<div class="sample"><span class="tag">示例：同一节课，两种写法让 AI 写出来的开头</span><div class="cmp"><div class="bad"><b>一次写完</b>导入：出示图片导入新课，激发学生兴趣。<br>新授：学习生字词，理解课文内容。<br>练习：完成课后练习。</div><div class="good"><b>先定目标，分 3 次写</b>导入：「如果你有一条小船，最想划到海上哪儿去看看？」请 3 个孩子说说。<br>新授：找一找，课文从哪几处写出了西沙的「富饶」？</div></div></div>';
    }
    el.innerHTML=h;
    if(!quiet)el.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function tail(lv){
    var ans=S.ans[lv.id]||[],all=lv.qs.every(function(_,i){return ans[i]!=null}),el=$('#lvTail');
    if(!all){el.innerHTML='';return}
    var IMG={need:'boat',write:'boat',pages:'fish',redline:'shell',cover:'kids'};
    el.innerHTML='<div class="grow"><img src="img/'+(IMG[lv.id]||'boat')+'.jpg" alt=""><div><b>练习 +1</b>　'+esc(lv.tray)+'</div></div><div class="learned">本关练习：<b>'+esc(lv.learned)+'</b></div><div class="sample"><span class="tag">示例产出 · 用《富饶的西沙群岛》演示</span>'+lv.sample()+'</div>'+
      '<details class="sample"><summary class="h3" style="cursor:pointer">想真做这一步？复制给豆包</summary>'+promptBox('填好了你的课',lv.tryIt(lessonText()))+'</details>'+
      '<div class="navbtns"><button class="btn ln" id="prevLv">上一关</button><button class="btn or" id="nextLv">'+(S.level===K.LEVELS.length?'查看练习结果':'下一关')+'</button></div>';
    $('#prevLv').addEventListener('click',function(){S.level--;persist();renderLevel();$('#lv').scrollIntoView({block:'start'})});
    $('#nextLv').addEventListener('click',function(){L.track('learn_step',{page:'learn',game:T,tier:lv.id});S.level++;persist();renderLevel();L.toTabs()});
  }
  function renderPick(box){
    var keys=Object.keys(K.LESSONS);
    box.innerHTML='<div class="lvhead"><small>开始之前</small></div><h2 class="h2" style="margin-top:4px">这次做哪节课？</h2><p class="lead">一共 5 关，每关做一个选择，了解制作课件的参考思路。走完你会看到示例课件，并得到一份根据选择整理的课件助手提示词；还需要去 AI 工具中实际制作。</p>'+
      (S.custom?'<div class="sample" style="margin-top:14px"><b>你填写的课题：</b>'+esc(S.custom)+'<p class="note">助手会以这个课题为准，学科或年级不明确时会先询问。如需换课，请返回入门修改。</p></div>':'<div class="opts" style="margin-top:14px">'+keys.map(function(k){return '<button type="button" class="opt'+(S.lesson===k?' on':'')+'" data-k="'+k+'">'+esc(K.LESSONS[k].name)+'</button>'}).join('')+'</div><p class="note">不知道选什么，就从你家孩子正在学的那一课开始。</p>')+
      '<div class="navbtns"><button class="btn or" id="goLv1">开始第 1 关</button></div>';
    $$('.opt',box).forEach(function(x){x.addEventListener('click',function(){S.lesson=x.dataset.k;persist();$$('.opt',box).forEach(function(y){y.classList.toggle('on',y===x)})})});
    $('#goLv1').addEventListener('click',function(){S.level=1;persist();L.track('learn_step',{page:'learn',game:T,tier:'start'});renderLevel()});
  }
  function renderEnd(box){
    var skill=K.buildSkill(S),wrong=S.wrong.filter(function(w){return K.DIAG[w]}).slice(0,2);
    if(!S.done){S.done=true;persist();L.track('learn_done',{page:'learn',game:T,tier:'pro'})}
    trayRender();
    var diag=wrong.length?'<ul>'+wrong.map(function(w){return '<li>你容易卡在<b>'+esc(K.DIAG[w][0])+'</b>。可以重点留意：'+esc(K.DIAG[w][1])+'。</li>'}).join('')+'</ul>':'<p>你已完成练习，可以尝试在 AI 工具中实际做一遍。</p>';
    box.innerHTML='<div class="donehead"><span class="stamp"><span class="step"><i></i><i></i><i></i></span>练习完成</span><h2 class="h1">你的课件练习<br>已经完成</h2><p class="lead">'+esc(lessonText())+'</p></div><div class="workwrap" id="work"></div>'+
      '<div class="sample"><span class="tag">诊断</span>'+diag+'</div>'+
      '<div class="sec"><h2 class="h2">你的课件助手</h2><p class="lead">这份就是按你 5 关的选择整理出来的。复制它发给豆包（或在工作模式里存成 skill），以后只要说「哪一节课」，它就按你的规则一步一步出课件。</p>'+
      '<div class="prompt dark" style="max-height:280px;overflow:auto"><small>课件助手 · SKILL.md</small>'+esc(skill)+'</div><div class="pact"><button class="btn or sm" id="cpSkill">复制全文</button><button class="btn ln sm" id="dlSkill">下载文件</button></div>'+
      '<p class="note">发给豆包后它会先问你课题。它每写完一步会停下来问「继续吗」，回「继续」就行。</p></div>'+
      '<div class="sec"><h2 class="h2">下一步</h2><ol class="next" style="margin-top:10px"><li><b>先自己用。</b>用助手给自己或身边的老师做 2 份，看顺不顺手。</li><li><b>想拿去卖？</b>先看「信息」里的成本和素材使用提示。</li></ol><div class="navbtns"><button class="btn ln" id="toInfo">看成本与使用提示</button><button class="btn ln" id="redo">重新走一遍</button></div></div>';
    L.mountWorkCard($('#work'),{badge:'练习示例',kicker:'AI 课件练习示例',title:lessonText(),sub:'示例教案和插图，实际课件需在 AI 工具中制作',images:['img/boat.jpg','img/fish.jpg','img/shell.jpg'],qrPath:'/static/learn/kejian.html?from=card',qrLabel:'扫码，做一份你的',tag:'入门 · 看教程'},T);
    $('#cpSkill').addEventListener('click',function(){L.copy(skill,'已复制，发给豆包就能用');L.track('skill_copy',{page:'learn',game:T})});
    $('#dlSkill').addEventListener('click',function(){L.download('课件助手-SKILL.md',skill);L.track('skill_copy',{page:'learn',game:T,tier:'file'})});
    $('#toInfo').addEventListener('click',function(){tab('info')});
    $('#redo').addEventListener('click',function(){S.level=0;S.ans={};S.wrong=[];S.done=false;persist();renderLevel()});
  }

  // ---------- 信息 ----------
  if(!L.MP&&!(window.AINPE_SITE_MODE&&window.AINPE_SITE_MODE.tutorialFirst)){var a=document.createElement('a');a.className='chip or';a.style.marginLeft='6px';a.href='/#/pages/camp/index?from=learn';a.textContent='看看怎么上船 ›';a.addEventListener('click',function(){L.track('outbound_click',{target:'camp',from:'learn'})});$('#campLink').appendChild(a)}

  renderTutorial();
  var q=location.search;
  if(/[?&]tab=practice/.test(q)||(S.level>0&&!/[?&]from=/.test(q)))tab('practice',false);
  else if(/[?&]tab=info/.test(q)||location.hash==='#next')tab('info',false);
  L.track('learn_view',{page:'learn',game:T});
})();
