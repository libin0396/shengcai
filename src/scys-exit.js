// Only real 生财站点 receive a local intermediate page. Keep the original
// destination intact, including query parameters and fragments.
export function isScysDestination(value,base){
 try{
  const url=base?new URL(value,base):new URL(value);
  const host=url.hostname.toLowerCase();
  return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password&&(host==='scys.com'||host.endsWith('.scys.com'));
 }catch{return false;}
}
export function scysExitPath(value,base){
 if(!isScysDestination(value,base))return null;
 return `/source?url=${encodeURIComponent(new URL(value,base).href)}`;
}
