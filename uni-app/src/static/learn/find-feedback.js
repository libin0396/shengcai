/* Search outcome and optional category feedback. Never reads the query. */
(function(root){
  'use strict';
  var doc=root.document;
  function onSearch(hasResults,container,offerFeedback,suppressCount){
    if(typeof hasResults!=='boolean')return;
    if(!suppressCount&&root.AINPETrack)root.AINPETrack.track('find_search',{page:'learn',game:'find',tier:hasResults?(offerFeedback?'related':'hit'):'miss'});
    if((hasResults&&!offerFeedback)||!container||!doc)return;
    var section=doc.createElement('section');
    section.className='find-feedback';
    section.innerHTML='<strong>想让我们补充什么？</strong><p>选择一个方向并提交，我们会参考反馈完善内容。只发送你选择的分类，不发送搜索内容；不会自动通知。选择“其他”仅记录类别，暂不能填写具体内容。</p><label for="find-feedback-category">希望补充的方向</label><div class="find-feedback-controls"><select id="find-feedback-category"><option value="">请选择方向</option><option value="drama">AI 短剧</option><option value="video">AI 视频</option><option value="office">办公与工作</option><option value="content">内容创作</option><option value="education">教育与学习</option><option value="business">项目与副业</option><option value="other">其他</option></select><button type="button" class="btn pri">提交需求</button></div><p class="find-feedback-status" role="status" aria-live="polite"></p>';
    container.appendChild(section);
    var select=section.querySelector('select'),button=section.querySelector('button'),status=section.querySelector('.find-feedback-status');
    button.addEventListener('click',async function(){
      if(!select.value){status.textContent='请选择一个方向。';return}
      if(!root.AINPETrack||typeof root.AINPETrack.submitFindFeedback!=='function'){status.textContent='暂时无法提交，请稍后再试。';return}
      button.disabled=true;status.textContent='正在提交…';
      var result=await root.AINPETrack.submitFindFeedback(select.value);
      if(result.ok){status.textContent='已收到，我们会参考大家的需求补充内容。';select.disabled=true;button.textContent='已提交';}
      else{status.textContent=result.reason==='disabled'?'当前设备已关闭统计，暂无法提交需求。':'暂时无法提交，请稍后再试。';button.disabled=false}
    });
  }
  root.AINPEFindFeedback={onSearch:onSearch};
})(typeof window==='undefined'?globalThis:window);
