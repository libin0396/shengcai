(function(root){
  'use strict';
  if(root.AINPETrack)return;
  var EVENTS=['site_view','sim_start','sim_finish','camp_view','camp_join_click','share_open','share_save','challenge_open','replay_same_seed','versus_finish','versus_share','board_view','board_join','board_share','outbound_click','contact_copy','persona_unlock','poster_save','learn_view','learn_step','learn_done','card_save','want_submit','aid_copy','skill_copy','active_sample'];
  var TARGETS=['camp','join','source','event','referral'], SOURCES=['article','camp','result','mine','home','home_bar','event','header','footer','library','events','simulate','bar','learn'];
  var LEARN_EVENTS=['learn_view','learn_step','learn_done','card_save','want_submit','aid_copy','skill_copy'];
  var LEARN_TOPICS=['index','kejian','huiben','jijiu','library','find'], WANT_CATEGORIES=['kejian','huiben','video','novel','tuwen','assistant','money','other'];
  var LEARN_TIERS=['basic','pro','start','file','wx','xhs','need','write','pages','redline','cover','caption','excel','homework','learnai','meeting','menu','notice','reply','summary','trip'];
  var KEY='ainpe:anonymous-device', ID=/^[a-z0-9][a-z0-9_-]{0,39}$/, did='';
  // Only this browser is excluded. Consume the URL control so it isn't shared.
  var INTERNAL='ainpe:internal', internal=false;
  try{internal=root.localStorage.getItem(INTERNAL)==='1'}catch(e){}
  function updateInternal(){
    try{
      if(!root.location||!root.location.href)return;
      var url=new URL(root.location.href), idx=url.hash.indexOf('?');
      var hashPath=idx<0?url.hash:url.hash.slice(0,idx);
      var hashParams=new URLSearchParams(idx<0?'':url.hash.slice(idx+1));
      var values=url.searchParams.getAll('ainpe_internal').concat(hashParams.getAll('ainpe_internal'));
      if(values.length!==1||!(/^[01]$/).test(values[0]))return;
      var next=values[0]==='1';
      // A link can arrive from anyone; never change this browser's setting silently.
      var message=next?'将此浏览器设为内部设备？此后不会计入网站统计。':'恢复统计此浏览器的访问？浏览器的隐私设置仍然优先。';
      var approved=next===internal;
      if(!approved&&typeof root.confirm==='function')try{approved=root.confirm(message)===true}catch(e){}
      if(approved){
        internal=next;
        try{if(internal)root.localStorage.setItem(INTERNAL,'1');else root.localStorage.removeItem(INTERNAL)}catch(e){}
      }
      url.searchParams.delete('ainpe_internal');hashParams.delete('ainpe_internal');
      var rest=hashParams.toString();url.hash=hashPath+(rest?'?'+rest:'');
      if(root.history&&typeof root.history.replaceState==='function')root.history.replaceState(root.history.state,'',url.pathname+url.search+url.hash);
    }catch(e){}
  }
  updateInternal();
  if(typeof root.addEventListener==='function')root.addEventListener('hashchange',updateInternal);
  function device(){
    if(did)return did;
    try{did=root.localStorage.getItem(KEY)||'';}catch(e){}
    if(!/^[a-f0-9]{32}$/.test(did)){
      if(!root.crypto||!root.crypto.getRandomValues)return '';
      var bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);
      did=Array.from(bytes,function(x){return x.toString(16).padStart(2,'0')}).join('');
      try{root.localStorage.setItem(KEY,did);}catch(e){}
    }
    return did;
  }
  function track(event,options){
    try{
      if(internal||!root.navigator||root.navigator.globalPrivacyControl||root.navigator.doNotTrack==='1'||EVENTS.indexOf(event)<0)return false;
      options=options||{};
      if(LEARN_EVENTS.indexOf(event)>=0){
        var isOnboard=event==='learn_step'&&options.page==='learn'&&options.game==='onboard';
        var allowed=event==='want_submit'?WANT_CATEGORIES:LEARN_TOPICS;
        var allowedPage=event==='want_submit'?(options.page==='learn'||options.page==='home'):options.page==='learn';
        if(!allowedPage||(!isOnboard&&allowed.indexOf(options.game)<0)||options.from!==undefined||options.target!==undefined||options.hidden!==undefined||(isOnboard?['open','skip','start'].indexOf(options.tier)<0:(options.tier!==undefined&&LEARN_TIERS.indexOf(options.tier)<0)))return false;
      }
      var isPersonaEvent=event==='persona_unlock'||event==='poster_save';
      if(isPersonaEvent && typeof options.hidden!=='boolean')return false;
      if((event==='outbound_click'||event==='contact_copy') && SOURCES.indexOf(options.from)<0)return false;
      if(event==='outbound_click' && TARGETS.indexOf(options.target)<0)return false;
      var id=device();if(!id)return false;
      var payload={event:event,played:options.played===true,ts:Date.now(),did:id};
      if(!isPersonaEvent)['page','from','game','tier'].forEach(function(k){if(typeof options[k]==='string'&&ID.test(options[k]))payload[k]=options[k]});
      if(isPersonaEvent)payload.hidden=options.hidden;
      if(event==='outbound_click')payload.target=options.target;
      var json=JSON.stringify(payload);
      if(typeof root.navigator.sendBeacon==='function')return root.navigator.sendBeacon('/api/track',new Blob([json],{type:'application/json'}));
      if(typeof root.fetch==='function'){root.fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:json,credentials:'same-origin',keepalive:true}).catch(function(){});return true;}
    }catch(e){}
    return false;
  }
  root.AINPETrack={track:track,isInternal:function(){return internal}};
  // Coarse, best-effort foreground activity samples; no text, URL, or new ID.
  // Hidden pages, inactive pages, admin pages, and privacy-opted-out visitors
  // are not sampled. Multiple open tabs can still count separately.
  if(root.document && typeof root.document.addEventListener==='function' && typeof root.setInterval==='function'){
    var lastActivity=0,lastTick=Date.now(), doc=root.document;
    function activity(){if(doc.visibilityState==='visible')lastActivity=Date.now()}
    ['pointerdown','keydown','scroll','touchstart'].forEach(function(name){doc.addEventListener(name,activity,{passive:true})});
    doc.addEventListener('visibilitychange',function(){lastActivity=0;lastTick=Date.now()});
    root.setInterval(function(){
      var now=Date.now(),elapsed=now-lastTick;lastTick=now;
      var where=root.location||{},admin=String(where.hash||'').indexOf('#/admin')===0 || String(where.pathname||'').indexOf('/admin')===0;
      if(!admin && doc.visibilityState==='visible' && lastActivity>0 && now-lastActivity<=30000 && elapsed>=14000 && elapsed<=30000)track('active_sample',{});
    },15000);
  }
})(typeof window==='undefined'?globalThis:window);
