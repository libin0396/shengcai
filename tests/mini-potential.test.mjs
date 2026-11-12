import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {potentialCards,potentialQuestions,evaluatePotential,completedTutorialIds,resolvePotentialProgress} from '../uni-app/src/data/mini-potential.js';
import {miniAids} from '../uni-app/src/data/mini-aids.js';

const guides=JSON.parse(await readFile(new URL('../uni-app/src/data/mini-guides.json',import.meta.url),'utf8'));
const allA=Object.fromEntries(potentialQuestions.map(q=>[q.id,'a']));

test('24 cards form complete paths and refer only to existing tutorials',()=>{
  assert.deepEqual([1,2,3,4].map(stage=>potentialCards.filter(x=>x.stage===stage).length),[10,6,4,4]);
  assert.equal(new Set(potentialCards.map(card=>card.id)).size,24);
  const ids=new Set(guides.map(g=>g.id));
  const aidIds=new Set(miniAids.map(aid=>aid.id));
  for(const c of potentialCards){
    assert.ok(c.name&&c.description&&c.guideIds.length+c.aidIds.length>=1&&c.guideIds.length+c.aidIds.length<=2);
    assert.ok(c.guideIds.every(id=>ids.has(id)));
    assert.ok(c.aidIds.every(id=>aidIds.has(id)));
    if(c.stage<4) assert.ok(potentialCards.some(next=>next.stage===c.stage+1&&next.id===c.nextId));
    else assert.equal(c.nextId,null);
  }
  const message=potentialCards.find(card=>card.id==='message');
  assert.deepEqual(message.aidIds,['reply']);assert.deepEqual(message.guideIds,[]);
});

test('every beginner card is reachable, with no result before all valid answers',()=>{
  assert.equal(evaluatePotential({}).status,'incomplete');
  assert.equal(evaluatePotential({...allA,next:'unknown'}).status,'incomplete');
  const reachable=new Set();
  for(let n=0;n<1024;n++){
    let k=n;const answer={};
    for(const question of potentialQuestions){answer[question.id]=question.options[k%4].id;k=Math.floor(k/4)}
    const result=evaluatePotential(answer);
    assert.equal(result.status,'complete');assert.equal(result.card.stage,1);reachable.add(result.card.id);
  }
  assert.equal(reachable.size,10);
});

test('a tutorial counts once only after all its real steps have been self-marked',()=>{
  const g=guides[0],steps=g.steps.map((_,i)=>i);
  assert.deepEqual(completedTutorialIds({[g.id]:{completedSteps:[0,0,999]}},guides),[]);
  assert.deepEqual(completedTutorialIds({[g.id]:{completedSteps:[...steps,...steps,999]},missing:{completedSteps:[0]}},[g,g,...guides]),[g.id]);
});

test('stages follow adjustable cumulative thresholds and do not lock tutorials',()=>{
  const marks=Object.fromEntries(guides.map(g=>[g.id,{completedSteps:g.steps.map((_,i)=>i)}]));
  assert.equal(resolvePotentialProgress(allA,{},guides).stage,1);
  const one={[guides[0].id]:marks[guides[0].id]};
  assert.equal(resolvePotentialProgress(allA,one,guides).stage,2);
  assert.equal(resolvePotentialProgress(allA,marks,guides).stage,4);
  assert.equal(resolvePotentialProgress(allA,marks,guides,[0,2,5,8]).stage,3);
  assert.throws(()=>resolvePotentialProgress(allA,marks,guides,[0,1,1,5]),/invalid stage thresholds/);
  assert.ok(resolvePotentialProgress(allA,one,guides).card.guideIds.every(id=>guides.some(g=>g.id===id)));
});
