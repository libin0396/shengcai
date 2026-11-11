import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const base=new URL('../uni-app/src/',import.meta.url);
async function loadModule(path){const src=await readFile(new URL(path,base),'utf8');return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))}
const {miniAids}=await loadModule('data/mini-aids.js');
const {matchAids,matchGuides}=await loadModule('data/mini-search-data.js');
const guides=JSON.parse(await readFile(new URL('data/mini-guides.json',base),'utf8'));

test('mini program prompt cards match website data snapshot',async()=>{
  const website=await readFile(new URL('static/learn/aids-data.js',base),'utf8');
  const context={window:{}};vm.runInNewContext(website,context);
  assert.deepEqual(JSON.parse(JSON.stringify(miniAids)),JSON.parse(JSON.stringify(context.window.AINPE_AIDS)));
});
test('find matches specific tutorials before generic words and supports broad searches',()=>{
  assert.deepEqual(matchGuides('会议笔记',guides).map(g=>g.id),['meeting-notes']);
  assert.ok(matchGuides('笔记',guides).some(g=>g.id==='content-notes'));
  assert.ok(matchGuides('生图',guides).some(g=>g.id==='product-poster'));
  assert.ok(matchGuides('做课件',guides).some(g=>g.id==='kejian'));
  assert.ok(matchGuides('AI 短剧',guides).some(g=>g.id==='short-drama'));
  assert.deepEqual(matchGuides('修自行车轮胎',guides),[]);
});
test('find matches practical prompts without fabricating unrelated results',()=>{
  assert.ok(matchAids('辅导作业',miniAids).some(a=>a.id==='homework'));
  assert.ok(matchAids('会议笔记',miniAids).some(a=>a.id==='meeting'));
  assert.deepEqual(matchAids('修自行车轮胎',miniAids),[]);
});
