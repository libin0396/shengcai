import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../uni-app/src/static/learn/find-feedback.js',import.meta.url),'utf8');
function setup(outcome={ok:true}){
  const events=[],submissions=[],sections=[];
  const select={value:'',disabled:false},status={textContent:''};
  const button={disabled:false,textContent:'',addEventListener(type,callback){if(type==='click')this.click=callback}};
  const document={createElement(){const el={className:'',innerHTML:'',querySelector(q){return q==='select'?select:q==='button'?button:status}};sections.push(el);return el}};
  const window={document,AINPETrack:{track(event,options){events.push({event,...options})},async submitFindFeedback(category){submissions.push(category);return outcome}}};
  vm.runInNewContext(source,{window});
  return {window,events,submissions,sections,select,button,status,container:{appendChild(){}}};
}
test('records a bounded search outcome and offers feedback for misses and related-only results',()=>{
 const a=setup();a.window.AINPEFindFeedback.onSearch(true,a.container,false);assert.equal(a.events[0].tier,'hit');assert.equal(a.sections.length,0);
 a.window.AINPEFindFeedback.onSearch(true,a.container,true);assert.equal(a.events[1].tier,'related');assert.equal(a.sections.length,1);
 a.window.AINPEFindFeedback.onSearch(false,a.container,false);assert.equal(a.events[2].tier,'miss');assert.equal(a.sections.length,2);
 for(const event of a.events)assert.deepEqual(Object.keys(event).sort(),['event','game','page','tier']);
});
test('requires a category and only confirms after successful submission',async()=>{
 const a=setup();a.window.AINPEFindFeedback.onSearch(false,a.container,false);
 await a.button.click();assert.equal(a.submissions.length,0);assert.match(a.status.textContent,/请选择/);
 a.select.value='drama';await a.button.click();assert.deepEqual(a.submissions,['drama']);assert.match(a.status.textContent,/已收到/);assert.equal(a.select.disabled,true);
});
test('unavailable content can collect voluntary feedback without counting an incomplete search',async()=>{
 const a=setup();a.window.AINPEFindFeedback.onSearch(false,a.container,true,true);
 assert.equal(a.events.length,0);assert.equal(a.sections.length,1);
 a.select.value='drama';await a.button.click();assert.deepEqual(a.submissions,['drama']);assert.match(a.status.textContent,/已收到/);
});
test('failed or privacy-disabled submission never claims it was received',async()=>{
 for(const outcome of [{ok:false,reason:'disabled'},{ok:false,reason:'unavailable'}]){
  const a=setup(outcome);a.window.AINPEFindFeedback.onSearch(false,a.container,false);a.select.value='other';await a.button.click();
  assert.doesNotMatch(a.status.textContent,/已收到/);assert.equal(a.button.disabled,false);
 }
});
