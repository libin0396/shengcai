/* 找用法页的小A：只看页面上已经显示的结果来换表情和说的话，不读、不发送输入的内容。 */
(function(root){
  'use strict';
  var doc=root.document,box=doc.getElementById('findAi'),say=doc.getElementById('findAiSay'),res=doc.getElementById('fres');
  if(!box||!say||!res)return;
  var IDLE=say.textContent;
  function set(state,text){box.classList.remove('thinking','found','miss');void box.offsetWidth;if(state)box.classList.add(state);say.textContent=text}
  function thinking(){set('thinking','我找找')}
  var form=doc.getElementById('fsearch'),chips=doc.getElementById('fchips');
  if(form)form.addEventListener('submit',function(){var v=doc.getElementById('fq');if(v&&String(v.value||'').trim())thinking()},true);
  if(chips)chips.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('button'))thinking()},true);
  function read(){
    var text=res.textContent||'';
    if(!res.children.length){set('',IDLE);return}
    if(/正在查找/.test(text)){thinking();return}
    var hits=res.querySelectorAll('.fbest,.fproj,.find-result-item').length;
    if(res.querySelector('.fbest'))set('found','找到了。先把下面的空填一填，再复制给 AI。');
    else if(hits)set('found','找到 '+hits+' 个可能有用的，挑一个看看。');
    else set('miss','没找到完全对得上的。换个说法试试，或者告诉我们你想做什么。');
  }
  if(root.MutationObserver)new root.MutationObserver(read).observe(res,{childList:true});
  read();
})(window);
