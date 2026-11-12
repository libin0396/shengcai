/* 跟着做 · 动画互动版
   教程内容来自 guides-data.js（课件、绘本两篇在 zuo-data.js 的 EXTRA 里），每篇的角色剧本和玩法在 zuo-data.js，玩法规则在 zuo-core.js。
   每一步：小A 先说要做什么 → 角色接一句 → 玩一玩（打码、找茬、分一分、排顺序……每篇不一样）→ 看本站实测的结果 →
   轮到你：去真的 AI 里做，复制提示词、对照检查一项项勾 → 这一步做完。
   记录只存在本机：每一步做没做完记在 ainpe:guide:<id>（和图文教程页的勾选同一份），玩法里选的词记在 ainpe:zuo:<id>。不接任何 AI 接口。 */
(function(){
  'use strict';
  var P=window.AIPlay,$=P.$,el=P.el,R=P.ROLES,clock=P.clock,C=window.AINPE_ZUO_CORE;
  var Z=window.AINPE_ZUO||{},SCRIPTS=Z.SCRIPTS||{},X=window.AINPE_XUE||null,MEDIA=window.AINPE_MEDIA_SRC||{};
  var GUIDES=(window.AINPE_GUIDES||[]).concat(Z.EXTRA||[]);
  var id='';try{id=new URLSearchParams(location.search).get('id')||''}catch(e){}
  var G=null;GUIDES.forEach(function(g){if(g.id===id)G=g});
  var S=SCRIPTS[id]||null;
  var cur=0;
  var KIND_LABEL={mask:'打码',spot:'找茬',judge:'分一分',pick:'选一选',order:'排顺序',chips:'选词拼',alloc:'分时间',place:'放文字',read:'读一遍',book:'翻一翻',film:'看成片'};

  var LITE=Z.LITE||{};
  // 预览版直接给图；网站上大图换成手机版（media/zuo/），原图留给图文教程页
  function src(path){return MEDIA[path]||LITE[path]||path}
  function show(view){['intro','step','end','missing'].forEach(function(v){$('#'+v).hidden=v!==view});window.scrollTo(0,0)}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k)}

  /* ---------- 记录 ---------- */
  var KEY='ainpe:guide:'+id,SAVE='ainpe:zuo:'+id;
  function readJSON(k){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v&&typeof v==='object'?v:null}catch(e){return null}}
  function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function marks(){return readJSON(KEY)||{}}
  function isDone(i){return marks()[i]===true}
  function doneCount(){var m=marks(),n=0;G.steps.forEach(function(_,i){if(m[i]===true)n++});return n}
  function firstTodo(){for(var i=0;i<G.steps.length;i++)if(!isDone(i))return i;return -1}
  function markDone(i){var m=marks();m[i]=true;writeJSON(KEY,m)}
  function saved(){var v=readJSON(SAVE);return v&&v.v&&typeof v.v==='object'?v.v:{}}
  function keep(vals){var all=saved();Object.keys(vals).forEach(function(k){all[k]=vals[k]});writeJSON(SAVE,{v:all})}
  // 课件、绘本这类有自己页面的作品，全部做完时也记到它们原来的记录里（学 AI、我的页面看的是那份）
  function markPage(){
    if(!X||!X.PROJECT_PAGES||!X.PROJECT_PAGES[id])return;
    var all=readJSON('ainpe:learn')||{},s=all[id]||{};s.basicDone=true;all[id]=s;writeJSON('ainpe:learn',all);
  }
  function unitBadge(){
    if(!X||!X.UNITS)return null;
    var u=null;X.UNITS.forEach(function(x){if((x.projects||[]).indexOf(id)>=0)u=x});if(!u)return null;
    var store=P.load(),lessons=u.lessons.filter(function(l){return !!store.lessons[l]}).length,made=0;
    (u.projects||[]).forEach(function(pid){
      if(X.PROJECT_PAGES&&X.PROJECT_PAGES[pid]){var s=(readJSON('ainpe:learn')||{})[pid]||{};if(s.done||s.basicDone)made++;return}
      var g=null;GUIDES.forEach(function(x){if(x.id===pid)g=x});if(!g)return;
      var m=readJSON('ainpe:guide:'+pid)||{};if(g.steps.every(function(_,k){return m[k]===true}))made++;
    });
    return {unit:u,got:lessons===u.lessons.length&&made>=(u.needProjects||0)};
  }

  /* ---------- 角色 ---------- */
  function sleep(ms,t){return new Promise(function(ok,no){setTimeout(function(){t===clock.run?ok():no('stop')},P.reduce?0:ms)})}
  function talk(p){p.classList.remove('talk');void p.offsetWidth;p.classList.add('talk')}
  function say(stage,who,text,t){
    var box=stage.querySelector('.say'),me=stage.querySelector('.p.me'),a=stage.querySelector('.p.a');
    box.hidden=false;box.className='say '+(who==='a'?'a':'me');void box.offsetWidth;
    box.querySelector('b').textContent=who==='a'?'小A':R[S.who].name;
    var span=box.querySelector('span');span.textContent='';
    talk(who==='a'?a:me);(who==='a'?me:a).classList.remove('talk');
    if(P.reduce){span.textContent=text;return Promise.resolve()}
    return P.type(span,text,t,38);
  }
  function mood(stage,m){stage.classList.remove('ai-flat','ai-happy','ai-confused');stage.classList.add('ai-'+m)}
  var moodTimer=0;
  function react(ok){
    var stage=$('#stage');
    clearTimeout(moodTimer);
    if(ok===true){mood(stage,'happy');talk($('#sA'));moodTimer=setTimeout(function(){mood(stage,'flat')},1200)}
    else if(ok===false){mood(stage,'confused');moodTimer=setTimeout(function(){mood(stage,'flat')},1400)}
  }
  function cast(stage){
    var me=stage.querySelector('.p.me'),a=stage.querySelector('.p.a');
    me.querySelector('img').src=R[S.who].src;me.querySelector('small').textContent=R[S.who].name;
    a.querySelector('img').src=R.a.src;if(!a.querySelector('.face'))a.querySelector('.char').insertAdjacentHTML('beforeend',P.FACE);
  }
  setInterval(function(){
    var a=document.querySelector('.view:not([hidden]) .zs.ai-flat .p.a');if(!a||P.reduce)return;
    a.classList.add('blinking');setTimeout(function(){a.classList.remove('blinking')},170);
  },3600);

  /* ---------- 玩法：每种一个画法，规则都在 zuo-core.js ---------- */
  function btn(cls,text){var b=el('button',cls,text);b.type='button';return b}
  function fb(box,r,plain){
    var f=box.querySelector('.wfb');if(!f||!r)return;
    if(!r.msg){f.hidden=true;return}
    f.hidden=false;f.className='wfb'+(r.ok===true&&!plain?' ok':r.ok===false?' no':'');f.innerHTML='';
    if(r.ok===true&&!plain)f.appendChild(el('b','','对了'));
    f.appendChild(document.createTextNode(r.msg));
    if(r.ok===false){f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake')}
  }
  function imgEl(path,alt,cls){var i=el('img',cls||'');i.alt=alt||'';i.decoding='async';i.src=src(path);return i}

  var DRAW={};

  DRAW.mask=function(w,s,body,go){
    var m=C.K.mask.words(w),note=el('div','note');
    w.lines.forEach(function(line,li){
      var p=el('p',li===0?'note-h':'');
      line.forEach(function(seg){
        if(!seg||typeof seg!=='object'){p.appendChild(document.createTextNode(seg));return}
        var hit=own(m.need,seg.w)&&s.hit[seg.w],b=btn('tok'+(hit?' hit':''),hit?m.need[seg.w]:seg.w);
        b.setAttribute('aria-pressed',hit?'true':'false');if(hit)b.disabled=true;
        b.addEventListener('click',function(){go({word:seg.w},b)});
        p.appendChild(b);
      });
      note.appendChild(p);
    });
    body.appendChild(note);
    var left=C.K.mask.left(w,s);
    body.appendChild(el('div','wcount',left?'还有 '+left+' 处要打码':'都打好码了'));
  };

  DRAW.spot=function(w,s,body,go){
    if(w.ref)body.appendChild(refCard(w.ref));
    var list=el('div','spots');
    w.lines.forEach(function(L,i){
      var found=!!s.found[i],b=btn('spot'+(found?' found':''));
      if(found){b.appendChild(el('s','',L.t));b.appendChild(el('span','fix',L.fix||''));b.disabled=true}
      else b.appendChild(el('span','',L.t));
      b.addEventListener('click',function(){go({i:i},b)});
      list.appendChild(b);
    });
    body.appendChild(list);
    var left=C.K.spot.left(w,s);
    body.appendChild(el('div','wcount',left?'还差 '+left+' 处':'都找到了'));
  };
  function refCard(ref){
    var c=el('div','ref');c.appendChild(el('b','',ref.title));
    ref.lines.forEach(function(l){c.appendChild(el('p','',l))});
    return c;
  }

  DRAW.judge=function(w,s,body,go){
    if(w.ref)body.appendChild(refCard(w.ref));
    var dots=el('div','dots2');w.items.forEach(function(_,i){dots.appendChild(el('i',i<s.i?'on':i===s.i?'cur':''))});body.appendChild(dots);
    var it=w.items[s.i];
    if(it){
      var card=el('div','jcard'+(it.img?' has-img':''));
      if(it.img){var im=imgEl(it.img,it.t,'jimg'+(it.crop==='right'?' crop-r':''));card.appendChild(im)}
      if(it.t&&!it.img)card.appendChild(el('span','',it.t));
      body.appendChild(card);
      var bins=el('div','bins'+(w.bins.length>2?' three':''));
      w.bins.forEach(function(name,k){var b=btn('bin',name);b.addEventListener('click',function(){go({bin:k},card)});bins.appendChild(b)});
      body.appendChild(bins);
    }else{
      var sum=el('ul','jsum');
      w.items.forEach(function(x){var li=el('li');li.appendChild(el('span','',x.t));li.appendChild(el('b','',w.bins[x.bin]));sum.appendChild(li)});
      body.appendChild(sum);
    }
  };

  DRAW.pick=function(w,s,body,go){
    if(w.imgs&&w.imgs.length){
      var g=el('div','pimgs'+(w.imgs.length>1?' two':''));
      w.imgs.forEach(function(x){var f=el('figure');f.appendChild(imgEl(x.src,x.label));f.appendChild(el('figcaption','',x.label));g.appendChild(f)});
      body.appendChild(g);
    }
    var list=el('div','opts');
    w.options.forEach(function(o,i){
      var b=btn('opt'+(s.chosen===i?' right':s.tried[i]&&!o.ok?' wrong':''),o.t);
      if(s.chosen>=0)b.disabled=true;
      b.addEventListener('click',function(){go({i:i},b)});
      list.appendChild(b);
    });
    body.appendChild(list);
  };

  DRAW.order=function(w,s,body,go){
    var imgs=w.items.some(function(x){return x.img});
    if(imgs){
      var track=el('div','track');
      w.items.forEach(function(x,k){
        var slot=el('div','tslot'+(k<s.placed.length?' on':''));
        if(k<s.placed.length){slot.appendChild(imgEl(w.items[s.placed[k]].img,w.items[s.placed[k]].t))}
        slot.appendChild(el('b','',String(k+1)));track.appendChild(slot);
      });
      body.appendChild(track);
      var pool=el('div','tpool');
      s.pool.forEach(function(i){var b=btn('tthumb');b.setAttribute('aria-label',w.items[i].t||'镜头');b.appendChild(imgEl(w.items[i].img,''));b.addEventListener('click',function(){go({i:i},b)});pool.appendChild(b)});
      if(s.pool.length)body.appendChild(pool);
    }else{
      var ol=el('ol','olist');
      s.placed.forEach(function(i,k){var li=el('li');li.appendChild(el('b','',String(k+1)));li.appendChild(el('span','',w.items[i].t));ol.appendChild(li)});
      if(s.placed.length)body.appendChild(ol);
      var pl=el('div','opool');
      s.pool.forEach(function(i){var b=btn('obtn',w.items[i].t);b.addEventListener('click',function(){go({i:i},b)});pl.appendChild(b)});
      if(s.pool.length)body.appendChild(pl);
    }
  };

  DRAW.chips=function(w,s,body,go){
    w.slots.forEach(function(sl){
      var row=el('div','crow');row.appendChild(el('b','',sl.q||sl.k));
      var box=el('div','cops');
      sl.options.forEach(function(o,j){
        var on=s.val[sl.k]===o.t,b=btn('cop'+(on?' on':''),o.t);b.setAttribute('aria-pressed',on?'true':'false');
        b.addEventListener('click',function(){go({k:sl.k,j:j},b)});box.appendChild(b);
      });
      row.appendChild(box);body.appendChild(row);
    });
    if(w.preview){
      var pv=el('div','cprev');
      String(w.preview).split(/(\{[^}]+\})/).forEach(function(part){
        var m=/^\{([^}]+)\}$/.exec(part);
        if(!m){if(part)pv.appendChild(document.createTextNode(part));return}
        pv.appendChild(own(s.val,m[1])?el('b','',s.val[m[1]]):el('i','','____'));
      });
      body.appendChild(pv);
    }
  };

  DRAW.alloc=function(w,s,body,go){
    var bar=el('div','abar'),sum=C.K.alloc.sum(w,s);
    w.parts.forEach(function(p,i){var seg=el('span','',p.k);seg.style.flexGrow=String(s.v[i]);bar.appendChild(seg)});
    if(sum<w.total){var gap=el('span','gap');gap.style.flexGrow=String(w.total-sum);bar.appendChild(gap)}
    body.appendChild(bar);
    w.parts.forEach(function(p,i){
      var row=el('div','arow');row.appendChild(el('b','',p.k));
      var minus=btn('ab','−'),plus=btn('ab','+');minus.setAttribute('aria-label',p.k+'减 1 分钟');plus.setAttribute('aria-label',p.k+'加 1 分钟');
      minus.addEventListener('click',function(){go({p:i,d:-1},row)});plus.addEventListener('click',function(){go({p:i,d:1},row)});
      row.appendChild(minus);row.appendChild(el('span','av',s.v[i]+' 分钟'));row.appendChild(plus);body.appendChild(row);
    });
    body.appendChild(el('div','wcount','合计 '+sum+' / '+w.total+' 分钟'));
  };

  DRAW.place=function(w,s,body,go){
    var chips=el('div','ptexts');
    w.texts.forEach(function(t,i){
      var placed=own(s.at,i),b=btn('ptx'+(placed?' done':s.sel===i?' on':''),t.t);if(placed)b.disabled=true;
      b.addEventListener('click',function(){go({text:i},b)});chips.appendChild(b);
    });
    body.appendChild(chips);
    var pic=el('div','pic');pic.style.aspectRatio=w.ratio||'4/3';pic.appendChild(imgEl(w.img,'商品底图'));
    w.zones.forEach(function(z){
      var b=btn('zone'+(z.k==='left'?' z-left':''));b.style.left=z.x+'%';b.style.top=z.y+'%';b.style.width=z.w+'%';b.style.height=z.h+'%';
      b.setAttribute('aria-label','放到'+(z.label||'这里'));
      var inside=w.texts.map(function(t,i){return own(s.at,i)&&s.at[i]===z.k?i:-1}).filter(function(i){return i>=0});
      if(inside.length){b.classList.add('has');inside.forEach(function(i){b.appendChild(el('span','ztext'+(w.texts[i].big?' big':''),w.texts[i].t))})}
      else b.appendChild(el('small','',z.label||''));
      b.addEventListener('click',function(){go({zone:z.k},b)});
      pic.appendChild(b);
    });
    body.appendChild(pic);
  };

  var readTimer=0;
  DRAW.read=function(w,s,body,go){
    var tp=el('div','tp'),chars=[];
    Array.prototype.forEach.call(w.text,function(ch){var c=el('span','',ch);chars.push(c);tp.appendChild(c)});
    body.appendChild(tp);
    var clockEl=el('div','tclock',s.phase==='done'?'用了 '+s.secs+' 秒':'0 秒'),b=btn('btn'+(s.phase==='reading'?' soft':''),s.phase==='idle'?'开始读':s.phase==='reading'?'读完了':'再读一遍');
    body.appendChild(clockEl);body.appendChild(b);
    if(s.phase==='done')chars.forEach(function(c){c.className='lit'});
    b.addEventListener('click',function(){
      clearInterval(readTimer);
      if(s.phase==='reading'){go({stop:true,now:Date.now()},b);return}
      C.act(w,s,{go:true,now:Date.now()});b.textContent='读完了';b.classList.add('soft');
      chars.forEach(function(c){c.className=''});
      var n=0,per=1000/(w.cps||4.5);
      readTimer=setInterval(function(){
        if(!document.body.contains(tp)){clearInterval(readTimer);return}
        clockEl.textContent=Math.round((Date.now()-s.t0)/1000)+' 秒';
        var want=Math.min(chars.length,Math.floor((Date.now()-s.t0)/per));
        while(n<want){chars[n].className='lit';n++}
        if(n>=chars.length&&Date.now()-s.t0>chars.length*per+1500){clearInterval(readTimer);go({stop:true,now:Date.now()},b)}
      },120);
    });
  };

  DRAW.book=function(w,s,body,go){
    var pg=w.pages[s.p],frame=el('figure','bpage');
    frame.appendChild(imgEl(pg.img,pg.cap));
    var cap=el('figcaption');cap.appendChild(el('b','',pg.cap));if(pg.text)cap.appendChild(el('span','',pg.text));frame.appendChild(cap);
    body.appendChild(frame);
    var nav=el('div','bnav'),prev=btn('ab','‹'),next=btn('ab','›'),dots=el('div','dots2');
    prev.setAttribute('aria-label','上一页');next.setAttribute('aria-label','下一页');prev.disabled=s.p===0;next.disabled=s.p===w.pages.length-1;
    w.pages.forEach(function(_,i){dots.appendChild(el('i',i===s.p?'cur':s.seen[i]?'on':''))});
    prev.addEventListener('click',function(){go({d:-1},frame)});next.addEventListener('click',function(){go({d:1},frame)});
    nav.appendChild(prev);nav.appendChild(dots);nav.appendChild(next);body.appendChild(nav);
    var x0=null;frame.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
    frame.addEventListener('touchend',function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)go({d:dx<0?1:-1},frame)});
  };

  DRAW.film=function(w,s,body,go,box){
    var tl=el('div','tl'),figs=[];
    w.frames.forEach(function(f,i){var fg=el('figure');fg.appendChild(imgEl(f,'第 '+(i+1)+' 个镜头'));tl.appendChild(fg);figs.push(fg)});
    body.appendChild(tl);
    var ex=el('div','export'),bar=el('span'),fill=el('i'),pct=el('b','','0%');bar.appendChild(fill);ex.appendChild(el('b','','导出'));ex.appendChild(bar);ex.appendChild(pct);body.appendChild(ex);
    body.appendChild(el('span','cap',w.caption||''));
    var holder=el('div','film-holder');body.appendChild(holder);
    function finish(){
      fill.style.width='100%';pct.textContent='100%';
      if(G.video&&G.video.verified&&!holder.firstChild)film(holder,S.poster||w.frames[0],G.video,G.video.kind||'成片');
      if(!s.end)go({end:true},null);
    }
    if(s.end||P.reduce){w.subs.forEach(function(t,i){if(figs[i])figs[i].appendChild(el('figcaption','',t))});finish();return}
    var t=clock.run,p=sleep(200,t);
    w.subs.forEach(function(t2,i){p=p.then(function(){if(figs[i])figs[i].appendChild(el('figcaption','',t2));return sleep(420,t)})});
    p.then(function(){fill.style.width='100%';pct.textContent='100%';return sleep(1200,t)}).then(finish).catch(function(){});
  };

  /* 一个玩法的卡片：说明 + 画面 + 对错提示 */
  function widget(w,host,onDone){
    var s=C.start(w),box=el('div','card wg'),head=el('div','wh');
    head.appendChild(el('span','wk',KIND_LABEL[w.kind]||'玩一玩'));if(w.tag)head.appendChild(el('span','wt',w.tag));
    box.appendChild(head);
    if(w.ask)box.appendChild(el('p','wask',w.ask));
    var body=el('div','wb');box.appendChild(body);
    var f=el('div','wfb');f.hidden=true;f.setAttribute('aria-live','polite');box.appendChild(f);
    host.appendChild(box);
    var finished=false;
    function draw(){body.innerHTML='';DRAW[w.kind](w,s,body,go,box)}
    function go(a,node){
      var r=C.act(w,s,a)||{ok:null,msg:''};
      if(r.ok===false&&node){node.classList.remove('shake');void node.offsetWidth;node.classList.add('shake');if(w.kind==='pick')node.classList.add('wrong')}
      if(w.kind!=='book'&&w.kind!=='film')react(r.ok);
      if(r.msg||w.kind!=='place')fb(box,r,w.kind==='read'||w.kind==='alloc');
      // 什么时候重画：看玩法而定（答错时不重画，留着摇一摇的样子）
      var redraw=w.kind==='alloc'||w.kind==='book'||(w.kind==='place'&&r.ok!==false)||(w.kind!=='film'&&r.ok===true);
      if(redraw)draw();
      check();
    }
    function check(){
      if(finished||!C.done(w,s))return;
      finished=true;box.classList.add('done');head.appendChild(el('span','wok','做好了'));
      keep(C.saved(w,s));
      onDone();
    }
    draw();check();
    return {solve:function(){if(finished)return;clearInterval(readTimer);C.solve(w,s);draw();check()},state:s};
  }

  /* ---------- 本站实测：玩完以后给你看 ---------- */
  function verified(md){return !!(md&&md.verified&&md.src&&md.kind&&md.caption)}
  function mediaBox(md){
    var b=el('figure','media');
    if(md.video){
      var v=document.createElement('video');v.className='shot tall';v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;
      v.setAttribute('playsinline','');v.setAttribute('muted','');if(md.poster)v.poster=src(md.poster);
      // 只循环成片里的一小段（clip:[开始秒, 结束秒]），不另做视频文件
      if(md.clip){v.loop=false;v.preload='metadata';
        v.addEventListener('loadedmetadata',function(){try{v.currentTime=md.clip[0]}catch(e){}});
        v.addEventListener('timeupdate',function(){if(v.currentTime>=md.clip[1]||v.currentTime<md.clip[0]){v.currentTime=md.clip[0];try{var p2=v.play();if(p2&&p2.catch)p2.catch(function(){})}catch(e){}}});
        v.addEventListener('ended',function(){v.currentTime=md.clip[0];try{v.play()}catch(e){}});}
      v.src=src(md.video);b.appendChild(v);
      try{var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}catch(e){}
    }else{
      var img=imgEl(md.src,md.alt||md.caption,'shot');
      img.addEventListener('load',function(){img.classList.add(img.naturalHeight>img.naturalWidth*1.2?'tall':'wide')});
      b.appendChild(img);
    }
    var cap=el('figcaption');cap.appendChild(el('span','mk',md.kind));cap.appendChild(el('span','cap',md.caption));b.appendChild(cap);
    return b;
  }
  function revealBox(st,sc){
    var items=[];
    if(!sc.noMedia)(st.media||[]).filter(verified).forEach(function(m){items.push(mediaBox(m))});
    ((sc.reveal&&sc.reveal.media)||[]).forEach(function(m){items.push(mediaBox(m))});
    var res=sc.reveal&&sc.reveal.result;
    if(!items.length&&!res)return null;
    var box=el('div','card reveal');box.appendChild(el('h3','','本站实测'));
    items.forEach(function(x){box.appendChild(x)});
    if(res){
      var r=el('div','res');var h=el('div','res-h');h.appendChild(el('b','',res.title));if(res.tag)h.appendChild(el('span','wt',res.tag));r.appendChild(h);
      if(res.rows){var dl=el('dl');res.rows.forEach(function(x){dl.appendChild(el('dt','',x[0]));dl.appendChild(el('dd','',x[1]))});r.appendChild(dl)}
      if(res.frames){var fr=el('div','frames');res.frames.forEach(function(x,i){var f=el('div','frame');f.appendChild(el('i','',String(i+1)));f.appendChild(el('span','',x));fr.appendChild(f)});r.appendChild(fr)}
      box.appendChild(r);
    }
    return box;
  }

  /* ---------- 一步 ---------- */
  var live=[];
  function play(i){
    cur=i;var t=++clock.run,n=G.steps.length,st=G.steps[i],sc=S.steps[i]||{},stage=$('#stage');
    show('step');clearInterval(readTimer);
    $('#sNo').textContent='第 '+(i+1)+' / '+n+' 步';$('#sTitle').textContent=st.title;
    var prog=$('#prog');prog.innerHTML='';for(var k=0;k<n;k++){var sp=el('span');if(k<=i)sp.className='on';prog.appendChild(sp)}
    mood(stage,'flat');$('#sSay').hidden=true;
    var host=$('#plays');host.innerHTML='';$('#reveal').innerHTML='';$('#yours').hidden=true;$('#skipPlay').hidden=true;$('#replay').hidden=true;
    live=[];
    var ws=C.plays(sc);
    function next(k){
      if(t!==clock.run)return;
      if(k>=ws.length){finishPlays(i,t);return}
      var h=widget(ws[k],host,function(){setTimeout(function(){next(k+1)},P.reduce?0:450)});
      live.push(h);
    }
    sleep(200,t).then(function(){return say(stage,'a',sc.ai||st.title,t)}).then(function(){return sleep(500,t)})
      .then(function(){if(sc.me)return say(stage,'me',sc.me,t)})
      .then(function(){$('#skipPlay').hidden=!ws.length;next(0)}).catch(function(){});
  }
  function finishPlays(i,t){
    var st=G.steps[i],sc=S.steps[i]||{};
    $('#skipPlay').hidden=true;$('#replay').hidden=false;
    var rb=revealBox(st,sc);if(rb)$('#reveal').appendChild(rb);
    mood($('#stage'),'happy');
    say($('#stage'),'a',sc.done||'轮到你了：去真的 AI 里做一遍，再对照检查。',t).catch(function(){});
    yours(i);
  }
  $('#skipPlay').addEventListener('click',function(){
    var t=clock.run;
    if(!$('#plays').children.length){
      // 角色还在说话就点了跳过：直接把这一步的玩法都摆出来
      clock.run++;t=clock.run;$('#sSay').hidden=true;
      var host=$('#plays');host.innerHTML='';live=[];
      C.plays(S.steps[cur]||{}).forEach(function(w){var h=widget(w,host,function(){});h.solve();live.push(h)});
      finishPlays(cur,t);return;
    }
    // 先把正在玩的做好，后面没出来的玩法也直接摆好
    var ws=C.plays(S.steps[cur]||{}),host2=$('#plays');
    clock.run++;t=clock.run;
    live.forEach(function(h){h.solve()});
    for(var k=live.length;k<ws.length;k++){var h=widget(ws[k],host2,function(){});h.solve();live.push(h)}
    finishPlays(cur,t);
  });

  /* ---------- 轮到你了 ---------- */
  function values(st,sc){
    var v={},sv=saved(),use=sc.use||{};
    Object.keys(sc.fill||{}).forEach(function(k){v[k]=sc.fill[k]});
    C.slots(st.prompt||'').forEach(function(k){if(own(sv,k))v[k]=sv[k];if(own(use,k)&&own(sv,use[k]))v[k]=sv[use[k]]});
    return v;
  }
  function drawPrompt(st,sc){
    var box=$('#ptext');box.innerHTML='';var hasFill=false,hasPaste=false,pasteFilled=false,v=values(st,sc);
    C.parts(st.prompt).forEach(function(x){
      if(x.text!=null){box.appendChild(document.createTextNode(x.text));return}
      var paste=C.isPaste(x.slot),inp=el(paste?'textarea':'input','fill'+(paste?' paste':''));
      if(!paste)inp.type='text';
      inp.setAttribute('aria-label',x.slot);inp.setAttribute('data-slot',x.slot);inp.placeholder=x.slot;
      if(own(v,x.slot)&&v[x.slot]){inp.value=v[x.slot];if(paste)pasteFilled=true;else hasFill=true}
      if(paste)hasPaste=true;
      function size(){if(paste){inp.rows=Math.min(5,Math.max(1,Math.ceil((inp.value||inp.placeholder).length/16)));return}inp.style.width='calc('+Math.min(14,Math.max(3,(inp.value||inp.placeholder).length+1))+'em + 14px)'}
      inp.addEventListener('input',size);size();box.appendChild(inp);
    });
    var tip=$('#ptip'),bits=[];
    if(hasFill)bits.push('【】里填好了例子，可以改成你自己的');
    if(pasteFilled)bits.push('虚线框里先放了练习里的内容，换成你自己的');
    else if(hasPaste)bits.push('虚线框留给你粘贴上一步的结果');
    tip.hidden=!bits.length;tip.textContent=bits.join('；')+'。';
  }
  function promptText(){
    var out='';
    Array.prototype.forEach.call($('#ptext').childNodes,function(n){
      if(n.nodeType===3)out+=n.data;
      else if(n.tagName==='INPUT'||n.tagName==='TEXTAREA')out+=(n.value.trim()||'【'+n.getAttribute('data-slot')+'】');
    });
    return out;
  }
  function yours(i){
    var st=G.steps[i],sc=S.steps[i]||{},done=isDone(i);
    $('#howto').textContent=st.action;
    $('#pcard').hidden=!st.prompt;if(st.prompt)drawPrompt(st,sc);else $('#ptext').innerHTML='';
    var box=$('#checks');box.innerHTML='';
    C.checks(st,sc).forEach(function(c){
      var b=btn('');b.setAttribute('aria-pressed',done?'true':'false');
      var bx=el('span','box','✓');bx.setAttribute('aria-hidden','true');b.appendChild(bx);b.appendChild(el('span','',c));
      b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on?'true':'false');if(on)talk($('#sA'));count(i)});
      box.appendChild(b);
    });
    var note=$('#note');note.hidden=!sc.note;note.textContent=sc.note||'';
    $('#yours').hidden=false;count(i);
  }
  function count(i){
    var left=Array.prototype.filter.call($('#checks').children,function(b){return b.getAttribute('aria-pressed')!=='true'}).length,n=G.steps.length,b=$('#doneBtn');
    b.disabled=left>0;
    b.textContent=left>0?'还差 '+left+' 项没勾':i+1<n?'这一步做完了 · 去第 '+(i+2)+' 步':'全部做完了 · 看成品';
  }
  $('#doneBtn').addEventListener('click',function(){
    var i=cur,n=G.steps.length,before=unitBadge();
    markDone(i);
    var left=firstTodo();
    if(left<0)markPage();
    if(i+1<n){P.toast('第 '+(i+1)+' 步做完了');play(i+1);return}
    if(left>=0){P.toast('还有第 '+(left+1)+' 步没做完，先把它做完');play(left);return}
    var after=unitBadge();
    showEnd(!!(after&&after.got&&!(before&&before.got))&&after.unit);
  });
  $('#copyBtn').addEventListener('click',function(){P.copy(promptText(),'已复制，去对话 AI 里粘贴发送')});
  $('#replay').addEventListener('click',function(){play(cur)});
  $('#stepBack').addEventListener('click',showIntro);
  $('#endBack').addEventListener('click',showIntro);

  /* ---------- 成片、成品 ---------- */
  function film(box,poster,video,label){
    var b=btn('film');b.setAttribute('aria-label','播放'+(video.title||'成片'));
    b.appendChild(imgEl(poster,''));b.appendChild(el('span','lbl',label));
    var pl=el('span','play');pl.setAttribute('aria-hidden','true');b.appendChild(pl);
    b.addEventListener('click',function(){
      var v=document.createElement('video');v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.poster=src(poster);v.src=src(video.src);
      var wrap=el('div','film');wrap.appendChild(v);b.replaceWith(wrap);
      try{var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}catch(e){}
    });
    box.appendChild(b);return b;
  }
  function gallery(){
    var out=[];
    (G.exampleMedia||[]).forEach(function(m){out.push({src:m.src,cap:m.caption,kind:'本站实测'})});
    if(!out.length)G.steps.forEach(function(st){(st.media||[]).filter(verified).forEach(function(m){if(m.kind!=='实操截图')out.push({src:m.src,cap:m.caption,kind:m.kind})})});
    return out;
  }

  /* ---------- 开场 ---------- */
  function showIntro(){
    var t=++clock.run,stage=$('#introStage'),n=G.steps.length,k=doneCount(),next=firstTodo();
    show('intro');mood(stage,'flat');$('#iSay').hidden=true;clearInterval(readTimer);
    $('#gCat').textContent='跟着做 · '+(G.category||'教程');$('#gTitle').textContent=G.title;
    $('#gNeeds').textContent=G.needs||'';
    $('#gN').textContent='一共 '+n+' 步';$('#gDone').textContent=k?'做完 '+k+' / '+n+' 步 · 只存在这台设备':'记录只存在这台设备';
    var list=$('#stepList');list.innerHTML='';
    G.steps.forEach(function(st,i){
      var li=el('li',isDone(i)?'done':''),b=btn('');
      b.appendChild(el('span','n',isDone(i)?'✓':String(i+1)));
      var tt=el('span','t');tt.appendChild(el('b','',st.title));
      var kinds=C.plays(S.steps[i]||{}).map(function(w){return KIND_LABEL[w.kind]}).filter(Boolean);
      if(kinds.length)tt.appendChild(el('small','','玩法：'+kinds.join(' · ')));
      b.appendChild(tt);b.appendChild(el('span','w',isDone(i)?'做完了':'›'));
      b.addEventListener('click',function(){play(i)});li.appendChild(b);list.appendChild(li);
    });
    var ev=G.evidence,pf=$('#gProof');pf.innerHTML='';
    if(ev&&ev.verified&&ev.tool){pf.appendChild(el('b','','本站实测'));pf.appendChild(document.createTextNode(' · '+ev.tool))}
    var start=$('#startBtn');
    start.textContent=next<0?'全部做完了 · 再看成品':k?'接着做第 '+(next+1)+' 步':'开始第 1 步';
    start.onclick=function(){if(next<0)showEnd(false);else play(next)};
    var page=X&&X.PROJECT_PAGES&&X.PROJECT_PAGES[id];
    $('#fullLink').href=page?page.href:'guide.html?id='+encodeURIComponent(id);
    var tz=$('#teaser'),holder=$('#teaserMedia');holder.innerHTML='';tz.hidden=true;
    if(G.video&&G.video.verified&&S.poster){
      tz.hidden=false;film(holder,S.poster,G.video,'成品示例');
      $('#teaserT').textContent=G.video.title;$('#teaserS').textContent='本站跟着这 '+n+' 步试做出来的，点开看看。';
    }else if(S.cover){
      tz.hidden=false;var f=el('div','film still');f.appendChild(imgEl(S.cover,G.title));f.appendChild(el('span','lbl',S.coverLabel||'配图'));holder.appendChild(f);
      var ex=gallery().length;
      $('#teaserT').textContent=ev&&ev.title?ev.title:G.title;
      $('#teaserS').textContent=ex?'做完能看到本站试做的成品。':'本站用虚构素材实测过，做完给你看实测记录。';
    }
    sleep(300,t).then(function(){return say(stage,'me',S.hello.me,t)}).then(function(){return sleep(500,t)})
      .then(function(){mood(stage,'happy');return say(stage,'a',S.hello.ai,t)}).catch(function(){});
  }

  /* ---------- 做成了 ---------- */
  function showEnd(badgeUnit){
    var t=++clock.run,stage=$('#endStage');
    show('end');mood(stage,'happy');$('#eSay').hidden=true;$('#stamp').hidden=true;clearInterval(readTimer);
    $('#eTitle').textContent=G.title;$('#eMade').textContent=G.outcome||'';
    var bn=$('#badgeNew');bn.hidden=!badgeUnit;bn.innerHTML='';
    if(badgeUnit){bn.appendChild(el('b','','新徽章'));bn.appendChild(document.createTextNode('学完了「'+badgeUnit.name.replace(/^第 \d 单元 /,'')+'」'))}
    var vb=$('#eVideo');vb.innerHTML='';vb.hidden=true;
    if(G.video&&G.video.verified){
      vb.hidden=false;vb.appendChild(el('h3','',G.video.title));
      film(vb,S.poster||'',G.video,G.video.kind);
      vb.appendChild(el('p','vcap',G.video.caption+' 来源：'+G.video.source));
    }else{
      var gl=gallery();
      if(gl.length){
        vb.hidden=false;vb.appendChild(el('h3','','本站试做的成品'));
        var row=el('div','gal');gl.forEach(function(m){var f=el('figure');f.appendChild(imgEl(m.src,m.cap));var c=el('figcaption');c.appendChild(el('span','mk',m.kind));c.appendChild(el('span','cap',m.cap));f.appendChild(c);row.appendChild(f)});
        vb.appendChild(row);
      }
    }
    var ev=G.evidence,eb=$('#eEv');eb.innerHTML='';eb.hidden=!(ev&&ev.verified);
    if(ev&&ev.verified){
      eb.appendChild(el('h3','','本站实测：'+ev.title));eb.appendChild(el('div','tool',ev.tool));
      var dl=el('dl');[['素材',ev.input],['怎么做',ev.process],['结果',ev.result],['还没验证',ev.limits]].forEach(function(r){if(!r[1])return;dl.appendChild(el('dt','',r[0]));dl.appendChild(el('dd','',r[1]))});
      eb.appendChild(dl);
    }
    var page=X&&X.PROJECT_PAGES&&X.PROJECT_PAGES[id];
    $('#eFull').href=page?page.href:'guide.html?id='+encodeURIComponent(id);
    sleep(300,t).then(function(){return say(stage,'me',S.end.me,t)}).then(function(){return sleep(450,t)})
      .then(function(){return say(stage,'a',S.end.ai,t)}).then(function(){$('#stamp').hidden=false}).catch(function(){});
  }

  /* ---------- 启动 ---------- */
  P.nav('learn');
  if(!G||!S||!C){show('missing');return}
  document.title=G.title+' · 跟着做';
  [$('#introStage'),$('#stage'),$('#endStage')].forEach(cast);
  P.track('site_view',{page:'zuo',game:id});
  showIntro();
})();
