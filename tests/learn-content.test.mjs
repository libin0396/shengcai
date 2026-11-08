import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = new URL('../uni-app/src/static/learn/', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8');

test('learning pages load executable code from same-origin files', () => {
  for (const page of ['index.html', 'jijiu.html', 'kejian.html', 'huiben.html']) {
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
  assert.match(read('kejian.html'), new RegExp(`${count} 关整理助手`));
  assert.match(read('index.html'), new RegExp(`进阶 ${count} 关`));
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
