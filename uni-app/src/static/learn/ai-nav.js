/* 网站底部导航：首页 / 每日 AI / 找用法 / 学 AI / 我的。
   新页面（首页、每日 AI、学 AI、我的）和原有教程页（learn.js 的 chrome）共用这一份。
   手机上固定在底部，「找用法」是中间的小A 头像；宽屏时变成顶部横栏。
   小程序 web-view 里不显示（小程序有自己的原生导航）。 */
(function(root){
  'use strict';
  var doc=root.document;
  if(!doc||root.AINPENav)return;
  var BASE='/static/learn/';
  var ITEMS=[
    {key:'home',label:'首页',href:BASE+'home.html'},
    {key:'daily',label:'每日 AI',href:BASE+'meiri-ai.html'},
    {key:'find',label:'找用法',href:BASE+'find.html'},
    {key:'learn',label:'学 AI',href:BASE+'xue-ai.html'},
    {key:'mine',label:'我的',href:BASE+'wode.html'}
  ];
  // 旧页面传进来的 key 换成新导航里的位置
  var ALIAS={discover:'home',library:'find',saved:'mine',study:'learn',guides:'learn'};
  var ICON={
    home:'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    daily:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    learn:'<path d="M3 20h6v-5h6v-5h6"/>',
    mine:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'
  };
  function svg(p){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
  function roleA(){var s=root.AINPE_ROLE_SRC;return (s&&s.a)||BASE+'img/role-a.jpg'}
  function isMiniProgram(){return !!root.AINPE_MP||/miniProgram/i.test((root.navigator&&root.navigator.userAgent)||'')}

  /* 每日 AI 的小蓝点：页面加载了每日内容、今天这期还没做时才亮。只读本机记录。 */
  function dailyPending(){
    try{
      var M=root.AINPE_MEIRI;if(!M||!M.ISSUES)return false;
      var d=new Date(Date.now()+8*60*60*1000),today=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
      if(root.AIPlay&&root.AIPlay.today)today=root.AIPlay.today();
      var is=M.ISSUES.filter(function(x){return x.date===today})[0];if(!is)return false;
      var v=JSON.parse(root.localStorage.getItem('ainpe:ai-level')||'null');
      return !(v&&v.daily&&v.daily[is.id]);
    }catch(e){return false}
  }

  function brand(){
    var tutorial=!!(root.AINPE_SITE_MODE&&root.AINPE_SITE_MODE.tutorialFirst);
    var a=doc.createElement('a');a.className='ainav-brand';a.href=ITEMS[0].href;
    a.innerHTML='<i aria-hidden="true">↗</i><b>'+(tutorial?'AI 教程站':'AI 实战情报站')+'</b><small>AINPE.</small>';
    return a;
  }

  /* active：当前页；opts.into：放进已有的顶栏（原有教程页用）；没有 into 时自己带品牌名。 */
  function mount(active,opts){
    opts=opts||{};
    if(isMiniProgram())return null;
    var old=doc.querySelector('nav.ainav');if(old)old.remove();
    active=ALIAS[active]||active;
    var nav=doc.createElement('nav');nav.className='ainav'+(opts.into?' in-header':' solo');nav.setAttribute('aria-label','主导航');
    if(!opts.into)nav.appendChild(brand());
    var list=doc.createElement('div');list.className='ainav-items';
    ITEMS.forEach(function(it){
      var a=doc.createElement('a');a.href=it.href;a.setAttribute('data-nav',it.key);
      if(it.key==='find'){
        a.className='mid';
        a.innerHTML='<span class="ava"><img src="'+roleA()+'" alt=""><span class="lens" aria-hidden="true">'+svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>')+'</span></span><span class="lb">'+it.label+'</span>';
      }else{
        a.innerHTML='<span class="ic">'+svg(ICON[it.key])+'</span><span class="lb">'+it.label+'</span>';
      }
      if(it.key==='daily'&&dailyPending()){var dot=doc.createElement('i');dot.className='dot';dot.setAttribute('aria-label','今天还没玩');a.appendChild(dot)}
      if(it.key===active){a.classList.add('on');a.setAttribute('aria-current','page')}
      // 单文件预览里，导航在几张预览页之间切换
      a.addEventListener('click',function(e){if(typeof root.AINPE_PREVIEW_GO==='function'){e.preventDefault();root.AINPE_PREVIEW_GO(it.key)}});
      list.appendChild(a);
    });
    nav.appendChild(list);
    (opts.into||doc.body).appendChild(nav);
    doc.body.classList.add('has-ainav');
    return nav;
  }
  root.AINPENav={mount:mount,ITEMS:ITEMS,ALIAS:ALIAS};
})(typeof window!=='undefined'?window:globalThis);
