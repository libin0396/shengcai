import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
const base=path.resolve('uni-app/src/static/learn');
const read=(p)=>readFileSync(path.join(base,p),'utf8');
const manifest=JSON.parse(read('guide-covers.json'));
const ids=['short-drama','video-script','product-poster','meeting-notes','content-notes','kejian','huiben'];
test('seven stable IDs use valid, unique covers and bind to the current example',()=>{
 assert.deepEqual(Object.keys(manifest).sort(),ids.slice().sort());
 assert.equal(new Set(Object.values(manifest).map(x=>x.src)).size,7);
 for(const id of ids){const c=manifest[id];assert.equal(c.src,`/static/learn/media/covers/${id}.jpg`);assert.ok(c.alt&&c.label);const cover=path.join(base,c.src.replace('/static/learn/',''));assert.ok(statSync(cover).size>5000);const hash=createHash('sha256').update(readFileSync(path.join(base,c.source.path))).digest('hex');assert.equal(hash,c.source.sha256,`${id}: 教程示例或素材已变，请重新核对封面`)}
 for(const id of ['video-script','meeting-notes','content-notes'])assert.equal(manifest[id].label,'AI 生成示意图');
 assert.equal(manifest['short-drama'].label,'AI 角色参考图');
});
test('home, list and detail all resolve the same manifest and retain search',()=>{
 const vue=readFileSync('uni-app/src/pages/discover/index.vue','utf8');assert.match(vue,/import tutorialCovers from.*guide-covers\.json/);assert.match(vue,/找用法/);for(const id of ids)assert.ok(vue.includes(`id:'${id}'`),id);
 for(const name of ['index.html','guides.html','guide.html','kejian.html','huiben.html'])assert.match(read(name),/guide-covers\.js/,name);
 assert.match(read('guides-page.js'),/data-guide-cover/);assert.match(read('guide-page.js'),/data-guide-cover/);assert.match(read('kejian.html'),/data-guide-cover="kejian"/);assert.match(read('huiben.html'),/data-guide-cover="huiben"/);
});
test('loader fills correct images and gracefully hides failed or unknown covers',async()=>{
 function wrapper(id){const image={listeners:{},addEventListener(n,fn){this.listeners[n]=fn}};const label={};return {id,image,label,hidden:true,getAttribute(){return this.id},hasAttribute(){return false},querySelector(sel){return sel==='img'?this.image:this.label}}}
 const items=ids.map(wrapper),missing=wrapper('missing');let ready;const root={fetch:async()=>({ok:true,json:async()=>manifest}),document:{readyState:'loading',addEventListener(n,cb){ready=cb}}};vm.runInNewContext(read('guide-covers.js'),{window:root,Promise});await root.LearnCovers.apply({querySelectorAll(){return [...items,missing]}});
 for(const el of items){assert.equal(el.image.src,manifest[el.id].src);assert.equal(el.image.alt,manifest[el.id].alt);assert.equal(el.label.textContent,manifest[el.id].label);assert.equal(el.hidden,false);assert.equal(el.image.loading,'lazy')}
 assert.equal(missing.hidden,true);items[0].image.listeners.error();assert.equal(items[0].hidden,true);assert.equal(typeof ready,'function');
});
