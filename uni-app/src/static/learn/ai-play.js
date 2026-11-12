/* 学 AI、每日 AI 共用：小工具、角色、等级存储、底部导航。
   不接任何 AI 接口，不上传任何内容；记录只存在本机 localStorage 的 ainpe:ai-level 里。 */
(function(root){
  'use strict';
  var doc=root.document;
  var PREVIEW=!!root.AINPE_PREVIEW; // 单文件预览版会把图片内联，并隐藏站内导航
  var IMG_BASE=root.AINPE_IMG_BASE||'img/';
  var ROLES={
    a:{name:'小A',src:IMG_BASE+'role-a.jpg'},
    lin:{name:'小林',src:IMG_BASE+'role-lin.jpg'},
    yuan:{name:'小圆',src:IMG_BASE+'role-yuan.jpg'},
    zhou:{name:'老周',src:IMG_BASE+'role-zhou.jpg'}
  };
  if(root.AINPE_ROLE_SRC){for(var k in root.AINPE_ROLE_SRC)if(ROLES[k])ROLES[k].src=root.AINPE_ROLE_SRC[k]}

  var reduce=!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $(s,ctx){return (ctx||doc).querySelector(s)}
  function $$(s,ctx){return Array.prototype.slice.call((ctx||doc).querySelectorAll(s))}
  function el(tag,cls,text){var e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function btn(cls,text,role){var b=el('button',cls,text);b.type='button';if(role)b.setAttribute('data-role',role);return b}

  /* 动画计时：每次换幕都会让 run 加一，旧的动画自动停下 */
  var clock={run:0};
  function sleep(ms,t){return new Promise(function(ok,no){setTimeout(function(){t===clock.run?ok():no('stop')},reduce?Math.min(ms,40):ms)})}
  function type(node,text,t,sp){
    node.textContent='';
    if(reduce){node.textContent=text;return Promise.resolve()}
    node.classList.add('typing');var i=0;
    return new Promise(function(ok,no){(function next(){
      if(t!==clock.run){node.classList.remove('typing');return no('stop')}
      if(i>=text.length){node.classList.remove('typing');return ok()}
      node.textContent+=text.charAt(i++);setTimeout(next,sp||45)})()});
  }
  function waitClick(node,t){return new Promise(function(ok){node.addEventListener('click',function(){if(t===clock.run)ok()},{once:true})})}
  function shake(n){n.classList.remove('shake');void n.offsetWidth;n.classList.add('shake')}
  function feedback(box,ok,text){box.hidden=false;box.innerHTML='';if(ok)box.appendChild(el('b','tag','对了'));box.appendChild(doc.createTextNode(text))}
  function toast(text){var old=$('.toast');if(old)old.remove();var t=el('div','toast',text);t.setAttribute('role','status');doc.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
  function copy(text,okMsg){
    function fail(){toast('请长按文字复制')}
    try{root.navigator.clipboard.writeText(text).then(function(){toast(okMsg||'已复制')},fail)}catch(e){fail()}
  }
  function shuffle(list,seed){var a=list.slice(),s=seed||7;for(var i=a.length-1;i>0;i--){s=(s*9301+49297)%233280;var j=Math.floor(s/233280*(i+1));var x=a[i];a[i]=a[j];a[j]=x}
    // 打乱后如果和原顺序一样，就把头两个换一下
    if(a.every(function(v,i){return v===list[i]})&&a.length>1){var y=a[0];a[0]=a[1];a[1]=y}return a}

  /* ---------- 等级存储 ---------- */
  var KEY='ainpe:ai-level';
  var LEVELS=[{n:'AI 新朋友',need:0},{n:'AI 新手',need:30},{n:'会问的人',need:80},{n:'会用的人',need:150},{n:'AI 熟手',need:240},{n:'AI 达人',need:360}];
  function blank(){return {v:1,xp:0,daily:{},lessons:{}}}
  function load(){try{var v=JSON.parse(root.localStorage.getItem(KEY)||'null');if(v&&v.v===1&&typeof v.xp==='number'){v.daily=v.daily||{};v.lessons=v.lessons||{};return v}}catch(e){}return blank()}
  function save(v){try{root.localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
  function levelOf(xp){var i=0;LEVELS.forEach(function(l,k){if(xp>=l.need)i=k});return i}
  function levelInfo(xp){var i=levelOf(xp),cur=LEVELS[i],nx=LEVELS[i+1];
    return {index:i,number:i+1,name:cur.n,next:nx||null,toNext:nx?nx.need-xp:0,pct:nx?Math.round((xp-cur.need)/(nx.need-cur.need)*100):100}}

  /* ---------- 日期（北京时间） ---------- */
  function ymd(d){var b=new Date(d.getTime()+8*60*60*1000);return b.getUTCFullYear()+'-'+String(b.getUTCMonth()+1).padStart(2,'0')+'-'+String(b.getUTCDate()).padStart(2,'0')}
  function parseYmd(s){var p=String(s).split('-');return new Date(Date.UTC(+p[0],+p[1]-1,+p[2]))}
  function addDays(s,n){var d=parseYmd(s);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
  function today(){
    try{var q=new URLSearchParams(root.location.search).get('date');if(q&&/^\d{4}-\d{2}-\d{2}$/.test(q))return q}catch(e){}
    if(root.AINPE_TODAY)return root.AINPE_TODAY;
    return ymd(new Date());
  }

  /* ---------- 小A 的脸：小A 面罩上用代码画表情 ---------- */
  var FACE='<svg class="face" viewBox="0 0 100 100" aria-hidden="true"><defs><filter id="softA" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>'+
    '<g transform="rotate(-11 59 40)"><ellipse cx="59" cy="40.5" rx="21" ry="10.5" fill="#152640" filter="url(#softA)"/>'+
    '<g class="f flat" fill="#8FE6FF" stroke="#8FE6FF"><circle cx="47.5" cy="38.5" r="2.8" stroke="none"/><circle cx="70.5" cy="38.5" r="2.8" stroke="none"/><path d="M54.5 46.5h9" fill="none" stroke-width="2.6" stroke-linecap="round"/></g>'+
    '<g class="f wavy" fill="#8FE6FF" stroke="#8FE6FF"><circle cx="47.5" cy="38.5" r="2.6" stroke="none"/><circle cx="70.5" cy="37.5" r="3.8" stroke="none"/><path d="M52 47q3-3.5 6 0t6 0" fill="none" stroke-width="2.6" stroke-linecap="round"/></g>'+
    '<g class="f blink" fill="none" stroke="#8FE6FF" stroke-width="2.6" stroke-linecap="round"><path d="M44 39.5q3.5 2.6 7 0M67 39.5q3.5 2.6 7 0"/><path d="M54 45.5q5 4 10 0"/></g></g></svg>';

  /* ---------- 底部导航：交给 ai-nav.js（和原有教程页共用） ---------- */
  function nav(active){if(root.AINPENav)root.AINPENav.mount(active)}

  /* ---------- 匿名统计（站内已有 tracking.js 时才记） ---------- */
  function track(event,opts){try{if(root.AINPETrack)root.AINPETrack.track(event,opts||{})}catch(e){}}

  /* ---------- 单文件预览：站内链接换成在预览页之间切换 ---------- */
  if(PREVIEW&&doc.addEventListener){
    doc.addEventListener('click',function(e){
      var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
      if(!a||a.closest('.ainav')||/^https?:\/\//.test(a.getAttribute('href')||''))return;
      var go=root.AINPE_PREVIEW_GO,href=a.getAttribute('href')||'';
      e.preventDefault();
      var hash=(href.split('#')[1]||'');
      var map=[[/meiri-ai\.html/,'daily'],[/xue-ai\.html/,'learn'],[/wode\.html/,'mine'],[/find\.html/,'find'],[/home\.html/,'home'],[/zuo\.html/,'zuo']];
      for(var i=0;i<map.length;i++){if(map[i][0].test(href)){if(typeof go==='function')go(map[i][1],hash,href);return}}
      toast('在网站里，这里会打开对应的教程页');
    },true);
  }

  root.AIPlay={$:$,$$:$$,el:el,btn:btn,clock:clock,sleep:sleep,type:type,waitClick:waitClick,shake:shake,feedback:feedback,toast:toast,copy:copy,shuffle:shuffle,
    ROLES:ROLES,FACE:FACE,LEVELS:LEVELS,load:load,save:save,levelInfo:levelInfo,today:today,addDays:addDays,parseYmd:parseYmd,nav:nav,track:track,reduce:reduce,PREVIEW:PREVIEW};
})(typeof window!=='undefined'?window:globalThis);
