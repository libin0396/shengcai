
var Engine=(function(){
 function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function picked(D,s){var out=[];D.conditions.forEach(function(c){if(s.cond[c.id]!=null)out.push(c.opts[s.cond[c.id]])});
  (s.talents||[]).forEach(function(i){out.push(D.talents[i])});D.choices.forEach(function(c){if(s.choice[c.id]!=null)out.push(c.opts[s.choice[c.id]])});return out}
 // 动手环节：漏掉的项不在这里扣，而是在模拟中以事件发生；补上的项只计少量返工；多选了不必要的项计少量浪费（游戏设定）
 function task(D,s){var r={d:0,flags:{},rows:[]};if(!D.task||!s.task)return r;var T=s.task;
  D.task.items.forEach(function(it){var sel=T.sel.indexOf(it.id)>=0,fx=(T.fixed||[]).indexOf(it.id)>=0,st;
   if(it.need){if(sel){st='ok'}else if(fx){st='fixed';r.d+=it.fd||0;r.flags['fixed_'+it.id]=1}else{st='miss';r.flags['miss_'+it.id]=1}}
   else{if(sel){st='fp';r.d+=it.d||0;r.flags['fp_'+it.id]=1}else st='skip'}
   r.rows.push({it:it,st:st})});
  var miss=r.rows.filter(function(x){return x.st=='miss'}).length;r.flags[miss==0?'task_good':miss<=2?'task_mid':'task_bad']=1;return r}
 function ref(D,s){return Math.max(0,picked(D,s).reduce(function(a,o){return a+(o.d||0)},D.baseRef)+task(D,s).d)}
 function flags(D,s){var f={};picked(D,s).forEach(function(o){(o.flags||[]).forEach(function(x){f[x]=1})});var t=task(D,s).flags;for(var k in t)f[k]=1;return f}
 function fit(D,s){return D.conditions.reduce(function(a,c){var o=c.opts[s.cond[c.id]];return a+(o&&o.fit||0)},0)}
 function charged(D,s){var k={};picked(D,s).forEach(function(o){if(o.k&&(o.d||0)<0)k[o.k]=1});return k}
 function sim(D,s,days,seed){
  var r=rng(seed),F=flags(D,s),R=ref(D,s),cost=0,evm=0,U=D.ui||{};
  var fund=D.conditions.filter(function(c){return c.id=='fund'})[0].opts[s.cond.fund];cost=fund.cost||0;
  var luck=0.85+0.3*r(), ramp=days>=30?1:0.4;
  var boostF=U.boostFlag||'payfirst';var fundBoost=F[boostF]? cost*1.4 : cost*0.3;
  var gross=Math.max(0,(R*luck*0.8+fundBoost)*ramp);
  var evs=[];D.events.forEach(function(e){var ok=e.need.every(function(x){return F[x]});if(!ok)return;if(r()>=e.p)return;
   var d=e.day[0]+Math.floor(r()*(e.day[1]-e.day[0]+1));if(d>days){if(days>=30)return;d=Math.max(2,Math.round(d/2))}evs.push({d:d,t:e.t,m:e.m,ref:e.ref,k:e.k,why:e.why})});
  evs.sort(function(a,b){return a.d-b.d});var used=charged(D,s);
  evs.forEach(function(e){if(e.k&&e.m<0){if(used[e.k]){e.dup=1;e.m0=e.m;e.m=0}else used[e.k]=1}});
  var cum=0,prev=0,daily=[],e0=U.ev0||"立项！在需求板写下第一行字。",em=U.evMid||{f:0.35,t:"小程序提交审核（航海节点：审核与发布）。"};
  for(var d=1;d<=days;d++){var w=Math.pow(d/days,1.8),inc=Math.round(gross*w)-prev;prev+=inc;
   var line={d:d,inc:inc,ev:[]};evs.forEach(function(e){if(e.d==d){line.ev.push(e);evm+=e.m*(days>=30?1:0.7)}});
   if(!line.ev.length)line.f=D.filler[Math.floor(r()*D.filler.length)];
   if(d==1)line.ev.unshift({t:e0,m:0});
   if(d==Math.round(days*em.f))line.ev.push({t:em.t,m:0});
   cum+=inc;line.cum=Math.round(cum-cost+evm);daily.push(line)}
  var profit=Math.round(gross-cost+evm);var hits=[];daily.forEach(function(x){x.ev.forEach(function(e){if(e.ref||e.why)hits.push({d:x.d,t:e.t,m:e.m,ref:e.ref,why:e.why,dup:e.dup,m0:e.m0})})});
  return {ref:R,gross:Math.round(gross),cost:cost,evm:Math.round(evm),profit:profit,hits:hits,daily:daily,flags:F,fit:fit(D,s),luck:luck}}
 return {rng:rng,ref:ref,flags:flags,fit:fit,sim:sim,task:task}})();
if(typeof module!=='undefined')module.exports=Engine;
