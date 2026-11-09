(function(root){
  'use strict';var L=root.Learn,app=L.$('#guide-app');L.chrome('learn');
  var id='';try{id=new URLSearchParams(root.location.search).get('id')||''}catch(_){}
  var guide=(root.AINPE_GUIDES||[]).find(function(g){return g.id===id});
  if(!guide){app.innerHTML='<p class="guide-not-found">没有找到这个教程，先去看看其他内容。</p><a class="guide-back" href="guides.html">返回教程目录 →</a>';return}
  document.title=guide.title+' · AI 教程站';
  var done={};try{done=JSON.parse(localStorage.getItem('ainpe:guide:'+id)||'{}')}catch(_){}
  // A media entry is shown only after its provenance and description have been reviewed.
  // `verified` refers to this asset, not to the whole tutorial or an income claim.
  var mediaItems=[];
  function safeMedia(item){
    if(!item||item.verified!==true||['实操截图','AI生成产出','人工编辑成果','示意图'].indexOf(item.kind)<0)return null;
    if(!['src','alt','caption','source'].every(function(k){return typeof item[k]==='string'&&item[k].trim()}))return null;
    try{
      var path=item.src.trim();
      if(/[?#\\\\]/.test(path)||!(/^(?:img|media)\//.test(path)||path.indexOf('/static/learn/')===0))return null;
      var url=new URL(path,root.location.href);
      if(url.origin!==root.location.origin||url.pathname.indexOf('/static/learn/')!==0||!/\.(?:png|jpe?g|webp)$/i.test(url.pathname))return null;
      return {src:url.pathname,alt:item.alt.trim(),caption:item.caption.trim(),kind:item.kind,source:item.source.trim()};
    }catch(_){return null}
  }
  function renderMedia(items){
    if(!Array.isArray(items))return '';
    return items.map(function(item){
      var m=safeMedia(item);if(!m)return '';
      var i=mediaItems.push(m)-1;
      return '<figure class="guide-media"><button type="button" class="guide-media-open" data-media="'+i+'" aria-label="'+L.esc('查看大图：'+m.alt)+'"><img src="'+L.esc(m.src)+'" alt="'+L.esc(m.alt)+'" loading="lazy"><span class="guide-media-zoom" aria-hidden="true">查看大图 ↗</span></button><figcaption><span class="guide-media-kind">'+L.esc(m.kind)+'</span> '+L.esc(m.caption)+'<small>来源：'+L.esc(m.source)+'</small></figcaption></figure>';
    }).join('');
  }
  function renderVideo(item){
    if(!item||item.verified!==true||item.kind!=='AI生成视频'||!['src','title','caption','source'].every(function(k){return typeof item[k]==='string'&&item[k].trim()}))return '';
    try{
      var path=item.src.trim();
      if(/[?#\\\\]/.test(path)||!(path.indexOf('media/')===0||path.indexOf('/static/learn/media/')===0))return '';
      var url=new URL(path,root.location.href);
      if(url.origin!==root.location.origin||url.pathname.indexOf('/static/learn/media/')!==0||!/\.mp4$/i.test(url.pathname))return '';
      var src=L.esc(url.pathname);
      return '<section class="guide-video-example" aria-label="本站短剧试做成片"><p class="guide-video-tag">'+L.esc(item.kind)+' · 本站试做</p><h2>'+L.esc(item.title)+'</h2><video controls playsinline webkit-playsinline preload="metadata" aria-label="'+L.esc(item.title)+'"><source src="'+src+'" type="video/mp4">当前浏览器无法直接播放，可打开下方视频文件。</video><p>'+L.esc(item.caption)+'</p><small>来源：'+L.esc(item.source)+'</small><a href="'+src+'">无法播放？打开视频文件</a></section>';
    }catch(_){return ''}
  }
  function renderEvidence(e){
    if(!e||e.verified!==true||!['title','tool','input','process','result','limits'].every(function(k){return typeof e[k]==='string'&&e[k].trim()}))return '';
    return '<section class="guide-evidence" aria-label="本站实操记录"><p class="guide-evidence-tag">本站实操记录 · '+L.esc(e.tool)+'</p><h2>'+L.esc(e.title)+'</h2><dl><div><dt>准备的示例</dt><dd>'+L.esc(e.input)+'</dd></div><div><dt>怎么做的</dt><dd>'+L.esc(e.process)+'</dd></div><div><dt>得到的结果</dt><dd>'+L.esc(e.result)+'</dd></div></dl><p class="guide-evidence-limits">'+L.esc(e.limits)+'</p></section>';
  }
  app.innerHTML='<a class="guide-back" href="guides.html">← 全部教程</a><section class="guide-detail-hero"><p class="guide-eyebrow">'+L.esc(guide.category)+' · 跟着做</p><h1>'+L.esc(guide.title)+'</h1><p>'+L.esc(guide.intro)+'</p><div class="guide-detail-facts"><div><small>完成后你会得到</small><b>'+L.esc(guide.outcome)+'</b></div><div><small>开始前准备</small><b>'+L.esc(guide.needs)+'</b></div></div></section>'+renderVideo(guide.video)+renderEvidence(guide.evidence)+renderMedia(guide.media)+'<div class="guide-progress" id="guide-progress" aria-live="polite"></div><section class="guide-steps">'+guide.steps.map(function(s,i){return '<article class="guide-step"><div class="guide-step-label"><span>'+String(i+1).padStart(2,'0')+'</span> 跟着做</div><h2>'+L.esc(s.title)+'</h2><p class="guide-action">'+L.esc(s.action)+'</p>'+renderMedia(s.media)+(s.prompt?'<div class="guide-prompt-head"><b>复制这段提示词</b><button type="button" class="guide-copy" data-copy="'+i+'">复制提示词</button></div><pre class="guide-prompt">'+L.esc(s.prompt)+'</pre>':'')+'<div class="guide-check"><b>做到这里，检查一下</b><p>'+L.esc(s.check)+'</p></div><label class="guide-done"><input type="checkbox" data-done="'+i+'" '+(done[i]?'checked':'')+'> 我完成了这一步</label></article>'}).join('')+'</section><section class="guide-end"><b>完成了？回头看看你的成果。</b><p>以上是帮助你动手的步骤，实际生成和剪辑需要你在所选工具中操作。进度只保存在当前设备。</p><a href="guides.html">再看看其他教程 →</a></section>'+(guide.source?'<p class="guide-source">工具能力参考：<a href="'+L.esc(guide.source.url)+'" target="_blank" rel="noopener noreferrer">'+L.esc(guide.source.name)+' ↗</a>；步骤和示例由本站整理，具体功能以工具内说明为准。</p>':'');
  if(root.LearnCovers){var cover=document.createElement('div');cover.className='guide-cover';cover.hidden=true;cover.setAttribute('data-guide-cover',id);cover.setAttribute('data-cover-eager','');cover.innerHTML='<img alt=""><span data-cover-label></span>';
  app.querySelector('.guide-detail-hero').prepend(cover);}
  var how=docCreateHelp();
  app.querySelector('.guide-detail-hero').appendChild(how);
  app.querySelector('.guide-end p').textContent='以上是帮助你动手的步骤，请在所选工具中实际操作并检查结果。本页进度只保存在当前设备。';
  function docCreateHelp(){
    var note=document.createElement('p');
    note.className='guide-getting-started';
    note.textContent='怎么开始：复制提示词，把【】里的内容换成你的情况，再打开你选择的 AI 工具粘贴发送。按步骤操作、检查结果；本页不会自动生成内容。';
    return note;
  }
  function update(){var n=guide.steps.filter(function(_,i){return !!done[i]}).length;L.$('#guide-progress').textContent='你的进度 '+n+' / '+guide.steps.length+' 步 · 仅当前设备'}
  L.$$('[data-copy]',app).forEach(function(btn){btn.addEventListener('click',function(){var s=guide.steps[Number(btn.dataset.copy)];if(s&&s.prompt)L.copy(s.prompt,'已复制，去你选择的 AI 工具粘贴')})});
  L.$$('.guide-media-open img',app).forEach(function(img){img.addEventListener('error',function(){var figure=img.closest('.guide-media');if(figure)figure.hidden=true},{once:true})});
  L.$$('[data-media]',app).forEach(function(btn){btn.addEventListener('click',function(){
    var m=mediaItems[Number(btn.dataset.media)];if(!m||document.getElementById('guide-media-dialog'))return;
    var overlay=document.createElement('div');overlay.id='guide-media-dialog';overlay.className='guide-media-overlay';
    overlay.innerHTML='<section class="guide-media-dialog" role="dialog" aria-modal="true" aria-label="'+L.esc(m.alt)+'"><button type="button" class="guide-media-close" aria-label="关闭大图">×</button><img src="'+L.esc(m.src)+'" alt="'+L.esc(m.alt)+'"><p><b>'+L.esc(m.kind)+'</b> · '+L.esc(m.caption)+'<small>来源：'+L.esc(m.source)+'</small></p></section>';
    document.body.appendChild(overlay);
    var close=overlay.querySelector('.guide-media-close');
    function dismiss(){document.removeEventListener('keydown',onKey);overlay.remove();if(btn.isConnected)btn.focus()}
    function onKey(e){if(e.key==='Escape'){e.preventDefault();dismiss()}else if(e.key==='Tab'){e.preventDefault();close.focus()}}
    overlay.addEventListener('click',function(e){if(e.target===overlay)dismiss()});close.addEventListener('click',dismiss);document.addEventListener('keydown',onKey);close.focus();
  })});
  L.$$('[data-done]',app).forEach(function(box){box.addEventListener('change',function(){done[Number(box.dataset.done)]=box.checked;try{localStorage.setItem('ainpe:guide:'+id,JSON.stringify(done))}catch(_){}update()})});
  update();
})(window);
