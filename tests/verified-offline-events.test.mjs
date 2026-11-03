import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeVerifiedOfflineEvents} from '../src/verified-offline-events.js';
import {reviewsForEvent} from '../src/event-reviews.js';

const curated=JSON.parse(await readFile(new URL('../src/verified-offline-events.json',import.meta.url),'utf8'));
const reviews=JSON.parse(await readFile(new URL('../src/event-reviews.json',import.meta.url),'utf8'));

test('live feed takes precedence and curated events only fill missing IDs',()=>{
  const live={id:10157,name:'更新后的原始资料',lifecycleStatus:'ENDED',description:'更完整的活动内容'};
  const merged=mergeVerifiedOfflineEvents([live],curated);
  assert.equal(merged.filter(event=>String(event.id)==='10157').length,1);
  assert.strictEqual(merged[0],live);
  assert.ok(merged.some(event=>event.id==='8925'));
  assert.equal(live.description,'更完整的活动内容');
});

test('curated activities are ended and linked reviews describe inferred attribution',()=>{
  assert.equal(curated.length,2);
  for(const event of curated){
    assert.equal(event.lifecycleStatus,'ENDED');
    assert.ok(event.name && event.city && event.description && Number.isFinite(event.startTime));
    const linked=reviewsForEvent(event,reviews);
    assert.equal(linked.length,1);
    assert.match(linked[0].attribution,/主题、组织人与时间关联/);
  }
  assert.deepEqual(reviewsForEvent({id:'unknown',lifecycleStatus:'ENDED'},reviews),[]);
});

test('invalid or repeated supplemental events are not added',()=>{
  const merged=mergeVerifiedOfflineEvents([], [...curated,curated[0],{id:'future',lifecycleStatus:'UPCOMING'}]);
  assert.deepEqual(merged.map(event=>event.id),['10157','8925']);
});
