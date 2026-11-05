#!/usr/bin/env node
// Non-interactive daily sync. The provider may refresh an existing session but
// never opens a browser or starts an interactive authorization flow.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Client,StreamableHTTPClientTransport} from '../dist/runtime/mcp-sdk.mjs';
import {ScysOAuthProvider,ReauthorizationRequired} from './scys-auth.mjs';
import {collectMcpInput,saveMcpInput} from './mcp-collector.mjs';
import {recordFeedFailure} from '../server/feed-store.mjs';
import {scysFetch} from './scys-network.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const endpoint=new URL('https://mcp.scys.com/shengcai-web/mcp');
let client,transport;
function runSync(file){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,'scripts/sync-from-mcp.mjs'),file],{cwd:root,stdio:['ignore','pipe','ignore'],env:{...process.env,NODE_NO_WARNINGS:'1'}});
  let output='',oversized=false;child.stdout.on('data',data=>{output+=data;if(output.length>4096){oversized=true;child.kill();}});
  child.once('error',()=>reject(new Error('PUBLISH_FAILED')));
  child.once('close',code=>{try{if(code!==0||oversized)throw 0;const result=JSON.parse(output);if(result.status!=='ok'||result.archiveStatus!=='ok'||!result.counts||typeof result.lastSuccessAt!=='string')throw 0;resolve({status:'ok',lastSuccessAt:result.lastSuccessAt,counts:result.counts,archiveStatus:result.archiveStatus});}catch{reject(new Error('PUBLISH_FAILED'));}});
});}

try {
  const provider=await new ScysOAuthProvider({directory:process.env.AINPE_AUTH_DIR}).initialize();
  // No initial token means there is no authorized session to refresh.
  if(!provider.tokens())throw new ReauthorizationRequired();
  client=new Client({name:'ainpe-daily-feed',version:'1.0.0'},{capabilities:{}});
  transport=new StreamableHTTPClientTransport(endpoint,{authProvider:provider,fetch:scysFetch});
  await client.connect(transport);
  const input=await collectMcpInput({client,signal:AbortSignal.timeout(15*60*1000)});
  const file=await saveMcpInput(input,path.join(root,'data/staging'));
  const result=await runSync(file);console.log(JSON.stringify(result));
}catch(error){
  await recordFeedFailure().catch(()=>{});
  console.error(error instanceof ReauthorizationRequired?'SYNC_AUTHORIZATION_REQUIRED':'SYNC_FAILED_PREVIOUS_CONTENT_RETAINED');process.exitCode=1;
}finally{await client?.close().catch(()=>{});}
