/* Explicit, user-authored feedback is separate from local search and analytics. */
(function(root){
  'use strict';
  var doc=root.document;
  if(!doc||root.AINPESiteFeedback)return;
  root.AINPESiteFeedback=true;
  function start(){
    if(doc.getElementById('ainpe-feedback-launch'))return;
    var style=doc.createElement('style');
    style.textContent='.asf-launch:not([hidden]){display:block;position:relative;margin:18px 16px calc(84px + env(safe-area-inset-bottom)) auto;min-height:44px;background:#fff;color:#667488;border:1px solid #d9e0e9;border-radius:999px;padding:8px 12px;font:500 12px system-ui,sans-serif;cursor:pointer}@media(min-width:701px){.asf-launch:not([hidden]){margin-bottom:24px}}.asf-launch:hover{color:#364b70;border-color:#a8b7ca}.asf-overlay{position:fixed;inset:0;z-index:20000;background:#101827aa;display:flex;align-items:center;justify-content:center;padding:16px}.asf-panel{box-sizing:border-box;width:min(100%,440px);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:20px;color:#18202c;font:15px/1.6 system-ui,sans-serif;box-shadow:0 12px 40px #0003}.asf-panel h2{font-size:20px;margin:0 0 6px}.asf-panel p{margin:8px 0;color:#596473;font-size:13px}.asf-panel textarea{box-sizing:border-box;width:100%;min-height:110px;resize:vertical;border:1px solid #cdd5e0;border-radius:8px;padding:10px;font:15px/1.5 system-ui,sans-serif}.asf-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.asf-actions button{border:0;border-radius:8px;padding:9px 15px;font:600 14px system-ui,sans-serif;cursor:pointer}.asf-cancel{background:#eef1f5;color:#344052}.asf-send{background:#263fe8;color:#fff}.asf-send:disabled{opacity:.5}.asf-status{min-height:20px;color:#46536b}.asf-panel :focus-visible,.asf-launch:focus-visible{outline:3px solid #eabf3a;outline-offset:2px}';
    style.textContent+='.asf-launch.asf-before-footer:not([hidden]){margin-bottom:18px}@media(max-width:700px){.asf-footer-clearance{padding-bottom:calc(84px + env(safe-area-inset-bottom))!important}}';
    doc.head.appendChild(style);
    var launch=doc.createElement('button');launch.id='ainpe-feedback-launch';launch.className='asf-launch';launch.type='button';launch.textContent='提意见';
    function attachLaunch(){
      // In H5 uni-page-body grows with the page; #app itself remains viewport-height.
      // Static tutorial pages have no uni-page-body, so use their document body.
      var pages=doc.querySelectorAll('uni-page-body');
      var page=pages.length?pages[pages.length-1]:null;
      var footer=page&&page.querySelector('.site-footer');
      var target=footer?footer.parentNode:(page||doc.body);
      launch.classList.toggle('asf-before-footer',!!footer);
      if(footer)footer.classList.add('asf-footer-clearance');
      if(launch.parentNode!==target||(footer&&launch.nextElementSibling!==footer))target.insertBefore(launch,footer||null);
    }
    attachLaunch();
    var closeDialog=null;
    function isAdmin(){return /^#\/admin(?:\/|$)/.test(root.location.hash)||/^\/admin(?:\/|$)/.test(root.location.pathname)}
    var lastLocation='';
    function sync(){
      lastLocation=root.location.pathname+root.location.hash;
      var hasProfileFeedback=root.AINPE_SITE_MODE&&root.AINPE_SITE_MODE.tutorialFirst&&/^#\/pages\/saved\/index(?:\?|$)/.test(root.location.hash);
      launch.hidden=isAdmin()||hasProfileFeedback;if(closeDialog)closeDialog();
    }
    root.addEventListener('hashchange',sync);
    root.addEventListener('popstate',sync);
    // uni-app can update history without firing hashchange; observe its page render
    // and only resync when the actual route has changed.
    if(root.MutationObserver)new root.MutationObserver(function(){
      var changed=root.location.pathname+root.location.hash!==lastLocation;
      if(changed)sync();
      var pages=doc.querySelectorAll('uni-page-body');
      var footer=pages.length&&pages[pages.length-1].querySelector('.site-footer');
      if(changed||!launch.isConnected||(launch.parentNode===doc.body&&pages.length)||(footer&&launch.nextElementSibling!==footer))attachLaunch();
    }).observe(doc.body,{childList:true,subtree:true});
    sync();
    launch.addEventListener('click',function(){
      if(doc.getElementById('ainpe-feedback-dialog'))return;
      var opener=(launch.hidden&&doc.querySelector('.my-settings .setting-row:last-child'))||launch._ainpeFeedbackOpener||doc.activeElement;
      delete launch._ainpeFeedbackOpener;
      var layer=doc.createElement('div');layer.id='ainpe-feedback-dialog';layer.className='asf-overlay';
      layer.innerHTML='<section class="asf-panel" role="dialog" aria-modal="true" aria-labelledby="asf-title"><h2 id="asf-title">给网站提意见</h2><p>点击提交后，意见会发送给站长查看。请勿填写手机号、微信号等个人信息；最长 200 字，约 30 天后删除。</p><label for="asf-message">你的建议</label><textarea id="asf-message" maxlength="200" placeholder="例如：希望增加 AI 短剧入门教程"></textarea><p class="asf-status" role="status" aria-live="polite"></p><div class="asf-actions"><button class="asf-cancel" type="button">取消</button><button class="asf-send" type="button">提交意见</button></div></section>';
      doc.body.appendChild(layer);
      var input=layer.querySelector('textarea'),status=layer.querySelector('.asf-status'),submit=layer.querySelector('.asf-send'),cancel=layer.querySelector('.asf-cancel');
      function close(){doc.removeEventListener('keydown',onKey);layer.remove();closeDialog=null;if(opener&&opener.isConnected&&opener!==doc.body&&typeof opener.focus==='function'&&!opener.hidden)opener.focus();else if(!launch.hidden)launch.focus()}
      closeDialog=close;
      function onKey(e){
        if(e.key==='Escape'){close();return}
        if(e.key!=='Tab')return;
        var available=[input,cancel,submit].filter(function(el){return !el.disabled});
        if(!available.length){e.preventDefault();return}
        var first=available[0],last=available[available.length-1];
        if((e.shiftKey&&doc.activeElement===first)||(!e.shiftKey&&doc.activeElement===last)||available.indexOf(doc.activeElement)<0){e.preventDefault();(e.shiftKey?last:first).focus()}
      }
      doc.addEventListener('keydown',onKey);
      cancel.addEventListener('click',close);
      layer.addEventListener('click',function(e){if(e.target===layer)close()});
      submit.addEventListener('click',async function(){
        var value=input.value.trim();if(!value){status.textContent='先写一句你的建议。';input.focus();return}
        if(Array.from(value).length>200){status.textContent='请将建议控制在 200 字以内。';return}
        submit.disabled=true;status.textContent='正在提交…';
        try{var r=await root.fetch('/api/feedback',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value})});var result=await r.json();if(r.status!==202||!result||result.ok!==true)throw new Error('failed');input.value='';input.disabled=true;submit.textContent='已提交';cancel.textContent='关闭';status.textContent='已收到，谢谢你的建议。';cancel.focus()}
        catch(_){status.textContent='暂时无法提交，请稍后再试。';submit.disabled=false}
      });
      input.focus();
    });
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='undefined'?globalThis:window);
