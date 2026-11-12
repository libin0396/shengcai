/* 每日 AI：等级卡、本周打卡、今天这一期、往期，和每种玩法的演出。内容在 meiri-ai-data.js。 */
(function(){
  'use strict';
  var P=window.AIPlay,D=window.AINPE_MEIRI,ART=window.AIArt||{};
  var $=P.$,el=P.el,btn=P.btn,clock=P.clock,R=P.ROLES;
  var DAYS=['一','二','三','四','五','六','日'];
  var TODAY=P.today();

  function byDate(d){return D.ISSUES.filter(function(x){return x.date===d})[0]||null}
  function playable(is){return D.UNLOCK_ALL||is.date<=TODAY}
  function weekStart(d){var x=P.parseYmd(d),w=(x.getUTCDay()+6)%7;return P.addDays(d,-w)}
  function doneOnDay(store,d){var is=byDate(d);return !!(is&&store.daily[is.id]===d)}
  function streak(store){
    var d=doneOnDay(store,TODAY)?TODAY:P.addDays(TODAY,-1),n=0;
    while(doneOnDay(store,d)){n++;d=P.addDays(d,-1)}
    return n;
  }
  function todayIssue(){var t=byDate(TODAY);if(t)return {is:t,isToday:true};
    var past=D.ISSUES.filter(function(x){return x.date<TODAY}).sort(function(a,b){return a.date<b.date?1:-1});
    return past.length?{is:past[0],isToday:false}:{is:D.ISSUES[0],isToday:false}}
  function weekday(d){return DAYS[(P.parseYmd(d).getUTCDay()+6)%7]}
  function mmdd(d){var x=P.parseYmd(d);return (x.getUTCMonth()+1)+' 月 '+x.getUTCDate()+' 日'}

  /* ---------- 入口页 ---------- */
  function drawLevel(up){
    var store=P.load(),info=P.levelInfo(store.xp),lessons=Object.keys(store.lessons).length,s=streak(store);
    $('#lv').textContent=info.number;$('#lvName').textContent=info.name;
    $('#xpText').textContent=info.next?('还差 '+info.toNext+' 经验升到「'+info.next.n+'」'):'已经是最高级';
    var t=byDate(TODAY);
    $('#todayText').textContent=(s?'连续 '+s+' 天 · ':'')+(t&&store.daily[t.id]?'今天已完成':'今天还没玩');
    $('#lvMore').textContent='学 AI 已学完 '+lessons+' 节';
    $('#bar').classList.toggle('up',!!up);
    var f=$('#barFill');f.style.width='0';requestAnimationFrame(function(){requestAnimationFrame(function(){f.style.width=info.pct+'%'})});
  }
  function drawWeek(){
    var store=P.load(),w=$('#week'),start=weekStart(TODAY);w.innerHTML='';
    for(var k=0;k<7;k++){
      // 当天做的打实心勾；之后补玩的打空心勾；以后的日子不打勾
      var d=P.addDays(start,k),is=byDate(d),onTime=doneOnDay(store,d),late=!onTime&&d<=TODAY&&is&&store.daily[is.id];
      var c=el('div','day'+(onTime?' done':late?' late':'')+(d===TODAY?' today':''));
      c.appendChild(el('span','',d===TODAY?'今天':DAYS[k]));
      c.appendChild(el('i','',onTime||late?'✓':String(P.parseYmd(d).getUTCDate())));w.appendChild(c);
    }
  }
  function drawToday(){
    var store=P.load(),pick=todayIssue(),is=pick.is,done=!!store.daily[is.id];
    $('#hDate').textContent=mmdd(TODAY)+' · 周'+weekday(TODAY);
    $('#cTag').textContent=(pick.isToday?'今天 · ':'最近一期 · ')+is.kind;$('#cQ').textContent=is.cover;
    $('#cB').src=R[is.who].src;$('#cB').alt=R[is.who].name;
    $('#tTitle').textContent=is.title;$('#tMeta').textContent=is.meta;
    $('#tTested').textContent=D.DEMO?'示意内容 · 上线前实测':(is.tested||'');$('#tTested').hidden=!D.DEMO&&!is.tested;
    var b=$('#tGo');
    var gain=pick.isToday?D.XP.today:D.XP.makeup;
    b.textContent=done?'已完成 · 再玩一次':is.btn+' · 得 '+gain+' 经验';b.className='btn'+(done?' done':'');
    b.onclick=function(){openIssue(is)};
    $('#tNote').hidden=pick.isToday;
  }
  function drawPast(){
    var store=P.load(),p=$('#past'),pick=todayIssue();p.innerHTML='';
    var start=weekStart(TODAY),list=D.ISSUES.filter(function(x){return x.id!==pick.is.id&&x.date>=P.addDays(start,-7)&&x.date<=P.addDays(start,6)})
      .sort(function(a,b){return a.date<b.date?-1:1});
    list.forEach(function(is){
      var open=playable(is),done=!!store.daily[is.id];
      var b=el('button','pi');b.type='button';b.disabled=!open;b.setAttribute('data-issue',is.id);
      var im=el('img');im.src=open?R[is.who].src:R.a.src;im.alt='';if(!open)im.style.opacity='.45';b.appendChild(im);
      var t=el('span','t');t.appendChild(el('small','','周'+weekday(is.date)+' · '+is.kind));t.appendChild(el('b','',open?is.title:'周'+weekday(is.date)+'揭晓'));b.appendChild(t);
      b.appendChild(el('span','pill'+(!open?' lock':done?' ok':''),!open?'还没到':done?'已完成':'补玩'));
      if(open)b.addEventListener('click',function(){openIssue(is)});
      p.appendChild(b);
    });
    p.hidden=!list.length;
  }
  function drawHome(up){drawLevel(up);drawWeek();drawToday();drawPast()}

  /* ---------- 一期里的通用工具 ---------- */
  function say(text){var n=$('#narr');n.innerHTML='';n.appendChild(el('span','',text))}
  function setProg(n,total){var p=$('#prog');p.innerHTML='';for(var k=0;k<total;k++){var s=el('span');if(k<n)s.className='on';p.appendChild(s)}}
  function panel(){return $('#panel')}
  function stage(){return $('#stage')}
  function choose(opts,t){
    var pn=panel();pn.innerHTML='';var box=el('div','fb');box.hidden=true;var anyOk=opts.some(function(o){return o.ok});
    return new Promise(function(res){
      opts.forEach(function(o){
        var b=btn('opt',o.text,'opt');
        b.addEventListener('click',function(){
          if(t!==clock.run)return;
          if(!anyOk){pn.innerHTML='';res(o);return}
          if(o.ok){b.classList.add('right');[].forEach.call(pn.querySelectorAll('.opt'),function(x){x.disabled=true});P.feedback(box,true,o.fb);
            var go=btn('btn','继续','next');go.addEventListener('click',function(){if(t===clock.run)res(o)},{once:true});pn.appendChild(go)}
          else{P.shake(b);P.feedback(box,false,o.fb)}
        });
        pn.appendChild(b);
      });
      pn.appendChild(box);
    });
  }
  function nextBtn(label,t){var pn=panel();pn.innerHTML='';var b=btn('btn',label,'next');pn.appendChild(b);return P.waitClick(b,t)}
  function aiRow(){var r=el('div','row2');var im=el('img');im.src=R.a.src;im.alt='小A';r.appendChild(im);return r}
  function personRow(who,text){var r=el('div','row2');var im=el('img');im.src=R[who].src;im.alt=R[who].name;r.appendChild(im);r.appendChild(el('div','bub',text));return r}

  /* ---------- 做完一期：记经验 ---------- */
  function finish(is){
    var store=P.load(),first=!store.daily[is.id],before=P.levelInfo(store.xp).index,gain=0,bonus=0;
    if(first){
      var onTime=is.date===TODAY;
      store.daily[is.id]=TODAY;
      gain=onTime?D.XP.today:D.XP.makeup;
      if(onTime){var s=streak(store);if(s>=D.XP.streakFrom)bonus=D.XP.streakBonus}
      store.xp+=gain+bonus;P.save(store);
    }
    var info=P.levelInfo(store.xp),up=info.index>before;
    setProg(1,1);say(up?'升级了！':'这期做完了。');
    var st=stage();st.innerHTML='';var box=el('div','done-box');
    var im=el('img');im.src=R.a.src;im.alt='';box.appendChild(im);
    box.appendChild(el('div','xp',first?'+'+(gain+bonus)+' 经验':'已完成'));
    if(bonus)box.appendChild(el('p','','含连续参与奖励 +'+bonus));
    if(up)box.appendChild(el('p','strong','你升到了「'+info.name+'」'));
    box.appendChild(el('p','',is.done));
    st.appendChild(box);
    var pn=panel();pn.innerHTML='';var two=el('div','two');
    var learn=btn('btn soft','去学 AI');
    learn.addEventListener('click',function(){if(P.PREVIEW){P.toast('在网站里，这里会打开学 AI 对应的课');return}location.href='xue-ai.html'+(is.learn?'#'+is.learn:'')});
    var home=btn('btn','回到每日 AI','finish');home.addEventListener('click',function(){goHome(up||first)});
    two.appendChild(learn);two.appendChild(home);pn.appendChild(two);
  }

  /* ---------- 玩法：故事分支 ---------- */
  var BUNNY='<svg class="bunny" id="bunny" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="38" cy="22" rx="8" ry="22" fill="#fff"/><ellipse cx="62" cy="22" rx="8" ry="22" fill="#fff"/><ellipse cx="38" cy="24" rx="3.5" ry="15" fill="#F7B6C2"/><ellipse cx="62" cy="24" rx="3.5" ry="15" fill="#F7B6C2"/><ellipse cx="50" cy="74" rx="30" ry="24" fill="#fff"/><circle cx="50" cy="50" r="22" fill="#fff"/><circle cx="42" cy="48" r="3" fill="#161A23"/><circle cx="58" cy="48" r="3" fill="#161A23"/><ellipse cx="50" cy="56" rx="3" ry="2" fill="#F48FA0"/><circle cx="36" cy="56" r="4" fill="#F7B6C2" opacity=".6"/><circle cx="64" cy="56" r="4" fill="#F7B6C2" opacity=".6"/></svg>';
  var PROPS={
    forest:'<svg class="prop" id="prop" style="left:14px" width="90" height="120" viewBox="0 0 90 120" aria-hidden="true"><path d="M45 4L8 70h74z" fill="#2A6B47"/><path d="M45 30L12 96h66z" fill="#3A8A5C"/><rect x="39" y="96" width="12" height="20" fill="#6B4A2E"/><circle cx="60" cy="60" r="4" fill="#FFE27A"/><circle cx="30" cy="80" r="3" fill="#FFE27A"/></svg>',
    sea:'<svg class="prop" id="prop" style="left:10px" width="110" height="90" viewBox="0 0 110 90" aria-hidden="true"><path d="M10 60h90l-12 22H22z" fill="#C46A3B"/><rect x="52" y="14" width="4" height="46" fill="#fff"/><path d="M56 16l34 36H56z" fill="#FFE7A1"/></svg>',
    home:'<svg class="prop" id="prop" style="left:12px" width="110" height="100" viewBox="0 0 110 100" aria-hidden="true"><path d="M10 48L55 12l45 36v48H10z" fill="#F2C7A5"/><path d="M4 50L55 8l51 42" fill="none" stroke="#7A3E4E" stroke-width="8" stroke-linecap="round"/><rect x="24" y="56" width="24" height="22" rx="3" fill="#FFE27A"/><rect x="64" y="60" width="20" height="36" rx="3" fill="#7A3E4E"/></svg>'
  };
  function stars(box,n){for(var k=0;k<n;k++){var s=el('i','star');s.style.left=(4+((k*41)%92))+'%';s.style.top=(6+((k*29)%45))+'%';s.style.animationDelay=(k%4)*.5+'s';box.appendChild(s)}}
  function playStory(is,t){
    var st=stage();
    st.innerHTML='<div class="scene" id="scene"><div class="moon"></div><div class="ground"></div><span id="propBox"></span>'+BUNNY+'<span class="zz">Z z</span></div><div class="storyline"><span id="sl"></span></div>';
    stars($('#scene'),12);
    var sl=$('#sl'),vars={},total=is.steps.length+1;
    setProg(1,total);say(is.intro);
    var p=P.sleep(500,t).then(function(){return P.type(sl,is.start,t)});
    is.steps.forEach(function(step,k){
      p=p.then(function(){say(step.ask);return choose(step.opts,t)}).then(function(o){
        setProg(k+2,total);
        if(o.scene){$('#scene').className='scene '+o.scene;$('#propBox').innerHTML=PROPS[o.scene]||'';setTimeout(function(){var pr=$('#prop');if(pr)pr.classList.add('on')},50)}
        if(o.vars)vars=o.vars;
        if(o.sleep)$('#bunny').classList.add('sleep');
        say('小A 接着往下编……');
        return P.type(sl,o.line.replace(/\{(\w+)\}/g,function(_,k2){return vars[k2]||''}),t);
      });
    });
    return p.then(function(){say(is.outro);return P.sleep(1000,t)}).then(function(){return nextBtn('完成这一期',t)}).then(function(){finish(is)});
  }

  /* ---------- 玩法：找茬 ---------- */
  function playSpot(is,t){
    setProg(1,2);say(is.intro);
    var st=stage();st.innerHTML='';
    var chat=el('div','chat');chat.appendChild(personRow(is.who,is.ask));
    var r2=aiRow(),ans=el('div','ans');r2.appendChild(ans);chat.appendChild(r2);st.appendChild(chat);
    var box=el('div','fb'),nodes=[];box.hidden=true;
    var p=Promise.resolve();
    is.sentences.forEach(function(s){p=p.then(function(){var b=btn('sent','');b.disabled=true;ans.appendChild(b);nodes.push({s:s,b:b});return P.type(b,s.t,t,30)})});
    return p.then(function(){say('哪一句是错的？点它。');panel().innerHTML='';panel().appendChild(box);
      return new Promise(function(ok){nodes.forEach(function(n){n.b.disabled=false;n.b.setAttribute('data-role','opt');n.b.addEventListener('click',function(){
        if(t!==clock.run)return;
        if(n.s.bad){n.b.classList.add('hit');nodes.forEach(function(x){x.b.disabled=true});P.feedback(box,true,is.hit);setProg(2,2);ok()}
        else{P.shake(n.b);P.feedback(box,false,is.miss)}
      })})})})
    .then(function(){say(is.outro);var b=btn('btn','完成这一期','next');panel().appendChild(b);return P.waitClick(b,t)})
    .then(function(){finish(is)});
  }

  /* ---------- 玩法：连续选择题（可带一段聊天记录） ---------- */
  function playQuiz(is,t){
    var st=stage();st.innerHTML='';var total=is.questions.length;
    setProg(1,total);say(is.intro);
    var p=Promise.resolve();
    if(is.chat){
      var ph=el('div','phone');
      var m1=el('div','msg');m1.appendChild(el('div','ava',is.chat.from));var v=el('div','voice');v.innerHTML='<span class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';v.appendChild(document.createTextNode('语音 '+is.chat.voice));m1.appendChild(v);ph.appendChild(m1);
      var m2=el('div','msg');m2.appendChild(el('div','ava',is.chat.from));var tm=el('div','text-msg');m2.appendChild(tm);ph.appendChild(m2);st.appendChild(ph);
      var plain=is.chat.text.map(function(x){return typeof x==='string'?x:x.t}).join('');
      p=P.sleep(600,t).then(function(){return P.type(tm,plain,t,40)}).then(function(){
        tm.innerHTML='';is.chat.text.forEach(function(x){if(typeof x==='string')tm.appendChild(document.createTextNode(x));else{var r=el('span','red',x.t);r.setAttribute('data-m',x.m);tm.appendChild(r)}})});
    }
    is.questions.forEach(function(q,k){
      p=p.then(function(){setProg(k+1,total);
        if(q.mark)q.mark.forEach(function(m,j){setTimeout(function(){var r=st.querySelector('[data-m="'+m+'"]');if(r)r.classList.add('on')},j*350)});
        say(q.q);return choose(q.opts,t)});
    });
    return p.then(function(){finish(is)});
  }

  /* ---------- 玩法：拼一句好问法 ---------- */
  function playPuzzle(is,t){
    setProg(1,2);say(is.intro);
    var st=stage();st.innerHTML='';
    var chat=el('div','chat'),r=el('div','row2'),im=el('img');im.src=R[is.who].src;im.alt=R[is.who].name;r.appendChild(im);
    var bub=el('div','bub building');bub.appendChild(el('span','ph','（还没拼好）'));r.appendChild(bub);chat.appendChild(r);st.appendChild(chat);
    var got=0;
    return P.sleep(400,t).then(function(){
      say(is.goal);var pn=panel();pn.innerHTML='';
      var pool=el('div','pool'),box=el('div','fb');box.hidden=true;
      var all=is.pieces.map(function(x){return {t:x}}).concat(is.extra||[]);
      pool.setAttribute('aria-label','可以拼的词块');
      pn.appendChild(pool);pn.appendChild(box);
      return new Promise(function(ok){
        P.shuffle(all,all.length*5+1).forEach(function(piece){
          var b=btn('',piece.t,'order');
          b.addEventListener('click',function(){
            if(t!==clock.run)return;
            if(piece.fb){P.shake(b);P.feedback(box,false,piece.fb);return}
            if(piece.t===is.pieces[got]){got++;b.remove();var ph=bub.querySelector('.ph');if(ph)ph.remove();bub.appendChild(el('span','add',piece.t));box.hidden=true;
              if(got===is.pieces.length){ok()}}
            else{P.shake(b);P.feedback(box,false,'顺序不对。先说「我是谁」，再说要做什么，然后是细节和要求。')}
          });
          pool.appendChild(b);
        });
      });
    }).then(function(){setProg(2,2);panel().innerHTML='';say('拼好了，发给小A。');
      var r2=aiRow(),a=el('div','bub ai');r2.appendChild(a);chat.appendChild(r2);return P.sleep(500,t).then(function(){return P.type(a,is.reply,t,40)})})
    .then(function(){say(is.outro);return P.sleep(600,t)}).then(function(){return nextBtn('完成这一期',t)}).then(function(){finish(is)});
  }

  /* ---------- 玩法：今日一句 ---------- */
  function playOneline(is,t){
    setProg(1,2);say(is.intro);
    var st=stage();st.innerHTML='';
    var c=el('div','oneline');c.appendChild(el('p','scene-tx',is.scene));
    var q=el('div','quote');var qt=el('span');q.appendChild(qt);c.appendChild(q);c.appendChild(el('p','tip',is.tip));st.appendChild(c);
    return P.sleep(500,t).then(function(){return P.type(qt,is.line,t,45)}).then(function(){
      say('复制这一句，去你的 AI 里试一次。');var pn=panel();pn.innerHTML='';
      var cp=btn('btn soft','复制这一句','copy'),tried=btn('btn','我试过了','next');tried.disabled=true;
      cp.addEventListener('click',function(){P.copy(is.line,'已复制，去你的 AI 里试试');tried.disabled=false;setProg(2,2)});
      pn.appendChild(cp);pn.appendChild(tried);pn.appendChild(el('p','foot','复制以后才能点「我试过了」。'));
      return P.waitClick(tried,t);
    }).then(function(){finish(is)});
  }

  /* ---------- 玩法：两边归类 ---------- */
  function playSort(is,t){
    var st=stage();st.innerHTML='';
    var hero=el('div','sorthero');var im=el('img');im.src=R[is.who].src;im.alt=R[is.who].name;hero.appendChild(im);var im2=el('img');im2.src=R.a.src;im2.alt='小A';hero.appendChild(im2);st.appendChild(hero);
    say(is.intro);var i=0,total=is.items.length;setProg(0,total);
    return P.sleep(500,t).then(function(){return new Promise(function(ok){
      (function one(){
        if(t!==clock.run)return;
        if(i>=total)return ok();
        var it=is.items[i],pn=panel();pn.innerHTML='';setProg(i,total);say('第 '+(i+1)+' 张：小A 能做吗？');
        var card=el('div','sortcard');card.appendChild(el('small','',(i+1)+' / '+total));card.appendChild(document.createTextNode(it.text));
        var two=el('div','two'),box=el('div','fb');box.hidden=true;
        is.labels.forEach(function(lab,k){var b=btn('btn soft',lab,'sort');
          b.addEventListener('click',function(){if(t!==clock.run)return;
            if(k===it.a){[].forEach.call(two.children,function(x){x.disabled=true});P.feedback(box,true,it.fb);setProg(i+1,total);
              var go=btn('btn',i+1<total?'下一张':'继续','next');pn.appendChild(go);go.addEventListener('click',function(){i++;one()},{once:true})}
            else{P.shake(card);P.feedback(box,false,'再想想。'+it.fb)}});
          two.appendChild(b)});
        pn.appendChild(card);pn.appendChild(two);pn.appendChild(box);
      })();
    })}).then(function(){say(is.outro);return nextBtn('完成这一期',t)}).then(function(){finish(is)});
  }

  /* ---------- 玩法：新工具尝鲜（手机演示） ---------- */
  var CAM='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  function playWalk(is,t){
    var st=stage();st.innerHTML='';var total=is.steps.length;
    var ph=el('div','mock');var scr=el('div','screen');var bar=el('div','inputbar');
    var cam=el('span','cam');cam.innerHTML=CAM;var field=el('span','field','发消息…');var send=el('span','sendbtn','发送');
    bar.appendChild(cam);bar.appendChild(field);bar.appendChild(send);ph.appendChild(scr);ph.appendChild(bar);st.appendChild(ph);
    say(is.intro);
    var p=P.sleep(600,t);
    is.steps.forEach(function(s,k){
      p=p.then(function(){setProg(k+1,total);say(s.narr);
        cam.classList.toggle('glow',s.screen==='camera');send.classList.toggle('glow',s.screen==='ask');
        if(s.screen==='photo'){scr.innerHTML='';var v=el('div','viewfinder');v.innerHTML=ART.fridge||'';scr.appendChild(v)}
        if(s.screen==='ask'){scr.innerHTML='';var mine=el('div','mine');mine.innerHTML=ART.fridge||'';scr.appendChild(mine);var q=el('div','mine-q');scr.appendChild(q);field.textContent='';
          return P.type(field,s.ask,t,40).then(function(){return s})}
        if(s.screen==='answer'){var q2=scr.querySelector('.mine-q');if(q2)q2.textContent=field.textContent;field.textContent='发消息…';var a=el('div','reply');scr.appendChild(a);
          return P.sleep(500,t).then(function(){return P.type(a,s.answer,t,30)}).then(function(){return s})}
        return s;
      }).then(function(s){
        if(!s.tap)return;
        var pn=panel();pn.innerHTML='';var b=btn('btn',s.tap,'next');pn.appendChild(b);return P.waitClick(b,t).then(function(){pn.innerHTML=''});
      });
    });
    return p.then(function(){say(is.outro);return P.sleep(600,t)}).then(function(){return nextBtn('完成这一期',t)}).then(function(){finish(is)});
  }

  var PLAY={story:playStory,spot:playSpot,quiz:playQuiz,puzzle:playPuzzle,oneline:playOneline,sort:playSort,walk:playWalk};
  function openIssue(is){
    var t=++clock.run;$('#home').hidden=true;$('#play').hidden=false;window.scrollTo(0,0);
    $('#pTag').textContent='周'+weekday(is.date)+' · '+is.kind;$('#pTitle').textContent=is.title;
    panel().innerHTML='';stage().innerHTML='';
    P.track('site_view',{page:'meiri-ai',game:is.id});
    (PLAY[is.type]||playSpot)(is,t).catch(function(){});
  }
  function goHome(up){clock.run++;$('#play').hidden=true;$('#home').hidden=false;window.scrollTo(0,0);drawHome(up)}

  function boot(){
    var cv=$('#cover');stars(cv,14);var a=$('#cA');a.src=R.a.src;
    $('#back').addEventListener('click',function(){goHome(false)});
    $('#foot').textContent='每期 3 分钟内玩完，做完才算完成。当天完成得 '+D.XP.today+' 经验，补玩得 '+D.XP.makeup+' 经验；连续 '+D.XP.streakFrom+' 天以上每天再加 '+D.XP.streakBonus+'。断了不扣等级。';
    P.nav('daily');
    drawHome(false);
    // 首页的今日卡片带着 #期号 过来时，直接打开这一期
    var h=(location.hash||'').slice(1),hit=D.ISSUES.filter(function(x){return x.id===h})[0];
    if(hit&&playable(hit)){openIssue(hit);try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
    P.track('site_view',{page:'meiri-ai'});
  }
  boot();
})();
