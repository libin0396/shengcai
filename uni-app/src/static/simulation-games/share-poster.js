(function(){
  'use strict';
  var combos=[
    [['拖延','完美主义'],'明天再改三版'],[['拖延','工具囤积'],'万事俱备只欠开工'],[['夜间高效','拖延'],'凌晨两点觉醒者'],[['先算账','爱记数据'],'人形 Excel'],[['敢问用户','会聊客户'],'社牛读心术'],[['标题敏感','会做封面'],'点击率制造机']
  ];
  var solo={'夜间高效':'午夜卷王','会提需求':'AI 嘴替','爱记数据':'Excel 判官','敢问用户':'社牛调研员','审核顺利':'过审锦鲤','标题敏感':'标题党本党','先算账':'人形计算器','会聊客户':'甲方翻译官','审美在线':'像素挑刺王','眼尖':'错别字终结者','懂版权':'版权警长','会做封面':'封面颜值担当','混副业群':'群聊潜水艇','亲友测试团':'家族群 CEO','有生意朋友':'人脉宝藏','拖延':'Deadline 战神','工具囤积':'工具仓鼠','完美主义':'改稿永动机'};
  function persona(talents){for(var i=0;i<combos.length;i++)if(combos[i][0].every(function(x){return talents.indexOf(x)>=0}))return combos[i][1];return solo[talents[0]]||'实践探索者'}
  function wrap(ctx,text,max){var result=[],line='';Array.from(String(text||'')).forEach(function(c){if(ctx.measureText(line+c).width>max&&line){result.push(line);line=c}else line+=c});if(line)result.push(line);return result}
  function money(n){return (n<0?'-¥':'¥')+Math.abs(Math.round(n||0)).toLocaleString('zh-CN')}
  function draw(data,kind){var canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;var c=canvas.getContext('2d');var w=1080,h=1440;
    c.fillStyle='#f7f2e8';c.fillRect(0,0,w,h);c.fillStyle='#0b3828';c.fillRect(0,0,w,240);c.fillStyle='#ffce60';c.fillRect(64,64,14,70);
    c.fillStyle='#dfedda';c.font='600 27px sans-serif';c.fillText('AINPE · AI 项目模拟',102,95);c.fillStyle='#ffffff';c.font='bold 52px sans-serif';c.fillText(kind==='persona'?'我的实战人格':'来挑战我的这一局',102,165);
    c.fillStyle='#e5eee1';c.fillRect(64,278,952,260);c.fillStyle='#23704d';c.font='600 26px sans-serif';c.fillText(kind==='persona'?(data.talents.length?'本站趣味设定 · 由本局天赋组合':'本站趣味设定 · 项目体验'):'模拟挑战 · 和我试试同一项目',98,330);
    c.fillStyle='#173b29';c.font='bold 64px sans-serif';wrap(c,kind==='persona'?persona(data.talents):data.result,880).slice(0,2).forEach(function(x,i){c.fillText(x,98,410+i*72)});
    c.fillStyle='#697c6c';c.font='27px sans-serif';c.fillText(data.project+' · '+(data.days==null?'项目模拟':data.days+' 天模拟'),98,476);c.font='24px sans-serif';c.fillText('本局结果：'+data.result,98,515);
    c.fillStyle='#173b29';c.font='bold 34px sans-serif';c.fillText('模拟收益',66,620);c.fillStyle='#e75825';c.font='bold 76px sans-serif';c.fillText(money(data.amount),66,713);
    c.fillStyle='#708270';c.font='25px sans-serif';c.fillText('游戏数值，仅供体验',66,756);
    var y=830;c.fillStyle='#173b29';c.font='bold 34px sans-serif';c.fillText(kind==='persona'?'这一局的天赋与改进':'挑战信息',66,y);y+=60;
    c.font='27px sans-serif';c.fillStyle='#425c4a';var lines=kind==='persona'?[data.talents.length?'天赋：'+data.talents.join('、'):'本局未设置天赋'].concat(data.issues.length?data.issues.slice(0,3):['本局没有记录到待改进事项']):['结果：'+data.result+(data.grades?'（等级：'+data.grades[data.gradeIndex]+'）':''),'随机种子：'+(data.seed==null?'本项目无随机种子':'#'+data.seed),'已完成：'+(data.completed||'项目模拟'),'本局踩坑：'+(data.pitCount||0)+' 项（模拟）'];
    lines.forEach(function(line){wrap(c,line,920).slice(0,2).forEach(function(l){if(y<1195){c.fillText(l,70,y);y+=39}});y+=14});
    if(kind==='challenge'&&data.grades&&data.grades.length===6){var chipY=Math.max(y+5,1060);data.grades.forEach(function(g,i){var x=66+(i%3)*316, yy=chipY+Math.floor(i/3)*54;c.fillStyle=i===data.gradeIndex?'#f3c95f':'#e9eee5';c.fillRect(x,yy,300,43);c.fillStyle='#244d35';c.font='bold 20px sans-serif';c.fillText(String(g).slice(0,12),x+10,yy+28)})}
    c.fillStyle='#0e3a28';c.fillRect(0,1250,w,190);c.fillStyle='#fff';c.font='bold 29px sans-serif';c.fillText('想试一次？打开 AINPE 模拟项目',64,1300);c.fillStyle='#e3d58a';c.font='25px sans-serif';c.fillText(data.seed==null?'到 AINPE 找到同名项目，开始体验':'挑战码：#'+data.seed+' · 在同一项目首页输入',64,1344);c.fillStyle='#c4ddca';c.font='25px sans-serif';c.fillText('模拟结果，不是收入预测；人格为本站趣味设定。',64,1388);
    return canvas.toDataURL('image/png')
  }
  function mount(data){var host=data.host;if(!host)return;data.talents=data.talents||[];data.issues=data.issues||[];var block=document.createElement('section');block.className='ainpe-share';block.innerHTML='<div class="ainpe-share-head"><strong>分享你的项目体验</strong><span>本站趣味人格 · 不代表真实收入</span></div><div class="ainpe-share-tabs"><button type="button" data-view="persona">人格卡</button><button type="button" data-view="challenge">挑战卡</button></div><img class="ainpe-share-preview" alt="模拟项目分享海报"><div class="ainpe-share-actions"><button type="button" data-action="save">保存海报</button><button type="button" data-action="copy">复制挑战链接</button></div><p class="ainpe-share-help">同一随机种子下，条件和决策也一致时结果才相同；模拟结果不是收入预测。</p><textarea class="ainpe-share-copy" readonly aria-label="挑战链接" hidden></textarea><p class="ainpe-share-message" role="status"></p>';host.insertBefore(block,host.children[1]||null);
    var kind='persona',preview=block.querySelector('.ainpe-share-preview'),url=new URL(data.url,location.href);if(data.seed!=null)url.searchParams.set('seed',String(data.seed));var link=url.href;
    function update(){preview.src=draw(data,kind);block.querySelectorAll('[data-view]').forEach(function(x){x.classList.toggle('active',x.dataset.view===kind)})}update();
    block.querySelectorAll('[data-view]').forEach(function(b){b.addEventListener('click',function(){kind=b.dataset.view;update()})});
    block.querySelector('[data-action="save"]').addEventListener('click',function(){var a=document.createElement('a');a.href=preview.src;a.download='AINPE-'+(kind==='persona'?'实战人格':'项目挑战')+'.png';a.click();block.querySelector('.ainpe-share-message').textContent='如未自动保存，可长按海报保存图片。'});
    block.querySelector('[data-action="copy"]').addEventListener('click',function(){var text='我在 AINPE 完成了「'+data.project+'」模拟体验，来试试同一项目：'+link+'（游戏模拟，不是收入预测）';var msg=block.querySelector('.ainpe-share-message'),field=block.querySelector('.ainpe-share-copy');function fallback(){field.hidden=false;field.value=text;field.focus();field.select();msg.textContent='请手动复制上方挑战内容。'}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(function(){msg.textContent='挑战链接已复制。'},fallback);else fallback()});
    if(data.seed==null)block.querySelector('.ainpe-share-help').textContent='打开链接可体验同一项目，结果由各自选择决定；模拟结果不是收入预测。';
  }
  window.AINPEShare={mount:mount};
})();
