import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewsForEvent} from '../src/event-reviews.js';

const records = [
  {eventId:'10383',author:'圈友甲',text:'收获了具体方法',sourceId:'post-1'},
  {eventId:'10386',author:'圈友乙',text:'认识了同行',sourceId:'post-2'},
];

test('only the exact event ID gets its own reviews, even for identically named events', () => {
  const event = {id:'10383',name:'如何从 0 入局 FDE',city:'杭州',lifecycleStatus:'ENDED'};
  assert.deepEqual(reviewsForEvent(event,records), [records[0]]);
  assert.deepEqual(reviewsForEvent({...event,id:'10386',city:'昆明'},records), [records[1]]);
  assert.deepEqual(reviewsForEvent({...event,id:'other'},records), []);
});

test('only explicitly finished events can show their matching feedback', () => {
  for (const status of ['UPCOMING','ONGOING','CANCELLED','']) {
    assert.deepEqual(reviewsForEvent({id:'10383',lifecycleStatus:status},records), []);
  }
  assert.deepEqual(reviewsForEvent({id:'10383',lifecycleStatus:'COMPLETED'},records), [records[0]]);
});

test('ignore missing identities, text, and source IDs rather than invent attribution', () => {
  const event = {id:'10383',lifecycleStatus:'FINISHED'};
  const incomplete = [
    {...records[0],author:''}, {...records[0],text:''}, {...records[0],sourceId:''},
    {...records[0],eventId:10383}, {author:'甲',text:'有收获',sourceId:'post-1'},
  ];
  assert.deepEqual(reviewsForEvent(event,incomplete), []);
  assert.deepEqual(reviewsForEvent({lifecycleStatus:'ENDED'},records), []);
});
