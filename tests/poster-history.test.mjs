import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../uni-app/src/static/simulation-games/poster-history.js',import.meta.url),'utf8');

function fakeDatabase(){
  const rows=new Map();
  const db={objectStoreNames:{contains:()=>true},close(){},transaction(){
    const tx={};
    tx.objectStore=()=>({
      openCursor(){
        const req={};const entries=[...rows.values()];let pos=0;
        function advance(){queueMicrotask(()=>{req.result=pos<entries.length?{value:entries[pos++],continue:advance}:null;req.onsuccess?.();if(!req.result)queueMicrotask(()=>tx.oncomplete?.())})}
        advance();return req;
      },
      delete(id){rows.delete(id)},
      put(value){rows.set(value.id,value)},
      get(id){const req={};queueMicrotask(()=>{req.result=rows.get(id);req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return req}
    });return tx;
  }};
  return {rows,indexedDB:{open(){const req={};queueMicrotask(()=>{req.result=db;req.onsuccess?.()});return req}}};
}
function setup(indexedDB){const window={indexedDB,atob:value=>Buffer.from(value,'base64').toString('binary')};vm.runInNewContext(source,{window,Blob,Uint8Array,Promise,Date});return window.AINPEPosterHistory}

test('missing or denied IndexedDB degrades safely without breaking the game',async()=>{
  const noDb=setup(undefined), denied=setup({open(){throw Error('denied')}}), blob=new Blob(['jpeg'],{type:'image/jpeg'});
  assert.equal(await noDb.save('record_1',blob),false);assert.equal(await noDb.get('record_1'),null);
  assert.equal(await denied.save('record_1',blob),false);assert.equal(await denied.get('record_1'),null);
});

test('stores only bounded JPEG blobs and evicts oldest cached images without changing history',async()=>{
  const fake=fakeDatabase(), api=setup(fake.indexedDB), history=['kept'];
  const blob=new Blob([new Uint8Array(700*1024)],{type:'image/jpeg'});
  assert.equal(await api.save('../unsafe',blob),false);
  assert.equal(await api.save('bad',new Blob(['x'],{type:'text/plain'})),false);
  assert.equal(await api.save('large',new Blob([new Uint8Array(2*1024*1024+1)],{type:'image/jpeg'})),false);
  for(let i=0;i<21;i++)assert.equal(await api.save(`record_${i}`,blob),true);
  assert.ok(fake.rows.size<=20);assert.ok([...fake.rows.values()].reduce((n,row)=>n+row.size,0)<=12*1024*1024);
  assert.equal(await api.get('record_0'),null);assert.equal((await api.get('record_20')).size,blob.size);assert.deepEqual(history,['kept']);
});

test('accepts generated JPEG data and handles missing cache entries',async()=>{
  const api=setup(fakeDatabase().indexedDB);
  assert.equal(await api.save('generated','data:image/jpeg;base64,anBlZw=='),true);
  assert.equal(await (await api.get('generated')).text(),'jpeg');assert.equal(await api.get('missing'),null);
  assert.equal(await api.save('wrong','data:image/png;base64,eA=='),false);
});

// Exercise the actual asynchronous renderer coordinator without rendering a canvas.
// The callbacks are resolved out of order, as they can be on a slow phone.
async function resultRenderer(){
  const script=await readFile(new URL('../uni-app/src/static/simulation-games/share-poster.js',import.meta.url),'utf8');
  const start=script.indexOf(' var paintVersion=0,defaultHistoryKind=kind,historySaveStarted=false;function update()');
  const end=script.indexOf("\n block.querySelectorAll('[data-view]')",start);
  assert.ok(start>=0 && end>start,'result renderer coordinator is present');
  const callbacks=[],saved=[],button={disabled:false},preview={},large={},message={};
  const context={kind:'versus',d:{recordId:'record_1'},preview,large,message,Promise,
    block:{querySelector:()=>button,querySelectorAll:()=>[]},
    window:{AINPEPosterHistory:{save(id,image){saved.push({id,image});return Promise.resolve(true)}}},
    paint(_data,kind,callback){callbacks.push({kind,callback})}};
  vm.runInNewContext(script.slice(start,end),context);
  return {context,callbacks,saved,button,preview,large,message};
}

test('switching challenge poster before the first image finishes still caches the original without replacing the selected preview',async()=>{
  const h=await resultRenderer();
  h.context.update();
  h.context.kind='persona';h.context.update();
  assert.deepEqual(h.callbacks.map(item=>item.kind),['versus','persona']);
  h.callbacks[1].callback('persona-image',true);
  assert.equal(h.preview.src,'persona-image');assert.equal(h.large.src,'persona-image');assert.equal(h.saved.length,0);
  h.callbacks[0].callback('versus-image',true);
  assert.equal(h.preview.src,'persona-image');assert.equal(h.large.src,'persona-image');
  assert.deepEqual(h.saved,[{id:'record_1',image:'versus-image'}]);assert.equal(h.button.disabled,false);
});

test('a failed initial challenge image can be cached when the default view is retried',async()=>{
  const h=await resultRenderer();
  h.context.update();h.context.kind='persona';h.context.update();
  h.callbacks[0].callback(null,false);h.callbacks[1].callback('persona-image',true);
  assert.equal(h.saved.length,0);
  h.context.kind='versus';h.context.update();h.callbacks[2].callback('versus-retry',true);
  assert.deepEqual(h.saved,[{id:'record_1',image:'versus-retry'}]);assert.equal(h.preview.src,'versus-retry');
});
