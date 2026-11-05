// Restrict all OAuth and MCP traffic to the exact endpoints observed in the
// official service's discovery metadata. No credentials cross origins.
const ORIGIN='https://mcp.scys.com';
const paths=new Set([
  '/shengcai-web/mcp',
  '/mcp-oauth/token',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-protected-resource/shengcai-web/mcp',
  '/.well-known/oauth-authorization-server/mcp-oauth',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration/mcp-oauth',
  '/mcp-oauth/.well-known/openid-configuration',
]);
export function validateScysRequest(input,init={}) {
  let u;try{u=new URL(input instanceof Request?input.url:String(input));}catch{throw new Error('UNTRUSTED_MCP_ENDPOINT');}
  const method=String(init.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
  if(u.origin!==ORIGIN||u.username||u.password||u.search||u.hash||!paths.has(u.pathname))throw new Error('UNTRUSTED_MCP_ENDPOINT');
  if(u.pathname==='/mcp-oauth/token'&&method!=='POST')throw new Error('INVALID_MCP_METHOD');
  if(u.pathname.startsWith('/.well-known/')&&method!=='GET')throw new Error('INVALID_MCP_METHOD');
  if(u.pathname==='/shengcai-web/mcp'&&!['GET','POST','DELETE'].includes(method))throw new Error('INVALID_MCP_METHOD');
  return u;
}
export async function scysFetch(input,init={}){validateScysRequest(input,init);return fetch(input,{...init,redirect:'error'});}
