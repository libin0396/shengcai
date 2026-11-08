/* 第一次来的引导：3 屏，告诉新用户这里能干什么、怎么用、能带走什么。
   只在本机第一次打开时出现（localStorage: ainpe:onboarded），随时可以跳过；首页 Vue 版用同一个存储键，两边看过一次就都不再弹。 */
(function(root){
  'use strict';
  if(root.AINPEOnboard)return;
  var doc=root.document,KEY='ainpe:onboarded',current=null;
  function seen(){try{return !!root.localStorage.getItem(KEY)}catch(_){return true}}
  function mark(){try{root.localStorage.setItem(KEY,String(Date.now()))}catch(_){}}
  function track(ev,o){try{if(root.Learn&&root.Learn.track)root.Learn.track(ev,o);else if(root.AINPETrack&&root.AINPETrack.track)root.AINPETrack.track(ev,o)}catch(_){}}
  var SLIDES=[
    {t:'挑一件想做的事',d:'不用先懂 AI。从一件具体的小事开始，比如给孩子做一份课件、和孩子做一本绘本。',
     art:'<div class="ob-pics"><figure><img src="/static/learn/img/boat.jpg" alt=""><figcaption>给孩子做课件</figcaption></figure><figure><img src="/static/learn/img/girl.jpg" alt=""><figcaption>和孩子做绘本</figcaption></figure></div><div class="ob-chips"><span>还在做：故事短片</span><span>写小说</span><span>图文号</span></div>'},
    {t:'跟着做',d:'先看图片教程，每一步都有能复制的话；再做 5 关小练习，试试不同的做法。',
     art:'<div class="ob-chat"><div class="ob-me">我要准备一节课：三年级语文……先写孩子要带走的 3 件事</div><div class="ob-ai">好的，孩子要带走的 3 件事：<br>1. 能说出课文写了哪几样东西<br>2. ……<br>继续吗？</div></div><div class="ob-stairs"><i style="height:10px"></i><i style="height:16px"></i><i style="height:22px"></i><i style="height:28px"></i><i style="height:34px"></i><span>5 关小练习</span></div>'},
    {t:'带走两样东西',d:'保存一张练习卡片，再把按你的选择整理的助手提示词复制到 AI 工具里使用。',
     art:'<div class="ob-take"><div class="ob-card"><div class="ob-cimg"><img src="/static/learn/img/boat.jpg" alt=""><em>练习示例</em></div><b>三年级语文《富饶的西沙群岛》</b><small>AI 实战情报站</small></div><div class="ob-skill"><small>课件助手 · SKILL.md</small>你现在是我的课件助手。<br>先问我：哪一节课？<br>分 3 步写，每步停下来问我……</div></div>'}
  ];
  function css(){
    if(doc.getElementById('ob-css'))return;
    var s=doc.createElement('style');s.id='ob-css';s.textContent=[
      '.ob-mask{position:fixed;inset:0;z-index:200;background:rgba(22,26,35,.55);display:flex;align-items:flex-end;justify-content:center}',
      '@media(min-width:680px){.ob-mask{align-items:center}}',
      '.ob{box-sizing:border-box;max-height:94vh;overflow-y:auto;width:100%;max-width:440px;background:#fff;border-radius:24px 24px 0 0;padding:18px 20px calc(18px + env(safe-area-inset-bottom));font-family:inherit;color:#161A23;animation:ob-up .3s ease-out}',
      '@media(min-width:680px){.ob{border-radius:24px}}',
      '@keyframes ob-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
      '.ob-top{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#9AA0AC;font-weight:700}',
      '.ob-top button{font:inherit;color:#5F6675;background:none;border:0;padding:6px 0;cursor:pointer}',
      '.ob-dots{display:flex;gap:5px}.ob-dots i{width:18px;height:5px;border-radius:3px;background:#E6E8EC}.ob-dots i.on{background:#2B44E6}',
      '.ob-art{margin-top:14px;background:#F3F4F6;border-radius:18px;padding:14px;min-height:196px;display:flex;flex-direction:column;justify-content:center;gap:10px}',
      '.ob-pics{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ob-pics figure{margin:0;background:#fff;border-radius:12px;overflow:hidden}.ob-pics img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}.ob-pics figcaption{font-size:12.5px;font-weight:800;padding:6px 8px}',
      '.ob-chips{display:flex;gap:6px;flex-wrap:wrap}.ob-chips span{font-size:12px;color:#5F6675;background:#fff;border-radius:99px;padding:3px 9px}',
      '.ob-chat{background:#fff;border-radius:14px;padding:10px;font-size:12.5px;line-height:1.6}.ob-me{margin-left:auto;max-width:86%;background:#2B44E6;color:#fff;border-radius:12px;padding:6px 10px}.ob-ai{margin-top:8px;max-width:86%;background:#F3F4F6;border-radius:12px;padding:6px 10px}',
      '.ob-stairs{display:flex;align-items:flex-end;gap:5px}.ob-stairs i{width:22px;border-radius:4px;background:#2B44E6}.ob-stairs span{margin-left:8px;font-size:13px;font-weight:800;color:#2B44E6}',
      '.ob-take{display:grid;grid-template-columns:1fr 1.1fr;gap:10px;align-items:center}',
      '.ob-card{background:#fff;border-radius:12px;overflow:hidden;padding-bottom:8px;box-shadow:0 10px 20px -14px #161A2399;transform:rotate(-2deg)}.ob-cimg{position:relative}.ob-cimg img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}.ob-cimg em{position:absolute;left:6px;top:6px;font-style:normal;font-size:10px;font-weight:900;background:#FFC83D;border-radius:6px;padding:1px 6px}.ob-card b{display:block;font-size:11.5px;padding:6px 8px 0;line-height:1.4}.ob-card small{display:block;font-size:10px;color:#9AA0AC;padding:2px 8px 0}',
      '.ob-skill{background:#161A23;color:#E6E8F0;border-radius:12px;padding:10px;font-size:11.5px;line-height:1.6}.ob-skill small{display:block;color:#A9B4FF;font-weight:800;margin-bottom:4px}',
      '.ob h3{font-size:22px;font-weight:800;margin-top:16px;line-height:1.35}',
      '.ob p{font-size:14.5px;line-height:1.7;color:#5F6675;margin-top:6px;min-height:74px}',
      '.ob-btns{display:flex;gap:10px;margin-top:14px}.ob-btns button{flex:1;min-height:48px;border-radius:14px;font:inherit;font-size:16px;font-weight:800;border:0;cursor:pointer}',
      '.ob-prev{flex:0 0 96px!important;background:#fff!important;color:#161A23;box-shadow:inset 0 0 0 1.5px #E6E8EC}.ob-next{background:#2B44E6;color:#fff}',
      '.ob button:focus-visible{outline:3px solid #2B44E6;outline-offset:2px}',
      '@media(prefers-reduced-motion:reduce){.ob{animation:none}}'
    ].join('\n');doc.head.appendChild(s);
  }
  function open(opts){
    opts=opts||{};if(current)return;css();
    var lastFocus=doc.activeElement,i=0,mask=doc.createElement('div');mask.className='ob-mask';
    mask.innerHTML='<div class="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title"><div class="ob-top"><span class="ob-dots" aria-hidden="true"><i></i><i></i><i></i></span><button type="button" class="ob-skip">跳过</button></div><div class="ob-art"></div><h3 id="ob-title"></h3><p></p><div class="ob-btns"><button type="button" class="ob-prev">上一步</button><button type="button" class="ob-next"></button></div></div>';
    doc.body.appendChild(mask);var prevOverflow=doc.body.style.overflow;doc.body.style.overflow='hidden';
    var q=function(s){return mask.querySelector(s)};
    function render(){var s=SLIDES[i];q('.ob-art').innerHTML=s.art;q('#ob-title').textContent=s.t;q('p').textContent=s.d;
      Array.prototype.forEach.call(mask.querySelectorAll('.ob-dots i'),function(d,k){d.className=k===i?'on':''});
      q('.ob-prev').style.display=i?'':'none';q('.ob-next').textContent=i<SLIDES.length-1?'下一步':'开始做第一件事';q('.ob-next').focus()}
    function close(how){if(!current)return;current=null;if(how)mark();doc.body.style.overflow=prevOverflow;mask.remove();if(how)track('learn_step',{page:'learn',game:'onboard',tier:how});doc.removeEventListener('keydown',onKey);if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus()}
    current=close;
    function onKey(e){if(e.key==='Escape')close('skip')}
    q('.ob-skip').addEventListener('click',function(){close('skip')});
    q('.ob-prev').addEventListener('click',function(){if(i>0){i--;render()}});
    q('.ob-next').addEventListener('click',function(){if(i<SLIDES.length-1){i++;render();return}close('start');root.location.href=opts.startHref||'/static/learn/kejian.html?from=onboard'});
    mask.addEventListener('click',function(e){if(e.target===mask)close('skip')});
    doc.addEventListener('keydown',onKey);
    render();track('learn_step',{page:'learn',game:'onboard',tier:'open'});
  }
  function auto(){if(!seen()&&!/[?&]from=(guide_skip|card)(?:&|$)/.test(root.location.search))open()}
  function dispose(){if(current)current(null)}
  root.AINPEOnboard={open:open,seen:seen,auto:auto,dispose:dispose};
  if(doc.getElementById('obReplay'))auto();
})(window);
