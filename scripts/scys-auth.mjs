// Private OAuth storage for the server's own MCP account. Never log values.
import {constants} from 'node:fs';
import {lstat, mkdir, open, readFile, realpath, rename, unlink} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';

export class ReauthorizationRequired extends Error {
  constructor(){super('REAUTHORIZATION_REQUIRED');this.name='ReauthorizationRequired';}
}

export async function openPrivateAuthDirectory(directory) {
  if (!path.isAbsolute(directory || '')) throw new Error('INVALID_AUTH_DIRECTORY');
  await mkdir(directory,{recursive:true,mode:0o700});
  const resolved=await realpath(directory), stat=await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || resolved!==directory || (stat.mode&0o077)!==0 || stat.uid!==process.getuid()) throw new Error('INVALID_AUTH_DIRECTORY');
  return resolved;
}

async function readPrivate(filename) {
  try {
    const stat=await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink!==1 || (stat.mode&0o077)!==0 || stat.uid!==process.getuid() || stat.size>65536) throw new Error('INVALID_AUTH_FILE');
    const handle=await open(filename,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
    try { const opened=await handle.stat();if(opened.dev!==stat.dev||opened.ino!==stat.ino||!opened.isFile()||opened.nlink!==1||(opened.mode&0o077)!==0||opened.uid!==process.getuid())throw new Error('INVALID_AUTH_FILE');return JSON.parse(await handle.readFile('utf8')); } finally { await handle.close(); }
  } catch(error) { if(error?.code==='ENOENT') return undefined;throw new Error('AUTH_STORAGE_UNAVAILABLE'); }
}

async function writePrivate(filename, value) {
  const temp=path.join(path.dirname(filename),`.auth-${randomBytes(16).toString('hex')}.tmp`);
  try {
    const handle=await open(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600);
    try {await handle.writeFile(JSON.stringify(value),'utf8');await handle.sync();} finally {await handle.close();}
    await rename(temp,filename);
  } finally { await unlink(temp).catch(()=>{}); }
}

export class ScysOAuthProvider {
  constructor({directory,callbackPort=19441,interactive=false,onAuthorization}={}) {
    if (!Number.isInteger(callbackPort)||callbackPort<1024||callbackPort>65535) throw new Error('INVALID_PORT');
    this.directory=directory;this.callbackPort=callbackPort;this.interactive=interactive;this.onAuthorization=onAuthorization;
    this.verifier=undefined;this.requestState=undefined;this.discovery=undefined;this.savedTokens=undefined;
  }
  async initialize(){this.directory=await openPrivateAuthDirectory(this.directory);this.savedTokens=await readPrivate(path.join(this.directory,'scys-feed-v1.json'));return this;}
  get redirectUrl(){return `http://127.0.0.1:${this.callbackPort}/oauth/callback`;}
  get clientMetadata(){return {client_name:'AINPE daily feed',redirect_uris:[this.redirectUrl],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none',scope:'mcp'};}
  clientInformation(){return {client_id:'scys-codex',token_endpoint_auth_method:'none'};}
  tokens(){return this.savedTokens;}
  async saveTokens(tokens){if(!tokens||typeof tokens!=='object'||typeof tokens.access_token!=='string'||tokens.access_token.length>32768)throw new Error('INVALID_TOKEN_RESPONSE');await writePrivate(path.join(this.directory,'scys-feed-v1.json'),tokens);this.savedTokens=tokens;}
  state(){this.requestState=randomBytes(32).toString('hex');return this.requestState;}
  saveCodeVerifier(value){this.verifier=value;}
  codeVerifier(){if(!this.verifier)throw new Error('VERIFIER_UNAVAILABLE');return this.verifier;}
  saveDiscoveryState(value){
    // Refuse metadata which does not echo the issuer selected through MCP
    // discovery; otherwise refresh credentials could be sent to another host.
    try {
      const issuer=new URL(value.authorizationServerUrl), metadata=value.authorizationServerMetadata;
      if(issuer.href.replace(/\/$/,'')!=='https://mcp.scys.com/mcp-oauth'||issuer.username||issuer.password||!metadata||
        new URL(metadata.issuer).href.replace(/\/$/,'')!==issuer.href.replace(/\/$/,'')||
        new URL(metadata.authorization_endpoint).href!=='https://mcp.scys.com/mcp-oauth/authorize'||
        new URL(metadata.token_endpoint).href!=='https://mcp.scys.com/mcp-oauth/token') throw new Error();
    } catch {throw new Error('INVALID_AUTHORIZATION_METADATA');}
    this.discovery=value;
  }
  discoveryState(){return this.discovery;}
  invalidateCredentials(scope){if(scope==='tokens'||scope==='all')this.savedTokens=undefined;if(scope==='discovery'||scope==='all')this.discovery=undefined;}
  redirectToAuthorization(url){
    if(!this.interactive)throw new ReauthorizationRequired();
    if(!(url instanceof URL)||url.origin!=='https://mcp.scys.com'||url.pathname!=='/mcp-oauth/authorize'||url.username||url.password||url.hash)throw new Error('INVALID_AUTHORIZATION_DESTINATION');
    const scopes=String(url.searchParams.get('scope')||'').split(/\s+/).filter(Boolean);
    if(scopes.length!==1||scopes[0]!=='mcp')throw new Error('INVALID_AUTHORIZATION_SCOPE');
    const advertised=this.discovery?.authorizationServerMetadata?.authorization_endpoint;
    if(advertised){const target=new URL(advertised);if(target.origin!==url.origin||target.pathname!==url.pathname)throw new Error('INVALID_AUTHORIZATION_DESTINATION');}
    if(typeof this.onAuthorization!=='function')throw new Error('AUTHORIZATION_UNAVAILABLE');
    return this.onAuthorization(url);
  }
}
