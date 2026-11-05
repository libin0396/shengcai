(function(root){
  'use strict';
  var EVENTS=['site_view','sim_start','sim_finish','camp_view','camp_join_click','share_open','share_save','challenge_open','replay_same_seed','versus_finish','versus_share','board_view','board_join','board_share'];
  var KEY='ainpe:anonymous-device', ID=/^[a-z0-9][a-z0-9_-]{0,39}$/, did='';
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
      if(!root.navigator||root.navigator.globalPrivacyControl||root.navigator.doNotTrack==='1'||EVENTS.indexOf(event)<0)return false;
      options=options||{};var id=device();if(!id)return false;
      var payload={event:event,played:options.played===true,ts:Date.now(),did:id};
      ['page','from','game','tier'].forEach(function(k){if(typeof options[k]==='string'&&ID.test(options[k]))payload[k]=options[k]});
      var json=JSON.stringify(payload);
      if(typeof root.navigator.sendBeacon==='function')return root.navigator.sendBeacon('/api/track',new Blob([json],{type:'application/json'}));
      if(typeof root.fetch==='function'){root.fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:json,credentials:'same-origin',keepalive:true}).catch(function(){});return true;}
    }catch(e){}
    return false;
  }
  root.AINPETrack={track:track};
})(typeof window==='undefined'?globalThis:window);
