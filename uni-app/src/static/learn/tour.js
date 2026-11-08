/* 第一次来的引导：把页面上的几个位置依次圈出来，告诉用户这里是干什么的。
   用法：AINPETour.start([{sel:'.a, .b', title:'', text:''}, ...], {force:true})
   看过一次（跳过或看完）写入 localStorage 的 ainpe:toured，并同时标记 ainpe:onboarded，
   这样「跟着做」页的旧版引导不会再弹第二次。 */
(function(root){
  'use strict';
  if(root.AINPETour)return;
  var doc=root.document,KEY='ainpe:toured';
  function seen(){try{return !!localStorage.getItem(KEY)}catch(_){return true}}
  function mark(){try{localStorage.setItem(KEY,'1');localStorage.setItem('ainpe:onboarded','1')}catch(_){}}
  function track(tier){try{if(root.AINPETrack)root.AINPETrack.track('learn_step',{page:'learn',game:'onboard',tier:tier})}catch(_){}}
  function css(){
    if(doc.getElementById('ainpe-tour-css'))return;
    var s=doc.createElement('style');s.id='ainpe-tour-css';
    s.textContent=
      '.tour-hole{position:fixed;z-index:10000;border-radius:16px;box-shadow:0 0 0 9999px rgba(22,26,35,.62);pointer-events:none;transition:all .25s ease}'+
      '.tour-hole::after{content:"";position:absolute;inset:-4px;border-radius:20px;border:2px solid #FFC83D}'+
      '.tour-tip{position:fixed;z-index:10001;left:16px;right:16px;max-width:360px;margin:0 auto;background:#fff;color:#161A23;border-radius:18px;padding:16px;box-shadow:0 20px 40px -20px rgba(0,0,0,.5);font-family:"Noto Sans SC","PingFang SC",system-ui,sans-serif;transition:top .25s ease}'+
      '.tour-tip .tn{font-size:12px;font-weight:800;color:#2B44E6}'+
      '.tour-tip .tt{display:block;font-size:18px;font-weight:900;margin-top:4px}'+
      '.tour-tip .tx{font-size:14.5px;line-height:1.6;color:#5F6675;margin:6px 0 0}'+
      '.tour-tip .tb{display:flex;align-items:center;gap:8px;margin-top:14px}'+
      '.tour-tip button{font:inherit;border:0;cursor:pointer}'+
      '.tour-tip .skip{background:transparent;color:#9AA0AC;font-size:14px;font-weight:700;padding:10px 4px}'+
      '.tour-tip .next{margin-left:auto;min-height:44px;padding:0 20px;border-radius:12px;background:#2B44E6;color:#fff;font-size:15px;font-weight:800}'+
      '.tour-tip .next:focus-visible,.tour-tip .skip:focus-visible{outline:3px solid #2B44E6;outline-offset:2px}'+
      '.tour-block{position:fixed;inset:0;z-index:9999}'+
      '@media (prefers-reduced-motion:reduce){.tour-hole,.tour-tip{transition:none}}';
    doc.head.appendChild(s);
  }
  function find(sel){
    var list=sel.split(',');for(var i=0;i<list.length;i++){var el=doc.querySelector(list[i].trim());if(el){var r=el.getBoundingClientRect();if(r.width>0&&r.height>0)return el}}return null;
  }
  var active=null;
  function start(steps,opt){
    opt=opt||{};
    if(active)return;
    if(!opt.force&&seen())return;
    steps=(steps||[]).filter(function(s){return find(s.sel)});
    if(!steps.length)return;
    css();
    var i=0,lastFocus=doc.activeElement,placeTimer=null,block=doc.createElement('div'),hole=doc.createElement('div'),tip=doc.createElement('div');
    block.className='tour-block';hole.className='tour-hole';tip.className='tour-tip';
    tip.setAttribute('role','dialog');tip.setAttribute('aria-modal','true');tip.setAttribute('aria-labelledby','tour-title');
    doc.body.appendChild(block);doc.body.appendChild(hole);doc.body.appendChild(tip);
    active={close:close};
    function place(){
      var s=steps[i],el=find(s.sel);if(!el){next();return}
      var r=el.getBoundingClientRect(),pad=6,vh=root.innerHeight;
      hole.style.top=(r.top-pad)+'px';hole.style.left=(r.left-pad)+'px';hole.style.width=(r.width+pad*2)+'px';hole.style.height=(r.height+pad*2)+'px';
      var th=tip.offsetHeight||170,below=r.bottom+pad+14,above=r.top-pad-14-th;
      tip.style.top=(below+th<vh-8?below:Math.max(8,above))+'px';
    }
    function show(){
      var s=steps[i],el=find(s.sel),last=i===steps.length-1;
      tip.innerHTML='<span class="tn">'+(i+1)+' / '+steps.length+'</span><b class="tt" id="tour-title"></b><p class="tx"></p><div class="tb">'+(last?'':'<button type="button" class="skip">跳过</button>')+'<button type="button" class="next">'+(last?'知道了':'下一步')+'</button></div>';
      tip.querySelector('.tt').textContent=s.title;tip.querySelector('.tx').textContent=s.text;
      var sk=tip.querySelector('.skip');if(sk)sk.addEventListener('click',function(){close('skip')});
      tip.querySelector('.next').addEventListener('click',next);
      // 先把目标滚到屏幕中间，再画圈
      if(el){var r=el.getBoundingClientRect();if(r.top<70||r.bottom>root.innerHeight-200){root.scrollTo(0,Math.max(0,(root.scrollY||root.pageYOffset)+r.top-Math.max(80,(root.innerHeight-r.height)/3)))}}
      clearTimeout(placeTimer);placeTimer=setTimeout(function(){if(active)place()},30);
      tip.querySelector('.next').focus({preventScroll:true});
    }
    function next(){if(i>=steps.length-1){close('start');return}i++;show()}
    function onKey(e){if(e.key==='Escape')close('skip');else if(e.key==='Tab'){var b=tip.querySelectorAll('button');if(b.length<2){e.preventDefault();return}var f=b[0],l=b[b.length-1];if(e.shiftKey&&doc.activeElement===f){e.preventDefault();l.focus()}else if(!e.shiftKey&&doc.activeElement===l){e.preventDefault();f.focus()}}}
    function onMove(){place()}
    function close(how){
      if(!active)return;
      if(how){mark();track(how)}
      clearTimeout(placeTimer);
      [block,hole,tip].forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n)});
      doc.removeEventListener('keydown',onKey);root.removeEventListener('resize',onMove);root.removeEventListener('scroll',onMove);
      active=null;
      if(lastFocus&&typeof lastFocus.focus==='function'&&lastFocus.isConnected!==false)lastFocus.focus({preventScroll:true});
    }
    doc.addEventListener('keydown',onKey);root.addEventListener('resize',onMove);root.addEventListener('scroll',onMove,{passive:true});
    track('open');show();
  }
  root.AINPETour={start:start,seen:seen,dispose:function(){if(active)active.close(null)}};
})(window);
