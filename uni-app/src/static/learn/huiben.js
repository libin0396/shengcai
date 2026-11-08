(function(){
  'use strict';
  var L=window.Learn,T='huiben',$=L.$,$$=L.$$,esc=L.esc;
  L.chrome('learn');
  var st=L.getState(T);
  var S={hero:st.hero||'girl',name:st.name||'',place:st.place||'sea',trouble:st.trouble||'lost',fix:st.fix||'friend',age:st.age||'4-6',style:st.style||'warm'};
  function persist(){L.setState(T,S)}

  var HERO={girl:{label:'一个小女孩',def:'小雨',look:'一个扎两个小辫子、穿黄色雨衣的小女孩'},boy:{label:'一个小男孩',def:'阿海',look:'一个短头发、穿蓝色条纹衫的小男孩'},turtle:{label:'一只小海龟',def:'圆圆',look:'一只绿色背壳、眼睛圆圆的小海龟'}};
  var PLACE={sea:{label:'海底',tt:'海底',go:'潜到海底',img:'fish.jpg',see:'珊瑚丛里，成群的小鱼游来游去'},island:{label:'一座小岛',tt:'小岛',go:'划着小船去一座小岛',img:'cliff.jpg',see:'高高的岩石边，海鸟一圈一圈地飞'},beach:{label:'海边沙滩',tt:'沙滩',go:'去海边沙滩',img:'shell.jpg',see:'金色的沙滩上，到处是花纹不一样的贝壳'}};
  var TROUBLE={lost:{label:'迷路了',t:'可是走着走着，回家的路不见了。'},boat:{label:'遇到意外',t:''},sad:{label:'遇到一个不开心的朋友',t:'这时，它看见一个小伙伴蹲在角落里，一句话也不说。'}};
  var FIX={friend:{label:'请新朋友帮忙',t:'一条小鱼游过来说：「跟我来！」它们一起找到了办法。'},self:{label:'自己想办法',t:'深呼吸，想一想，再试一试——办法真的被想出来了。'},share:{label:'把自己的东西分出去',t:'把口袋里最喜欢的那颗贝壳送了出去，大家都笑了。'}};
  var AGE={'2-3':'2–3 岁','4-6':'4–6 岁','7-9':'7–9 岁'};
  var STY={warm:'暖色调、柔和的水彩插画',crayon:'像小朋友用蜡笔画的，线条稚气、颜色鲜亮',clean:'干净的扁平插画，颜色明快'};

  function heroName(){return S.name||HERO[S.hero].def}
  var BY_PLACE={
    sea:{ride:'海水凉凉的，亮亮的，慢慢往下潜。',rideImg:'fish.jpg',helper:'一条小鱼游过来',lost:'可是游着游着，回家的路不见了。',broken:'潜水镜进了水，什么都看不清了。',repair:'仔细擦干净潜水镜，终于又看清了'},
    island:{ride:'小船摇呀摇，风吹着帆，小岛越来越近。',rideImg:'boat.jpg',helper:'一只海鸟飞过来',lost:'可是走着走着，回家的路不见了。',broken:'要回家的时候，小船开始漏水，水一点点漫上来。',repair:'用背包里的修补材料补好了小船'},
    beach:{ride:'沙子软软的，海浪一下一下拍着脚丫。',rideImg:'shell.jpg',helper:'一只小螃蟹爬过来',lost:'可是走着走着，回家的路不见了。',broken:'一个大浪打过来，刚装满贝壳的小桶被卷走了。',repair:'等海浪退去，找回了小桶'}
  };
  function troubleText(){var bp=BY_PLACE[S.place]||BY_PLACE.sea;return S.trouble==='boat'?bp.broken:S.trouble==='lost'?bp.lost:TROUBLE[S.trouble].t}
  function fixText(){var bp=BY_PLACE[S.place]||BY_PLACE.sea;
    if(S.trouble==='sad')return S.fix==='share'?'它把最喜欢的贝壳送给小伙伴，小伙伴笑了。':S.fix==='friend'?bp.helper+'，陪它们一起聊天，小伙伴慢慢笑了。':'它坐下来听小伙伴说话，小伙伴慢慢笑了。';
    if(S.trouble==='lost')return S.fix==='self'?'它静下心，沿着熟悉的记号找到了回家的路。':bp.helper+(S.fix==='share'?'，它分享了自己的贝壳，也问到了回家的路。':'，为它指明了回家的路。');
    return S.fix==='self'?'它想了想，'+bp.repair+'。':bp.helper+(S.fix==='share'?'，它分享了自己的贝壳，然后一起想办法，':'，它们一起想办法，')+bp.repair+'。';
  }
  function pages(){
    var n=heroName(),p=PLACE[S.place],bp=BY_PLACE[S.place]||BY_PLACE.sea;
    var short=S.age==='2-3';
    return [
      {img:'girl.jpg',text:short?n+'想'+p.go+'。':'有一天，'+n+'对着窗外的大海说：「我想'+p.go+'！」'},
      {img:bp.rideImg,text:short?n+'出发啦！':n+'带上小背包出发了。'+bp.ride},
      {img:p.img,text:(short?'哇，':'到了'+p.label+'，'+p.see+'。')+troubleText()},
      {img:'kids.jpg',text:fixText()+(short?n+'笑了。':'回家的路上，'+n+'想：下次还要再来。')}
    ];
  }
  function buildSkill(){
    var h=HERO[S.hero],n=heroName();
    return ['---','name: huiben-zhushou','description: 亲子绘本助手。孩子出主意、家长打字，帮忙把故事写成 4 页绘本，并按固定的主角形象一页一页画出来。','---','',
'# 亲子绘本助手（'+AGE[S.age]+'）','',
'你是一个陪家长和孩子做绘本的助手。和你说话的是家长，故事的主意来自孩子。','',
'## 规则（一直遵守）',
'- 故事要适合 '+AGE[S.age]+' 的孩子：句子短，每页 '+(S.age==='2-3'?'1 句':S.age==='4-6'?'1–2 句':'2–3 句')+'，没有吓人的情节。',
'- 不要求、也不接收孩子的照片和声音。主角形象只用文字描述。',
'- 孩子的主意优先。家长转述孩子的想法时，照着写，不要替孩子改主意。',
'- 每次只做一步，做完问「这样可以吗？」。','',
'## 主角（每一页都照这个画）',
'名字：'+n+'；样子：'+h.look+'。','',
'## 第 1 步：问 3 个问题',
'一次问一个，等回答：主角想去哪里？路上遇到了什么麻烦？最后是怎么解决的？','',
'## 第 2 步：写成 4 页',
'第 1 页：出发前想做什么；第 2 页：出发；第 3 页：遇到麻烦；第 4 页：解决了，心情怎样。',
'每页写：正文 + 一句画面描述（主体、场景、颜色，40 字以内）。','',
'## 第 3 步：一页一页画',
'家长说「画第 1 页」时，按画面描述生成图片。',
'- 统一风格：'+STY[S.style]+'。',
'- 画面里不要出现任何文字。',
'- 主角每页都是同一个样子。',
'孩子说哪里不对，就按孩子说的改那一页，别的页不动。','',
'## 第 4 步：收尾',
'给这本书起 3 个书名让孩子挑，再写一句「作者：（孩子的小名）」放在封面。','',
'---','由 AI 实战情报站「和孩子一起做绘本」生成',''].join('\n');
  }

  // 分区
  function tab(id,scroll){
    $$('.tabs button').forEach(function(x){x.classList.toggle('on',x.dataset.tab===id)});
    $$('.pane').forEach(function(p){p.hidden=p.id!==id});
    $$('.tier').forEach(function(t){t.classList.toggle('on',t.dataset.go===id)});
    if(scroll!==false)L.toTabs();
  }
  $$('.tabs button').forEach(function(x){x.addEventListener('click',function(){tab(x.dataset.tab)})});
  $$('.tier').forEach(function(t){t.addEventListener('click',function(){tab(t.dataset.go)})});

  // 教程
  function promptBox(label,text){return '<div class="prompt"><small>'+esc(label)+'</small>'+esc(text)+'</div><div class="pact"><button type="button" class="btn or sm js-copy" data-text="'+esc(text)+'">复制这句话</button></div>'}
  var p1='我和孩子想一起做一本 4 页的绘本，孩子 '+AGE[S.age]+'。\n主角是【孩子起的名字】，样子是【孩子说的样子，比如 穿黄雨衣的小女孩】。\n请一次只问我一个问题：主角想去哪？遇到什么麻烦？最后怎么解决？我会把孩子的回答告诉你。';
  var p2='好，请把故事写成 4 页：每页正文 1–2 句，再写一句画面描述（40 字以内）。\n4 页里主角的样子要完全一样。';
  var p3='按第 1 页的画面描述生成图片：暖色调水彩插画，画面里不要有任何文字。';
  var cards=[
    {t:'先离开手机，和孩子聊',p:'问孩子三个问题：主角是谁、想去哪、路上遇到了什么麻烦。孩子说，你记在纸上。这一步最重要，故事是孩子的。',pic:'<div class="flow"><span>🧒 孩子说</span><em>→</em><span>📝 你记下来</span><em>→</em><span>📱 再拿手机</span></div>'},
    {t:'把孩子的主意告诉 AI',p:'打开豆包新对话，粘贴下面这句，把【】换成孩子说的。它会一个一个问，你照孩子的回答转述。',pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub me">主角叫小雨，穿黄雨衣……</div><div class="bub ai">好的！第一个问题：小雨想去哪里呀？</div><div class="bub me">孩子说：想去海底看鱼</div></div>',prompt:['第 1 句',p1]},
    {t:'让 AI 写成 4 页',p:'读给孩子听，孩子说哪句不好，就让 AI 改那一句。',pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub ai">第 1 页：有一天，小雨对着大海说：「我想潜到海底！」<br>画面：穿黄雨衣的小女孩站在海边……</div></div>',prompt:['第 2 句',p2]},
    {t:'一页一页画出来',p:'每页单独画。画错了很正常，让孩子挑：「哪里不像？」再让 AI 重画那一页。',pic:'<div class="chatmock"><div class="top"><i></i>AI 对话（示意）</div><div class="bub me">按第 1 页的描述生成图片</div><div class="bub ai" style="padding:6px"><img src="img/girl.jpg" alt="AI 生成示例：海边的小女孩" style="border-radius:8px"></div></div>',prompt:['第 3 句',p3]},
    {t:'做成一本小书',p:'把 4 张图和文字放进 WPS 文档，一页一张，打印出来对折订好。封面写上「作者：孩子的小名」。睡前让孩子给你讲一遍。',pic:'<div class="flow"><span>🖼️ 4 张图</span><em>→</em><span>📄 WPS 排版</span><em>→</em><span>🖨️ 打印对折</span><em>→</em><span>📖 孩子讲给你听</span></div>'}
  ];
  $('#tcards').innerHTML=cards.map(function(c,i){return '<article class="tcard"><div class="pic">'+c.pic+'</div><div class="txt"><h3 class="h3"><span>'+(i+1)+'</span>'+esc(c.t)+'</h3><p>'+esc(c.p)+'</p>'+(c.prompt?promptBox(c.prompt[0],c.prompt[1]):'')+'</div></article>'}).join('')+
    '<div class="card"><b class="h3">做完了？</b><p class="note">去「实操」里换个主角编一个，还能拿走一个绘本助手，以后说一句就开始。</p><div class="row" style="margin-top:10px"><button class="btn or sm" id="markBasic">我们做完了</button></div></div>';
  document.addEventListener('click',function(e){var x=e.target.closest&&e.target.closest('.js-copy');if(!x)return;L.copy(x.dataset.text);L.track('aid_copy',{page:'learn',game:T})});
  $('#markBasic').addEventListener('click',function(){L.setState(T,{basicDone:true});L.track('learn_done',{page:'learn',game:T,tier:'basic'});L.toast('已标记完成，可以继续体验故事示例');setTimeout(function(){tab('practice')},700)});

  // 实操：点一点编故事
  function group(key,title,map){
    return '<div class="q"><h3 class="h3">'+esc(title)+'</h3><div class="opts" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">'+Object.keys(map).map(function(k){var v=map[k];return '<button type="button" class="opt'+(S[key]===k?' on':'')+'" data-k="'+key+'" data-v="'+k+'">'+esc(typeof v==='string'?v:v.label)+'</button>'}).join('')+'</div></div>';
  }
  $('#builder').innerHTML='<h2 class="h2">和孩子一起点一点</h2><p class="lead">每一题让孩子来选。选完可以看到一份 4 页的故事示例，配图是预设图片。</p>'+
    group('age','孩子几岁？',AGE)+group('hero','主角是谁？',HERO)+
    '<div class="q"><label class="h3" for="nameIn">给主角起个名字（选填）</label><input id="nameIn" maxlength="6" placeholder="'+esc(HERO[S.hero].def)+'" value="'+esc(S.name)+'" style="display:block;width:100%;margin-top:8px;border:1.5px solid var(--line);border-radius:12px;height:46px;padding:0 12px;font:inherit;background:#fff"><p class="note">用小名或者孩子想的名字就好，不要写真实全名。名字保存在本机，也可能出现在你保存或分享的图片中。</p></div>'+
    group('place','想去哪儿？',PLACE)+group('trouble','路上遇到了什么？',TROUBLE)+group('fix','最后怎么解决？',FIX)+group('style','画成什么样？',STY)+
    '<div class="navbtns"><button class="btn or" id="makeBook">看看绘本示例</button></div>';
  $$('#builder .opt').forEach(function(x){x.addEventListener('click',function(){S[x.dataset.k]=x.dataset.v;persist();$$('#builder .opt[data-k="'+x.dataset.k+'"]').forEach(function(y){y.classList.toggle('on',y===x)});if(x.dataset.k==='hero')$('#nameIn').placeholder=HERO[S.hero].def})});
  $('#nameIn').addEventListener('input',function(e){S.name=e.target.value.replace(/[<>]/g,'').trim().slice(0,6);persist()});
  $('#makeBook').addEventListener('click',function(){renderBook(true)});

  function renderBook(scroll){
    var ps=pages(),skill=buildSkill(),out=$('#bookOut');
    out.innerHTML='<div class="sec"><h2 class="h2">《'+esc(heroName())+'的'+esc(PLACE[S.place].tt)+'冒险》</h2><p class="note">故事根据你的选择拼成，图片是预设示例；要生成自己的图片，请将提示词复制到 AI 工具中。</p><div class="book">'+
      ps.map(function(p,i){return '<div class="bpage"><img src="img/'+p.img+'" alt="第 '+(i+1)+' 页插图（AI 生成示例）"><p><small>第 '+(i+1)+' 页</small>'+esc(p.text)+'</p></div>'}).join('')+'</div></div>'+
      '<div class="sec donehead"><span class="stamp"><span class="step"><i></i><i></i><i></i></span>故事示例</span><div class="workwrap" id="work"></div></div>'+
      '<div class="sec"><h2 class="h2">绘本助手</h2><p class="lead">复制它发给豆包，以后说一句「我们来做绘本」，它就按你们的主角和规则，一步一步带着做。</p><div class="prompt" style="max-height:260px;overflow:auto"><small>绘本助手 · SKILL.md</small>'+esc(skill)+'</div><div class="pact"><button class="btn or sm" id="cpSkill">复制全文</button><button class="btn ln sm" id="dlSkill">下载文件</button></div></div>';
    L.mountWorkCard($('#work'),{badge:'练习示例',kicker:'我和孩子的绘本练习',title:'《'+heroName()+'的'+PLACE[S.place].tt+'冒险》',sub:'故事由选择组合，图片为预设示例。'+ps[0].text,images:['img/'+ps[0].img,'img/'+ps[2].img,'img/'+ps[3].img],qrPath:'/static/learn/huiben.html?from=card',qrLabel:'扫码，和孩子做一本',tag:'孩子是作者'},T);
    $('#cpSkill').addEventListener('click',function(){L.copy(skill,'已复制，发给豆包就能用');L.track('skill_copy',{page:'learn',game:T})});
    $('#dlSkill').addEventListener('click',function(){L.download('绘本助手-SKILL.md',skill);L.track('skill_copy',{page:'learn',game:T,tier:'file'})});
    if(!L.getState(T).done){L.setState(T,{done:true});L.track('learn_done',{page:'learn',game:T,tier:'pro'})}
    if(scroll)out.scrollIntoView({block:'start',behavior:'smooth'});
  }
  if(/[?&]tab=practice/.test(location.search))tab('practice',false);
  L.track('learn_view',{page:'learn',game:T});
})();
