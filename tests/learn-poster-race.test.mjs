import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

function setup() {
  const source = readFileSync(new URL('../uni-app/src/static/learn/learn.js', import.meta.url), 'utf8')
    .replace('function workCard(opts){', 'function originalWorkCard(opts){')
    .replace('function mountWorkCard(box,opts,topic){', 'function workCard(opts){return root.__mockWorkCard(opts)}\n  function mountWorkCard(box,opts,topic){');
  const jobs = [], downloads = [], events = [];
  const img = {innerHTML:'', textContent:''};
  const save = {disabled:false, addEventListener(type, fn){this[type] = fn}};
  const buttons = ['wx', 'xhs'].map(v => ({
    dataset:{v}, classList:{toggle(){}}, setAttribute(){},
    addEventListener(type, fn){this[type] = fn},
  }));
  const box = {
    innerHTML:'',
    querySelector(selector){return selector === '.workimg' ? img : selector === '.js-save' ? save : null},
    querySelectorAll(selector){return selector === '.seg button' ? buttons : []},
  };
  const document = {
    body:{appendChild(){}},
    createElement(tag) {
      assert.equal(tag, 'a');
      return {click(){downloads.push({href:this.href, name:this.download})}, remove(){}};
    },
  };
  const window = {
    document,
    __mockWorkCard(options){const item = deferred();jobs.push({...item, withQr:options.withQr});return item.promise},
    AINPETrack:{track(...args){events.push(args)}},
  };
  vm.runInNewContext(source, {
    window, navigator:{userAgent:''}, location:{search:''}, sessionStorage:{getItem(){return null}},
    URLSearchParams, setTimeout, clearTimeout,
  });
  window.Learn.mountWorkCard(box, {title:'课件示例'}, 'kejian');
  return {jobs, downloads, events, img, save, buttons};
}

test('late WeChat render cannot replace the selected QR-free Xiaohongshu poster', async () => {
  const s = setup();
  assert.equal(s.jobs[0].withQr, true);
  assert.equal(s.save.disabled, true);
  s.buttons[1].click();
  assert.equal(s.jobs[1].withQr, false);
  s.save.click();
  assert.equal(s.downloads.length, 0);
  s.jobs[1].resolve('data:image/jpeg;base64,XHS');
  await new Promise(setImmediate);
  assert.match(s.img.innerHTML, /XHS/);
  assert.equal(s.save.disabled, false);
  s.jobs[0].resolve('data:image/jpeg;base64,WECHAT');
  await new Promise(setImmediate);
  assert.match(s.img.innerHTML, /XHS/);
  assert.doesNotMatch(s.img.innerHTML, /WECHAT/);
  s.save.click();
  assert.equal(s.downloads[0].href, 'data:image/jpeg;base64,XHS');
  assert.match(s.downloads[0].name, /小红书/);
  assert.equal(s.events[0][1].tier, 'xhs');
});

test('failed current render cannot save an earlier version and can be retried', async () => {
  const s = setup();
  s.jobs[0].resolve('data:image/jpeg;base64,WECHAT');
  await new Promise(setImmediate);
  s.buttons[1].click();
  assert.equal(s.save.disabled, true);
  s.save.click();
  assert.equal(s.downloads.length, 0);
  s.jobs[1].reject(new Error('image load failed'));
  await new Promise(setImmediate);
  assert.match(s.img.textContent, /生成失败/);
  assert.equal(s.save.disabled, true);
  s.buttons[1].click();
  s.jobs[2].resolve('data:image/jpeg;base64,XHS');
  await new Promise(setImmediate);
  assert.equal(s.save.disabled, false);
  assert.match(s.img.innerHTML, /XHS/);
});
