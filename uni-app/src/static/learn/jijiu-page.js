(function(){
  var L=window.Learn;L.chrome('library');
  var AIDS=window.AINPE_AIDS||[],box=L.$('#aids');
  box.innerHTML=AIDS.map(function(a){
    return '<div class="aid" id="'+a.id+'"><button type="button" class="hd" aria-expanded="false" aria-controls="b-'+a.id+'"><span class="em" aria-hidden="true">'+L.aidIcon(a.id)+'</span><span><b>'+L.esc(a.title)+(a.tags||[]).map(function(tag){return ' <i class="lv">'+L.esc(tag)+'</i>'}).join('')+'</b><small>'+L.esc(a.when)+'</small></span><span class="ar" aria-hidden="true">›</span></button>'+
      '<div class="body" id="b-'+a.id+'" hidden><div class="prompt"><small>复制这句话给 AI</small>'+L.esc(a.prompt)+'</div><div class="pact"><button type="button" class="btn or sm js-copy">复制</button></div><div class="ex"><small>AI 大概会这样回答（示例）</small>'+L.esc(a.example)+'</div></div></div>';
  }).join('');
  // 分类描述用户要做的事，而不是所需的操作。同一用法可在多个场景中出现。
  var topics={notice:['生活','工作'],reply:['生活','工作'],summary:['工作','学习'],homework:['学习'],menu:['生活'],meeting:['工作'],excel:['工作'],trip:['生活'],caption:['内容创作'],learnai:['AI入门']};
  var topicOrder=['生活','工作','学习','内容创作','AI入门','其他'];
  function categories(a){return Object.prototype.hasOwnProperty.call(topics,a.id)?topics[a.id]:['其他']}
  var categoryBar=L.$('#library-categories'),bar=L.$('#library-operations');
  var selectedTopic='',selectedTag='',query=L.$('#library-query'),empty=L.$('#library-empty'),count=L.$('#library-count'),reset=L.$('#library-reset'),operationSummary=L.$('#library-operation-summary');
  function updatePressed(container,selected){
    L.$$('button',container).forEach(function(button){button.setAttribute('aria-pressed',button.dataset.value===selected?'true':'false')});
  }
  function applyFilters(){
    var q=(query&&query.value||'').trim().toLowerCase(),visible=0;
    L.$$('.aid',box).forEach(function(el){var a=AIDS.filter(function(x){return x.id===el.id})[0];
      var matchesTopic=!selectedTopic||!!(a&&categories(a).indexOf(selectedTopic)>=0);
      var matchesTag=!selectedTag||!!(a&&Array.isArray(a.tags)&&a.tags.indexOf(selectedTag)>=0);
      var haystack=a?[a.title,a.when,a.prompt,a.example,(a.tags||[]).join(' '),categories(a).join(' ')].join(' ').toLowerCase():'';
      var matchesQuery=!q||haystack.indexOf(q)>=0;
      el.hidden=!(matchesTopic&&matchesTag&&matchesQuery);if(!el.hidden)visible++;
    });
    if(empty)empty.hidden=visible>0;
    if(count)count.textContent='找到 '+visible+' 个用法';
    if(operationSummary)operationSummary.textContent=selectedTag?'操作方式：'+selectedTag:'更多筛选：按操作方式';
  }
  if(query)query.addEventListener('input',applyFilters);
  if(categoryBar){
    [''].concat(topicOrder.filter(function(topic){return AIDS.some(function(a){return categories(a).indexOf(topic)>=0})})).forEach(function(topic){
      var b=document.createElement('button');b.type='button';b.dataset.value=topic;
      var total=topic?AIDS.filter(function(a){return categories(a).indexOf(topic)>=0}).length:AIDS.length;
      b.textContent=(topic||'全部')+' '+total;b.setAttribute('aria-pressed',topic?'false':'true');
      b.addEventListener('click',function(){selectedTopic=topic;updatePressed(categoryBar,selectedTopic);applyFilters()});
      categoryBar.appendChild(b);
    });
  }
  ['全部','需粘贴原文','需填写信息','需表格工具'].forEach(function(tag,i){var b=document.createElement('button');b.type='button';b.textContent=tag;b.setAttribute('aria-pressed',i?'false':'true');
    b.dataset.value=i?tag:'';
    b.addEventListener('click',function(){L.$$('button',bar).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
      selectedTag=i?tag:'';applyFilters()});
    bar.appendChild(b)});
  if(reset)reset.addEventListener('click',function(){selectedTopic='';selectedTag='';if(query)query.value='';updatePressed(categoryBar,'');updatePressed(bar,'');applyFilters();if(query)query.focus()});
  applyFilters();
  function open(el,on){el.classList.toggle('open',on);L.$('.body',el).hidden=!on;L.$('.hd',el).setAttribute('aria-expanded',on?'true':'false')}
  L.$$('.aid',box).forEach(function(el){
    var a=AIDS.filter(function(x){return x.id===el.id})[0];
    L.$('.hd',el).addEventListener('click',function(){var on=!el.classList.contains('open');open(el,on);if(on)L.track('learn_step',{page:'learn',game:'library',tier:a.id})});
    L.$('.js-copy',el).addEventListener('click',function(){L.copy(a.prompt,'已复制，粘贴到 AI 里，再把【】换成你的内容');L.track('aid_copy',{page:'learn',game:'library',tier:a.id})});
  });
  var h=(location.hash||'').slice(1),t=h&&document.getElementById(h);
  if(t&&t.classList.contains('aid')){open(t,true);setTimeout(function(){t.scrollIntoView({block:'start'})},50)}
  L.track('learn_view',{page:'learn',game:'library'});
})();
