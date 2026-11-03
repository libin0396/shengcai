import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(path.join(root,'tests','.offline-'));
const component=path.join(dir,'events.mjs');
const data=path.join(dir,'data.mjs');
await Promise.all([
 build({entryPoints:[path.join(root,'src/variants/OfflineEvents.jsx')],outfile:component,bundle:true,format:'esm',platform:'node',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'}),
 build({entryPoints:[path.join(root,'src/ainpe-data.js')],outfile:data,bundle:true,format:'esm',platform:'node',packages:'external',logLevel:'silent'})
]);
after(()=>rm(dir,{recursive:true,force:true}));
const {default:Events,isAiEvent,groupCityEvents}=await import(pathToFileURL(component));
const {eventStatus}=await import(pathToFileURL(data));
const now=Math.floor(Date.now()/1000);
const base={city:'北京市',district:'海淀区',startTime:now+86400,submitEnd:now+3600,lifecycleStatus:'UPCOMING',full:false,joinCount:0,url:'https://scys.com/meeting/detail?id=123'};

test('满员和截止的状态不会误标为可报名',()=>{
 assert.equal(eventStatus({...base,full:true}),'名额已满');
 assert.equal(eventStatus({...base,submitEnd:now-60}),'报名已截止');
 assert.equal(eventStatus({...base,startTime:now-60}),'已开始');
 assert.equal(eventStatus({...base,startTime:now-60,lifecycleStatus:'ENDED'}),'已结束');
 assert.equal(eventStatus({...base,lifecycleStatus:'CANCELLED'}),'已取消');
});
test('同城卡片分列近期与往期，默认各展示最多两场，并保留站内展开入口',()=>{
 const events=[{...base,id:'1',name:'AI 活动一'},{...base,id:'2',name:'AI 活动二',startTime:now+2*86400,full:true},{...base,id:'6',name:'AI 活动三',startTime:now+3*86400},{...base,id:'3',city:'杭州市',name:'AI 杭州'},{...base,id:'4',name:'AI 已结束一',startTime:now-86400,lifecycleStatus:'ENDED'},{...base,id:'5',name:'AI 已结束二',startTime:now-2*86400,lifecycleStatus:'ENDED'},{...base,id:'7',name:'AI 已结束三',startTime:now-3*86400,lifecycleStatus:'ENDED'}];
 const app={events,live:{},registrationUrl:e=>e.url,isSaved:()=>false,campaign:{},onCampaign:()=>{}};
 const html=renderToStaticMarkup(React.createElement(Events,{app}));
 assert.match(html,/AI 活动一/);assert.match(html,/AI 活动二/);assert.doesNotMatch(html,/AI 活动三/);assert.match(html,/AI 杭州/);assert.match(html,/AI 已结束一/);assert.match(html,/AI 已结束二/);assert.doesNotMatch(html,/AI 已结束三/);
 assert.equal((html.match(/同城 AI 活动 \/ MEETUP/g)||[]).length,2);
 assert.match(html,/近期与进行中/);assert.match(html,/已经结束/);assert.equal((html.match(/展开另外 1 场/g)||[]).length,2);assert.doesNotMatch(html,/href="https?:\/\/([^/]*\.)?scys\.com/);
 assert.doesNotMatch(html,/0 人已报名/);
});
test('AI 活动必须有主题证据，不能仅因准备了 AI 工具入选',()=>{
 assert.equal(isAiEvent({name:'SEO 出海选词上站交流',description:'请自备笔记本，建议准备 AI 编程工具'}),false);
 assert.equal(isAiEvent({name:'小红书内容获客',summary:'本期活动聚焦创业者如何借助 AI 做短视频获客'}),true);
 assert.equal(isAiEvent({name:'郑州航海家茶话会',summary:'从 AI 聊起，不止于 AI'}),true);
 assert.equal(isAiEvent({name:'亲子教育交流',typeText:'高手分享局'}),false);
 assert.equal(isAiEvent({name:'企业 FDE 实战',typeText:'交流局'}),true);
});
test('按城市聚合保留所有不同活动并去除重复条目',()=>{
 const records=[{...base,id:'a',name:'AI 一'},{...base,id:'b',name:'AI 二',startTime:now+2*86400},{...base,id:'c',city:'上海市',name:'AI 上海'}];
 const grouped=groupCityEvents([...records,records[0]],'upcoming');
 assert.equal(grouped.length,2);
 assert.deepEqual(grouped.find(g=>g.city==='北京市').items.map(e=>e.id),['a','b']);
 assert.equal(grouped.find(g=>g.city==='上海市').items.length,1);
});
test('开始时间已过但未确认结束的活动仍显示，并标注状态待核实',()=>{
 const app={events:[{...base,id:'started',name:'AI 开始中',startTime:now-60,lifecycleStatus:'UPCOMING'}],live:{},registrationUrl:e=>e.url,isSaved:()=>false,onCampaign:()=>{}};
 const html=renderToStaticMarkup(React.createElement(Events,{app}));
 assert.match(html,/AI 开始中/);assert.match(html,/状态待核实/);assert.match(html,/已经结束/);assert.match(html,/暂无收录活动/);
});
