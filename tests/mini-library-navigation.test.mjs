import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {miniAids} from '../uni-app/src/data/mini-aids.js';
import {aidTopics,topics,normalized} from '../uni-app/src/data/mini-search-data.js';

// Run the actual WeChat branch of the pages with lifecycle and uni navigation
// replaced by a small simulator. This checks outcomes rather than CSS strings.
function pageScript(name, exposed) {
  const text=readFileSync(new URL(`../uni-app/src/pages/learn/${name}.vue`,import.meta.url),'utf8');
  const section=text.split('<script setup>')[1].split('// #ifdef MP-WEIXIN')[1].split('// #endif')[0];
  return section.replace(/^import .*;\s*$/gm,'')+'\n;globalThis.pageTest={'+exposed.join(',')+'};';
}
function setup(name, exposed, extra={}) {
  const hooks={}, calls=[];
  const uni={pageScrollTo:o=>calls.push(['scroll',o.selector]),navigateTo:o=>calls.push(['navigate',o]),redirectTo:o=>calls.push(['redirect',o.url])};
  const ctx={
    ref:value=>({value}), computed:fn=>({get value(){return fn()}}),
    onLoad:f=>hooks.load=f, onReady:f=>hooks.ready=f, onShow:f=>hooks.show=f,
    miniAids,aidTopics,topics,normalized,uni,...extra,
  };
  vm.runInNewContext(pageScript(name,exposed),ctx,{filename:name+'.vue'});
  return {page:ctx.pageTest,hooks,calls};
}

test('首次打开及回到快捷提示词时收起全部内容，定向入口保留定位',()=>{
  for(const id of ['', 'reply','homework','unknown']) {
    const {page,hooks,calls}=setup('library',['expanded','toggle']);
    hooks.load(id?{id}:{}); hooks.show(); hooks.ready();
    assert.equal(page.expanded.value,'',`entry ${id} must be collapsed`);
    const expected=miniAids.some(x=>x.id===id)?'#aid-'+id:undefined;
    assert.equal(calls.find(c=>c[0]==='scroll')?.[1],expected);
    page.toggle('notice'); assert.equal(page.expanded.value,'notice');
    hooks.show(); assert.equal(page.expanded.value,'','returning collapses open cards');
  }
});

test('快捷提示词的完整教程入口避开回跳条目，导航栈满时仍能打开',()=>{
  const {page,calls}=setup('library',['goGuides']);
  page.goGuides();
  assert.equal(calls[0][0],'navigate');
  assert.equal(calls[0][1].url,'/pages/learn/guides?complete=1');
  calls[0][1].fail(); assert.deepEqual(calls[1],['redirect','/pages/learn/guides?complete=1']);
  const guides=JSON.parse(readFileSync(new URL('../uni-app/src/data/mini-guides.json',import.meta.url),'utf8'));
  const list=setup('guides',['filtered','openGuide'],{guides});
  list.hooks.load({complete:'1'});
  assert.equal(list.page.filtered.value.length,guides.length);
  for(const guide of list.page.filtered.value) {
    assert.equal(guide.kind,'guide');
    list.page.openGuide(guide);
    assert.ok(list.calls.at(-1)[1].url.startsWith('/pages/learn/guide?id='));
  }
  const ordinary=setup('guides',['filtered','openGuide'],{guides}); ordinary.hooks.load({});
  assert.equal(ordinary.page.filtered.value.filter(x=>x.kind==='guide').length,guides.length);
  assert.ok(ordinary.page.filtered.value.some(x=>x.kind==='future'),'ordinary guide list can show upcoming tutorials');
  assert.ok(ordinary.page.filtered.value.every(x=>x.kind==='guide'||x.kind==='future'),'prompt cards do not appear among tutorials');
  for(const item of ordinary.page.filtered.value) {
    const previous=ordinary.calls.length;
    ordinary.page.openGuide(item);
    if(item.kind==='future') assert.equal(ordinary.calls.length,previous,'upcoming tutorial remains unavailable');
    else assert.ok(ordinary.calls.at(-1)[1].url.startsWith('/pages/learn/guide?id='),'tutorial opens its steps');
  }
});
