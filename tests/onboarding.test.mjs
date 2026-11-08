import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../uni-app/src/static/learn/onboarding.js',import.meta.url),'utf8');

function setup({storageBlocked=false,staticPage=false,useLearn=false}={}){
  const saved=new Map(),events=[],listeners={},nodes=[];
  let document;
  function element(){
    return {style:{},className:'',textContent:'',innerHTML:'',handlers:{},
      addEventListener(type,fn){this.handlers[type]=fn},
      focus(){document.activeElement=this},
      remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1)},
      click(){this.handlers.click?.({target:this})}};
  }
  document={activeElement:element(),body:{style:{overflow:'auto'},appendChild(e){nodes.push(e)}},
    head:{appendChild(e){this.styleNode=e}},
    getElementById(id){return id==='ob-css'?this.head.styleNode:id==='obReplay'&&staticPage?{}:null},
    addEventListener(type,fn){listeners[type]=fn},removeEventListener(type){delete listeners[type]},
    createElement(tag){
      const e=element();if(tag==='div'){
        const children=Object.fromEntries(['.ob-art','#ob-title','p','.ob-prev','.ob-next','.ob-skip'].map(k=>[k,element()]));
        const dots=[element(),element(),element()];
        e.querySelector=selector=>children[selector];e.querySelectorAll=selector=>selector==='.ob-dots i'?dots:[];e.children=children;
      }return e;
    }};
  const tracker={track(...args){events.push(args)}};
  const window={document,location:{search:'',href:''},localStorage:{getItem(k){if(storageBlocked)throw Error('blocked');return saved.get(k)||null},setItem(k,v){if(storageBlocked)throw Error('blocked');saved.set(k,v)}},
    AINPETrack:tracker};if(useLearn)window.Learn=tracker;
  vm.runInNewContext(source,{window});
  return {window,document,saved,events,listeners,nodes,mask:()=>nodes[0]};
}

test('first visit progresses through three steps and tracks homepage fallback',()=>{
  const s=setup();assert.equal(s.nodes.length,0);s.window.AINPEOnboard.auto();assert.equal(s.nodes.length,1);
  const m=s.mask();assert.equal(m.children['#ob-title'].textContent,'挑一件想做的事');
  s.window.AINPEOnboard.open();assert.equal(s.nodes.length,1);
  m.children['.ob-next'].click();assert.equal(m.children['#ob-title'].textContent,'跟着做');
  m.children['.ob-prev'].click();assert.equal(m.children['#ob-title'].textContent,'挑一件想做的事');
  m.children['.ob-next'].click();m.children['.ob-next'].click();assert.equal(m.children['#ob-title'].textContent,'带走两样东西');
  m.children['.ob-next'].click();assert.equal(s.nodes.length,0);assert.match(s.window.location.href,/\/static\/learn\/kejian\.html\?from=onboard$/);
  assert.ok(s.saved.has('ainpe:onboarded'));assert.equal(s.events.length,2);assert.equal(s.events[0][1].tier,'open');assert.equal(s.events[1][1].tier,'start');
  s.window.AINPEOnboard.auto();assert.equal(s.nodes.length,0);
});

test('replay and Escape close safely and restore focus and scrolling',()=>{
  const s=setup({useLearn:true});const prior=s.document.activeElement;
  s.window.AINPEOnboard.open();assert.equal(s.document.body.style.overflow,'hidden');
  s.listeners.keydown({key:'Escape'});assert.equal(s.nodes.length,0);assert.equal(s.document.body.style.overflow,'auto');assert.equal(s.document.activeElement,prior);
  assert.equal(s.events[1][1].tier,'skip');s.window.AINPEOnboard.open();assert.equal(s.nodes.length,1);
});

test('navigation dispose closes without marking onboarding as seen',()=>{
  const s=setup();s.window.AINPEOnboard.auto();s.window.AINPEOnboard.dispose();assert.equal(s.nodes.length,0);assert.equal(s.saved.has('ainpe:onboarded'),false);
  s.window.AINPEOnboard.auto();assert.equal(s.nodes.length,1);
});

test('blocked storage skips automatic popup but replay still works',()=>{
  const s=setup({storageBlocked:true,staticPage:true});assert.equal(s.nodes.length,0);s.window.AINPEOnboard.open();assert.equal(s.nodes.length,1);
});

test('loading the script twice preserves the active dialog',()=>{
  const s=setup();s.window.AINPEOnboard.open();const controller=s.window.AINPEOnboard;
  vm.runInNewContext(source,{window:s.window});assert.equal(s.window.AINPEOnboard,controller);
  s.window.AINPEOnboard.open();assert.equal(s.nodes.length,1);
});

test('homepage tour does not open after navigation and is disposed when hidden',()=>{
  const vue=readFileSync(new URL('../uni-app/src/pages/discover/index.vue',import.meta.url),'utf8');
  const start=vue.indexOf('let tourMounted=false');
  const end=vue.indexOf('// #endif',start);
  assert.ok(start>=0&&end>start);
  const hooks={},scripts=[],calls=[],timers=[];
  const document={createElement(){return {}},body:{appendChild(el){scripts.push(el)}}};
  const window={removeEventListener(){}};
  vm.runInNewContext(vue.slice(start,end),{window,document,updateJoinBar(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},
    onShow(fn){hooks.show=fn},onHide(fn){hooks.hide=fn},onUnmounted(fn){hooks.unmount=fn}});
  hooks.show();assert.equal(document.title,'AI 实战情报站');assert.equal(scripts.length,1);hooks.hide();
  window.AINPETour={start(_steps,opts){calls.push(opts.force?'open':'auto')},dispose(){calls.push('dispose')}};
  scripts[0].onload();assert.deepEqual(calls,[]);
  hooks.show();assert.deepEqual(calls,['auto']);hooks.hide();assert.deepEqual(calls,['auto','dispose']);
  document.title='上一篇文章';hooks.show();assert.equal(document.title,'AI 实战情报站');assert.deepEqual(calls,['auto','dispose','auto']);hooks.unmount();assert.deepEqual(calls,['auto','dispose','auto','dispose']);
});

test('delayed tour keeps its controls visible for targets outside the viewport',()=>{
  const tour=readFileSync(new URL('../uni-app/src/static/learn/tour.js',import.meta.url),'utf8');
  const match=tour.match(/function tipTop\(r,pad,th,vh\)\{[\s\S]*?\n  \}/);
  assert.ok(match,'tour dialog positioning helper exists');
  const top=vm.runInNewContext('('+match[0]+')');
  const height=844,tip=180;
  for(const rect of [{top:-1200,bottom:-1100},{top:2000,bottom:2100},{top:330,bottom:390}]){
    const y=top(rect,6,tip,height);
    assert.ok(y>=8 && y+tip<=height-8,`dialog at ${y} must be visible`);
  }
  assert.equal(top({top:330,bottom:390},6,tip,height),410);
  assert.match(tour,/max-height:calc\(100vh - 16px\);overflow:auto/);
});
