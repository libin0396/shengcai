import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../uni-app/src/static/tracking.js',import.meta.url),'utf8');
function setup(){
 const sent=[];const window={navigator:{sendBeacon:(url,data)=>{sent.push({url,data});return true}},crypto:{getRandomValues:a=>a.fill(1)},localStorage:{getItem:()=>null,setItem:()=>{}}};
 vm.runInNewContext(source,{window,Blob,Uint8Array,Date,Array});return {window,sent};
}
test('client sends only enumerated attribution fields for new events',async()=>{
 const {window,sent}=setup();assert.equal(window.AINPETrack.track('outbound_click',{from:'article',target:'join',url:'https://private.example',wechatId:'sensitive'}),true);
 assert.equal(sent.length,1);assert.equal(sent[0].url,'/api/track');const payload=JSON.parse(await sent[0].data.text());
 assert.equal(payload.target,'join');assert.equal(payload.from,'article');assert.equal('url' in payload,false);assert.equal('wechatId' in payload,false);
 assert.equal(window.AINPETrack.track('outbound_click',{from:'article',target:'https://private.example'}),false);
 assert.equal(window.AINPETrack.track('contact_copy',{from:'private'}),false);
 assert.equal(window.AINPETrack.track('contact_copy',{from:'camp',target:'join'}),true);
 const copy=JSON.parse(await sent[1].data.text());assert.equal(copy.event,'contact_copy');assert.equal('target' in copy,false);
 assert.equal(window.AINPETrack.track('contact_copy',{from:'header',wechatId:'sensitive'}),true);
 const headerCopy=JSON.parse(await sent[2].data.text());assert.equal(headerCopy.from,'header');assert.equal('wechatId' in headerCopy,false);
 assert.equal(window.AINPETrack.track('outbound_click',{from:'home',target:'camp'}),true);
 const homeCamp=JSON.parse(await sent[3].data.text());assert.equal(homeCamp.from,'home');assert.equal(homeCamp.target,'camp');
});
test('privacy signals suppress collection before generating a browser identifier',()=>{
 for(const field of ['doNotTrack','globalPrivacyControl']){
  const {window,sent}=setup();window.navigator[field]=field==='doNotTrack'?'1':true;
  assert.equal(window.AINPETrack.track('outbound_click',{from:'article',target:'camp'}),false);assert.equal(sent.length,0);
 }
});
