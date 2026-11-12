/* 学 AI 徽章：六个单元各一枚，画成一枚花边圆章，中间是这个单元的小图。
   没拿到：白色章 + 外面一圈进度（一段一节课，第 6 单元多一段「跟着做的作品」）。
   拿到了：金色章 + 蓝色单元号；第一次看到时会转着弹出来，闪一下光，四周冒几颗小星星。
   网页直接用 svg() 画；小程序用 scripts/build-badge-images.mjs 按这里的图样导出的 PNG（static/learn/img/badges/）。
   颜色写在属性里（浅色），网页上由 ai-badges.css 按浅色/深色覆盖。 */
(function(root){
  'use strict';
  // 每个单元的小图（线条画，坐标以章的中心为原点）：认识 AI、表达需求、处理文字与资料、制作图片与声音、制作视频、完成综合作品
  var ICONS={
    u1:{dy:2.5,d:'<rect x="-9" y="-6" width="18" height="14" rx="4"/><path d="M0-6v-4"/><circle cx="0" cy="-11.5" r="1.6"/><circle class="abg-f" cx="-3.6" cy=".5" r="1.6" fill="#412402"/><circle class="abg-f" cx="3.6" cy=".5" r="1.6" fill="#412402"/><path d="M-3 4.6h6"/>'},
    u2:{dy:-.5,d:'<path d="M-10-8h20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H-1l-5 4v-4h-4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/><path d="M-6-3h12M-6 1h8"/>'},
    u3:{dy:0,d:'<path d="M-7-11h9l6 6v15a1 1 0 0 1-1 1H-7a1 1 0 0 1-1-1v-20a1 1 0 0 1 1-1z"/><path d="M2-11v6h6"/><path d="M-4 0h8M-4 4h5"/>'},
    u4:{dy:0,d:'<rect x="-11" y="-8" width="15" height="13" rx="2"/><path d="M-9 3l4-5 3 3 2-2 3 4"/><path d="M8-6v11"/><circle cx="6" cy="6" r="2.2"/><path d="M8-6l3 1.5"/>'},
    u5:{dy:-.5,d:'<rect x="-11" y="-7" width="22" height="15" rx="3"/><path class="abg-f" d="M-3-3v7l6-3.5z" fill="#412402"/>'},
    u6:{dy:1,d:'<path d="M0-11l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2L0 5.5l-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1z"/>'}
  };
  var C={ // 浅色下的颜色（小程序 PNG 就是这一套）
    off:{body:'#FFFFFF',edge:'#D9DCE2',dash:'#E3E6EB',ink:'#A3A9B4',pill:'#E6E8EC',num:'#5F6675'},
    got:{body:'#FFC83D',edge:'#EF9F27',dash:'#BA7517',ink:'#412402',pill:'#2B44E6',num:'#FFFFFF'},
    track:'#E6E8EC',done:'#2B44E6'
  };
  function f2(n){return String(Math.round(n*100)/100)}
  function pt(r,deg){var t=deg*Math.PI/180;return f2(r*Math.sin(t))+' '+f2(-r*Math.cos(t))}
  // 花边圆：半径随角度起伏（n 道花边）
  function sealPath(R,A,n){
    var out=[],N=n*8;
    for(var i=0;i<N;i++){var t=i/N*Math.PI*2,r=R+A*Math.cos(n*t);out.push(f2(r*Math.sin(t))+' '+f2(-r*Math.cos(t)))}
    return 'M'+out.join('L')+'Z';
  }
  var SEAL=sealPath(31,2.2,14),MINI_SEAL=sealPath(29,2.4,12);
  // 进度圈：底部给单元号留个口，其余平分成 total 段
  function ring(done,total){
    var gap=56,sep=12,start=180+gap/2,sweep=360-gap,len=(sweep-(total-1)*sep)/total,s='';
    for(var i=0;i<total;i++){
      var a0=start+i*(len+sep),a1=a0+len;
      s+='<path class="'+(i<done?'abg-done':'abg-track')+'" d="M'+pt(39,a0)+'A39 39 0 '+(len>180?1:0)+' 1 '+pt(39,a1)+'" stroke="'+(i<done?C.done:C.track)+'"/>';
    }
    return '<g fill="none" stroke-width="3.4" stroke-linecap="round">'+s+'</g>';
  }
  var uid=0;
  /* 一枚徽章。opts：got 拿到了；done/total 进度（没拿到时画圈）；no 单元号；size 像素；earn 播放拿到时的动画；standalone 导出图片用 */
  function svg(id,opts){
    opts=opts||{};
    var got=!!opts.got,k=got?C.got:C.off,icon=ICONS[id]||ICONS.u6,size=opts.size||64,total=Math.max(1,opts.total||1);
    var done=Math.max(0,Math.min(total,opts.done||0)),earn=got&&!!opts.earn,cid='abg-c'+(++uid);
    var s='<svg class="abg '+(got?'abg-got':'abg-off')+(earn?' abg-earn':'')+'" viewBox="-46 -46 92 92" width="'+size+'" height="'+size+'"'+
      (opts.standalone?' xmlns="http://www.w3.org/2000/svg" font-family="Inter, -apple-system, \'PingFang SC\', \'Helvetica Neue\', Arial, sans-serif"':' aria-hidden="true" focusable="false"')+'>';
    if(!got)s+=ring(done,total);
    s+='<g class="abg-seal">';
    s+='<path class="abg-body" d="'+SEAL+'" fill="'+k.body+'" stroke="'+k.edge+'" stroke-width="'+(got?2:1.6)+'" stroke-linejoin="round"/>';
    s+='<circle class="abg-dash" r="24" fill="none" stroke="'+k.dash+'" stroke-width="1.3" stroke-dasharray="2.2 2.8"/>';
    if(got)s+='<path d="M-19.5-12.2A23 23 0 0 1-7-21.9" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round"/>';
    s+='<g class="abg-ink" transform="translate(0 '+icon.dy*1.25+') scale(1.25)" fill="none" stroke="'+k.ink+'" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+
      (got?icon.d:icon.d.replace(/#412402/g,k.ink))+'</g>';
    s+='</g>';
    // 闪光放在章外面一层，免得它移动时改变章的中心（弹出动画以章的中心为原点）
    if(earn)s+='<clipPath id="'+cid+'"><path d="'+SEAL+'"/></clipPath><g clip-path="url(#'+cid+')"><g transform="skewX(-20)"><rect class="abg-shine" x="-7" y="-46" width="11" height="92" fill="#FFFFFF" fill-opacity=".6"/></g></g>';
    if(opts.no){
      s+='<g class="abg-tab"><rect class="abg-pill" x="-10" y="27.5" width="20" height="15" rx="7.5" fill="'+k.pill+'"/>'+
        '<text class="abg-num" x="0" y="38.8" text-anchor="middle" font-size="10.5" font-weight="800" fill="'+k.num+'">'+opts.no+'</text></g>';
    }
    if(earn){
      s+='<g class="abg-sparks">';
      for(var i=0;i<6;i++)s+='<g transform="rotate('+(i*60+30)+')"><circle class="abg-spark" r="'+(i%2?1.8:2.4)+'" fill="'+(i%2?C.done:'#FFC83D')+'"/></g>';
      s+='</g>';
    }
    return s+'</svg>';
  }
  /* 页头「徽章 n / 6」前面的小章：拿到过就是金色 */
  function mini(got,opts){
    opts=opts||{};var k=got?C.got:C.off,size=opts.size||18;
    return '<svg class="abg abg-mini '+(got?'abg-got':'abg-off')+'" viewBox="-34 -34 68 68" width="'+size+'" height="'+size+'"'+(opts.standalone?' xmlns="http://www.w3.org/2000/svg"':' aria-hidden="true" focusable="false"')+'>'+
      '<path class="abg-body" d="'+MINI_SEAL+'" fill="'+k.body+'" stroke="'+k.edge+'" stroke-width="3.2" stroke-linejoin="round"/>'+
      '<path class="abg-fill" transform="translate(0 1.4) scale(1.45)" d="'+ICONS.u6.d.match(/d="([^"]+)"/)[1]+'" fill="'+k.ink+'"/></svg>';
  }
  /* 一个单元离徽章还差多少：一节课一段，要做作品的单元再加作品的段数 */
  function steps(unit,lessonsDone,made){
    var need=unit.needProjects||0;
    return {done:Math.min(lessonsDone,unit.lessons.length)+Math.min(made||0,need),total:unit.lessons.length+need};
  }
  /* 已经庆祝过的徽章（只在这台设备上记，换设备会再弹一次） */
  var SEEN_KEY='ainpe:badges-seen';
  function seen(){try{var v=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return {}}}
  function markSeen(id){try{var v=seen();v[id]=1;localStorage.setItem(SEEN_KEY,JSON.stringify(v))}catch(e){}}

  root.AINPE_BADGES={ICONS:ICONS,COLORS:C,svg:svg,mini:mini,steps:steps,seen:seen,markSeen:markSeen,SEEN_KEY:SEEN_KEY};
})(typeof window!=='undefined'?window:globalThis);
