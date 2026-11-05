import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';

const HEADERS={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"};
function page(res,status,message){res.writeHead(status,HEADERS);res.end(`<!doctype html><meta charset="utf-8"><title>AINPE 授权</title><p>${message}</p>`);}
function same(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;return timingSafeEqual(Buffer.from(a),Buffer.from(b));}
function equalIssuer(a,b){try{const x=new URL(a),y=new URL(b);return x.href.replace(/\/$/,'')===y.href.replace(/\/$/,'');}catch{return false;}}

export function createAuthCallbackServer({port,provider,transport,getDestination,onDone}) {
  let completed=false,started=false,outcome=null;
  function finish(res,ok){
    completed=true;outcome=ok;
    // Remove the authorization response from the browser address immediately.
    res.writeHead(303,{...HEADERS,Location:ok?'/done':'/failed'});res.end();
    const timer=setTimeout(()=>onDone(ok),3000);timer.unref();
  }
  return createServer(async(req,res)=>{
    try{
      if(req.method!=='GET'||req.headers.host!==`127.0.0.1:${port}`)return page(res,400,'无法处理此请求。');
      const parsed=new URL(req.url,`http://127.0.0.1:${port}`);
      if(parsed.pathname==='/done'&&outcome===true){page(res,200,'授权已完成，可以关闭此页面。');onDone(true);return;}
      if(parsed.pathname==='/failed'&&outcome===false){page(res,400,'授权未完成，请返回应用查看状态。');onDone(false);return;}
      if(parsed.pathname==='/start'){
        const destination=getDestination();if(started||!destination)return page(res,409,'授权流程不可重复启动。');
        started=true;res.writeHead(302,{...HEADERS,Location:destination.href});res.end();return;
      }
      if(parsed.pathname!=='/oauth/callback'||!started||completed)return page(res,404,'页面不存在。');
      const states=parsed.searchParams.getAll('state'), codes=parsed.searchParams.getAll('code'), issuers=parsed.searchParams.getAll('iss');
      const discovery=provider.discoveryState();
      if(states.length!==1||codes.length!==1||issuers.length>1||!same(states[0],provider.requestState)||!codes[0]||codes[0].length>8192||
        (issuers.length===1&&!equalIssuer(issuers[0],discovery?.authorizationServerUrl))||
        (discovery?.authorizationServerMetadata?.authorization_response_iss_parameter_supported===true&&issuers.length!==1)) {
        finish(res,false);return;
      }
      completed=true;
      try{await transport.finishAuth(codes[0]);finish(res,true);}
      catch{finish(res,false);}
    }catch{if(!res.headersSent)page(res,400,'授权未完成，请返回应用查看状态。');else res.end();completed=true;onDone(false);}
  });
}
