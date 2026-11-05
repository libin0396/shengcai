#!/usr/bin/env node
// One interactive server-side OAuth session. The browser reaches this listener
// over an SSH loopback tunnel; never log the request URL or provider response.
import {Client,StreamableHTTPClientTransport,UnauthorizedError} from '../dist/runtime/mcp-sdk.mjs';
import {ScysOAuthProvider} from './scys-auth.mjs';
import {createAuthCallbackServer} from './scys-auth-loopback.mjs';
import {scysFetch} from './scys-network.mjs';
import {waitForAuthorization} from './authorization-wait.mjs';

const endpoint=new URL('https://mcp.scys.com/shengcai-web/mcp');
const port=19441, directory=process.env.AINPE_AUTH_DIR;
let destination, provider, transport, client, server;
let resolveDone;const done=new Promise(resolve=>{resolveDone=resolve});

try{
  provider=await new ScysOAuthProvider({directory,callbackPort:port,interactive:true,onAuthorization:url=>{destination=url;}}).initialize();
  client=new Client({name:'ainpe-daily-feed',version:'1.0.0'},{capabilities:{}});
  transport=new StreamableHTTPClientTransport(endpoint,{authProvider:provider,fetch:scysFetch});
  try{await client.connect(transport);console.log('ALREADY_AUTHENTICATED');}
  catch(error){
    if(!(error instanceof UnauthorizedError)||!destination)throw new Error('AUTH_PREPARATION_FAILED');
    server=createAuthCallbackServer({port,provider,transport,getDestination:()=>destination,onDone:resolveDone});
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});
    console.log('AUTHORIZATION_READY');
    const ok=await waitForAuthorization(done);
    if(!ok)throw new Error('AUTHORIZATION_FAILED');
    console.log('AUTHORIZATION_SUCCEEDED');
  }
}catch{console.error('AUTHORIZATION_NOT_COMPLETED');process.exitCode=1;}
finally{server?.close();await client?.close().catch(()=>{});}
