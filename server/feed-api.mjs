import {readFeed,getFeedStatus,DEFAULT_ROOT} from './feed-store.mjs';
export function createFeedMiddleware({root=DEFAULT_ROOT}={}){
 return async(req,res,next)=>{
  const pathname=(req.url||'').split('?')[0];if(pathname!=='/api/feed'&&pathname!=='/api/feed/status')return next();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.end(JSON.stringify({error:'method_not_allowed'}));return;}
  if(req.headers.origin){try{const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host){res.statusCode=403;res.end(JSON.stringify({error:'origin_not_allowed'}));return;}}catch{res.statusCode=403;res.end(JSON.stringify({error:'origin_not_allowed'}));return;}}
  try{const body=pathname==='/api/feed'?await readFeed({root}):await getFeedStatus({root});res.statusCode=200;res.end(req.method==='HEAD'?undefined:JSON.stringify(body));}catch{res.statusCode=503;res.end(JSON.stringify({error:'feed_unavailable'}));}
 };
}
export function feedApiPlugin(options){return {name:'ainpe-local-feed',configureServer(server){server.middlewares.use(createFeedMiddleware(options));},configurePreviewServer(server){server.middlewares.use(createFeedMiddleware(options));}};}
