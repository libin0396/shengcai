/* 我的：AI 等级卡、学 AI 徽章、学过的课、跟着做的作品。只读本机记录。 */
(function(){
  'use strict';
  var P=window.AIPlay,X=window.AINPE_XUE||{UNITS:[],LESSONS:{},ORDER:[],PROJECT_PAGES:{}},M=window.AINPE_MEIRI||{ISSUES:[],XP:{today:10,makeup:5,streakBonus:5,streakFrom:3}};
  var $=P.$,el=P.el,R=P.ROLES,GUIDES=window.AINPE_GUIDES||[];
  var TODAY=P.today();
  var STEP_ICON='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h6v-5h6v-5h6"/></svg>';

  function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
  function byDate(d){return (M.ISSUES||[]).filter(function(x){return x.date===d})[0]||null}
  function doneOnDay(store,d){var is=byDate(d);return !!(is&&store.daily[is.id]===d)}
  function streak(store){var d=doneOnDay(store,TODAY)?TODAY:P.addDays(TODAY,-1),n=0;while(doneOnDay(store,d)){n++;d=P.addDays(d,-1)}return n}

  /* 跟着做：教程步骤勾选记录（ainpe:guide:id）和课件、绘本的记录（ainpe:learn） */
  // 单文件预览会把封面图直接交给页面（和学 AI 页一样）
  function coverOf(id,path){var m=window.AINPE_COVER_SRC;return (m&&m[id])||path}
  function projects(){
    var out=[],learn=readJSON('ainpe:learn')||{};
    [['kejian','/static/learn/img/boat.jpg'],['huiben','/static/learn/img/girl.jpg']].forEach(function(x){
      var s=learn[x[0]],page=X.PROJECT_PAGES&&X.PROJECT_PAGES[x[0]];
      if(!s||typeof s!=='object'||!Object.keys(s).length||!page)return;
      var level=Number(s.level)||0;
      var zz=window.AINPE_ZUO&&window.AINPE_ZUO.SCRIPTS;
      out.push({href:zz&&zz[x[0]]?'zuo.html?id='+x[0]:x[0]+'.html?tab=practice',title:page.title,cover:coverOf(x[0],x[1]),done:!!(s.done||s.basicDone),detail:s.done?'练习已完成':level>0?'进行到第 '+Math.min(level,5)+' 关':s.basicDone?'教程已标记完成':'已开始学习'});
    });
    GUIDES.forEach(function(g){
      var marks=readJSON('ainpe:guide:'+g.id);if(!marks||typeof marks!=='object')return;
      var total=(g.steps||[]).length,n=0;for(var k=0;k<total;k++)if(marks[k]===true)n++;
      if(!n)return;
      var z=window.AINPE_ZUO&&window.AINPE_ZUO.SCRIPTS;
      out.push({href:(z&&z[g.id]?'zuo.html?id=':'guide.html?id=')+encodeURIComponent(g.id),title:g.title,cover:coverOf(g.id,'/static/learn/media/covers/'+g.id+'.jpg'),done:n>=total,detail:n>=total?'步骤已全部完成':'已完成 '+n+' / '+total+' 步'});
    });
    return out;
  }
  function unitBadge(u,store,made){
    var lessons=u.lessons.filter(function(id){return store.lessons[id]}).length;
    var doneProjects=(u.projects||[]).filter(function(id){return made[id]}).length;
    return {lessons:lessons,total:u.lessons.length,got:lessons===u.lessons.length&&doneProjects>=(u.needProjects||0)};
  }

  function draw(){
    var store=P.load(),info=P.levelInfo(store.xp),s=streak(store),today=byDate(TODAY);
    $('#cheer').src=R.a.src;
    $('#lvNum').textContent=info.number;$('#lvName').textContent=info.name;
    $('#lvNext').textContent=info.next?'下一级：'+info.next.n:'已经是最高级了';
    $('#lvXp').textContent='经验 '+store.xp+(info.next?' · 还差 '+info.toNext:'');
    $('#lvToday').textContent=today?(store.daily[today.id]?'今天的每日 AI 已完成':'今天的每日 AI 还没玩'):'今天这期还在准备';
    var bar=$('#lvBar');bar.classList.toggle('full',!info.next);
    requestAnimationFrame(function(){requestAnimationFrame(function(){$('#lvFill').style.width=info.pct+'%'})});
    $('#sStreak').textContent=s;$('#sDaily').textContent=Object.keys(store.daily).length;$('#sLessons').textContent=Object.keys(store.lessons).filter(function(id){return X.LESSONS[id]}).length;
    var go=$('#lvGo');
    if(today&&store.daily[today.id]){go.textContent='今天已完成 · 去学一节课';go.href='xue-ai.html'}
    else if(today){go.textContent='去玩今天的每日 AI';go.href='meiri-ai.html#'+today.id}

    // 徽章
    var list=projects(),made={};
    list.forEach(function(p){var id=(p.href.match(/id=([a-z-]+)/)||[])[1]||p.href.split('.')[0];if(p.done)made[id]=true});
    var box=$('#badges');box.innerHTML='';var got=0;
    X.UNITS.forEach(function(u){
      var b=unitBadge(u,store,made);if(b.got)got++;
      var c=el('div','bdg'+(b.got?' got':''));var ic=el('span','ic');ic.innerHTML=STEP_ICON;c.appendChild(ic);
      c.appendChild(el('b','',u.name.replace(/^第 \d 单元 /,'')));
      c.appendChild(el('small','',b.got?'已获得':(b.lessons+' / '+b.total+' 节'+((u.needProjects&&b.lessons===b.total)?' · 差 1 件作品':''))));
      box.appendChild(c);
    });
    $('#bdgSum').textContent='已获得 '+got+' / '+X.UNITS.length+' 枚';

    // 学过的课：按课程顺序列出已学完的
    var lb=$('#lessons');lb.innerHTML='';
    var learned=X.ORDER.filter(function(id){return store.lessons[id]});
    if(!learned.length){
      var e=el('div','empty');var im=el('img');im.src=R.zhou.src;im.alt='';e.appendChild(im);
      e.appendChild(el('p','','还没学过。老周也是从第一课开始的，每节 3 分钟。'));
      var a=el('a','','去学 ›');a.href='xue-ai.html#can';e.appendChild(a);lb.appendChild(e);
    }else{
      learned.slice(-5).reverse().forEach(function(id){
        var L=X.LESSONS[id],a=el('a','li');a.href='xue-ai.html#'+id;
        var pic=el('span','pic');var im2=el('img');im2.src=R[L.who].src;im2.alt='';pic.appendChild(im2);a.appendChild(pic);
        var t=el('span','t');t.appendChild(el('b','',L.title));t.appendChild(el('small','',R[L.who].name+' · 学完了'));a.appendChild(t);
        a.appendChild(el('span','w','再看 ›'));lb.appendChild(a);
      });
      if(learned.length>5)lb.appendChild(el('p','notice','还有 '+(learned.length-5)+' 节，在学 AI 里能看到全部。'));
    }

    // 跟着做的作品
    var mb=$('#made');mb.innerHTML='';
    if(!list.length){
      var e2=el('div','empty');var im3=el('img');im3.src=R.yuan.src;im3.alt='';e2.appendChild(im3);
      e2.appendChild(el('p','','跟着教程做过的作品会出现在这里，下次接着做。'));
      var a2=el('a','','看看教程 ›');a2.href='guides.html';e2.appendChild(a2);mb.appendChild(e2);
    }else list.forEach(function(p){
      var a=el('a','li');a.href=p.href;
      var pic=el('span','pic');var im4=el('img');im4.src=p.cover;im4.alt='';im4.addEventListener('error',function(){pic.textContent='作品'},{once:true});pic.appendChild(im4);a.appendChild(pic);
      var t=el('span','t');t.appendChild(el('b','',p.title));t.appendChild(el('small','',p.detail));a.appendChild(t);
      a.appendChild(el('span','w'+(p.done?' ok':''),p.done?'做完了':'继续 ›'));mb.appendChild(a);
    });

    // 等级规则
    var rules=$('#rules');rules.innerHTML='';
    ['当天玩完「每日 AI」的那一期：+'+M.XP.today+' 经验','补玩之前的期：+'+M.XP.makeup+' 经验','连续 '+M.XP.streakFrom+' 天以上，每天再加 '+M.XP.streakBonus,'断了不扣经验，也不降级','学完一个单元的课拿一枚徽章（第 6 单元还要跟着做完一件作品）'].forEach(function(t){rules.appendChild(el('li','',t))});
  }

  function boot(){
    draw();
    $('#feedback').addEventListener('click',function(e){
      var b=document.getElementById('ainpe-feedback-launch');
      if(b){b._ainpeFeedbackOpener=e.currentTarget;b.click()}else P.toast('反馈暂时用不了，稍后再试');
    });
    P.nav('mine');
    window.addEventListener('pageshow',function(e){if(e.persisted)draw()});
    P.track('site_view',{page:'wode'});
  }
  boot();
})();
