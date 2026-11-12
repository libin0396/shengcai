/* 教程站模式：网站首页和「我的」直接打开新的静态页（/static/learn/home.html、wode.html），
   在 uni-app 网页版启动前就跳转，省去加载整站脚本。其它地址（文章、旧页面的分享链接）照旧。
   需要先加载 /static/site-mode.js。 */
(function(root){
  'use strict';
  try{
    var mode=root.AINPE_SITE_MODE;if(!mode||!mode.tutorialFirst)return;
    var loc=root.location,hash=loc.hash||'',i=hash.indexOf('?');
    var path=(i<0?hash:hash.slice(0,i)).replace(/^#/,'');
    var target=(path===''||path==='/'||path==='/pages/discover/index')?'/static/learn/home.html':path==='/pages/saved/index'?'/static/learn/wode.html':'';
    if(!target)return;
    // 网址里的参数一起带过去（海报二维码的 from=persona_qr 由新首页记录来源）
    var params=new URLSearchParams(loc.search),inner=new URLSearchParams(i<0?'':hash.slice(i+1));
    inner.forEach(function(v,k){params.append(k,v)});
    if(params.has('section'))return; // 旧的情报入口参数，交给原页面处理
    var qs=params.toString();
    loc.replace(target+(qs?'?'+qs:''));
  }catch(e){}
})(typeof window!=='undefined'?window:this);
