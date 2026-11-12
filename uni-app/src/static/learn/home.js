/* 网站首页：小A 打招呼、三位朋友、今天的每日 AI、学 AI 进度、选一件事开始做。
   只读本机记录（ainpe:ai-level、ainpe:learn），搜索内容只在本站页面之间传递，不上传。 */
(function(){
  'use strict';
  var P=window.AIPlay,M=window.AINPE_MEIRI||{ISSUES:[]},X=window.AINPE_XUE||{UNITS:[],LESSONS:{},ORDER:[]};
  var $=P.$,el=P.el,R=P.ROLES;
  var TODAY=P.today();

  /* ---------- 小A 和三位朋友说的话 ---------- */
  var LINES={
    a:{text:['你好，我是小A。','遇到什么事，说一句，我帮你找用法。','每天来玩 3 分钟，慢慢就会用 AI 了。']},
    lin:{text:['写消息、整理资料、做计划，我常找小A 帮忙。'],go:'学一节：把话说清楚',href:'xue-ai.html#clear'},
    yuan:{text:['讲题、编睡前故事、问生活里的小事，孩子也爱一起玩。'],go:'和孩子一起：给它看个例子',href:'xue-ai.html#example'},
    zhou:{text:['我刚开始学，很多基础问题都想问问。'],go:'从第一课开始：AI 能帮你做什么',href:'xue-ai.html#can'}
  };
  var FRIEND_TAG={lin:'上班族',yuan:'带孩子',zhou:'刚入门'};
  var talk={run:0},lineIdx=0,rotateTimer=null,blinkTimer=null;
  // 页面被换掉（预览里切到别的页）后，计时器自己停下
  function alive(){var b=document.getElementById('bigA');return !!(b&&document.body.contains(b))}
  function speak(who){
    var t=++talk.run,L=LINES[who],text=L.text[who==='a'?lineIdx%L.text.length:0];
    $('#sayWho').textContent=R[who].name;
    var go=$('#sayGo');
    if(L.go){go.hidden=false;go.href=L.href;$('#sayGoText').textContent=L.go}else go.hidden=true;
    [].forEach.call($('#friends').children,function(b){var on=b.getAttribute('data-who')===who;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    var big=$('#bigA');big.classList.remove('hop');void big.offsetWidth;if(who==='a')big.classList.add('hop');
    return typeWith(t,$('#sayText'),text);
  }
  function typeWith(t,node,text){
    node.textContent='';
    if(P.reduce){node.textContent=text;return Promise.resolve()}
    var i=0;node.classList.add('typing');
    return new Promise(function(ok){(function next(){
      if(t!==talk.run||!alive()){node.classList.remove('typing');return}
      if(i>=text.length){node.classList.remove('typing');return ok()}
      node.textContent+=text.charAt(i++);setTimeout(next,55)})()});
  }
  function rotate(){clearTimeout(rotateTimer);rotateTimer=setTimeout(function(){if(!alive())return;lineIdx++;speak('a').then(rotate)},3800)}
  function blink(){
    clearTimeout(blinkTimer);
    blinkTimer=setTimeout(function(){if(!alive())return;var b=$('#bigA');b.classList.add('blinking');setTimeout(function(){b.classList.remove('blinking');blink()},170)},3200+Math.random()*1800);
  }
  function drawMeet(){
    var big=$('#bigA');$('#bigAImg').src=R.a.src;big.insertAdjacentHTML('beforeend',P.FACE);
    var box=$('#friends');
    ['lin','yuan','zhou'].forEach(function(k){
      var b=el('button','friend');b.type='button';b.setAttribute('data-who',k);b.setAttribute('aria-pressed','false');
      var im=el('img');im.src=R[k].src;im.alt='';b.appendChild(im);
      var tx=el('span');tx.appendChild(el('b','',R[k].name));tx.appendChild(el('small','',FRIEND_TAG[k]));b.appendChild(tx);
      b.addEventListener('click',function(){clearTimeout(rotateTimer);speak(k).then(function(){rotateTimer=setTimeout(function(){if(alive())speak('a').then(rotate)},6000)})});
      box.appendChild(b);
    });
    $('#bigA').addEventListener('click',function(){clearTimeout(rotateTimer);lineIdx++;speak('a').then(rotate)});
    speak('a').then(rotate);blink();
  }

  /* ---------- 等级、每日 AI、学 AI ---------- */
  function byDate(d){return (M.ISSUES||[]).filter(function(x){return x.date===d})[0]||null}
  function weekStart(d){var x=P.parseYmd(d),w=(x.getUTCDay()+6)%7;return P.addDays(d,-w)}
  function drawLevel(store){var info=P.levelInfo(store.xp);$('#lvNum').textContent=info.number;$('#lvName').textContent=info.name}
  function drawDaily(store){
    var is=byDate(TODAY),isToday=!!is;
    if(!is){var past=(M.ISSUES||[]).filter(function(x){return x.date<TODAY}).sort(function(a,b){return a.date<b.date?1:-1});is=past[0]||(M.ISSUES||[])[0]}
    var card=$('#daily');if(!is){card.hidden=true;return}
    var done=!!store.daily[is.id],cv=$('#dCover');
    for(var k=0;k<12;k++){var s=el('i','star');s.style.left=(4+((k*37)%60))+'%';s.style.top=(8+((k*53)%60))+'%';s.style.animationDelay=(k%5)*.4+'s';cv.insertBefore(s,cv.firstChild)}
    $('#dTag').textContent=(isToday?'今天 · ':'最近一期 · ')+is.kind;$('#dQ').textContent=is.cover;
    $('#dA').src=R.a.src;$('#dB').src=R[is.who].src;
    var x=P.parseYmd(TODAY);$('#dDate').textContent='每日 AI · '+(x.getUTCMonth()+1)+' 月 '+x.getUTCDate()+' 日';
    $('#dTitle').textContent=is.title;$('#dMeta').textContent=is.meta;
    var gain=isToday?(M.XP?M.XP.today:10):(M.XP?M.XP.makeup:5);
    $('#dGo').textContent=done?'已完成 · 再玩一次':is.btn+' · 得 '+gain+' 经验';
    if(done)$('#dGo').classList.add('done');
    card.href='meiri-ai.html#'+is.id;
    var w=$('#dWeek'),start=weekStart(TODAY);
    for(var d=0;d<7;d++){var day=P.addDays(start,d),iss=byDate(day),i=el('i');
      if(iss&&store.daily[iss.id])i.classList.add('done');if(day===TODAY)i.classList.add('today');w.appendChild(i)}
  }
  function drawLearn(store){
    var total=X.ORDER.length,done=X.ORDER.filter(function(id){return store.lessons[id]}).length;
    var resume=X.ORDER.filter(function(id){return !store.lessons[id]})[0];
    var unitIdx=-1,badges=0;
    X.UNITS.forEach(function(u,k){var all=u.lessons.every(function(id){return store.lessons[id]});if(all)badges++;if(unitIdx<0&&!all)unitIdx=k});
    var bars=$('#stairs').children;
    X.UNITS.forEach(function(u,k){var all=u.lessons.every(function(id){return store.lessons[id]});bars[k].className=all?'done':k===unitIdx?'now':''});
    if(resume){
      var L=X.LESSONS[resume],u=X.UNITS.filter(function(x){return x.lessons.indexOf(resume)>=0})[0];
      $('#lK').textContent=(done?'学 AI · 接着学':'学 AI · 从这里开始')+' · '+u.name.match(/^第 \d 单元/)[0]+'第 '+(u.lessons.indexOf(resume)+1)+' 节';
      $('#lTitle').textContent=L.title;$('#learn').href='xue-ai.html#'+resume;
      $('#lGo').textContent=done?'继续学 · '+R[L.who].name+'陪你':'开始第一课 · 3 分钟';
    }else{
      $('#lK').textContent='学 AI';$('#lTitle').textContent='动画课都学完了';$('#lGo').textContent='去跟着做一件作品';$('#learn').href='xue-ai.html';
    }
    $('#lMeta').textContent='已学完 '+done+' / '+total+' 节';$('#lBadge').textContent=badges?'动画课徽章 '+badges+' 枚':'六个单元 · 循序渐进';
  }

  /* ---------- 搜索和快捷入口 ---------- */
  function drawSearch(){
    var chips=$('#chips');
    [['做 AI 短剧','zuo.html?id=short-drama'],['写视频脚本','guide.html?id=video-script'],['做宣传图','guide.html?id=product-poster'],['做课件','kejian.html?from=home']].forEach(function(c){var a=el('a','',c[0]);a.href=c[1];chips.appendChild(a)});
    $('#search').addEventListener('submit',function(e){
      e.preventDefault();var v=String($('#q').value||'').trim().slice(0,40);
      // 搜索词只放在本机的会话存储里交给找用法页，不放进网址
      try{if(v)sessionStorage.setItem('ainpe:find-once',v);else sessionStorage.removeItem('ainpe:find-once')}catch(err){if(v){P.toast('浏览器不让传递内容，到找用法页再输入一次');}}
      $('#q').value='';
      if(typeof window.AINPE_PREVIEW_GO==='function'){window.AINPE_PREVIEW_GO('find');return}
      location.href='find.html';
    });
  }

  /* ---------- 第一次来：小A 带着走一遍四个入口 ---------- */
  var STEPS=[
    {nav:'daily',title:'每天来玩 3 分钟',text:'「每日 AI」每天一期小互动：编故事、找茬、防骗练习……做完能涨经验。'},
    {nav:'learn',title:'按顺序学会用 AI',text:'「学 AI」有六个单元，每节 3～5 分钟，小林、小圆、老周陪你一起学。'},
    {nav:'find',title:'遇到事，点中间的我',text:'说一句你遇到的事，帮你找一句能直接复制给 AI 的话，或一篇跟着做的教程。'},
    {nav:'mine',title:'在「我的」看等级',text:'等级、徽章、学过的课都在这里。记录只存在这台设备上，不用登录。'}
  ];
  var introBox=null,introStep=0,lastFocus=null;
  function spot(key){[].forEach.call(document.querySelectorAll('.ainav-items a'),function(a){a.classList.toggle('spot',a.getAttribute('data-nav')===key)})}
  function closeIntro(){if(!introBox)return;introBox.remove();introBox=null;spot('');document.removeEventListener('keydown',onKey);try{localStorage.setItem('ainpe:intro-v51','1')}catch(e){}if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function onKey(e){if(e.key==='Escape')closeIntro()}
  function drawIntro(){
    var s=STEPS[introStep];introBox.innerHTML='';
    var card=el('div','card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','introT');
    var who=el('div','who');var im=el('img');im.src=R.a.src;im.alt='';who.appendChild(im);var h=el('h2','',s.title);h.id='introT';who.appendChild(h);card.appendChild(who);
    card.appendChild(el('p','',s.text));
    var dots=el('div','dots');STEPS.forEach(function(_,k){dots.appendChild(el('i',k===introStep?'on':''))});card.appendChild(dots);
    var row=el('div','row3');
    var skip=P.btn('btn soft',introStep?'上一步':'跳过');skip.addEventListener('click',function(){if(introStep){introStep--;drawIntro()}else closeIntro()});
    var next=P.btn('btn',introStep<STEPS.length-1?'下一步':'知道了');next.addEventListener('click',function(){if(introStep<STEPS.length-1){introStep++;drawIntro()}else closeIntro()});
    row.appendChild(skip);row.appendChild(next);card.appendChild(row);introBox.appendChild(card);
    spot(s.nav);next.focus();
  }
  function openIntro(){
    if(introBox)return;lastFocus=document.activeElement;introStep=0;
    introBox=el('div','intro');introBox.addEventListener('click',function(e){if(e.target===introBox)closeIntro()});
    document.body.appendChild(introBox);document.addEventListener('keydown',onKey);drawIntro();
  }
  function autoIntro(){
    if(P.PREVIEW)return;
    var seen=false;try{seen=localStorage.getItem('ainpe:intro-v51')==='1'}catch(e){return}
    if(!seen)setTimeout(openIntro,900);
  }

  /* ---------- 统计：和原首页一致，扫海报二维码进来的单独记一下来源 ---------- */
  function trackView(){
    var played=false;try{played=!!localStorage.getItem('ainpe:played')}catch(e){}
    var from='';
    try{var url=new URL(location.href);if(url.searchParams.getAll('from').length===1&&url.searchParams.get('from')==='persona_qr'){from='persona_qr';url.searchParams.delete('from');history.replaceState(history.state,'',url.pathname+url.search+url.hash)}}catch(e){}
    P.track('site_view',from?{page:'home',played:played,from:from}:{page:'home',played:played});
  }

  function boot(){
    var store=P.load();
    drawLevel(store);drawMeet();drawDaily(store);drawLearn(store);drawSearch();
    $('#replayIntro').addEventListener('click',openIntro);
    P.nav('home');
    window.addEventListener('pageshow',function(e){if(e.persisted){var s=P.load();drawLevel(s);drawLearn(s)}});
    autoIntro();trackView();
  }
  boot();
})();
