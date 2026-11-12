/* 学 AI：目录 + 动画互动课。课程内容在 xue-ai-data.js，真实教程（跟着做）的标题和进度从 guides-data.js 和本机记录里读。 */
(function(){
  'use strict';
  var P=window.AIPlay,D=window.AINPE_XUE,ART=window.AIArt||{};
  var $=P.$,el=P.el,btn=P.btn,clock=P.clock,R=P.ROLES;
  var GUIDES=window.AINPE_GUIDES||[];
  var cur=null,curId='',actIdx=0,pageToken={};

  /* ---------- 跟着做（真实教程）的标题、地址和进度 ---------- */
  function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
  // 有角色剧本的教程打开「跟着做 · 动画版」（zuo.html），其余打开原来的图文教程
  function zuoHref(id){var z=window.AINPE_ZUO&&window.AINPE_ZUO.SCRIPTS;return z&&z[id]?'zuo.html?id='+encodeURIComponent(id):''}
  function project(id){
    var g=GUIDES.filter(function(x){return x.id===id})[0],page=D.PROJECT_PAGES[id],zuo=zuoHref(id);
    if(page){
      var s=(readJSON('ainpe:learn')||{})[id]||{},ex=null,m=readJSON('ainpe:guide:'+id)||{},n0=0;
      ((window.AINPE_ZUO&&window.AINPE_ZUO.EXTRA)||[]).forEach(function(x){if(x.id===id)ex=x});
      if(ex)for(var j=0;j<ex.steps.length;j++)if(m[j])n0++;
      return {id:id,title:page.title,href:zuo||page.href,zuo:!!zuo,done:!!(s.done||s.basicDone),step:s.done||(ex&&n0>=ex.steps.length)?'做完了':s.basicDone?'看完教程':n0&&ex?'做到第 '+n0+' / '+ex.steps.length+' 步':''};
    }
    if(!g)return null;
    var marks=readJSON('ainpe:guide:'+id)||{},total=g.steps.length,n=0;
    for(var k=0;k<total;k++)if(marks[k])n++;
    return {id:id,title:g.title,href:zuo||'guide.html?id='+encodeURIComponent(id),zuo:!!zuo,done:total>0&&n>=total,step:n?(n>=total?'做完了':'做到第 '+n+' / '+total+' 步'):''};
  }
  function lessonDone(id,store){return !!store.lessons[id]}
  function unitState(u,store){
    var lessons=u.lessons.filter(function(id){return lessonDone(id,store)}).length;
    var projects=(u.projects||[]).map(project).filter(Boolean);
    var made=projects.filter(function(p){return p.done}).length;
    var need=u.needProjects||0;
    return {lessons:lessons,total:u.lessons.length,projects:projects,made:made,badge:lessons===u.lessons.length&&made>=need};
  }

  /* ---------- 舞台 ---------- */
  var stage,narr,youB,youT,aiB,aiT,aiArt,marks,demo,aiWho,panel;
  function grab(){stage=$('#stage');narr=$('#narr');youB=$('#youBubble');youT=$('#youText');aiB=$('#aiBubble');aiT=$('#aiText');aiArt=$('#aiArt');marks=$('#marks');demo=$('#demo');aiWho=$('#aiWho');panel=$('#panel')}
  function say(text){narr.innerHTML='';narr.appendChild(el('span','',text))}
  function mood(m){stage.classList.remove('ai-flat','ai-confused','ai-happy');stage.classList.add('ai-'+m)}
  function show(node){node.hidden=false;node.style.animation='none';void node.offsetWidth;node.style.animation=''}
  function setMarks(n){marks.hidden=n<=0;[].forEach.call(marks.children,function(b,i){b.classList.toggle('gone',i>=n)})}
  function clearStamp(){var s=aiB.querySelector('.stamp');if(s)s.remove()}
  function person(k){$('#personImg').src=R[k].src;$('#personName').textContent=R[k].name}
  function nod(){aiWho.classList.remove('nod');void aiWho.offsetWidth;aiWho.classList.add('nod')}

  var DO={
    say:function(s,t){say(s.text);return P.sleep(450,t)},
    person:function(s){person(s.who);return Promise.resolve()},
    mood:function(s){mood(s.m);return Promise.resolve()},
    marks:function(s,t){setMarks(s.n);return P.sleep(700,t)},
    clear:function(){youB.hidden=true;aiB.hidden=true;demo.hidden=true;clearStamp();setMarks(0);mood('flat');return Promise.resolve()},
    you:function(s,t){show(youB);if(s.instant){youT.textContent=s.text;return P.sleep(500,t)}return P.type(youT,s.text,t,s.sp||70).then(function(){return P.sleep(450,t)})},
    ai:function(s,t){
      if(s.mood)mood(s.mood);if(s.mood==='happy')setMarks(0);clearStamp();
      aiArt.innerHTML=s.art&&ART[s.art]?ART[s.art]:'';show(aiB);demo.hidden=!D.DEMO;
      return P.sleep(s.art?500:0,t).then(function(){return P.type(aiT,s.text,t,s.sp||40)}).then(function(){return P.sleep(450,t)})},
    stamp:function(s,t){clearStamp();aiB.appendChild(el('b','stamp','做成了'));return P.sleep(500,t)},
    next:function(s,t){panel.innerHTML='';var b=btn('btn',s.label||'继续','next');panel.appendChild(b);return P.waitClick(b,t).then(function(){panel.innerHTML=''})},
    choice:function(s,t){
      panel.innerHTML='';var fb=el('div','fb');fb.hidden=true;
      return new Promise(function(ok){
        s.opts.forEach(function(o){
          var b=btn('opt',o.text,'opt');
          b.addEventListener('click',function(){
            if(t!==clock.run)return;
            if(o.ok){b.classList.add('right');[].forEach.call(panel.querySelectorAll('.opt'),function(x){x.disabled=true});mood('happy');setMarks(0);P.feedback(fb,true,o.fb);
              var go=btn('btn','继续','next');panel.appendChild(go);go.addEventListener('click',function(){if(t===clock.run)ok()},{once:true})}
            else{P.shake(b);mood('confused');P.feedback(fb,false,o.fb+'再看看别的。')}
          });
          panel.appendChild(b);
        });
        panel.appendChild(fb);
      });
    },
    sort:function(s,t){
      var i=0;
      return new Promise(function(ok){
        (function one(){
          if(t!==clock.run)return;
          if(i>=s.items.length)return ok();
          var it=s.items[i];panel.innerHTML='';mood('flat');
          var card=el('div','sortcard');card.appendChild(el('small','',(i+1)+' / '+s.items.length));card.appendChild(document.createTextNode(it.text));
          var two=el('div','two'),fb=el('div','fb');fb.hidden=true;
          s.labels.forEach(function(lab,k){
            var b=btn('btn soft',lab,'sort');
            b.addEventListener('click',function(){
              if(t!==clock.run)return;
              if(k===it.a){[].forEach.call(two.children,function(x){x.disabled=true});mood('happy');P.feedback(fb,true,it.fb);
                var go=btn('btn',i+1<s.items.length?'下一个':'继续','next');panel.appendChild(go);
                go.addEventListener('click',function(){i++;one()},{once:true})}
              else{P.shake(card);mood('confused');P.feedback(fb,false,'再想想。'+it.fb)}
            });
            two.appendChild(b);
          });
          panel.appendChild(card);panel.appendChild(two);panel.appendChild(fb);
        })();
      });
    },
    order:function(s,t){
      panel.innerHTML='';var got=0;
      var list=el('ol','orderlist'),pool=el('div','pool'),fb=el('div','fb');fb.hidden=true;
      panel.appendChild(el('div','sub','按顺序点：'));panel.appendChild(list);panel.appendChild(pool);panel.appendChild(fb);
      return new Promise(function(ok){
        P.shuffle(s.items,s.items.length*7+3).forEach(function(text){
          var b=btn('',text,'order');
          b.addEventListener('click',function(){
            if(t!==clock.run)return;
            if(text===s.items[got]){got++;b.remove();var li=el('li');li.appendChild(el('b','',String(got)));li.appendChild(document.createTextNode(text));list.appendChild(li);nod();fb.hidden=true;
              if(got===s.items.length){mood('happy');P.feedback(fb,true,s.fb);var go=btn('btn','继续','next');panel.appendChild(go);go.addEventListener('click',function(){if(t===clock.run)ok()},{once:true})}}
            else{P.shake(b);mood('confused');P.feedback(fb,false,'这一步还没到，想想先做哪个。')}
          });
          pool.appendChild(b);
        });
      });
    },
    build:function(s,t){
      var picked={},left=s.chips.length;
      function draw(){youT.innerHTML='';s.tpl.forEach(function(p){
        if(typeof p==='string'){youT.appendChild(document.createTextNode(p));return}
        if(picked[p.k]){var c=s.chips.filter(function(x){return x.k===p.k})[0];youT.appendChild(el('span','add',c.text))}})}
      show(youB);draw();setMarks(Math.min(3,left));panel.innerHTML='';
      var chips=el('div','chips'),send=btn('btn',s.send,'next');send.disabled=true;
      s.chips.forEach(function(c){
        var b=btn('chip',c.label,'chip');b.setAttribute('aria-pressed','false');b.appendChild(el('small','',c.sub));
        b.addEventListener('click',function(){
          if(t!==clock.run||picked[c.k])return;picked[c.k]=1;left--;b.classList.add('used');b.setAttribute('aria-pressed','true');
          draw();setMarks(Math.min(3,left));nod();
          if(!left){mood('flat');say(s.ready);send.disabled=false}
        });
        chips.appendChild(b);
      });
      panel.appendChild(chips);panel.appendChild(send);
      return P.waitClick(send,t).then(function(){panel.innerHTML=''});
    },
    end:function(s,t){
      var store=P.load(),u=unitOf(curId),before=unitState(u,store).badge,first=!store.lessons[curId];
      store.lessons[curId]=1;P.save(store);
      var after=unitState(u,store);
      say('这节学完了。'+s.done);mood('happy');panel.innerHTML='';
      if(first&&after.badge&&!before)panel.appendChild(badgeLine(u));
      else if(after.lessons===after.total&&!after.badge&&(u.needProjects||0)>after.made)panel.appendChild(hintLine('再跟着做完一件作品，就能拿到这个单元的徽章。'));
      var two=el('div','two'),nextId=nextLesson(curId);
      if(s.copy){var cp=btn('btn soft','复制去试试');cp.addEventListener('click',function(){P.copy(s.copy,'已复制，去你的 AI 里试试')});two.appendChild(cp)}
      else if(nextId){var home=btn('btn soft','回到目录');home.addEventListener('click',goHome);two.appendChild(home)}
      var nx=btn('btn',nextId?'学下一节':'回到目录','finish');
      nx.addEventListener('click',function(){nextId?openLesson(nextId):goHome()});two.appendChild(nx);
      if(two.children.length===1)two.style.gridTemplateColumns='1fr';
      panel.appendChild(two);
      return new Promise(function(){});
    }
  };
  function badgeLine(u){var f=el('div','fb');f.appendChild(el('b','tag','新徽章'));f.appendChild(document.createTextNode('学完了「'+shortName(u)+'」'));return f}
  function hintLine(text){var f=el('div','fb');f.textContent=text;return f}
  function shortName(u){return u.name.replace(/^第 \d 单元 /,'')}

  function unitOf(id){return D.UNITS.filter(function(x){return x.lessons.indexOf(id)>=0})[0]}
  function nextLesson(id){var i=D.ORDER.indexOf(id);return i>=0&&i+1<D.ORDER.length?D.ORDER[i+1]:null}

  function runAct(a){
    var t=++clock.run;actIdx=a;
    [].forEach.call($('#prog').children,function(sp,i){sp.classList.toggle('on',i<=a)});
    panel.innerHTML='';DO.clear();youT.textContent='';aiT.textContent='';aiArt.innerHTML='';person(cur.who);
    var p=Promise.resolve();
    cur.acts[a].forEach(function(s){p=p.then(function(){if(t!==clock.run)throw 'stop';return DO[s.t](s,t)})});
    p.then(function(){if(t===clock.run&&a+1<cur.acts.length)runAct(a+1)}).catch(function(){});
  }
  function openLesson(id){
    var L=D.LESSONS[id];if(!L)return goHome();
    curId=id;cur=L;var u=unitOf(id);
    $('#lUnit').textContent=u.name+' · 第 '+(u.lessons.indexOf(id)+1)+' 节';$('#lTitle').textContent=L.title;
    var prog=$('#prog');prog.innerHTML='';L.acts.forEach(function(){prog.appendChild(el('span'))});
    $('#home').hidden=true;$('#lesson').hidden=false;window.scrollTo(0,0);
    try{history.replaceState(null,'','#'+id)}catch(e){}
    P.track('site_view',{page:'xue-ai',game:id});
    runAct(0);
  }
  function openProject(p){
    if(P.PREVIEW){if(p.zuo&&typeof window.AINPE_PREVIEW_GO==='function'){window.AINPE_PREVIEW_GO('zuo','',p.href);return}P.toast('在网站里，这里会打开「'+p.title+'」');return}
    location.href=p.href;
  }
  function goHome(){
    clock.run++;cur=null;curId='';$('#lesson').hidden=true;$('#home').hidden=false;
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    drawHome();window.scrollTo(0,0);
  }

  function coverBox(id){
    var box=el('span','pcover');box.setAttribute('data-guide-cover',id);box.hidden=true;
    box.appendChild(el('img'));box.querySelector('img').alt='';
    var inline=window.AINPE_COVER_SRC&&window.AINPE_COVER_SRC[id];
    if(inline){box.querySelector('img').src=inline;box.hidden=false}
    return box;
  }
  function drawHome(){
    var store=P.load(),box=$('#units');box.innerHTML='';
    var total=0,done=0,badges=0,resume=null;
    D.UNITS.forEach(function(u){
      var st=unitState(u,store),card=el('div','unit');
      var head=el('div','unit-head');var txt=el('div');txt.appendChild(el('span','lv',u.level));txt.appendChild(el('h2','',shortName(u)));head.appendChild(txt);
      head.appendChild(el('span','count',(st.badge?'徽章 · ':'')+st.lessons+' / '+st.total));
      if(st.badge){badges++;head.classList.add('got')}
      card.appendChild(head);card.appendChild(el('div','sub',u.name.match(/^第 \d 单元/)[0]+' · '+u.sub));
      u.lessons.forEach(function(id,i){
        var L=D.LESSONS[id],d=lessonDone(id,store);total++;if(d)done++;else if(!resume)resume=id;
        var b=el('button','item'+(d?' done':''));b.type='button';b.setAttribute('data-lesson',id);
        b.appendChild(el('span','n',d?'✓':String(i+1)));
        var tt=el('span','t');tt.appendChild(el('b','',L.title));tt.appendChild(el('small','',L.mins+' 分钟 · '+R[L.who].name));b.appendChild(tt);
        b.appendChild(el('span','w',d?'学完了':'›'));
        b.addEventListener('click',function(){openLesson(id)});card.appendChild(b);
      });
      if(st.projects.length){
        var ph=el('div','proj-head');ph.appendChild(el('b','','跟着做 · 真实教程'));
        ph.appendChild(el('small','',u.needProjects?'做完 '+u.needProjects+' 件就能拿徽章':'学完可以试试，不做也不影响徽章'));card.appendChild(ph);
        st.projects.forEach(function(p){
          var b=el('button','proj'+(p.done?' done':''));b.type='button';b.setAttribute('data-project',p.id);
          b.appendChild(coverBox(p.id));
          var tt=el('span','t');tt.appendChild(el('b','',p.title));tt.appendChild(el('small','',p.step||(p.zuo?'先看演示，再跟着做':'分步骤 · 提示词可复制')));b.appendChild(tt);
          b.appendChild(el('span','w',p.done?'做完了':'去做 ›'));
          b.addEventListener('click',function(){openProject(p)});card.appendChild(b);
        });
      }
      box.appendChild(card);
    });
    $('#sum').textContent='已学完 '+done+' / '+total+' 节 · 徽章 '+badges+' 枚';
    var rb=$('#resume');
    if(resume){var L=D.LESSONS[resume],u=unitOf(resume);rb.hidden=false;$('#rTitle').textContent=L.title;$('#rUnit').textContent=(done?'接着学 · ':'从这里开始 · ')+u.name.match(/^第 \d 单元/)[0]+'第 '+(u.lessons.indexOf(resume)+1)+' 节';
      $('#rGo').textContent=done?'继续学':'开始学';$('#rGo').onclick=function(){openLesson(resume)}}
    else rb.hidden=true;
    $('#demoNote').hidden=!D.DEMO;
    if(window.LearnCovers&&!window.AINPE_COVER_SRC)window.LearnCovers.apply(box);
  }

  function boot(){
    grab();
    var a=$('#aiChar');a.querySelector('img').src=R.a.src;a.insertAdjacentHTML('beforeend',P.FACE);
    var faces=$('#castFaces');['a','lin','yuan','zhou'].forEach(function(k){var i=el('img');i.src=R[k].src;i.alt=R[k].name;faces.appendChild(i)});
    $('#back').addEventListener('click',goHome);
    $('#replay').addEventListener('click',function(){if(cur)runAct(actIdx)});
    P.nav('learn');
    var h=(location.hash||'').slice(1);
    if(h&&D.LESSONS[h])openLesson(h);else drawHome();
    var token=pageToken;
    window.addEventListener('hashchange',function(){if(token!==pageToken||!document.body.contains(stage))return;var k=(location.hash||'').slice(1);if(k&&D.LESSONS[k]&&k!==curId)openLesson(k)});
    window.addEventListener('pageshow',function(e){if(e.persisted&&!cur)drawHome()});
    P.track('site_view',{page:'xue-ai'});
  }
  boot();
})();
