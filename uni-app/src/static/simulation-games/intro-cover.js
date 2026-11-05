(function(root){
 'use strict';
 var designs={miniapp:{label:'AI 小程序副业',question:'30 天，你的小程序',emphasis:'能回本吗？',symbol:'↗',time:'约 2 分钟'},video:{label:'AI 视频定制',question:'接一单定制视频，',emphasis:'能赚到吗？',symbol:'▶',time:'约 3 分钟'},'education-ppt':{label:'小红书教育 PPT',question:'一套课件，',emphasis:'能卖出去吗？',symbol:'✎',time:'约 3 分钟'}};
 function escapeText(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function gameKey(){var match=location.pathname.match(/\/(miniapp|video|education-ppt)\.html$/);return match?match[1]:''}
 function completedTiers(key){
  try{var history=JSON.parse(localStorage.getItem('ainpe:history')||'[]');if(!Array.isArray(history))return new Set();return new Set(history.filter(function(record){return record&&String(record.game||'').replace(/\.html$/,'')===key&&Number.isInteger(record.tier)&&record.tier>=0&&record.tier<6}).map(function(record){return record.tier}))}catch(_){return new Set()}
 }
 function render(data,ui){
  var key=gameKey(),design=designs[key];if(!design||!Array.isArray(ui.titles)||!Array.isArray(data.choices))return '';
  var done=completedTiers(key),money=Number.isFinite(Number(data.baseRef))?'¥'+Math.round(Number(data.baseRef)).toLocaleString():'未设置';
  var cards=ui.titles.slice(0,6).map(function(item,i){var unlocked=done.has(i);return '<div class="intro-ending '+(unlocked?'is-unlocked':'is-locked')+'"><span aria-hidden="true">'+(unlocked?'✓':'○')+'</span><strong>'+escapeText(item[1])+'</strong><small>'+(unlocked?'已点亮':'待点亮')+'</small></div>'}).join('');
  return '<div class="intro-cover-page"><section class="intro-cover-hero '+escapeText(key)+'"><div class="intro-cover-kicker">'+escapeText(design.label)+' · 项目模拟</div><h1>'+escapeText(design.question)+'<br><b>'+escapeText(design.emphasis)+'</b></h1><div class="intro-cover-art" aria-hidden="true"><div class="intro-cover-art-screen">'+escapeText(design.symbol)+'</div></div><div class="intro-cover-meta"><span>'+escapeText(design.time)+'</span><span>'+data.choices.length+' 个决策</span><span>15 或 30 天</span></div></section><section class="intro-cover-endings"><h2>6 种结局，你会拿到哪个？</h2><p>根据本设备当前记录，已点亮 '+done.size+' 种</p><div class="intro-ending-grid">'+cards+'</div></section><section class="intro-cover-gains"><h2>玩完你会拿到</h2><p><span aria-hidden="true">✦</span> 一个有趣的副业人格</p><p><span aria-hidden="true">!</span> 这局的关键选择与案例参考</p><p><span aria-hidden="true">↗</span> 一张可分享的模拟战报</p></section><details class="intro-cover-assumption"><summary>参考起点 '+escapeText(money)+' · 游戏假设</summary><p>'+escapeText(data.baseRefNote)+'</p></details><p class="intro-cover-disclaimer">游戏中的金额、事件和结果均为模拟，不是收入预测。</p><div class="intro-cover-cta"><button class="btn" id="go">开局 ▶</button><small>开局后先选择生活状态、时间、技术和资金等条件</small></div></div>'
 }
 var stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./intro-cover.css';document.head.appendChild(stylesheet);
 root.AINPEIntroCover={render:render};
})(window);
