(function(root){
  'use strict';var L=root.Learn, box=L.$('#guides-list');L.chrome('learn');
  // 把日常任务放在前面；完整短剧是较长的项目，不暗示它是新手第一步。
  var guides=(root.AINPE_GUIDES||[]).slice().sort(function(a,b){
    function priority(g){return g.id==='meeting-notes'?0:g.id==='short-drama'?2:1}
    return priority(a)-priority(b);
  });
  var special=[
    {id:'kejian',title:'给孩子做一份课件',category:'学习',badge:'作品教程',intro:'从教案到课件，跟着步骤做一节课。',href:'kejian.html'},
    {id:'huiben',title:'和孩子一起做一本绘本',category:'亲子',badge:'作品教程',intro:'从孩子的故事开始，试着做出四页绘本。',href:'huiben.html'}
  ];
  box.innerHTML=guides.concat(special).map(function(g,i){var href=g.href||('guide.html?id='+encodeURIComponent(g.id));return '<a class="guide-card '+(i===0?'guide-card-featured':'')+'" href="'+L.esc(href)+'"><div class="guide-cover" data-guide-cover="'+L.esc(g.id)+'" hidden><img alt=""><span data-cover-label></span></div><div class="guide-card-top"><span>'+L.esc(g.category)+'</span><span>'+L.esc(g.badge)+'</span></div><b>'+L.esc(g.title)+'</b><p>'+L.esc(g.intro)+'</p><div class="guide-card-bottom">跟着步骤做 <span>↗</span></div></a>'}).join('');
})(window);
