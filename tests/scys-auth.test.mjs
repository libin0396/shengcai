import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, chmod, rm, symlink, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {request} from 'node:http';
import {ScysOAuthProvider,ReauthorizationRequired} from '../scripts/scys-auth.mjs';
import {createAuthCallbackServer} from '../scripts/scys-auth-loopback.mjs';
import {auth} from '@modelcontextprotocol/sdk/client/auth.js';
import {validateScysRequest} from '../scripts/scys-network.mjs';

async function privateDir(){const root=await mkdtemp(path.join(await realpath(tmpdir()),'ainpe-auth-test-'));await chmod(root,0o700);return root;}
function get(port,pathname,host='127.0.0.1:0'){return new Promise((resolve,reject)=>{const r=request({host:'127.0.0.1',port,path:pathname,headers:{host}},res=>{res.resume();res.on('end',()=>resolve(res));});r.on('error',reject);r.end();});}
test('private storage is owner-only and stores refresh results atomically',async()=>{
 const directory=await privateDir();try{
  const p=await new ScysOAuthProvider({directory}).initialize();assert.equal(p.tokens(),undefined);
  await p.saveTokens({access_token:'test-only-access',refresh_token:'test-only-refresh'});
  const s=JSON.parse(await readFile(path.join(directory,'scys-feed-v1.json'),'utf8'));assert.equal(s.access_token,'test-only-access');
  const p2=await new ScysOAuthProvider({directory}).initialize();assert.equal(p2.tokens().refresh_token,'test-only-refresh');
  await chmod(path.join(directory,'scys-feed-v1.json'),0o644);await assert.rejects(new ScysOAuthProvider({directory}).initialize(),/AUTH_STORAGE_UNAVAILABLE/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('rejects unsafe directories and never begins browser auth during daily sync',async()=>{
 const root=await privateDir();try{
  const actual=path.join(root,'real'),link=path.join(root,'link');await mkdir(actual,{mode:0o700});await symlink(actual,link);
  await assert.rejects(new ScysOAuthProvider({directory:link}).initialize(),/INVALID_AUTH_DIRECTORY/);
  const p=await new ScysOAuthProvider({directory:actual}).initialize();
  assert.throws(()=>p.redirectToAuthorization(new URL('https://mcp.scys.com/mcp-oauth/authorize?scope=mcp')),ReauthorizationRequired);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('interactive authorization requires precisely the requested scope',async()=>{
 const directory=await privateDir();try{
  let called=0;const p=await new ScysOAuthProvider({directory,interactive:true,onAuthorization:()=>called++}).initialize();
  assert.throws(()=>p.redirectToAuthorization(new URL('https://mcp.scys.com/mcp-oauth/authorize?scope=mcp%20other')),/INVALID_AUTHORIZATION_SCOPE/);
  p.redirectToAuthorization(new URL('https://mcp.scys.com/mcp-oauth/authorize?scope=mcp'));assert.equal(called,1);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('rejects issuer metadata that does not match its discovery origin',async()=>{
 const directory=await privateDir();try{
  const p=await new ScysOAuthProvider({directory}).initialize();
  const metadata={issuer:'https://mcp.scys.com/mcp-oauth',authorization_endpoint:'https://mcp.scys.com/mcp-oauth/authorize',token_endpoint:'https://mcp.scys.com/mcp-oauth/token'};
  p.saveDiscoveryState({authorizationServerUrl:'https://mcp.scys.com/mcp-oauth',authorizationServerMetadata:metadata});
  assert.throws(()=>p.saveDiscoveryState({authorizationServerUrl:'https://mcp.scys.com/mcp-oauth',authorizationServerMetadata:{...metadata,issuer:'https://evil.invalid'}}),/INVALID_AUTHORIZATION_METADATA/);
  assert.throws(()=>p.saveDiscoveryState({authorizationServerUrl:'https://mcp.scys.com/mcp-oauth',authorizationServerMetadata:{...metadata,token_endpoint:'https://evil.invalid/token'}}),/INVALID_AUTHORIZATION_METADATA/);
  assert.throws(()=>p.saveDiscoveryState({authorizationServerUrl:'https://mcp.scys.com/mcp-oauth',authorizationServerMetadata:{...metadata,token_endpoint:'https://mcp.scys.com/other'}}),/INVALID_AUTHORIZATION_METADATA/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('network guard rejects different origins, paths, methods and query strings',()=>{
 assert.doesNotThrow(()=>validateScysRequest('https://mcp.scys.com/shengcai-web/mcp',{method:'POST'}));
 assert.doesNotThrow(()=>validateScysRequest('https://mcp.scys.com/mcp-oauth/token',{method:'POST'}));
 for(const bad of ['http://mcp.scys.com/mcp-oauth/token','https://evil.invalid/mcp-oauth/token','https://mcp.scys.com/elsewhere','https://mcp.scys.com/mcp-oauth/token?next=other'])assert.throws(()=>validateScysRequest(bad,{method:'POST'}),/UNTRUSTED_MCP_ENDPOINT/);
 assert.throws(()=>validateScysRequest('https://mcp.scys.com/mcp-oauth/token',{method:'GET'}),/INVALID_MCP_METHOD/);
});
test('official SDK completes PKCE and refreshes a previously authorized session',async()=>{
 const directory=await privateDir();try{
  let destination, tokenRequests=0;
  const json=x=>new Response(JSON.stringify(x),{status:200,headers:{'content-type':'application/json'}});
  const mock=async(input,init={})=>{
   const url=new URL(input instanceof Request?input.url:input);
   if(url.pathname.startsWith('/.well-known/oauth-protected-resource'))return json({resource:'https://mcp.scys.com/shengcai-web/mcp',authorization_servers:['https://mcp.scys.com/mcp-oauth'],scopes_supported:['mcp']});
   if(url.pathname.startsWith('/.well-known/oauth-authorization-server'))return json({issuer:'https://mcp.scys.com/mcp-oauth',authorization_endpoint:'https://mcp.scys.com/mcp-oauth/authorize',token_endpoint:'https://mcp.scys.com/mcp-oauth/token',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none']});
   if(url.pathname==='/mcp-oauth/token'){const b=new URLSearchParams(init.body);assert.ok(['authorization_code','refresh_token'].includes(b.get('grant_type')));tokenRequests++;return json({access_token:'test-access',refresh_token:'test-refresh',token_type:'Bearer',expires_in:3600});}
   return new Response(null,{status:404});
  };
  const p=await new ScysOAuthProvider({directory,interactive:true,onAuthorization:url=>{destination=url}}).initialize();
  const options={serverUrl:'https://mcp.scys.com/shengcai-web/mcp',scope:'mcp',fetchFn:mock};
  assert.equal(await auth(p,options),'REDIRECT');assert.ok(destination);assert.equal(destination.searchParams.get('code_challenge_method'),'S256');assert.equal(destination.searchParams.get('scope'),'mcp');
  assert.equal(await auth(p,{...options,authorizationCode:'test-code'}),'AUTHORIZED');assert.equal(tokenRequests,1);
  const daily=await new ScysOAuthProvider({directory}).initialize();assert.equal(await auth(daily,options),'AUTHORIZED');assert.equal(tokenRequests,2);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('bundled transport authorizes, reconnects and performs a read-only tool call',async()=>{
 const directory=await privateDir();try{
  const {Client,StreamableHTTPClientTransport,UnauthorizedError}=await import('../dist/runtime/mcp-sdk.mjs');let target,requests=0;
  const json=(x,status=200,headers={})=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json',...headers}});
  const mock=async(input,init={})=>{
   const u=new URL(input instanceof Request?input.url:input);
   if(u.pathname.startsWith('/.well-known/oauth-protected-resource'))return json({resource:'https://mcp.scys.com/shengcai-web/mcp',authorization_servers:['https://mcp.scys.com/mcp-oauth'],scopes_supported:['mcp']});
   if(u.pathname.startsWith('/.well-known/oauth-authorization-server'))return json({issuer:'https://mcp.scys.com/mcp-oauth',authorization_endpoint:'https://mcp.scys.com/mcp-oauth/authorize',token_endpoint:'https://mcp.scys.com/mcp-oauth/token',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none']});
   if(u.pathname==='/mcp-oauth/token')return json({access_token:'fake-access',refresh_token:'fake-refresh',token_type:'Bearer',expires_in:3600});
   if(u.pathname==='/shengcai-web/mcp' && init.method==='GET')return new Response(null,{status:405});
   if(u.pathname==='/shengcai-web/mcp' && init.method==='POST'){
    if(!new Headers(init.headers).has('authorization'))return new Response('',{status:401,headers:{'www-authenticate':'Bearer resource_metadata="https://mcp.scys.com/.well-known/oauth-protected-resource", scope="mcp"'}});
    const m=JSON.parse(init.body);if(m.method==='notifications/initialized')return new Response(null,{status:202});
    if(m.method==='initialize')return json({jsonrpc:'2.0',id:m.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'fake',version:'1'}}});
    if(m.method==='tools/call'){requests++;return json({jsonrpc:'2.0',id:m.id,result:{content:[{type:'text',text:'{}'}],structuredContent:{items:[]}}});}
   }
   return new Response(null,{status:404});
  };
  const p=await new ScysOAuthProvider({directory,interactive:true,onAuthorization:url=>{target=url}}).initialize();
  const mk=()=>new StreamableHTTPClientTransport(new URL('https://mcp.scys.com/shengcai-web/mcp'),{authProvider:p,fetch:mock});
  const first=mk(),c1=new Client({name:'test',version:'1'},{capabilities:{}});
  await assert.rejects(c1.connect(first),UnauthorizedError);assert.ok(target);await first.finishAuth('fake-code');await c1.close().catch(()=>{});
  const second=mk(),c2=new Client({name:'test',version:'1'},{capabilities:{}});await c2.connect(second);
  const answer=await c2.callTool({name:'listMenu',arguments:{}});assert.deepEqual(answer.structuredContent.items,[]);assert.equal(requests,1);await c2.close();
 }finally{await rm(directory,{recursive:true,force:true});}
});
async function runCallback({validState=true,issuerMode='none'}={}){
 let count=0,done;const provider={requestState:'test-state',discoveryState:()=>({authorizationServerUrl:'https://example.invalid',authorizationServerMetadata:{authorization_response_iss_parameter_supported:issuerMode==='required'}})};
 const transport={finishAuth:async()=>{count++}};const server=createAuthCallbackServer({port:0,provider,transport,getDestination:()=>new URL('https://example.invalid/authorize'),onDone:value=>{done=value;}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
 try {
  assert.equal((await get(port,'/start','attacker.invalid')).statusCode,400);
  assert.equal((await get(port,'/start')).statusCode,302);assert.equal((await get(port,'/start')).statusCode,409);
  const suffix=issuerMode==='required'?'&iss='+encodeURIComponent('https://example.invalid'):issuerMode==='wrong'?'&iss='+encodeURIComponent('https://evil.invalid'):'';
  const response=await get(port,'/oauth/callback?state='+(validState?'test-state':'wrong')+'&code=test-only'+suffix);
  assert.equal(response.statusCode,303);assert.equal(response.headers.location,validState&&issuerMode!=='wrong'?'/done':'/failed');
  assert.equal((await get(port,response.headers.location)).statusCode,validState&&issuerMode!=='wrong'?200:400);
  assert.equal(count,validState&&issuerMode!=='wrong'?1:0);assert.equal(done,validState&&issuerMode!=='wrong');
  assert.equal((await get(port,'/oauth/callback?state=test-state&code=test-only')).statusCode,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
}
test('loopback callback enforces state, issuer and one-use redirect',async()=>{
 await runCallback();await runCallback({validState:false});await runCallback({issuerMode:'required'});await runCallback({issuerMode:'wrong'});
});
