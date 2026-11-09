/* One manifest supplies the same tutorial covers to every H5 entry point. */
(function(root){
  'use strict';
  var cache;
  function load(){
    if(!cache){
      cache=(typeof root.fetch==='function'?root.fetch('/static/learn/guide-covers.json'):Promise.reject(new Error('fetch unavailable'))).then(function(res){
        if(!res.ok)throw new Error('cover manifest unavailable');return res.json();
      }).catch(function(){return {}});
    }
    return cache;
  }
  function valid(id,item){
    return typeof id==='string'&&/^[a-z-]+$/.test(id)&&item&&
      item.src==='/static/learn/media/covers/'+id+'.jpg'&&
      typeof item.alt==='string'&&!!item.alt.trim()&&
      ['AI 角色参考图','AI 生成示意图','实操成品'].indexOf(item.label)>=0;
  }
  function apply(scope){
    return load().then(function(items){
      scope.querySelectorAll('[data-guide-cover]').forEach(function(el){
        var id=el.getAttribute('data-guide-cover'),item=items[id];
        if(!valid(id,item)){el.hidden=true;return}
        var image=el.querySelector('img'), label=el.querySelector('[data-cover-label]');
        if(!image){el.hidden=true;return}
        image.addEventListener('error',function(){el.hidden=true},{once:true});
        image.alt=item.alt; image.loading=el.hasAttribute('data-cover-eager')?'eager':'lazy';
        image.decoding='async'; image.src=item.src;
        if(label)label.textContent=item.label;
        el.hidden=false;
      });
    });
  }
  root.LearnCovers={load:load,apply:apply,valid:valid};
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',function(){apply(root.document)},{once:true});
  else apply(root.document);
})(window);
