import test from 'node:test';
import assert from 'node:assert/strict';
import { createWelcomeGate } from '../uni-app/src/data/mini-welcome.js';
function harness({isLogged=false,failStorage=false}={}) {
 const storage=new Map(), callbacks=[], prompts=[];let logged=isLogged,epoch=0,logins=0;
 const deps={read:k=>storage.get(k),write:(k,v)=>{if(failStorage)throw Error('storage');storage.set(k,v)},defer:fn=>callbacks.push(fn),show:options=>prompts.push(options),loggedIn:()=>logged,generation:()=>epoch,login:()=>{logins++;epoch++}};
 return {storage,callbacks,prompts,gate:createWelcomeGate(deps),restart:()=>createWelcomeGate(deps),get logins(){return logins},setLogin(value){logged=value;epoch++},changeGeneration(){epoch++}};
}
test('first visit can decline without logging in, and does not reappear',()=>{const h=harness();h.gate();h.gate();assert.equal(h.callbacks.length,1);assert.equal(h.logins,0);h.callbacks[0]();assert.equal(h.prompts.length,1);assert.equal(h.prompts[0].cancelText,'先体验');h.prompts[0].success({cancel:true});assert.equal(h.logins,0);h.restart()();assert.equal(h.callbacks.length,1)});
test('only explicit confirmation starts login',()=>{const h=harness();h.gate();h.callbacks[0]();assert.equal(h.logins,0);h.prompts[0].success({confirm:true});assert.equal(h.logins,1)});
test('an existing session is not interrupted or prompted again',()=>{const h=harness({isLogged:true});h.gate();assert.equal(h.callbacks.length,0);h.setLogin(false);h.restart()();assert.equal(h.callbacks.length,0)});
test('a session change invalidates a pending prompt or confirmation',()=>{const h=harness();h.gate();h.changeGeneration();h.callbacks[0]();assert.equal(h.prompts.length,0);const other=harness();other.gate();other.callbacks[0]();other.setLogin(true);other.setLogin(false);other.prompts[0].success({confirm:true});assert.equal(other.logins,0)});
test('if local storage is unavailable, no prompt or login is started',()=>{const h=harness({failStorage:true});h.gate();assert.equal(h.prompts.length,0);assert.equal(h.callbacks.length,0);assert.equal(h.logins,0)});
