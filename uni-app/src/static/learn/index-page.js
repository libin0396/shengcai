(function(){
  var L=window.Learn;
  L.chrome('learn','learn');
  var SOON=[['video','故事短片'],['novel','写小说'],['tuwen','图文号'],['assistant','AI 助手']];
  var voted=L.getState('votes').ids||[];
  var v=L.$('#vote');
  SOON.forEach(function(t){var b=document.createElement('button');b.type='button';b.textContent=t[1];if(voted.indexOf(t[0])>=0)b.className='on';
    b.addEventListener('click',function(){if(voted.indexOf(t[0])>=0){L.toast('已经投过啦');return}voted.push(t[0]);L.setState('votes',{ids:voted});b.className='on';L.track('want_submit',{page:'learn',game:t[0]});L.toast('已在当前页面标记，不会自动通知')});v.appendChild(b)});
  if(L.getState('kejian').done){var f=L.$('#feat');f.href='kejian.html?tab=practice';f.querySelector('.ladder').innerHTML='<span><span class="step done"><i></i><i></i><i></i></span>初级 · 已完成</span><span class="on">中级 · 5 关</span><span>高级</span>';f.querySelector('.btn').textContent='接着做'}
  if(L.getState('huiben').done)L.$('#miniHb').classList.add('done');

  var NAMES={kejian:'给孩子做一份课件',huiben:'和孩子做绘本',video:'AI 故事短片',novel:'AI 写小说',tuwen:'AI 图文号',assistant:'你自己的 AI 助手'};
  L.$('#want').addEventListener('submit',function(e){
    e.preventDefault();var val=L.$('#wantIn').value.trim(),res=L.$('#wantRes');
    if(!val){res.textContent='先写一句你想做的事。';return}
    var k=L.classifyWant(val);L.track('want_submit',{page:'learn',game:k});
    if(k==='kejian'||k==='huiben')res.innerHTML='这件事现在就能做：<a class="chip" href="'+k+'.html?from=want">'+NAMES[k]+' ›</a>';
    else if(k==='money')res.innerHTML='先做成一件小事，再谈赚钱。'+(L.MP?'':'<a class="chip" href="/#/pages/camp/index?from=learn">看看真人怎么做 ›</a>');
    else if(k==='other')res.innerHTML='这个方向还在准备，也不会自动通知。先试试<a class="chip" href="jijiu.html">用法库 ›</a>';
    else res.innerHTML='「'+NAMES[k]+'」还在准备，不会自动通知。';
    L.$('#wantIn').value='';
  });
  L.$('#aidsPreview').innerHTML=(window.AINPE_AIDS||[]).slice(0,5).map(function(a){return '<a href="jijiu.html#'+a.id+'"><span aria-hidden="true">'+L.aidIcon(a.id)+'</span><b>'+L.esc(a.title)+'</b><small>'+L.esc(a.when)+'</small></a>'}).join('');
  var ua=navigator.userAgent||'',tip;
  if(L.MP)tip='在小程序里：点右上角「···」，选「添加到我的小程序」或「添加到桌面」。';
  else if(/MicroMessenger/i.test(ua))tip='在微信里：点右上角「···」，选「在浏览器打开」，再按下面的方法添加。';
  else if(/iPhone|iPad/i.test(ua))tip='iPhone：点 Safari 底部的分享按钮，选「添加到主屏幕」。';
  else tip='安卓：点浏览器菜单，选「添加到主屏幕」或「添加到桌面」。';
  L.$('#addHomeTip').textContent=tip;
  L.track('learn_view',{page:'learn',game:'index'});
  var replay=L.$('#obReplay');if(replay)replay.addEventListener('click',function(){if(window.AINPEOnboard)window.AINPEOnboard.open()});
})();
