import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(path.join(root,'tests','.hero-'));
const output=path.join(dir,'hero.mjs');
await build({entryPoints:[path.join(root,'src/components/FdeOpportunityHero.jsx')],outfile:output,bundle:true,format:'esm',platform:'node',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
after(()=>rm(dir,{recursive:true,force:true}));
const Hero=(await import(pathToFileURL(output))).default;
const now=Math.floor(Date.now()/1000);
const event={id:'10533',name:'北京市｜AI航海家FDE大会',startTime:now+5*86400,submitEnd:now+3*86400,city:'北京市',district:'顺义区',lifecycleStatus:'UPCOMING',full:false,remainStock:5,url:'https://scys.com/meeting/detail?id=10533'};
const app=e=>({fdeEvent:e,featuredEvent:null,registrationUrl:()=> 'https://scys.com/form/z27Vz1Dq'});
const render=a=>renderToStaticMarkup(React.createElement(Hero,{app:a}));

test('eligible FDE shows real-source poster and registration destination',()=>{
 const html=render(app(event));assert.match(html,/foh-has-event/);assert.match(html,/下一站/);assert.match(html,/\/assets\/fde-cover.jpg/);assert.match(html,/href="https:\/\/scys.com\/form\/z27Vz1Dq"/);assert.match(html,/查看大会与报名/);
});
test('expired, full and cancelled FDE cannot remain promoted',()=>{
 for(const change of [{startTime:now-60},{submitEnd:now-60},{full:true},{lifecycleStatus:'CANCELLED'}]){const html=render(app({...event,...change}));assert.match(html,/foh-topic-only/);assert.doesNotMatch(html,/\/assets\/fde-cover.jpg|查看大会与报名|报名截止/);}
});
test('no available FDE offers real topic and activity paths without invented date',()=>{
 const html=render(app(null));assert.match(html,/href="\/topics\/fde"/);assert.match(html,/href="\/events"/);assert.doesNotMatch(html,/foh-event-band|foh-date-poster|都可以来现场/);
});
test('normalized unknown capacity does not hide an otherwise eligible event',()=>{
 const html=render(app({...event,full:false,remainStock:0}));assert.match(html,/foh-has-event/);
});
