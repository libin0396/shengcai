import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../uni-app/src/static/simulation-games');
const source=fs.readFileSync(path.join(root,'voyage-lab-data.js'),'utf8');
const require=createRequire(import.meta.url);
const Engine=require(path.join(root,'voyage-lab-model.js'));
function project(name){
  let raw='';
  const gameData={set textContent(v){raw=v}};
  const ctx=vm.createContext({URLSearchParams,location:{search:'?project='+name},document:{getElementById:()=>gameData}});
  vm.runInContext(source,ctx,{timeout:1000});
  return JSON.parse(raw);
}
function state(D, missing=false){
  return {cond:{life:0,time:1,tech:0,fund:1,experience:0},talents:[0,1,2],choice:Object.fromEntries(D.choices.map(c=>[c.id,1])),task:{sel:missing?[]:D.task.items.filter(i=>i.need).map(i=>i.id),fixed:[]}};
}
for(const name of ['books','brain','trends']) test(`${name} 配置、事件和账本`,()=>{
  const D=project(name),S=state(D);
  assert.equal(D.choices.length,5);
  assert.equal(D.task.after,2,'动手任务在发布前');
  const expectedNodes={books:['定位选品','内容策划','成片制作','发布挂载','复盘优化'],brain:['素材库','选题策划','提炼规律','内容创作','发布复盘'],trends:['选词调研','页面内容','页面制作','上线测试','数据复盘']};
  assert.deepEqual(D.choices.map(c=>c.node),expectedNodes[name]);
  assert.doesNotMatch(D.choices.slice(0,3).map(c=>c.q).join(' '),/发布一段时间后|发布后反响|上线后发现访问少/);
  assert.equal(D.cases.length,name==='brain'?1:2);
  assert.ok(D.conditions.some(c=>c.id==='fund') && D.conditions.some(c=>c.id==='time'));
  assert.ok(D.task.items.some(x=>x.need) && D.workspace.fields.length);
  assert.ok(D.cases.every(c=>c.url.startsWith('https://scys.com/')&&c.results.length&&c.cond.daily_time));
  assert.match(D.baseRefNote,/游戏设定/);
  if(name==='brain') assert.match(D.baseRefNote,/内容服务接单.*不会自动产生收入/);
  assert.match(D.ui.grossLabel,name==='books'?/佣金/:name==='brain'?/内容服务/:/广告/);
  for(const days of [15,30]){
    const a=Engine.sim(D,S,days,100),b=Engine.sim(D,S,days,100);
    assert.deepEqual(a,b,'相同条件与种子必须产生相同结果');
    assert.equal(a.daily.length,days);
    assert.equal(a.profit,a.gross-a.cost+a.evm,'账本按模拟到账、成本和事件结算');
    assert.equal(a.evm,a.daily.flatMap(d=>d.ev).reduce((sum,e)=>sum+(e.m||0),0),'列出的事件金额与账本小计一致');
  }
  const duplicate=Array.from({length:30},(_,i)=>Engine.sim(D,S,30,i).daily.flatMap(d=>d.ev)).flat().filter(e=>e.dup);
  assert.ok(duplicate.length>0,'不利决策可触发同一问题的事件');
  assert.ok(duplicate.every(e=>e.m===0),'同一问题不重复扣减');
  const missing=state(D,true),flags=Engine.flags(D,missing);
  assert.ok(D.task.items.filter(x=>x.need).every(x=>flags['miss_'+x.id]));
  const simulated=Engine.sim(D,missing,30,12).daily.flatMap(d=>d.ev);
  assert.ok(simulated.some(e=>String(e.t).includes('上线后发现遗漏')),'遗漏的检查应出现模拟后果');
});
test('各方向采用各自模拟起点，而非真实平均收入',()=>{
  const values=['books','brain','trends'].map(n=>project(n).baseRef);
  assert.equal(new Set(values).size,3);
});
