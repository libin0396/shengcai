import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const script=await readFile('uni-app/src/static/learn/guide-page.js','utf8');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid={verified:true,src:'media/example/step-1.png',alt:'原始资料',caption:'第一步的实际输出',kind:'AI生成产出',source:'本站实际生成'};
function render(media,stepMedia,evidence){
  const app={innerHTML:'',querySelector(selector){return selector==='.guide-detail-hero'?{appendChild(){}}:{textContent:''}}};
  const progress={textContent:''};
  const L={$:selector=>selector==='#guide-app'?app:progress,$$:()=>[],chrome(){},esc:escape,copy(){}};
  const location={search:'?id=example',href:'http://127.0.0.1:4188/static/learn/guide.html?id=example',origin:'http://127.0.0.1:4188'};
  const guide={id:'example',title:'示例教程',category:'示例',intro:'说明',outcome:'成果',needs:'准备',media,evidence,steps:[{title:'第一步',action:'操作',check:'检查',media:stepMedia}]};
  const window={Learn:L,location,AINPE_GUIDES:[guide]};
  const document={title:'',createElement(){return {className:'',textContent:''}}};
  vm.runInNewContext(script,{window,document,URL,URLSearchParams,localStorage:{getItem(){return '{}'},setItem(){}}});
  return {html:app.innerHTML,progress:progress.textContent};
}
test('教程没有图片时依然显示步骤和进度，不出现空图片区域',()=>{
  const {html,progress}=render();
  assert.match(html,/第一步/);assert.doesNotMatch(html,/guide-media-open/);assert.equal(progress,'你的进度 0 / 1 步 · 仅当前设备');
});
test('经过核对且有来源的步骤图片显示类型、描述和来源',()=>{
  const {html}=render(undefined,[valid]);
  assert.match(html,/\/static\/learn\/media\/example\/step-1\.png/);
  assert.match(html,/AI生成产出/);assert.match(html,/第一步的实际输出/);assert.match(html,/本站实际生成/);assert.match(html,/查看大图/);
});
test('没有核对、来源或类型的素材不会展示为实操成果',()=>{
  const {html}=render([{...valid,verified:false},{...valid,source:''},{...valid,kind:'真实用户成果'},{...valid,alt:''}]);
  assert.doesNotMatch(html,/guide-media-open/);
});
test('只允许站内教程图片并安全显示文字',()=>{
  const html=render([{...valid,src:'https://elsewhere.example/a.png'},{...valid,src:'img/../../../secret.png'},{...valid,caption:'<script>alert(1)</script>'}]).html;
  assert.equal((html.match(/class="guide-media-open"/g)||[]).length,1);
  assert.doesNotMatch(html,/<script>alert/);assert.match(html,/&lt;script&gt;/);
});
test('试做摘要只在记录信息完整且经核对时显示，文字不会被当作 HTML',()=>{
  const evidence={verified:true,title:'一次试做',tool:'Kimi · 虚构示例',input:'示例资料',process:'处理过程',result:'<script>结果</script>',limits:'仅为草稿'};
  const html=render(undefined,undefined,evidence).html;
  assert.match(html,/Kimi · 虚构示例/);assert.match(html,/处理过程/);assert.match(html,/&lt;script&gt;结果&lt;\/script&gt;/);assert.match(html,/仅为草稿/);
  assert.doesNotMatch(render(undefined,undefined,{...evidence,limits:''}).html,/guide-evidence/);
  assert.doesNotMatch(render(undefined,undefined,{...evidence,verified:false}).html,/guide-evidence/);
});
test('三篇文字教程保留实操工具、虚构素材与结果边界；短剧参考图是第三步的局部成果',async()=>{
  const content=await readFile('uni-app/src/static/learn/guides-data.js','utf8');
  const ctx={window:{}};vm.runInNewContext(content,ctx);
  for(const id of ['meeting-notes','video-script','content-notes']){
    const e=ctx.window.AINPE_GUIDES.find(g=>g.id===id).evidence;
    assert.equal(e.verified,true);assert.match(e.tool,/Kimi/);assert.match(e.tool,/虚构/);assert.match(e.limits,/未保存操作截图/);
  }
  const image=ctx.window.AINPE_GUIDES.find(g=>g.id==='short-drama').steps[2].media[0];
  assert.equal(image.kind,'AI生成产出');assert.match(image.caption,/不代表短剧已完成/);
  assert.ok((await readFile('uni-app/src/static/learn/'+image.src)).length>0);
});
test('商品图演示保留虚构 AI 底图和未导出说明，不展示未整理的排版截图',async()=>{
  const content=await readFile('uni-app/src/static/learn/guides-data.js','utf8');
  const ctx={window:{}};vm.runInNewContext(content,ctx);
  const guide=ctx.window.AINPE_GUIDES.find(g=>g.id==='product-poster');
  assert.match(guide.evidence.limits,/虚构|真实商品/);assert.match(guide.evidence.limits,/尚未.*导出/);
  const image=guide.steps[1].media[0];
  assert.equal(image.kind,'AI生成产出');assert.match(image.caption,/虚构/);assert.match(image.caption,/无法核验/);
  assert.equal(guide.steps[2].media,undefined);
  assert.ok((await readFile('uni-app/src/static/learn/'+image.src)).length>0);
});
test('绘本专题可看到真实生成的单张四格图，并明确排版和未成册的边界',async()=>{
  const html=await readFile('uni-app/src/static/learn/huiben.html','utf8');
  assert.match(html,/内置 AI 图像生成工具一次生成一张四格插画/);
  assert.match(html,/四格来自同一张图，尚未导出或装订成册/);
  assert.equal((html.match(/class="book-example-scene (?:one|two|three|four)"/g)||[]).length,4);
  assert.match(html,/<details class="book-example-details">/);
  assert.ok((await readFile('uni-app/src/static/learn/media/picturebook/fox-story-grid.png')).length>0);
});
test('课件专题展示三页真实预览及可下载文件，并如实标明未验证的 WPS 环节',async()=>{
  const html=await readFile('uni-app/src/static/learn/kejian.html','utf8');
  assert.match(html,/Kimi K3\.1 Pro/);assert.match(html,/内置 AI 图像生成工具/);assert.match(html,/本地演示文稿工具/);
  assert.match(html,/尚未在 WPS 或 PowerPoint 中打开/);assert.match(html,/没有验证 WPS 导出/);
  for(const n of [1,2,3]){
    const name='media/lesson/slide-'+n+'.png';assert.ok(html.includes(name));
    assert.ok((await readFile('uni-app/src/static/learn/'+name)).length>0);
  }
  const name='media/lesson/rain-lesson-example.pptx';assert.ok(html.includes(name));
  const pptx=await readFile('uni-app/src/static/learn/'+name);assert.equal(pptx.subarray(0,2).toString(),'PK');
});
