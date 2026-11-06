
(function(){
  function showCampGate(original){
    if(document.querySelector('.ainpe-gate-backdrop'))return;
    var backdrop=document.createElement('div');backdrop.className='ainpe-gate-backdrop';
    var box=document.createElement('section');box.className='ainpe-gate';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','了解三天体验营');
    var close=document.createElement('button');close.className='ainpe-gate-close';close.type='button';close.setAttribute('aria-label','关闭');close.textContent='×';
    var title=document.createElement('h2');title.textContent='想把模拟换成实战？';
    var desc=document.createElement('p');desc.textContent='生财有术 AI 成万事 · 3 天体验营：有人带你把一个项目跑一遍。';
    var posterLink=document.createElement('a');posterLink.href='/#/pages/camp/index?from=game-result';posterLink.rel='noopener noreferrer';posterLink.setAttribute('aria-label','打开完整体验营海报');
    var poster=document.createElement('img');poster.src='/static/assets/camp-illo.svg';poster.alt='三天体验营：看机会、学路径、出成果';posterLink.appendChild(poster);
    var tip=document.createElement('p');tip.textContent='体验营页有报名二维码，微信里长按即可识别。';
    var camp=document.createElement('a');camp.className='ainpe-gate-link';camp.href='/#/pages/camp/index?from=game-result'+(original?'&source='+encodeURIComponent(original):'');camp.rel='noopener noreferrer';camp.textContent='了解三天体验营';
    box.append(close,title,desc,posterLink,tip,camp);

    backdrop.appendChild(box);document.body.appendChild(backdrop);close.focus();
    function dismiss(){document.removeEventListener('keydown',onkey);backdrop.remove()}
    function onkey(e){if(e.key==='Escape')dismiss()}
    close.addEventListener('click',dismiss);backdrop.addEventListener('click',function(e){if(e.target===backdrop)dismiss()});document.addEventListener('keydown',onkey);
  }
  function isMP(){try{return !!window.AINPE_MP||sessionStorage.getItem('ainpe:mp')==='1'||/miniProgram/i.test(navigator.userAgent||'')}catch(_){return /miniProgram/i.test(navigator.userAgent||'')}}
  function toast(text){var t=document.createElement('div');t.setAttribute('role','status');t.textContent=text;t.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:99999;max-width:80vw;padding:10px 16px;border-radius:10px;background:rgba(19,36,27,.92);color:#fff;font-size:14px;line-height:1.5;text-align:center';document.body.appendChild(t);setTimeout(function(){t.remove()},2600)}
  function copy(text){function ok(){toast('链接已复制，粘贴到浏览器打开')}function manual(){try{var a=document.createElement('textarea');a.value=text;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:-999px;top:0';document.body.appendChild(a);a.select();var done=document.execCommand('copy');a.remove();if(done){ok();return}}catch(_){}toast('请在浏览器打开：'+text)}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(ok,manual);else manual()}
  document.addEventListener('click',function(e){
    var camp=e.target.closest&&e.target.closest('#camp');if(camp){e.preventDefault();e.stopImmediatePropagation();showCampGate(null);return;}
    var link=e.target.closest&&e.target.closest('a[href]');if(!link)return;
    var u;try{u=new URL(link.href,location.href)}catch(_){return;}
    if(link.dataset&&link.dataset.track){try{if(window.AINPETrack)window.AINPETrack.track('outbound_click',{target:link.dataset.track,from:'result'})}catch(_){}}
    if(u.protocol==='https:'&&(u.hostname==='scys.com'||u.hostname.endsWith('.scys.com'))){e.preventDefault();e.stopImmediatePropagation();showCampGate(u.href);return;}
    if(u.origin!==location.origin&&isMP()){e.preventDefault();e.stopImmediatePropagation();copy(u.href)}
  },true);
})();
