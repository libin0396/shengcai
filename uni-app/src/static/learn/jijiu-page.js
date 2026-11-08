(function(){
  var L=window.Learn;L.chrome('learn');
  var AIDS=window.AINPE_AIDS||[],box=L.$('#aids');
  box.innerHTML=AIDS.map(function(a){
    return '<div class="aid" id="'+a.id+'"><button type="button" class="hd" aria-expanded="false" aria-controls="b-'+a.id+'"><span class="em" aria-hidden="true">'+a.em+'</span><span><b>'+L.esc(a.title)+'</b><small>'+L.esc(a.when)+'</small></span><span class="ar" aria-hidden="true">›</span></button>'+
      '<div class="body" id="b-'+a.id+'" hidden><div class="prompt"><small>复制这句话给 AI</small>'+L.esc(a.prompt)+'</div><div class="pact"><button type="button" class="btn or sm js-copy">复制</button></div><div class="ex"><small>AI 大概会这样回答（示例）</small>'+L.esc(a.example)+'</div></div></div>';
  }).join('');
  function open(el,on){el.classList.toggle('open',on);L.$('.body',el).hidden=!on;L.$('.hd',el).setAttribute('aria-expanded',on?'true':'false')}
  L.$$('.aid',box).forEach(function(el){
    var a=AIDS.filter(function(x){return x.id===el.id})[0];
    L.$('.hd',el).addEventListener('click',function(){var on=!el.classList.contains('open');open(el,on);if(on)L.track('learn_step',{page:'learn',game:'jijiu',tier:a.id})});
    L.$('.js-copy',el).addEventListener('click',function(){L.copy(a.prompt,'已复制，粘贴到 AI 里，再把【】换成你的内容');L.track('aid_copy',{page:'learn',game:'jijiu',tier:a.id})});
  });
  var h=(location.hash||'').slice(1),t=h&&document.getElementById(h);
  if(t&&t.classList.contains('aid')){open(t,true);setTimeout(function(){t.scrollIntoView({block:'start'})},50)}
  L.track('learn_view',{page:'learn',game:'jijiu'});
})();
