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

test('persona events send only the anonymous hidden flag and require a boolean',async()=>{
 const {window,sent}=setup();
 assert.equal(window.AINPETrack.track('persona_unlock',{hidden:true,played:true,game:'miniapp',tier:'tier-1',name:'private',trigger:'private'}),true);
 assert.equal(window.AINPETrack.track('poster_save',{hidden:false,played:true}),true);
 assert.equal(window.AINPETrack.track('poster_save',{hidden:'true'}),false);
 assert.equal(window.AINPETrack.track('persona_unlock',{}),false);
 assert.equal(sent.length,2);
 const unlock=JSON.parse(await sent[0].data.text()),save=JSON.parse(await sent[1].data.text());
 assert.equal(unlock.event,'persona_unlock');assert.equal(unlock.hidden,true);assert.equal(unlock.played,true);
 assert.deepEqual(Object.keys(unlock).sort(),['did','event','hidden','played','ts']);
 assert.equal(save.hidden,false);
});


test('persona poster landing emits the attributed site view without private fields',async()=>{
 const {window,sent}=setup();
 assert.equal(window.AINPETrack.track('site_view',{page:'pick',from:'persona_qr'}),true);
 const payload=JSON.parse(await sent[0].data.text());
 assert.equal(payload.event,'site_view');assert.equal(payload.page,'pick');assert.equal(payload.from,'persona_qr');
 assert.deepEqual(Object.keys(payload).sort(),['did','event','from','page','played','ts']);
});

function internalBrowser(href,store=new Map(),storageAvailable=true,approve=true){
 const sent=[],listeners={},prompts=[];let address=new URL(href);
 const localStorage={getItem:key=>{if(!storageAvailable)throw Error('blocked');return store.get(key)??null},setItem:(key,value)=>{if(!storageAvailable)throw Error('blocked');store.set(key,value)},removeItem:key=>{if(!storageAvailable)throw Error('blocked');store.delete(key)}};
 const window={navigator:{sendBeacon:(url,data)=>{sent.push({url,data});return true}},crypto:{getRandomValues:a=>a.fill(1)},localStorage,confirm:message=>{prompts.push(message);return approve},history:{state:{route:'preserved'},replaceState(state,title,url){assert.equal(state.route,'preserved');address=new URL(url,address)}},addEventListener:(event,fn)=>{listeners[event]=fn}};
 Object.defineProperty(window,'location',{get:()=>address});
 vm.runInNewContext(source,{window,Blob,Uint8Array,Date,Array,URL,URLSearchParams});
 return {window,sent,store,prompts,get address(){return address},navigateHash(hash){address.hash=hash;listeners.hashchange()}};
}

test('internal device is excluded across pages and its control does not leak into shared URLs',()=>{
 const b=internalBrowser('https://example.test/?keep=1&ainpe_internal=1#/pages/home?x=2');
 assert.equal(b.window.AINPETrack.isInternal(),true);
 assert.equal(b.window.AINPETrack.track('site_view',{page:'home'}),false);
 assert.equal(b.sent.length,0);assert.equal(b.address.search,'?keep=1');assert.equal(b.address.hash,'#/pages/home?x=2');
 const reload=internalBrowser('https://example.test/#/pages/events',b.store);
 assert.equal(reload.window.AINPETrack.isInternal(),true);
 assert.equal(reload.window.AINPETrack.track('site_view',{page:'events'}),false);
 const other=internalBrowser('https://example.test/#/pages/home');
 assert.equal(other.window.AINPETrack.isInternal(),false);
 assert.equal(other.window.AINPETrack.track('site_view',{page:'home'}),true);
});

test('internal device switch responds to SPA hash route changes and keeps other parameters',()=>{
 const b=internalBrowser('https://example.test/#/pages/home');
 b.navigateHash('#/pages/camp?from=article&ainpe_internal=1');
 assert.equal(b.window.AINPETrack.isInternal(),true);assert.equal(b.address.hash,'#/pages/camp?from=article');
 assert.equal(b.window.AINPETrack.track('camp_view',{}),false);
 b.navigateHash('#/pages/camp?from=article&ainpe_internal=0');
 assert.equal(b.window.AINPETrack.isInternal(),false);assert.equal(b.address.hash,'#/pages/camp?from=article');
 assert.equal(b.window.AINPETrack.track('camp_view',{}),true);
 b.window.navigator.doNotTrack='1';assert.equal(b.window.AINPETrack.track('camp_view',{}),false);
});

test('malformed and conflicting internal controls are ignored; storage failure keeps this page private',()=>{
 const conflict=internalBrowser('https://example.test/?ainpe_internal=1#/pages/home?ainpe_internal=0');
 assert.equal(conflict.window.AINPETrack.isInternal(),false);
 const invalid=internalBrowser('https://example.test/?ainpe_internal=yes#/');
 assert.equal(invalid.window.AINPETrack.isInternal(),false);
 const blocked=internalBrowser('https://example.test/?ainpe_internal=1#/',new Map(),false);
 assert.equal(blocked.window.AINPETrack.isInternal(),true);
 assert.equal(blocked.window.AINPETrack.track('site_view',{page:'home'}),false);
 blocked.navigateHash('#/pages/home?ainpe_internal=0');
 assert.equal(blocked.window.AINPETrack.isInternal(),false);
});

test('internal link requires local confirmation and removes the control even when declined',()=>{
 const declined=internalBrowser('https://example.test/?ainpe_internal=1#/pages/home?x=2',new Map(),true,false);
 assert.equal(declined.prompts.length,1);assert.equal(declined.window.AINPETrack.isInternal(),false);
 assert.equal(declined.address.search,'');assert.equal(declined.address.hash,'#/pages/home?x=2');
 assert.equal(declined.window.AINPETrack.track('site_view',{page:'home'}),true);
 const store=new Map([['ainpe:internal','1']]);
 const keep=internalBrowser('https://example.test/#/pages/camp?ainpe_internal=0',store,true,false);
 assert.equal(keep.prompts.length,1);assert.equal(keep.window.AINPETrack.isInternal(),true);
 assert.equal(keep.address.hash,'#/pages/camp');assert.equal(store.get('ainpe:internal'),'1');
 assert.equal(keep.window.AINPETrack.track('camp_view',{}),false);
});

test('a missing confirmation API cannot silently opt the browser out',()=>{
 const store=new Map(),sent=[];let address=new URL('https://example.test/?ainpe_internal=1#/');
 const window={navigator:{sendBeacon:()=>{sent.push(1);return true}},crypto:{getRandomValues:a=>a.fill(1)},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},history:{state:null,replaceState(s,t,u){address=new URL(u,address)}}};
 Object.defineProperty(window,'location',{get:()=>address});
 vm.runInNewContext(source,{window,Blob,Uint8Array,Date,Array,URL,URLSearchParams});
 assert.equal(window.AINPETrack.isInternal(),false);assert.equal(address.search,'');
 assert.equal(window.AINPETrack.track('site_view',{page:'home'}),true);assert.equal(sent.length,1);
});
