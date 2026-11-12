// 由 scripts/build-mini-ai-content.mjs 从 static/learn/zuo-core.js 生成，请改源文件后重新生成。
const holder = {};
/* 跟着做 · 玩法规则（网页和小程序共用这一份）
   网页：<script src="zuo-core.js"> 之后用 window.AINPE_ZUO_CORE。
   小程序：scripts/build-mini-ai-content.mjs 把这个文件包成 ES 模块，生成 src/data/zuo-core.js，生成的文件不要手改。
   这里只放「怎么算做对、做完」的规则，不碰页面：
     start(w) 给出一个玩法的初始状态；act(w, s, a) 处理一次点按，改状态并返回 {ok, msg}（ok：true 对、false 错、null 没有对错）；
     done(w, s) 判断做完没有；solve(w, s) 直接摆成做好的样子（「跳过练习」时用）。 */
(function(root){
  'use strict';
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k)}
  // 固定种子的打乱：同一道题每次打乱成一样的顺序，方便测试；打乱后和原顺序一样时，把头两个换一下
  function seeded(n,seed){
    var a=[],i,s=seed||7;for(i=0;i<n;i++)a.push(i);
    for(i=n-1;i>0;i--){s=(s*9301+49297)%233280;var j=Math.floor(s/233280*(i+1));var x=a[i];a[i]=a[j];a[j]=x}
    if(n>1&&a.every(function(v,k){return v===k})){var y=a[0];a[0]=a[1];a[1]=y}
    return a;
  }

  /* ---------- 提示词：【】是要填的空，以「粘贴」开头的空留给用户粘贴上一步的结果 ---------- */
  function parts(prompt){
    var out=[],re=/【([^】]*)】/g,last=0,m,p=String(prompt||'');
    while((m=re.exec(p))){if(m.index>last)out.push({text:p.slice(last,m.index)});out.push({slot:m[1]});last=re.lastIndex}
    if(last<p.length)out.push({text:p.slice(last)});
    return out;
  }
  function isPaste(label){return /^粘贴/.test(String(label||''))}
  function slots(prompt){return parts(prompt).filter(function(x){return x.slot!=null}).map(function(x){return x.slot})}
  function fill(prompt,values){
    return parts(prompt).map(function(x){
      if(x.text!=null)return x.text;
      var v=values&&own(values,x.slot)?String(values[x.slot]==null?'':values[x.slot]).trim():'';
      return v||'【'+x.slot+'】';
    }).join('');
  }
  // 对照检查：剧本里写好的几项；没写就按教程的检查文字拆开
  function checks(step,sc){
    if(sc&&sc.checks&&sc.checks.length)return sc.checks.slice();
    return String(step&&step.check||'').replace(/^[^：]{1,8}：/,'').split(/[；。]/).map(function(x){return x.trim()}).filter(Boolean);
  }
  function plays(sc){var p=sc&&sc.play;return !p?[]:Array.isArray(p)?p:[p]}

  /* ---------- 玩法 ---------- */
  var K={};

  // 打码：点笔记里该隐去的词。同一个词出现几次，一次全打上。
  K.mask={
    words:function(w){
      var need={},keep={};
      (w.lines||[]).forEach(function(line){line.forEach(function(seg){
        if(seg&&typeof seg==='object'){if(seg.to!=null)need[seg.w]=seg.to;else keep[seg.w]=seg.keep||''}
      })});
      return {need:need,keep:keep};
    },
    start:function(){return {hit:{}}},
    act:function(w,s,a){
      var m=K.mask.words(w),word=a.word;
      if(own(m.need,word)){if(s.hit[word])return {ok:null,msg:''};s.hit[word]=true;return {ok:true,msg:'打好码了：'+word+' → '+m.need[word]}}
      if(own(m.keep,word))return {ok:false,msg:m.keep[word]||'这个不用打码。'};
      return {ok:null,msg:''};
    },
    left:function(w,s){var m=K.mask.words(w);return Object.keys(m.need).filter(function(k){return !s.hit[k]}).length},
    // 打好码以后的笔记全文（交给下一步的提示词）
    text:function(w,s){var m=K.mask.words(w);return (w.lines||[]).map(function(line){return line.map(function(seg){
      if(!seg||typeof seg!=='object')return String(seg);return own(m.need,seg.w)&&s.hit[seg.w]?m.need[seg.w]:seg.w}).join('')}).join('\n')},
    done:function(w,s){return K.mask.left(w,s)===0},
    solve:function(w,s){Object.keys(K.mask.words(w).need).forEach(function(k){s.hit[k]=true})}
  };

  // 找茬：点出没有依据、写错了的那几句
  K.spot={
    start:function(){return {found:{}}},
    act:function(w,s,a){
      var L=(w.lines||[])[a.i];if(!L)return {ok:null,msg:''};
      if(L.bad){if(s.found[a.i])return {ok:null,msg:''};s.found[a.i]=true;return {ok:true,msg:L.why||'找到了。'}}
      return {ok:false,msg:L.why||w.fine||'这句没问题。'};
    },
    left:function(w,s){return (w.lines||[]).filter(function(L,i){return L.bad&&!s.found[i]}).length},
    done:function(w,s){return K.spot.left(w,s)===0},
    solve:function(w,s){(w.lines||[]).forEach(function(L,i){if(L.bad)s.found[i]=true})}
  };

  // 分一分：一张一张卡片，放进对的那一边
  K.judge={
    start:function(){return {i:0,miss:0}},
    act:function(w,s,a){
      var it=(w.items||[])[s.i];if(!it)return {ok:null,msg:''};
      if(a.bin===it.bin){s.i++;return {ok:true,msg:it.why||'对。'}}
      s.miss++;return {ok:false,msg:it.no||it.why||'再想想。'};
    },
    done:function(w,s){return s.i>=(w.items||[]).length},
    solve:function(w,s){s.i=(w.items||[]).length}
  };

  // 选一个：有的选项不对，会说为什么
  K.pick={
    start:function(){return {chosen:-1,tried:{}}},
    act:function(w,s,a){
      var o=(w.options||[])[a.i];if(!o||s.chosen>=0)return {ok:null,msg:''};
      s.tried[a.i]=true;
      if(o.ok){s.chosen=a.i;return {ok:true,msg:o.why||'对。'}}
      return {ok:false,msg:o.why||'再想想。'};
    },
    done:function(w,s){return s.chosen>=0},
    solve:function(w,s){for(var i=0;i<(w.options||[]).length;i++)if(w.options[i].ok){s.chosen=i;break}}
  };

  // 排顺序：按先后一个个点
  K.order={
    start:function(w){return {pool:seeded((w.items||[]).length,w.seed||11),placed:[]}},
    act:function(w,s,a){
      if(s.placed.indexOf(a.i)>=0)return {ok:null,msg:''};
      if(a.i===s.placed.length){s.placed.push(a.i);var k=s.pool.indexOf(a.i);if(k>=0)s.pool.splice(k,1);return {ok:true,msg:''}}
      return {ok:false,msg:w.hint||'不是这个，想想哪个该在前面。'};
    },
    done:function(w,s){return s.placed.length>=(w.items||[]).length},
    solve:function(w,s){s.placed.splice(0,s.placed.length);for(var i=0;i<(w.items||[]).length;i++)s.placed.push(i);s.pool.splice(0,s.pool.length)}
  };

  // 选词拼：每一行选一个词，拼出素材或提示词；有的词不能用，会说为什么
  K.chips={
    start:function(){return {val:{}}},
    act:function(w,s,a){
      var sl=(w.slots||[]).filter(function(x){return x.k===a.k})[0];if(!sl)return {ok:null,msg:''};
      var o=sl.options[a.j];if(!o)return {ok:null,msg:''};
      if(o.bad)return {ok:false,msg:o.bad};
      s.val[a.k]=o.t;return {ok:true,msg:o.why||''};
    },
    done:function(w,s){return (w.slots||[]).every(function(x){return own(s.val,x.k)})},
    solve:function(w,s){(w.slots||[]).forEach(function(x){if(own(s.val,x.k))return;for(var j=0;j<x.options.length;j++)if(!x.options[j].bad){s.val[x.k]=x.options[j].t;break}})},
    text:function(w,s){return String(w.preview||'').replace(/\{([^}]+)\}/g,function(_,k){return own(s.val,k)?s.val[k]:'____'})}
  };

  // 分时间：几段加起来正好是总时长，重点那段最长
  K.alloc={
    start:function(w){return {v:(w.parts||[]).map(function(p){return p.v})}},
    sum:function(w,s){return s.v.reduce(function(x,y){return x+y},0)},
    status:function(w,s){
      var sum=K.alloc.sum(w,s);
      if(sum>w.total)return {ok:false,msg:'多了 '+(sum-w.total)+' 分钟，减一点。'};
      if(sum<w.total)return {ok:null,msg:'还剩 '+(w.total-sum)+' 分钟没分出去。'};
      var big=w.big==null?-1:w.big;
      if(big>=0&&s.v.some(function(x,i){return i!==big&&x>=s.v[big]}))return {ok:false,msg:w.bigMsg||'重点那段的时间要最多。'};
      return {ok:true,msg:w.okMsg||'分好了，加起来正好 '+w.total+' 分钟。'};
    },
    act:function(w,s,a){
      var p=(w.parts||[])[a.p];if(!p)return {ok:null,msg:''};
      var nv=s.v[a.p]+(a.d||0);
      if(nv<(p.min||1))return {ok:false,msg:p.k+'不能再少了。'};
      if(nv>(p.max||w.total))return {ok:false,msg:p.k+(p.maxMsg?p.maxMsg:'不能再多了。')};
      s.v.splice(a.p,1,nv);
      return K.alloc.status(w,s);
    },
    done:function(w,s){return K.alloc.status(w,s).ok===true},
    solve:function(w,s){(w.answer||[]).forEach(function(x,i){s.v.splice(i,1,x)})}
  };

  // 放文字：先点一行字，再点图上要放的位置
  K.place={
    start:function(){return {sel:0,at:{}}},
    next:function(w,s){for(var i=0;i<(w.texts||[]).length;i++)if(!own(s.at,i))return i;return -1},
    act:function(w,s,a){
      if(a.text!=null){if(own(s.at,a.text))return {ok:null,msg:''};s.sel=a.text;return {ok:null,msg:''}}
      if(a.zone!=null){
        var t=(w.texts||[])[s.sel];if(!t||own(s.at,s.sel))return {ok:null,msg:'先点一行字。'};
        if(a.zone===t.zone){s.at[s.sel]=a.zone;s.sel=K.place.next(w,s);return {ok:true,msg:''}}
        var z=(w.zones||[]).filter(function(x){return x.k===a.zone})[0];
        return {ok:false,msg:(z&&z.why)||'放这里不合适。'};
      }
      return {ok:null,msg:''};
    },
    done:function(w,s){return (w.texts||[]).every(function(_,i){return own(s.at,i)})},
    solve:function(w,s){(w.texts||[]).forEach(function(t,i){s.at[i]=t.zone});s.sel=-1}
  };

  // 读一遍：照着亮起来的字读出声，读完看看用了几秒
  K.read={
    start:function(){return {phase:'idle',t0:0,secs:0}},
    verdict:function(w,s){
      var t=w.target||30,d=s.secs-t;
      if(Math.abs(d)<=Math.max(3,Math.round(t*0.15)))return {ok:true,msg:'读了 '+s.secs+' 秒，和 '+t+' 秒差不多。'};
      return d<0?{ok:true,msg:'读了 '+s.secs+' 秒，比 '+t+' 秒短。'+(w.short||'可以补一句你自己的经验。')}:{ok:true,msg:'读了 '+s.secs+' 秒，比 '+t+' 秒长。'+(w.long||'删掉一句重复的话。')};
    },
    act:function(w,s,a){
      if(a.go){s.phase='reading';s.t0=a.now;s.secs=0;return {ok:null,msg:''}}
      if(a.stop&&s.phase==='reading'){s.secs=Math.max(1,Math.round((a.now-s.t0)/1000));s.phase='done';return K.read.verdict(w,s)}
      return {ok:null,msg:''};
    },
    done:function(w,s){return s.phase==='done'},
    solve:function(w,s){s.phase='done';s.secs=Math.max(1,Math.round(String(w.text||'').length/(w.cps||4.5)))}
  };

  // 翻一翻：每一页都翻到
  K.book={
    start:function(){return {p:0,seen:{0:true}}},
    act:function(w,s,a){
      var n=(w.pages||[]).length,p=a.to!=null?a.to:s.p+(a.d||0);
      p=Math.max(0,Math.min(n-1,p));s.p=p;s.seen[p]=true;return {ok:null,msg:''};
    },
    done:function(w,s){return (w.pages||[]).every(function(_,i){return !!s.seen[i]})},
    solve:function(w,s){(w.pages||[]).forEach(function(_,i){s.seen[i]=true})}
  };

  // 成片：时间线、字幕、导出放完就算看完
  K.film={
    start:function(){return {end:false}},
    act:function(w,s,a){if(a.end)s.end=true;return {ok:null,msg:''}},
    done:function(w,s){return !!s.end},
    solve:function(w,s){s.end=true}
  };

  function kind(w){return K[w&&w.kind]||null}
  function start(w){var k=kind(w);return k?k.start(w):{}}
  function act(w,s,a){var k=kind(w);return k?k.act(w,s,a||{}):{ok:null,msg:''}}
  function done(w,s){var k=kind(w);return k?!!k.done(w,s):true}
  function solve(w,s){var k=kind(w);if(k)k.solve(w,s);return s}
  // 做完后要记下来、给后面几步提示词用的值
  function saved(w,s){
    var out={};
    if(w&&w.kind==='chips')Object.keys(s.val||{}).forEach(function(k){out[k]=s.val[k]});
    if(w&&w.kind==='chips'&&w.saveAs)out[w.saveAs]=K.chips.text(w,s);
    if(w&&w.kind==='mask'&&w.saveAs)out[w.saveAs]=K.mask.text(w,s);
    if(w&&w.kind==='pick'&&w.save&&s.chosen>=0)out[w.save]=String(s.chosen+1);
    return out;
  }

  root.AINPE_ZUO_CORE={K:K,start:start,act:act,done:done,solve:solve,saved:saved,parts:parts,isPaste:isPaste,slots:slots,fill:fill,checks:checks,plays:plays,seeded:seeded};
})(holder);
export default holder.AINPE_ZUO_CORE;
