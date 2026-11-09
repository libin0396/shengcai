(function(root){
  'use strict';var L=root.Learn, box=L.$('#guides-list');L.chrome('learn');
  // 把日常任务放在前面；完整短剧是较长的项目，不暗示它是新手第一步。
  var guides=(root.AINPE_GUIDES||[]).slice().sort(function(a,b){
    function priority(g){return g.id==='meeting-notes'?0:g.id==='short-drama'?2:1}
    return priority(a)-priority(b);
  });
  box.innerHTML=guides.map(function(g,i){return '<a class="guide-card '+(i===0?'guide-card-featured':'')+'" href="guide.html?id='+encodeURIComponent(g.id)+'"><div class="guide-card-top"><span>'+L.esc(g.category)+'</span><span>'+L.esc(g.badge)+'</span></div><b>'+L.esc(g.title)+'</b><p>'+L.esc(g.intro)+'</p><div class="guide-card-bottom">跟着步骤做 <span>↗</span></div></a>'}).join('');
})(window);
