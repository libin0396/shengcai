
(function(){
  function showCampGate(original){
    if(document.querySelector('.ainpe-gate-backdrop'))return;
    var backdrop=document.createElement('div');backdrop.className='ainpe-gate-backdrop';
    var box=document.createElement('section');box.className='ainpe-gate';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','了解三天体验营');
    var close=document.createElement('button');close.className='ainpe-gate-close';close.type='button';close.setAttribute('aria-label','关闭');close.textContent='×';
    var title=document.createElement('h2');title.textContent='想把模拟换成实战？';
    var desc=document.createElement('p');desc.textContent='扫码了解生财有术三天体验营，具体活动时间和参与方式以入口说明为准。';
    var posterLink=document.createElement('a');posterLink.href='/static/assets/ai-camp-poster.jpg';posterLink.rel='noopener noreferrer';posterLink.setAttribute('aria-label','打开完整体验营海报');
    var poster=document.createElement('img');poster.src='/static/assets/ai-camp-poster.jpg';poster.alt='生财有术三天体验营完整推广海报，含报名二维码';posterLink.appendChild(poster);
    var tip=document.createElement('p');tip.textContent='点击海报可查看大图，手机可长按识别二维码。';
    var camp=document.createElement('a');camp.className='ainpe-gate-link';camp.href='/#/pages/camp/index?from=game-result'+(original?'&source='+encodeURIComponent(original):'');camp.rel='noopener noreferrer';camp.textContent='了解三天体验营';
    box.append(close,title,desc,posterLink,tip,camp);
    if(original){var note=document.createElement('p');note.textContent='了解体验营后，可在介绍页面复制原文链接；查看原文可能需要生财账号。';box.appendChild(note);}
    backdrop.appendChild(box);document.body.appendChild(backdrop);close.focus();
    function dismiss(){document.removeEventListener('keydown',onkey);backdrop.remove()}
    function onkey(e){if(e.key==='Escape')dismiss()}
    close.addEventListener('click',dismiss);backdrop.addEventListener('click',function(e){if(e.target===backdrop)dismiss()});document.addEventListener('keydown',onkey);
  }
  document.addEventListener('click',function(e){
    var camp=e.target.closest('#camp');if(camp){e.preventDefault();e.stopImmediatePropagation();showCampGate(null);return;}
    var link=e.target.closest('a[href]');if(!link)return;
    var u;try{u=new URL(link.href,location.href)}catch(_){return;}
    if(u.hostname==='scys.com'||u.hostname.endsWith('.scys.com')){e.preventDefault();e.stopImmediatePropagation();showCampGate(u.href)}
  },true);
})();
