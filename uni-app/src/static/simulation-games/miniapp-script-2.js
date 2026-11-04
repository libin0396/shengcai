
var D=JSON.parse(document.getElementById('game-data').textContent),$=function(q){return document.querySelector(q)},app=$('#app'),UI=D.ui;
var S;
function reset(){S={cond:{},talents:[],choice:{},task:null,days:30,seed:(Math.random()*1e6)|0}}
function money(n){return(n<0?'-¥':'¥')+Math.abs(Math.round(n)).toLocaleString()}
function prog(k){var b=document.getElementById('progb');if(b)b.style.width=(k*100)+'%'}
var BR='AINPE · AI 实战情报站';
var RMQ=matchMedia('(prefers-reduced-motion: reduce)');
function esc(t){return String(t).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function cta(btns,hint,cls){return '<div class="cta'+(cls?' '+cls:'')+'"><div class="hint" id="hint">'+(hint||'')+'</div>'+btns+'</div>'}
function wide(on){document.body.classList.toggle('wide',!!on)}
function top0(){window.scrollTo(0,0)}
var NSTEP=D.task?5:4;
var CK='<i class="ck" aria-hidden="true"></i>';

function intro(){reset();$('#top').hidden=true;wide(0);top0();
 app.innerHTML='<div style="margin-top:22px"><span class="brand">'+BR+'</span></div><h1>'+UI.title+'</h1><p class="lead">'+UI.intro+'</p>'+
 '<ol class="flow">'+UI.steps.map(function(x,i){return '<li><span class="fn">'+(i+1)+'</span><span>'+x+'</span></li>'}).join('')+'</ol>'+
 '<div class="note"><div class="nh"><b>'+UI.refLabel+'</b><span class="num">'+money(D.baseRef)+'</span><span class="tag">游戏假设</span></div><p>'+D.baseRefNote+'</p></div>'+
 '<p class="fine">本游戏的数值、事件、客户和平台规则均为模拟设定；模拟结果不是收入预测。</p>'+cta('<button class="btn" id="go">开始模拟</button>');
 $('#go').onclick=conds}

function conds(){$('#top').hidden=false;wide(0);$('#stepv').textContent='1/'+NSTEP+' 开局条件';prog(.15);
 var h='<div class="kick"><span>第 1 步</span></div><h2>开局条件</h2><p class="mute" style="margin:0">按真实情况选，结果才有参考价值。</p>';
 D.conditions.forEach(function(c){var sel=S.cond[c.id]!=null;
  h+='<div class="sec"><div class="sec-h"><span>'+c.q+'</span><span class="st'+(sel?' ok':'')+'" id="st_'+c.id+'">'+(sel?'已选':'未选')+'</span></div><div class="opts">'+c.opts.map(function(o,i){return '<button class="opt'+(S.cond[c.id]==i?' on':'')+'" aria-pressed="'+(S.cond[c.id]==i)+'" data-c="'+c.id+'" data-i="'+i+'">'+o.t+(o.n?'<span class="n">'+o.n+'</span>':'')+CK+'</button>'}).join('')+'</div></div>'});
 h+=cta('<div class="row"><button class="btn ghost" id="rnd">随机填写</button><button class="btn" id="nx" disabled style="flex:1.6">下一步：选天赋</button></div><div class="links"><button class="tlink" id="bk">返回首页</button></div>');app.innerHTML=h;
 function chk(){var left=D.conditions.filter(function(c){return S.cond[c.id]==null}).length;$('#nx').disabled=left>0;$('#hint').textContent=left?'还有 '+left+' 项未选':'条件已填好'}
 app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){S.cond[b.dataset.c]=+b.dataset.i;app.querySelectorAll('[data-c="'+b.dataset.c+'"]').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});var st=$('#st_'+b.dataset.c);st.textContent='已选';st.classList.add('ok');chk()}});
 $('#rnd').onclick=function(){D.conditions.forEach(function(c){S.cond[c.id]=Math.floor(Math.random()*c.opts.length)});conds()};
 $('#nx').onclick=talents;$('#bk').onclick=intro;chk()}

function talents(just){$('#stepv').textContent='2/'+NSTEP+' 天赋';prog(.3);wide(0);
 var n=S.talents.length;
 var slots=[0,1,2].map(function(k){var i=S.talents[k];return i!=null?'<span class="f">'+D.talents[i].t+'</span>':'<span>空位</span>'}).join('');
 var h='<div class="kick"><span>第 2 步</span></div><h2>选 3 个天赋</h2><p class="mute" style="margin:0 0 12px">选最像你的 3 个。有优点也有毛病，照实选。</p><div class="talents">'+
 D.talents.map(function(t,i){var k=S.talents.indexOf(i),on=k>=0;return '<div class="tal r'+(t.r||0)+(on?' on':'')+(!on&&n==3?' dim':'')+(just===i&&!RMQ.matches?' pick':'')+'" role="button" tabindex="0" aria-pressed="'+on+'" data-i="'+i+'"><span class="ck">'+(on?(k+1):'')+'</span><b>'+t.t+'</b><span class="mute">'+t.n+'</span></div>'}).join('')+'</div>'+
 cta('<div class="slots">'+slots+'</div><button class="btn" id="nx" '+(n==3?'':'disabled')+'>'+(n==3?'确认天赋，开始决策':'已选 '+n+'/3')+'</button><div class="links"><button class="tlink" id="bk">上一步：改条件</button>'+(n?'<button class="tlink" id="clr">清空重选</button>':'')+'</div>',n==3?'再点一次可取消':'还差 '+(3-n)+' 个');
 var y=window.scrollY;app.innerHTML=h;window.scrollTo(0,y);
 app.querySelectorAll('.tal').forEach(function(b){function act(){var i=+b.dataset.i,k=S.talents.indexOf(i);if(k>=0)S.talents.splice(k,1);else if(S.talents.length<3)S.talents.push(i);else{var hn=$('#hint');hn.textContent='最多选 3 个，先取消一个';hn.classList.add('warn');return}talents(i);var f=app.querySelector('.tal[data-i="'+i+'"]');if(f)f.focus({preventScroll:true})}
  b.onclick=act;b.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();act()}}});
 $('#nx').onclick=function(){top0();choices(0)};$('#bk').onclick=function(){top0();conds()};if($('#clr'))$('#clr').onclick=function(){S.talents=[];talents()}}

function dots(n){return '<span class="dots" aria-hidden="true">'+D.choices.map(function(c,i){return '<i class="'+(i<n?'d':i==n?'c':'')+'"></i>'}).join('')+'</span>'}
function choices(n){var c=D.choices[n];$('#stepv').textContent='3/'+NSTEP+' 决策 '+(n+1)+'/'+D.choices.length;prog(.4+n*.4/D.choices.length);wide(0);top0();
 if(D.task&&D.task.after==n-1&&!S.task){taskScr();return}
 app.innerHTML='<div class="kick"><span>决策 '+(n+1)+'/'+D.choices.length+' · '+UI.nodeLabel+'：<b>'+c.node+'</b></span>'+dots(n)+'</div><h2>'+c.q+'</h2><div class="opts list" style="margin-top:14px">'+c.opts.map(function(o,i){return '<button class="opt'+(S.choice[c.id]==i?' on':'')+'" data-i="'+i+'"><span class="ab">'+String.fromCharCode(65+i)+'</span><span class="tx">'+o.t+(o.n?'<span class="n">'+o.n+'</span>':'')+'</span>'+CK+'</button>'}).join('')+'</div>'+
 cta('<button class="btn ghost" id="bk">'+(n?'上一个决策':'上一步：改天赋')+'</button>','选一项后自动进入下一题');
 var busy=false;app.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){if(busy)return;busy=true;S.choice[c.id]=+b.dataset.i;app.querySelectorAll('.opt').forEach(function(x){x.classList.toggle('on',x===b)});setTimeout(function(){next(n)},300)}});
 $('#bk').onclick=function(){if(D.task&&D.task.after==n-1){S.task=null;taskScr();return}n?choices(n-1):talents()}}
function next(n){if(D.task&&D.task.after==n){S.task=null;taskScr(n)}else if(n+1<D.choices.length)choices(n+1);else daysPick()}

/* ---------- 动手环节 ---------- */
function taskScr(){var T=D.task,sel=[];$('#stepv').textContent='4/'+NSTEP+' 动手：'+T.node;wide(0);top0();
 function draw(){app.innerHTML='<div class="kick"><span>动手环节 · '+UI.nodeLabel+'：<b>'+T.node+'</b></span></div><h2>'+T.title+'</h2><p class="mute" style="margin:0;font-size:14px;color:var(--sub)">'+T.desc+'</p><div class="task">'+T.preview+'</div><div class="q" style="margin-top:16px">'+T.prompt+'</div>'+
  T.items.map(function(it){var on=sel.indexOf(it.id)>=0;return '<button class="chk'+(on?' on':'')+'" aria-pressed="'+on+'" data-id="'+it.id+'"><span class="bx">'+(on?'✓':'')+'</span><span>'+it.t+'</span></button>'}).join('')+
  cta('<button class="btn" id="sub" '+(sel.length?'':'disabled')+'>提交检查</button><div class="links"><button class="tlink" id="bk">上一个决策</button></div>',sel.length?'已勾选 '+sel.length+' 项，想好了就提交':'至少勾选 1 项');
  app.querySelectorAll('.chk').forEach(function(b){b.onclick=function(){var id=b.dataset.id,k=sel.indexOf(id);if(k>=0)sel.splice(k,1);else sel.push(id);var y=window.scrollY;draw();window.scrollTo(0,y)}});
  $('#sub').onclick=function(){S.task={sel:sel.slice(),fixed:[]};review()};$('#bk').onclick=function(){choices(T.after)}}
 draw()}
function review(){var T=D.task;top0();
 function draw(){var R=Engine.task(D,S),miss=R.rows.filter(function(x){return x.st=='miss'}).length,ok=R.rows.filter(function(x){return x.st=='ok'}).length,need=T.items.filter(function(x){return x.need}).length,fp=R.rows.filter(function(x){return x.st=='fp'}).length;
  app.innerHTML='<div class="kick"><span>动手环节 · 检查结果</span></div><h2 style="margin-bottom:0">'+T.rtitle+'</h2><div class="score"><span class="num" style="color:'+(ok==need?'var(--good)':'var(--acc)')+'">'+ok+'</span><small>/ '+need+' 个关键项一次抓到</small></div><p class="mute" style="margin:0 0 6px;font-size:14px;color:var(--sub)">'+(miss?'漏掉的项会在后面的模拟里变成真实发生的问题。现在点「补上」可以修复，但会多花一点返工时间。':'关键项都抓到了。')+(fp?' 多勾的项不算错，但会占用时间。':'')+'</p>'+
  R.rows.filter(function(x){return x.st!='skip'}).map(function(x){var it=x.it,lab={ok:'抓到了',miss:'漏掉了',fixed:'已补上',fp:'不必要'}[x.st];
   return '<div class="chk '+(x.st=='fixed'?'ok':x.st)+'" style="cursor:default"><span class="bx">'+(x.st=='miss'?'!':x.st=='fp'?'–':'✓')+'</span><span>'+it.t+'<span class="why"><b>'+lab+'</b>'+it.why+(it.fix&&x.st!='fp'?'<br>做法：'+it.fix:'')+(it.ref?'<br><span class="rtag">参考：'+it.ref+' 自述经历</span>':'')+'</span>'+(x.st=='miss'?'<button class="fixb" data-id="'+it.id+'">补上这一项</button>':'')+'</span></div>'}).join('')+
  cta('<button class="btn" id="go">'+(miss?'带着这些问题继续':'继续下一步')+'</button><div class="links"><button class="tlink" id="redo">重新检查</button></div>',miss?'还有 '+miss+' 项没补':'检查完成');
  app.querySelectorAll('.fixb').forEach(function(b){b.onclick=function(){S.task.fixed.push(b.dataset.id);var y=window.scrollY;draw();window.scrollTo(0,y)}});
  $('#go').onclick=function(){T.after+1<D.choices.length?choices(T.after+1):daysPick()};$('#redo').onclick=function(){S.task=null;taskScr()}}
 draw()}

function daysPick(){$('#stepv').textContent=NSTEP+'/'+NSTEP+' 模拟';prog(.9);wide(0);top0();
 app.innerHTML='<div class="kick"><span>最后一步</span></div><h2>模拟多久？</h2><div class="dtiles"><button class="dtile'+(S.days==15?' on':'')+'" data-d="15"><span class="num">15<span class="u">天</span></span><span class="n">'+UI.d15+'</span></button><button class="dtile'+(S.days==30?' on':'')+'" data-d="30"><span class="num">30<span class="u">天</span></span><span class="n">完整跑一轮</span></button></div>'+
 '<div class="sec"><div class="seedc"><div><span class="mute">随机种子</span><div class="seed">#'+S.seed+'</div></div><button class="btn ghost" id="rs" style="width:auto;min-height:40px;margin:0;font-size:14px;padding:6px 14px">换一组随机事件</button></div><p class="mute" style="margin:8px 0 0">条件、决策和种子都相同，结果就相同，过程中不会暗改。</p></div>'+
 cta('<button class="btn" id="run">开始模拟 '+S.days+' 天</button><div class="links"><button class="tlink" id="bk">上一步：改决策</button></div>');
 app.querySelectorAll('[data-d]').forEach(function(b){b.onclick=function(){S.days=+b.dataset.d;daysPick()}});
 $('#rs').onclick=function(){S.seed=(Math.random()*1e6)|0;daysPick()};$('#run').onclick=run;$('#bk').onclick=function(){choices(D.choices.length-1)}}

function run(){top0();wide(1);var R=Engine.sim(D,S,S.days,S.seed),N=S.days,RM=RMQ.matches;$('#stepv').textContent='模拟中 · #'+S.seed;prog(0);
 var PH=UI.phases;
 function ph(d){for(var k=0;k<PH.length;k++)if(d/N<=PH[k][1])return k;return PH.length-1}
 var sc=0.6+0.25*(R.fit||0),M=UI.mets;
 app.innerHTML='<div class="rn"><div class="rnL"><div class="rnHead"><div class="cal" id="cal"><small>DAY</small><b id="dn">0</b><small>/ '+N+'</small></div><div class="rnT"><div class="ph">当前阶段</div><b id="phn">'+PH[0][0]+'</b><div class="sd">'+BR+' · 种子 #'+S.seed+'</div></div></div>'+
 '<div class="trk" style="margin-top:16px"><div class="trkB"><i id="trkf"></i></div><div class="trkL">'+PH.map(function(p,k){var st=(k?PH[k-1][1]:0);return '<span data-k="'+k+'" style="left:'+(st*100)+'%;width:'+((p[1]-st)*100)+'%">'+(p[2]||p[0])+'</span>'}).join('')+'</div></div>'+
 '<div class="phone"><div class="phT"><span>'+UI.dash+' · 模拟</span><span class="mute">仅示意趋势</span></div><div class="mets'+(M.length>3?' n4':'')+'">'+M.map(function(m,j){return '<div><small>'+m[0]+'</small><b id="m'+j+'">0</b></div>'}).join('')+'</div>'+
 '<svg id="spk" viewBox="0 0 100 30" preserveAspectRatio="none"><defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc23d" stop-opacity=".35"/><stop offset="1" stop-color="#ffc23d" stop-opacity="0"/></linearGradient></defs><polygon id="spa" fill="url(#spg)" points=""/><polyline id="spl" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" points=""/></svg><div class="mute" style="font-size:12px">'+UI.hideNote+'</div></div></div>'+
 '<div class="rnR"><div class="evs" id="evs"><div class="evc idle"><span class="ic">📋</span><div><small class="mute">关键事件</small><b>等待关键事件</b><div class="mute">关键节点会在这里弹出</div></div></div></div><div class="log" id="log" aria-live="polite"></div></div></div>'+
 '<div class="cta runc"><div class="row" style="margin:0"><button class="btn ghost" id="sp" style="flex:1;margin:0">速度 1x</button><button class="btn" id="sk" style="flex:2;margin:0">直接看结果</button></div></div>'+
 '<div class="trans" id="trans" hidden><div><span class="brand">AINPE · 实战情报站</span><h2>模拟结束，进入复盘</h2><p class="mute">正在整理本局数据和真实案例…</p><div class="spin"></div></div></div>';
 var L=$('#log'),i=0,skip=false,spd=1,V=M.map(function(){return 0}),pts=[],cal=$('#cal');
 function add(h,c){var d=document.createElement('div');if(c)d.className=c;d.innerHTML=h;L.appendChild(d);while(L.children.length>60)L.removeChild(L.firstChild);L.scrollTop=L.scrollHeight}
 function tone(e){var m=e.dup?e.m0:e.m;return m<0?'bd':m>0?'gd':'ev'}
 function card(e,d){var t=tone(e),ic=t=='bd'?'⚠️':t=='gd'?'📈':'📌';$('#evs').innerHTML='<div class="evc '+t+(RM?'':' pop')+'"><span class="ic">'+ic+'</span><div><small class="mute">第 '+d+' 天 · 关键事件</small><b>'+e.t+'</b>'+(e.why?'<div class="mute" style="font-size:12.5px;margin-top:4px">原因：'+e.why+'</div>':'')+(e.ref?'<span class="rtag">参考：'+e.ref+' 自述经历</span>':'')+'</div></div>'}
 $('#sp').onclick=function(){spd=spd==1?2:1;this.textContent='速度 '+spd+'x'};
 function fin(){$('#trans').hidden=false;setTimeout(function(){ending(R)},skip||RM?0:900)}
 function step(){if(i>=R.daily.length){fin();return}var x=R.daily[i++],k=ph(x.d);
  $('#dn').textContent=x.d;if(!RM&&!skip){cal.classList.remove('tick');void cal.offsetWidth;cal.classList.add('tick')}
  $('#phn').textContent=PH[k][0];$('#trkf').style.width=(x.d/N*100)+'%';prog(x.d/N);
  app.querySelectorAll('.trkL span').forEach(function(s){s.className=+s.dataset.k<k?'done':+s.dataset.k==k?'on':''});
  var w=x.d/N,de=Math.round((k<UI.liveFrom?M[0][2]:M[0][1])*sc*(0.6+1.8*w)*(1+((x.d*7)%5)/10));V[0]+=de;for(var j=1;j<M.length;j++)V[j]=V[j-1]*M[j][1]*(j==M.length-1?sc:1);
  M.forEach(function(m,j){$('#m'+j).textContent=Math.round(V[j]).toLocaleString()});
  pts.push(de);var mx=Math.max.apply(null,pts)||1,pp=pts.map(function(v,j){return (j/(N-1)*100).toFixed(1)+','+(29-v/mx*27).toFixed(1)});
  $('#spl').setAttribute('points',pp.join(' '));$('#spa').setAttribute('points','0,30 '+pp.join(' ')+' '+((pts.length-1)/(N-1)*100).toFixed(1)+',30');
  x.ev.forEach(function(e){add('<em>D'+x.d+'</em>'+e.t+(e.ref?' <span class="rtag">参考：'+e.ref+'</span>':''),tone(e));if(e.m||e.ref||e.dup||e.why)card(e,x.d)});
  if(x.f)add('<em>D'+x.d+'</em>'+x.f);
  setTimeout(step,skip?0:(x.ev.length?900:260)/spd)}
 $('#sk').onclick=function(){skip=true;this.disabled=true;this.textContent='生成复盘…'};step()}

function verdict(R){var F=R.flags,good=[],bad=[],life=D.conditions[0].opts[S.cond.life].t;
 function has(r){if(r.all&&!r.all.every(function(f){return F[f]}))return false;if(r.any&&!r.any.some(function(f){return F[f]}))return false;if(r.not&&r.not.some(function(f){return F[f]}))return false;return true}
 D.rules.forEach(function(r){if(!has(r))return;if(r.bad)bad.push([r.bad[0].replace('{life}',life),r.bad[1]]);if(r.good)good.push(r.good)});
 var p=R.profit,fit=R.fit,ok=p>=UI.okP&&fit>=3,mid=p>0;
 var v=ok?'适合：值得认真试一次':mid?'可以试：先改掉几个问题':'暂不适合：先补短板';
 var T=UI.titles,title=p>=T[0][0]?T[0][1]:p>=T[1][0]?T[1][1]:p>=T[2][0]?T[2][1]:p>0?T[3][1]:p>-500?T[4][1]:T[5][1];
 (D.specials||[]).forEach(function(x){if(F[x.f]&&p<x.lt)title=x.t});
 return {v:v,title:title,good:good.slice(0,3),bad:bad.slice(0,3),lv:ok?'good':mid?'mid':'bad'}}

function ending(R){$('#stepv').textContent='复盘';prog(1);wide(1);top0();var V=verdict(R);
 var lifeO=D.conditions.map(function(c){return c.opts[S.cond[c.id]].t}),pc=R.profit>=0?'var(--good)':'var(--bad)';
 var slip='<div class="slip'+(RMQ.matches?'':' in')+'"><div class="sh"><span class="brand">'+BR+' · 模拟复盘</span><span class="tag">模拟</span></div>'+
  '<div class="lbl">'+S.days+' 天模拟收益（'+UI.profitNote+'）</div><div class="big" style="color:'+pc+'">'+money(R.profit)+'</div>'+
  '<div class="stamp'+(R.profit<0?' bad':'')+'">「'+V.title+'」</div>'+
  '<div class="vpill '+V.lv+'"><i></i>'+V.v+'</div>'+
  '<div class="ledger"><div class="ex"><span>'+UI.refLabel+'（游戏假设）</span><b>'+money(R.ref)+'</b></div><div><span>'+UI.grossLabel+'</span><b>'+money(R.gross)+'</b></div><div><span>启动花费</span><b>-'+money(R.cost)+'</b></div><div><span>事件</span><b>'+(R.evm>=0?'+':'')+money(R.evm)+'</b></div><div class="tot"><span>收益</span><b style="color:'+pc+'">'+money(R.profit)+'</b></div>'+
  '<span class="fine">以上分开列示：'+UI.refLabel+'是开局假设，不计入收益；收益 = '+UI.grossLabel+' − 花费 ± 事件。种子 #'+S.seed+'</span></div></div>';
 var acts='<div class="acts"><button class="btn" id="dl">保存战报图片</button><button class="btn ghost" id="again">再来一局</button><button class="btn ghost full" id="redo">保留条件，重做决策</button></div>';
 var fitB='<div class="grp"><div class="q">你适合做这个项目吗？'+V.v+'</div>'+V.good.map(function(g){return '<div class="fitl g"><span class="mk">✓</span><div class="pos">'+g+'</div></div>'}).join('')+V.bad.map(function(b){return '<div class="fitl b"><span class="mk">✗</span><div><span class="neg">'+b[0]+'</span><span class="nx">下次：'+b[1]+'</span></div></div>'}).join('')+'</div>';
 app.innerHTML='<div class="end"><div class="endL">'+slip+acts+'</div><div class="endR">'+fitB+'<div class="camp"><b>想把模拟换成实战？</b><p class="mute" style="font-size:14px">扫码了解三天体验营，活动安排以入口说明为准。</p><button class="btn ghost" id="camp">查看体验营介绍</button></div>'+taskBlock()+breakdown()+hitsBlock(R)+
 '<div class="grp imgc"><div class="q" style="text-align:left">战报图片 <span class="tag">模拟</span></div><canvas id="cv" width="720" height="1000" hidden></canvas><img class="cardimg" id="ci" alt="模拟战报图片"><button class="btn ghost" id="dl2" style="max-width:400px;margin:10px auto 0">保存这张图</button></div>'+
 realBlock()+'<div class="disc">声明：本局的数值、事件、客户、平台规则和'+UI.refLabel+'都是游戏设定。模拟结果不是收入预测，也不代表原作者或任何人的收入。</div></div></div>';
 function save(){var a=document.createElement('a');a.download='AINPE-'+UI.dl+'-'+S.seed+'.png';a.href=$('#cv').toDataURL('image/png');a.click()}
 var draw=function(){drawCard(R,V,lifeO)};if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('700 40px "Barlow Condensed"'),document.fonts.load('600 40px "Barlow Condensed"')]).then(draw,draw)}else draw();
 $('#dl').onclick=save;$('#dl2').onclick=save;
 $('#again').onclick=intro;$('#redo').onclick=function(){S.choice={};S.task=null;choices(0)};
 $('#camp').onclick=function(){if($('.modal'))return;var bg=document.createElement('div');bg.className='sheetbg';var m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.innerHTML='<b style="font-size:17px">体验营</b><p class="mute" style="font-size:14px">介绍和报名方式待补充。</p><button class="btn ghost">关闭</button>';function cl(){m.remove();bg.remove()}m.querySelector('button').onclick=cl;bg.onclick=cl;document.body.appendChild(bg);document.body.appendChild(m);m.querySelector('button').focus()}}

function taskBlock(){if(!D.task||!S.task)return '';var R=Engine.task(D,S);var rows=R.rows.filter(function(x){return x.st=='miss'||x.st=='fixed'||x.st=='fp'});
 return '<div class="grp"><div class="q">动手环节回顾：'+D.task.title+'</div>'+(rows.length?rows.map(function(x){var lab={miss:'漏掉',fixed:'检查后补上',fp:'多做了'}[x.st];return '<div class="fitl '+(x.st=='miss'?'b':'g')+'"><span class="mk">'+(x.st=='miss'?'!':x.st=='fp'?'–':'✓')+'</span><div><span class="'+(x.st=='miss'?'neg':x.st=='fp'?'mute':'pos')+'">'+lab+'：'+x.it.t+'</span><span class="nx">'+x.it.why+'</span></div></div>'}).join(''):'<div class="pos">关键项全部一次抓到。</div>')+'</div>'}

function breakdown(){var it=[];D.conditions.forEach(function(c){var o=c.opts[S.cond[c.id]];it.push([c.q+'：'+o.t,o.d])});S.talents.forEach(function(i){it.push(['天赋：'+D.talents[i].t,D.talents[i].d])});D.choices.forEach(function(c){var o=c.opts[S.choice[c.id]];it.push([c.q+' '+o.t,o.d])});
 if(D.task&&S.task)Engine.task(D,S).rows.forEach(function(x){if(x.st=='fixed')it.push(['补上：'+x.it.t+'（返工）',x.it.fd||0]);if(x.st=='fp')it.push(['多做：'+x.it.t,x.it.d||0])});
 var up=it.filter(function(x){return x[1]>0}).sort(function(a,b){return b[1]-a[1]}),dn=it.filter(function(x){return x[1]<0}).sort(function(a,b){return a[1]-b[1]});
 var mx=Math.max.apply(null,it.map(function(x){return Math.abs(x[1]||0)}).concat([1]));
 function li(x){return '<div class="bar '+(x[1]>0?'p':'m')+'"><span class="bt">'+x[0]+'</span><span class="bv">'+(x[1]>0?'+':'−')+'¥'+Math.abs(x[1])+'</span><span class="bl"><i style="width:'+Math.max(3,Math.abs(x[1])/mx*100)+'%"></i></span></div>'}
 return '<div class="grp"><div class="q">复盘：各项条件和决策的影响 <span class="tag">游戏设定</span></div><div class="flowline"><span>起点</span><span class="num">'+money(D.baseRef)+'</span><span>→ 你的'+UI.refLabel+'</span><span class="num" style="color:var(--acc)">'+money(Engine.ref(D,S))+'</span></div>'+(dn.length?'<div class="subh">拉低最多</div><div class="bars">'+dn.slice(0,3).map(li).join('')+'</div>':'')+(up.length?'<div class="subh">加分最多</div><div class="bars">'+up.slice(0,3).map(li).join('')+'</div>':'')+'<details style="margin-top:6px"><summary>查看全部明细</summary><div class="bars" style="padding-bottom:6px">'+dn.concat(up).map(li).join('')+'</div></details></div>'}

function matchCases(){var life=D.conditions[0].opts[S.cond.life].t,tech=S.cond.tech,F=Engine.flags(D,S);
 return D.cases.map(function(c,i){var sc=0;if(c.m.life.indexOf(life)>=0)sc+=3;if(c.m.tech.indexOf(tech)>=0)sc+=2;c.m.flags.forEach(function(f){if(F[f])sc+=1});return{c:c,sc:sc,i:i}}).sort(function(a,b){return b.sc-a.sc||a.i-b.i})}
function caseHtml(c,full){return '<div class="real"><div class="ch"><b>'+esc(c.author)+'</b><span class="mute">'+esc(c.platform)+'</span>'+(c.warn?'<span class="tag warn" style="margin:0">'+esc(c.warn)+'</span>':'')+'</div>'+
 '<div class="kv"><span>起点：</span>'+esc(c.cond.life_context)+' '+esc(c.cond.technical_background)+' <span>每天时间：</span>'+esc(c.cond.daily_time)+'</div>'+
 '<div class="kv" style="color:var(--ink)"><span>项目：</span>'+esc(c.project)+'</div><div class="kv"><span>踩过的坑：</span></div><ul>'+c.pits.map(function(p){return '<li>'+esc(p)+'</li>'}).join('')+'</ul>'+
 c.results.map(function(r){return '<div class="res"><b>自述结果：'+esc(r.amount_text)+'</b><div class="mute">周期：'+esc(r.period)+'</div><div class="mute">口径：'+esc(r.scope)+'</div>'+(full?'<div class="mute">'+esc(r.description)+'</div>':'')+'</div>'}).join('')+
 '<div class="src">来源：<a href="'+c.url+'" rel="noopener">查看原帖</a> · '+c.date+'（北京时间）</div></div>'}
function realBlock(){var M=matchCases(),top=M.filter(function(x){return x.sc>0}).slice(0,2);if(!top.length)top=M.slice(0,1);
 return '<div class="h2s"><h2>和你条件最像的真实案例</h2><span class="tag real">作者自述</span></div><p class="mute">'+D.dataNote+' 匹配只按生活情况、技术经验和你踩的坑粗略对照，不代表你会得到同样结果。</p>'+
 top.map(function(x){return caseHtml(x.c,false)}).join('')+'<details class="all"><summary>看全部 '+D.cases.length+' 个案例</summary>'+D.cases.map(function(c){return caseHtml(c,true)}).join('')+'</details>'}
function hitsBlock(R){if(!R.hits.length)return '';return '<div class="grp"><div class="q">本局踩到的坑 <span class="tag">金额为模拟</span></div><div class="tl">'+R.hits.map(function(h){var amt=h.dup?'<span class="mute">（同类问题已计过一次，不重复扣）</span>':h.m?'<span class="'+(h.m<0?'neg':'pos')+'">'+(h.m<0?'−':'+')+'¥'+Math.abs(h.m)+'（模拟）</span>':'<span class="mute">（不计金额）</span>';
 return '<div class="tli '+(h.dup?'':h.m<0?'m':h.m>0?'p':'')+'"><span class="dd">第'+h.d+'天</span>'+esc(h.t)+' <span class="amt">'+amt+'</span>'+(h.why?'<div class="mute">原因：'+esc(h.why)+'</div>':'')+(h.ref?'<div class="mute">参考：'+esc(h.ref)+' 自述经历</div>':'')+'</div>'}).join('')+'</div></div>'}

/* ---------- 战报图片（结算单样式） ---------- */
function drawCard(R,V,conds){var c=$('#cv'),x=c.getContext('2d'),W=720,P=48,MW=W-2*P,F='-apple-system,"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",sans-serif',NF='"Barlow Condensed","DIN Condensed","DIN Alternate","Bahnschrift","Arial Narrow",'+F;
 var C={bg:'#12142a',slip:'#1d2044',ink:'#f2f3fb',sub:'#c3c7e6',mute:'#8d93bf',acc:'#ffc23d',good:'#3fd6a2',bad:'#ff6f86',sim:'#a2a9ec',line:'#3e4580'};
 function wrap(t,font,mw){x.font=font;var out=[],line='';for(var ch of t){if(x.measureText(line+ch).width>(mw||MW)){out.push(line);line=ch}else line+=ch}if(line)out.push(line);return out}
 var ops=[],H=0;function op(h,f){ops.push([H,f]);H+=h}
 function text(t,font,color,lh,gap,mw,dx){wrap(t,font,mw).forEach(function(l){op(lh,function(y){x.font=font;x.fillStyle=color;x.fillText(l,P+(dx||0),y+lh*0.74)})});if(gap)op(gap,function(){})}
 function kv(k,v){var kw=150;x.font='22px '+F;if(x.measureText(k).width>kw-16){op(32,function(y){x.font='22px '+F;x.fillStyle=C.mute;x.fillText(k,P,y+24)});wrap(v,'24px '+F).forEach(function(l){op(38,function(y){x.font='24px '+F;x.fillStyle=C.ink;x.fillText(l,P,y+28)})});op(6,function(){});return}
  var ls=wrap(v,'24px '+F,MW-kw);ls.forEach(function(l,i){op(38,function(y){if(i==0){x.font='22px '+F;x.fillStyle=C.mute;x.fillText(k,P,y+28)}x.font='24px '+F;x.fillStyle=C.ink;x.fillText(l,P+kw,y+28)})})}
 function rule(gap){op(gap,function(y){x.save();x.strokeStyle=C.line;x.setLineDash([8,8]);x.lineWidth=2;x.beginPath();x.moveTo(P,y+gap/2);x.lineTo(W-P,y+gap/2);x.stroke();x.restore();x.fillStyle=C.bg;[[24,y+gap/2],[W-24,y+gap/2]].forEach(function(p){x.beginPath();x.arc(p[0],p[1],14,0,7);x.fill()})})}
 // 页眉
 op(86,function(y){x.fillStyle=C.acc;x.fillRect(24,24,W-48,62);x.fillStyle='#241a00';x.font='bold 24px '+F;x.fillText(BR,P,64);x.font='bold 20px '+F;var t='模拟复盘';x.fillText(t,W-P-x.measureText(t).width,64)});
 op(28,function(){});
 text(UI.card,'bold 34px '+F,C.ink,48);text('模拟 '+S.days+' 天 · 种子 #'+S.seed,'22px '+F,C.mute,34,12);
 text(S.days+' 天模拟收益','22px '+F,C.sub,32);
 op(124,function(y){x.font='bold 128px '+NF;x.fillStyle=R.profit>=0?C.good:C.bad;x.fillText(money(R.profit),P-4,y+112)});
 op(96,function(y){var t='「'+V.title+'」';x.font='bold 40px '+F;var w=Math.min(x.measureText(t).width,MW-40);x.save();x.translate(P+8,y+20);x.rotate(-0.045);x.strokeStyle=R.profit<0?C.bad:C.acc;x.lineWidth=4;x.beginPath();x.roundRect?x.roundRect(0,0,w+36,64,12):x.rect(0,0,w+36,64);x.stroke();x.fillStyle=R.profit<0?C.bad:C.acc;x.fillText(t,18,46,MW-40);x.restore()});
 text(V.v,'bold 26px '+F,V.lv=='good'?C.good:V.lv=='bad'?C.bad:C.acc,40,8);
 rule(48);
 conds.forEach(function(t,i){kv(D.conditions[i].q.replace(/（.*）/g,''),t)});op(12,function(){});
 kv('天赋',S.talents.map(function(i){return D.talents[i].t}).join(' / '));
 kv('决策',D.choices.map(function(c){return c.opts[S.choice[c.id]].t}).join(' / '));
 if(D.task&&S.task){var tr=Engine.task(D,S).rows,need=tr.filter(function(r){return r.it.need});kv(D.task.card,'抓到 '+need.filter(function(r){return r.st=='ok'}).length+'/'+need.length+(tr.some(function(r){return r.st=='fixed'})?'（另有补救）':''))}
 if(V.bad.length||V.good.length){rule(48);V.bad.slice(0,2).forEach(function(b){text('✗ '+b[0],'25px '+F,C.bad,40)});V.good.slice(0,2).forEach(function(b){text('✓ '+b,'25px '+F,C.good,40)})}
 op(28,function(){});
 text('模拟结果，不是收入预测；数值与事件均为游戏设定。','19px '+F,C.sim,30);
 H+=24+P;c.height=H;
 x.fillStyle=C.bg;x.fillRect(0,0,W,H);
 var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#252a58');g.addColorStop(1,'#191c3c');x.fillStyle=g;
 x.beginPath();x.roundRect?x.roundRect(24,24,W-48,H-48,22):x.rect(24,24,W-48,H-48);x.fill();
 x.textBaseline='alphabetic';
 ops.forEach(function(o){o[1](o[0]+24)});
 $('#ci').src=c.toDataURL('image/png')}
intro();
