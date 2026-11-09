import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = new URL('../uni-app/src/static/learn/', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8');

test('learning pages load executable code from same-origin files', () => {
  for (const page of ['index.html', 'jijiu.html', 'kejian.html', 'huiben.html', 'find.html', 'guides.html', 'guide.html']) {
    const html = read(page);
    const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
    assert.ok(tags.length, `${page} loads scripts`);
    for (const [, attrs, body] of tags) {
      assert.equal(body.trim(), '', `${page} must not contain executable inline code`);
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      assert.ok(src && !/^(?:https?:)?\/\//i.test(src), `${page} has local script`);
      assert.ok(fs.existsSync(new URL(src, new URL(page, root))), `${page}: ${src} exists`);
    }
  }
});

test('interest input is classified locally and not sent in analytics', () => {
  const source = read('learn.js');
  const document = {};
  const window = { document };
  const navigator = { userAgent: '' };
  const location = { search: '' };
  const sessionStorage = { getItem: () => null };
  vm.runInNewContext(source, { window, navigator, location, sessionStorage, URLSearchParams });
  const L = window.Learn;
  const handlers = {}, events = [];
  const fields = {
    '#vote': { appendChild() {} },
    '#want': { addEventListener(type, handler) { handlers[type] = handler; } },
    '#wantIn': { value: '想做语文课件，私密示例内容' },
    '#wantRes': { innerHTML: '', textContent: '' },
    '#aidsPreview': { innerHTML: '' },
    '#addHomeTip': { textContent: '' },
  };
  L.chrome = () => {};
  L.getState = () => ({});
  L.setState = () => {};
  L.$ = (selector) => fields[selector];
  L.track = (event, props) => events.push({ event, props });
  const createElement = () => ({ addEventListener() {}, className: '', textContent: '', type: '' });
  vm.runInNewContext(read('index-page.js'), { window: { Learn: L, AINPE_AIDS: [] }, document: { createElement }, navigator });
  handlers.submit({ preventDefault() {} });
  const request = events.find((item) => item.event === 'want_submit');
  assert.ok(request);
  assert.equal(request.props.game, 'kejian');
  assert.doesNotMatch(JSON.stringify(events), /私密示例内容/);
  assert.equal(fields['#wantIn'].value, '');
});

test('lesson exercise clearly identifies preset media and does not promise notification', () => {
  assert.match(read('kejian.js'), /示例教案和插图，实际课件需在 AI 工具中制作/);
  assert.match(read('huiben.js'), /图片为预设示例/);
  assert.match(read('learn.js'), /opts\.badge\|\|'练习示例'/);
  assert.doesNotMatch(read('index-page.js'), /做好第一个告诉你/);
});

test('lesson progress uses the number of actual interactive stages', () => {
  const window = {};
  vm.runInNewContext(read('kejian-data.js'), {window});
  const count = window.AINPE_KEJIAN.LEVELS.length;
  assert.equal(count, 5);
  assert.match(read('kejian.html'), new RegExp(`${count} 关选择练习`));
  assert.match(read('index.html'), new RegExp(`先练一练 · ${count} 关`));
  assert.match(read('kejian.js'), /关 \/ '\+K\.LEVELS\.length/);
});

test('custom lesson does not inherit an unrelated preset subject', () => {
  const window = {};
  vm.runInNewContext(read('kejian-data.js'), {window});
  const app = window.AINPE_KEJIAN;
  const custom = app.buildSkill({lesson:'yuwen3',custom:'三年级数学 分数认识'});
  assert.match(custom, /当前课题：「三年级数学 分数认识」/);
  assert.doesNotMatch(custom, /三年级语文老师|西沙群岛/);
  assert.match(custom, /学科和学段/);
  assert.ok(Object.values(app.LESSONS).some((lesson) => /三年级数学/.test(lesson.label)));
  const preset = app.buildSkill({lesson:'yuwen3'});
  assert.match(preset, /三年级语文老师/);
  assert.match(preset, /富饶的西沙群岛/);
  const other = app.buildSkill({lesson:'yuwen3',custom:'初中物理 浮力'});
  assert.match(other, /当前课题：「初中物理 浮力」/);
  assert.doesNotMatch(other, /三年级语文老师|西沙群岛/);
});

test('find page does not put search text in the address', () => {
  const src = read('find-page.js');
  assert.match(src, /sessionStorage\.removeItem/);
  assert.doesNotMatch(src, /URLSearchParams\(location\.search\)\.get\('q'\)/);
});

test('use cards filter by life situations, operation and search together', () => {
  const window = {};
  vm.runInNewContext(read('aids-data.js'), { window });
  const AIDS = window.AINPE_AIDS;
  for (const a of AIDS) {
    assert.ok(Array.isArray(a.tags) && a.tags.length, `${a.id} has operation tags`);
    assert.ok(a.tags.every(tag => ['需粘贴原文', '需填写信息', '需表格工具'].includes(tag)));
  }
  assert.equal(AIDS.find(a => a.id === 'excel').tags.join(','), '需填写信息,需表格工具');
  assert.equal(AIDS.find(a => a.id === 'notice').tags.join(','), '需粘贴原文');
  const nodes = AIDS.map(a => ({ id:a.id, hidden:false, classList:{ contains:()=>false },
    hd:{ addEventListener(){} }, copy:{ addEventListener(){} } }));
  const box = {innerHTML:''};
  const categoryBar={children:[],appendChild(button){this.children.push(button)}};
  const bar={children:[],appendChild(button){this.children.push(button)}};
  const query={value:'',addEventListener(_type,fn){this.input=fn},focus(){this.focused=true}};
  const empty={hidden:true},count={textContent:''},summary={textContent:''},reset={addEventListener(_type,fn){this.click=fn}},tracked=[];
  const document = {createElement(type){
    return {dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(_type,fn){this.click=fn}};
  },getElementById(){return null}};
  const L = {chrome(){},aidIcon(){return ''},esc(value){return value},track(...args){tracked.push(args)},
    $(selector,node){if(selector==='#aids')return box;if(selector==='#library-categories')return categoryBar;if(selector==='#library-operations')return bar;if(selector==='#library-query')return query;if(selector==='#library-empty')return empty;if(selector==='#library-count')return count;if(selector==='#library-operation-summary')return summary;if(selector==='#library-reset')return reset;if(selector==='.hd')return node.hd;if(selector==='.js-copy')return node.copy},
    $$(selector,node){return node===box ? nodes : node ? node.children : nodes}};
  vm.runInNewContext(read('jijiu-page.js'), {window:{Learn:L,AINPE_AIDS:AIDS},document,location:{hash:''}});
  const visible = () => nodes.filter(n=>!n.hidden).map(n=>n.id).join(',');
  assert.equal(categoryBar.children.map(b=>b.textContent).join(','),'全部 10,生活 4,工作 5,学习 2,内容创作 1,AI入门 1');
  categoryBar.children[1].click();
  assert.equal(visible(), 'notice,reply,menu,trip');
  assert.equal(categoryBar.children[1].attrs['aria-pressed'],'true');
  assert.equal(count.textContent,'找到 4 个用法');
  bar.children[1].click();
  assert.equal(visible(), 'notice');
  assert.equal(summary.textContent,'操作方式：需粘贴原文');
  query.value='周末';query.input();
  assert.equal(visible(),'');
  assert.equal(empty.hidden,false);
  assert.equal(count.textContent,'找到 0 个用法');
  reset.click();
  assert.equal(visible(), AIDS.map(a=>a.id).join(','));
  assert.equal(query.value,'');assert.equal(query.focused,true);assert.equal(empty.hidden,true);
  assert.equal(summary.textContent,'更多筛选：按操作方式');
  bar.children[3].click();
  assert.equal(visible(), 'excel');
  bar.children[0].click();
  assert.equal(nodes.filter(n=>!n.hidden).length, AIDS.length);
  categoryBar.children[2].click();
  assert.equal(visible(), 'notice,reply,summary,meeting,excel');
  query.value='工作';query.input();
  assert.equal(visible(), 'notice,reply,summary,meeting,excel');
  reset.click();query.value='报销';query.input();
  assert.equal(visible(),'excel'); // 报销出现在静态提示词中，不在标题中。
  reset.click();query.value='做饭';query.input();
  assert.equal(visible(),'menu,learnai'); // 同时覆盖静态提示词与示例。
  assert.doesNotMatch(JSON.stringify(tracked),/报销|做饭/); // 搜索文本没有上传到统计。
});
