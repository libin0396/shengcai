import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const mine=await readFile('uni-app/src/pages/learn/mine.vue','utf8');
const learning=await readFile('uni-app/src/pages/learn/learning.vue','utf8');
const template=mine.split('<!-- #ifndef MP-WEIXIN -->')[0];
const match=mine.match(/function onAccountTap\(\)\{([^\n]+)\}/);
assert.ok(match,'account tap handler must exist');
function tap(loggedIn,open=false){const state={account:{value:{loggedIn}},accountOpen:{value:open},calls:0};state.doLogin=()=>{state.calls++};vm.runInNewContext(`(function onAccountTap(){${match[1]}})()`,state);return state;}
test('the logged-out avatar immediately starts login, with no intermediate panel',()=>{assert.match(template,/@account="onAccountTap"/);const s=tap(false);assert.equal(s.calls,1);assert.equal(s.accountOpen.value,false);assert.doesNotMatch(template,/v-if="!account\.loggedIn"[^\n]*微信登录/)});
test('the logged-in avatar still opens and closes profile settings',()=>{const s=tap(true);assert.equal(s.calls,0);assert.equal(s.accountOpen.value,true);const close=tap(true,true);assert.equal(close.accountOpen.value,false);assert.match(template,/accountOpen && account\.loggedIn/)});
test('the requested example disclaimer is removed only in mini-program branch',()=>{const phrase='课里小A 的回答目前是示意，上线前会换成实测结果。';const [mini,h5]=learning.split('<!-- #ifndef MP-WEIXIN -->');assert.doesNotMatch(mini,new RegExp(phrase));assert.match(h5,new RegExp(phrase));});
