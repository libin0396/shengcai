import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the actual home page's onLoad callback with a browser root query.
const source = fs.readFileSync(new URL('../uni-app/src/pages/discover/index.vue', import.meta.url), 'utf8');
const callback = source.match(/onLoad\(options=>\{([\s\S]*?)\n\}\);/);
assert.ok(callback, 'home page must register its visit callback');
function visit(search, options = {}) {
  const calls = [], changes=[];
  const context = {
    window: {location: {href: `https://ainpe.example/${search}#/`, search}, history: {state:null, replaceState: (_state, _title, url) => changes.push(url)}}, URL, URLSearchParams,
    uni: {getStorageSync: () => null, redirectTo: () => {}},
    track: (...args) => calls.push(args),
  };
  vm.runInNewContext(`(options => {${callback[1]}\n})(input)`, {...context, input: options});
  return {calls: JSON.parse(JSON.stringify(calls)), changes};
}
test('home records persona poster attribution from the actual root query', () => {
  assert.deepEqual(visit('?from=persona_qr').calls, [['site_view', {page: 'home', played: false, from: 'persona_qr'}]]);
});
test('home does not attribute unknown source strings to persona posters', () => {
  for (const search of ['', '?from=other', '?from=persona_qr_extra']) {
    assert.deepEqual(visit(search).calls, [['site_view', {page: 'home', played: false}]]);
  }
});
test('mini program options may carry valid persona attribution', () => {
  assert.deepEqual(visit('', {from: 'persona_qr'}).calls, [['site_view', {page: 'home', played: false, from: 'persona_qr'}]]);
});

test('home consumes persona source once while preserving other parameters and route', () => {
  assert.deepEqual(visit('?from=persona_qr&other=1').changes, ['/?other=1#/']);
  assert.deepEqual(visit('?from=other').changes, []);
});
test('home still records the source when history replacement is unavailable', () => {
  const calls=[];
  const window={location:{href:'https://ainpe.example/?from=persona_qr#/'} };
  const uni={getStorageSync:()=>null, redirectTo:()=>{}};
  vm.runInNewContext(`(options => {${callback[1]}\n})(input)`, {window, uni, URL, URLSearchParams, track:(...args)=>calls.push(args), input:{}});
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['site_view',{page:'home',played:false,from:'persona_qr'}]]);
});
test('ambiguous duplicate source parameters are not consumed or attributed', () => {
  const result=visit('?from=persona_qr&from=other&event=123');
  assert.deepEqual(result.calls, [['site_view', {page:'home',played:false}]]);
  assert.deepEqual(result.changes, []);
});
