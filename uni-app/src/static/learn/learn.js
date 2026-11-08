/* AI 实战情报站 · 学（静态页公用脚本）
   - 小程序 web-view 识别：小程序里隐藏顶栏和底部导航，外链一律改成复制
   - 复制、提示条、本地进度、统计（只发白名单事件，不发用户输入的文字）
   - 作品卡：微信版带二维码，小红书版不带任何二维码、网址、微信号 */
(function(root){
  'use strict';
  var doc=root.document;
  var MP=!!root.AINPE_MP||/miniProgram/i.test(navigator.userAgent||'')||root.__wxjs_environment==='miniprogram'||/[?&]mp=1(&|$)/.test(location.search);
  try{if(MP)sessionStorage.setItem('ainpe:mp','1');else if(sessionStorage.getItem('ainpe:mp')==='1')MP=true}catch(_){}
  root.AINPE_MP=MP;
  if(MP)doc.documentElement.classList.add('is-mp');
  var SITE='https://ainpe.aisen.xin';

  function $(s,el){return (el||doc).querySelector(s)}
  function $$(s,el){return Array.prototype.slice.call((el||doc).querySelectorAll(s))}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  var toastEl,toastTimer;
  function toast(msg){
    if(!toastEl){toastEl=doc.createElement('div');toastEl.className='toast';toastEl.setAttribute('role','status');doc.body.appendChild(toastEl)}
    toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){toastEl.classList.remove('show')},2200);
  }
  function fallbackCopy(text){
    var ta=doc.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:-1000px;opacity:0';
    doc.body.appendChild(ta);ta.select();ta.setSelectionRange(0,text.length);var ok=false;try{ok=doc.execCommand('copy')}catch(_){}
    doc.body.removeChild(ta);return ok;
  }
  function copy(text,msg){
    var done=function(ok){toast(ok?(msg||'已复制，去豆包粘贴就行'):'复制没成功，长按文字手动复制')};
    if(navigator.clipboard&&root.isSecureContext){navigator.clipboard.writeText(text).then(function(){done(true)},function(){done(fallbackCopy(text))})}
    else done(fallbackCopy(text));
  }
  function download(name,text){
    if(MP){copy(text,'小程序里不能下载，已复制全文');return}
    try{var a=doc.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.download=name;doc.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
    catch(_){copy(text,'下载没成功，已复制全文')}
  }
  // 小程序 web-view 打不开外部网址：复制链接
  function openOut(url,label){
    if(MP){copy(url,(label||'链接')+'已复制，去浏览器打开');return}
    root.location.href=url;
  }

  var KEY='ainpe:learn';
  function load(){try{var v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(_){return {}}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
  function getState(topic){var all=load();return all[topic]||{}}
  function setState(topic,patch){var all=load(),cur=all[topic]||{};for(var k in patch)cur[k]=patch[k];all[topic]=cur;save(all);return cur}

  function track(event,opts){try{if(root.AINPETrack)root.AINPETrack.track(event,opts||{})}catch(_){}}

  // 公用顶栏、底部导航、生财横幅
  var STEP='<span class="step s3" aria-hidden="true"><i></i><i></i><i></i></span>';
  function chrome(active,bannerFrom){
    var hdr=doc.createElement('header');hdr.className='lhdr';
    hdr.innerHTML='<div class="w"><a class="lbrand" href="/#/pages/discover/index"><i>↗</i>AI 实战情报站 <small>AINPE.</small></a></div>';
    doc.body.insertBefore(hdr,doc.body.firstChild);
    if(bannerFrom&&!MP){
      var a=doc.createElement('a');a.className='lbanner';a.href='/#/pages/camp/index?from='+bannerFrom;
      a.innerHTML='<em>生财有术</em>想用 AI 赚钱？看看真人怎么做<span>›</span>';
      a.addEventListener('click',function(){track('outbound_click',{target:'camp',from:'learn'})});
      doc.body.insertBefore(a,hdr);
    }
    var nav=doc.createElement('nav');nav.className='lnav';nav.setAttribute('aria-label','主导航');
    [['home','首页','/#/pages/discover/index'],['learn','学','/static/learn/index.html'],['intel','情报','/#/pages/intelligence/index'],['mine','我的','/#/pages/saved/index']].forEach(function(l){
      var a=doc.createElement('a');a.href=l[2];var on=l[0]===active;
      a.innerHTML=(on?'<i>'+STEP+'</i>':'<i></i>')+'<span>'+l[1]+'</span>';
      if(on){a.className='on';a.setAttribute('aria-current','page')}nav.appendChild(a);
    });
    doc.body.appendChild(nav);
  }
  // 滚到吸顶导航所在位置，避免切换时跳回页首。
  function toTabs(){var t=$('.ttop');if(!t)return;var y=t.getBoundingClientRect().bottom+(root.scrollY||root.pageYOffset||0)-4;root.scrollTo(0,Math.max(0,y))}
  function banner(){return null} // 已并入 chrome()

  // ---------- 作品卡 ----------
  function loadImg(src){return new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=src})}
  function wrapText(ctx,text,x,y,maxW,lh,maxLines){
    var lines=[],cur='';
    String(text).split('').forEach(function(ch){if(ch==='\n'){lines.push(cur);cur='';return}var t=cur+ch;if(ctx.measureText(t).width>maxW&&cur&&!/[，。、》」）：；！？,.]/.test(ch)){lines.push(cur);cur=ch}else cur=t});
    if(cur)lines.push(cur);
    if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].slice(0,-1)+'…'}
    lines.forEach(function(l,i){ctx.fillText(l,x,y+i*lh)});return y+lines.length*lh;
  }
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function coverImg(ctx,im,x,y,w,h,r){
    ctx.save();roundRect(ctx,x,y,w,h,r);ctx.clip();
    if(im){var s=Math.max(w/im.width,h/im.height),iw=im.width*s,ih=im.height*s;ctx.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}else{ctx.fillStyle='#DCE8DF';ctx.fillRect(x,y,w,h)}
    ctx.restore();
  }
  /* opts: {kicker,title,sub,images:[src],items:[text],withQr:bool,qrPath,qrLabel} → Promise<dataURL> */
  function workCard(opts){
    var W=1080,H=1440,c=doc.createElement('canvas');c.width=W;c.height=H;var ctx=c.getContext('2d');
    var F='"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
    return Promise.all((opts.images||[]).map(loadImg)).then(function(ims){
      ctx.fillStyle='#F3F4F6';ctx.fillRect(0,0,W,H);ctx.textBaseline='top';
      // 白色卡片
      var X=56,Y=56,CW=W-112,CH=H-112;
      ctx.save();ctx.shadowColor='rgba(22,26,35,.18)';ctx.shadowBlur=40;ctx.shadowOffsetY=16;ctx.fillStyle='#fff';roundRect(ctx,X,Y,CW,CH,44);ctx.fill();ctx.restore();
      // 大图 + 两张小图
      ctx.save();roundRect(ctx,X,Y,CW,CH,44);ctx.clip();
      coverImg(ctx,ims[0],X,Y,CW,560,0);ctx.restore();
      var sw=(CW-24-12)/2;
      if(ims[1])coverImg(ctx,ims[1],X+12,Y+572,sw,230,24);
      if(ims[2])coverImg(ctx,ims[2],X+12+sw+12,Y+572,sw,230,24);
      // 「我做的」角标
      ctx.font='900 30px '+F;var tag=opts.badge||'练习示例',tw=ctx.measureText(tag).width;
      ctx.fillStyle='#FFC83D';roundRect(ctx,X+28,Y+28,tw+36,52,14);ctx.fill();ctx.fillStyle='#161A23';ctx.fillText(tag,X+46,Y+40);
      var ty=Y+572+(ims[1]?230:0)+36;
      ctx.fillStyle='#9AA0AC';ctx.font='600 28px '+F;ctx.fillText(opts.kicker||'',X+44,ty);
      ctx.fillStyle='#161A23';ctx.font='800 50px '+F;ty=wrapText(ctx,opts.title||'',X+44,ty+44,CW-88-(opts.withQr?210:0),64,2);
      ctx.fillStyle='#5F6675';ctx.font='500 30px '+F;wrapText(ctx,opts.sub||'',X+44,ty+10,CW-88-(opts.withQr?210:0),42,2);
      // 底部品牌行：原来的 logo
      var by=Y+CH-92;
      ctx.fillStyle='#FFC83D';roundRect(ctx,X+44,by,52,52,12);ctx.fill();
      ctx.fillStyle='#133426';ctx.font='900 34px '+F;ctx.textAlign='center';ctx.fillText('↗',X+70,by+8);ctx.textAlign='left';
      ctx.fillStyle='#161A23';ctx.font='800 30px '+F;ctx.fillText('AI 实战情报站',X+110,by+4);
      ctx.fillStyle='#9AA0AC';ctx.font='800 20px '+F;ctx.fillText('AINPE.  图片为示例',X+110,by+40);
      if(opts.withQr&&root.qrcode){
        var q=root.qrcode(0,'M');q.addData(SITE+(opts.qrPath||'/static/learn/index.html'));q.make();
        var n=q.getModuleCount(),size=180,qx=X+CW-44-size,qy=by-size-40,cell=size/(n+2);
        ctx.fillStyle='#fff';ctx.fillRect(qx,qy,size,size);
        ctx.fillStyle='#161A23';for(var r=0;r<n;r++)for(var k=0;k<n;k++)if(q.isDark(r,k))ctx.fillRect(Math.floor(qx+(k+1)*cell),Math.floor(qy+(r+1)*cell),Math.ceil(cell),Math.ceil(cell));
        ctx.fillStyle='#5F6675';ctx.font='700 22px '+F;ctx.textAlign='center';ctx.fillText(opts.qrLabel||'扫码，跟着做一份',qx+size/2,qy+size+8);ctx.textAlign='left';
      }else{
        ctx.fillStyle='#2B44E6';ctx.font='800 28px '+F;ctx.textAlign='right';ctx.fillText(opts.tag||'',X+CW-44,by+12);ctx.textAlign='left';
      }
      return c.toDataURL('image/jpeg',0.9);
    });
  }
  /* 在容器里放作品卡：微信版 / 小红书版切换 + 保存 */
  function mountWorkCard(box,opts,topic){
    box.innerHTML='<div class="seg" role="tablist"><button class="on" data-v="wx" role="tab" aria-selected="true">发微信（带二维码）</button><button data-v="xhs" role="tab" aria-selected="false">发小红书（无二维码）</button></div><div class="workimg" style="margin-top:12px">正在生成作品卡…</div><div class="row" style="justify-content:center;margin-top:12px"><button class="btn or sm js-save">保存图片</button></div><p class="note">'+(MP?'长按图片可以保存到相册。':'手机上也可以长按图片保存。')+'小红书版不带二维码和网址。</p>';
    var cur='wx',url='',generation=0;
    function render(){
      var current=++generation,o={};for(var k in opts)o[k]=opts[k];o.withQr=cur==='wx';
      url='';$('.js-save',box).disabled=true;$('.workimg',box).textContent='正在生成作品卡…';
      workCard(o).then(function(d){
        if(current!==generation)return;
        url=d;$('.workimg',box).innerHTML='<img alt="'+esc(opts.title)+' 作品卡" src="'+d+'">';$('.js-save',box).disabled=false;
      }).catch(function(){if(current===generation){$('.workimg',box).textContent='作品卡生成失败，请切换版本后重试。';}});
    }
    $$('.seg button',box).forEach(function(b){b.addEventListener('click',function(){cur=b.dataset.v;$$('.seg button',box).forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b?'true':'false')});render()})});
    $('.js-save',box).addEventListener('click',function(){
      if(!url)return;track('card_save',{page:'learn',game:topic,tier:cur});
      if(MP){toast('长按上面的图片保存');return}
      var a=doc.createElement('a');a.href=url;a.download='AI作品卡-'+(cur==='wx'?'微信':'小红书')+'.jpg';doc.body.appendChild(a);a.click();a.remove();
    });
    render();
  }

  // 「我想用 AI……」：只在本地分类，统计里只记类别，不上传原文
  var WANT=[
    ['kejian',/课件|PPT|ppt|教案|上课|老师|备课|讲课|资料|试卷|练习题|学案/],
    ['huiben',/绘本|故事|童话|睡前|孩子|小孩|宝宝|儿子|女儿|亲子|作文/],
    ['video',/视频|短片|短剧|剪辑|动画|抖音|视频号|vlog/i],
    ['novel',/小说|网文|写书|剧本/],
    ['tuwen',/小红书|图文|文案|公众号|朋友圈|笔记|标题/],
    ['assistant',/助手|智能体|agent|自动|表格|Excel|excel|工作|总结|会议|周报|邮件/i],
    ['money',/赚钱|副业|变现|收入|搞钱|接单/]
  ];
  function classifyWant(text){var t=String(text||'');for(var i=0;i<WANT.length;i++)if(WANT[i][1].test(t))return WANT[i][0];return 'other'}

  root.Learn={toTabs:toTabs,STEP:STEP,MP:MP,$:$,$$:$$,esc:esc,toast:toast,copy:copy,download:download,openOut:openOut,getState:getState,setState:setState,track:track,chrome:chrome,banner:banner,workCard:workCard,mountWorkCard:mountWorkCard,classifyWant:classifyWant};
})(window);
