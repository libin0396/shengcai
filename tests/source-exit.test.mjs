import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {isScysDestination,scysExitPath} from '../src/scys-exit.js';

test('only actual 生财 hosts and HTTP(S) destinations are accepted',()=>{
 for(const url of ['https://scys.com/path','https://mcp.scys.com/a?b=c','http://sub.scys.com/'])assert.equal(isScysDestination(url),true,url);
 for(const url of ['https://scys.com.evil.example','https://evilscys.com','https://scys.com@evil.example','https://user:pass@scys.com','javascript:alert(1)','data:text/html,hi','/join/ai-camp','https://work.weixin.qq.com/'])assert.equal(isScysDestination(url),false,url);
});

test('intermediate link preserves the original query and fragment',()=>{
 const original='https://scys.com/a?ref=a%2Bb&topic=AI%20FDE&ref=two#section';
 const path=scysExitPath(original,'https://ainpe.example/');
 const local=new URL(path,'https://ainpe.example/');
 assert.equal(local.pathname,'/source');
 assert.equal(local.searchParams.get('url'),original);
 assert.equal(scysExitPath('https://scys.com.evil.example','https://ainpe.example/'),null);
});

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(path.join(root,'tests','.source-gate-'));
const output=path.join(dir,'component.mjs');
await build({entryPoints:[path.join(root,'src/components/SourceExitGate.jsx')],outfile:output,bundle:true,format:'esm',platform:'node',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
after(()=>rm(dir,{recursive:true,force:true}));
const {SourceAccessPage}=await import(pathToFileURL(output));
const app={savedCount:0,campaign:{posterUrl:'/assets/ai-camp-poster.jpg',qrUrl:'/assets/ai-camp-qr.png',scheduleLabel:'具体排期以入口为准'}};
const render=url=>{
 globalThis.window={location:{search:`?url=${encodeURIComponent(url)}`}};
 try{return renderToStaticMarkup(React.createElement(SourceAccessPage,{app}));}finally{delete globalThis.window;}
};

test('intermediate page presents the complete camp poster before an explicit continue link',()=>{
 const html=render('https://scys.com/meeting?id=4&ref=7');
 assert.match(html,/\/assets\/ai-camp-poster\.jpg/);
 assert.match(html,/查看三天体验营完整海报和扫码入口/);
 assert.match(html,/具体排期以入口为准/);
 assert.match(html,/data-scys-exit-allow="true"/);
 assert.match(html,/href="https:\/\/scys\.com\/meeting\?id=4&amp;ref=7"/);
 assert.match(html,/继续访问生财/);
});

test('intermediate page cannot redirect to a deceptive or executable address',()=>{
 for(const url of ['https://scys.com.evil.example/','javascript:alert(1)','https://user@scys.com/']){
  const html=render(url);
  assert.match(html,/无法识别原页面地址/);
  assert.doesNotMatch(html,/data-scys-exit-allow/);
 }
});
