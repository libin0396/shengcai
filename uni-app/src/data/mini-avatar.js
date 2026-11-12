// 所有图片处理均由微信在本机完成；不读取或记录图片内容。
const LIMIT = 512 * 1024, TARGET = 480 * 1024;
const ok = () => ({ok:true});
const fail = reason => ({ok:false,reason});
function reasonOf(error, fallback) {
  // 仅内部判断错误类型，URL、路径与原始错误均不保存或展示。
  const text=String(error?.errMsg || error?.message || '').toLowerCase().replace(/https?:\/\/[^\s"'<>]+/g,'[url]');
  if (/timed? ?out|timeout|超时/.test(text)) return 'timeout';
  if (/network|offline|internet|connection|socket|econn|网络/.test(text)) return 'network';
  if (/url not in (?:the )?domain list|not in (?:the )?(?:allowed |legal )?domain|domain (?:is )?not (?:configured|allowed)|(?:url|域名).{0,24}(?:合法域名|域名白名单|domain list)|不在.{0,12}合法域名/.test(text)) return 'configuration';
  if (/err_(?:ssl|cert)|(?:ssl|tls) (?:error|fail|handshake)|certificate (?:error|fail|invalid|expired)|证书(?:错误|无效|过期)/.test(text)) return 'tls';
  if (/auth deny|auth denied|permission|not authorized|access denied|no permission|权限不足|没有权限/.test(text)) return 'permission';
  if (/no such file|file (?:not found|does not exist|not exist|invalid)|invalid file|enoent|文件不存在|文件无法读取/.test(text)) return 'local_file';
  return fallback;
}
const ERROR_TEXT={
  login:['A01','登录已过期，请重新登录后再试。'],
  permission:['A02','头像访问未获许可，请检查微信权限后重试。'],
  server_permission:['A03','头像上传服务拒绝了请求，请稍后再试。'],
  configuration:['A04','头像上传域名未通过微信校验，请稍后重试。'],
  network:['A05','网络连接失败，请检查网络后重试。'],
  timeout:['A06','头像上传超时，请检查网络后重试。'],
  local_file:['A07','微信未能读取选中的头像，请重新选择。'],
  tls:['A08','头像上传连接的证书校验未通过，请稍后重试。'],
  format:['A09','头像格式或上传校验未通过，请换一张头像或稍后重试。'],
  too_large:['A10','头像未能自动压缩到合适大小，请换一张图片。'],
  compression:['A11','头像自动压缩失败，请重试或换一张头像。'],
  rate:['A12','操作太频繁，请稍后再试。'],
  service:['A13','头像服务暂时不可用，请稍后重试。'],
  upload:['A14','头像上传未成功，请稍后重试。'],
  selection:['A15','未选到头像，请重新选择。'],
};
export function avatarFailureText(reason){const [code,message]=ERROR_TEXT[reason]||ERROR_TEXT.upload;return message+'（诊断码 '+code+'）';}
function metadata(platform, filePath) { return new Promise(resolve=>{
  if(typeof platform.getImageInfo!=='function')return resolve({});
  try{platform.getImageInfo({src:filePath,success:r=>resolve({width:Number(r.width)||0,height:Number(r.height)||0}),fail:()=>resolve({})});}catch{resolve({})}
}); }
function fileSize(wxApi,platform,filePath) { return new Promise(resolve=>{
  let manager;try{manager=wxApi?.getFileSystemManager?.() || platform.getFileSystemManager?.()}catch{return resolve(null)}
  if(!manager||typeof manager.getFileInfo!=='function')return resolve(null);
  try{manager.getFileInfo({filePath,success:r=>resolve(Number.isFinite(r.size)&&r.size>=0?r.size:null),fail:()=>resolve(null)});}catch{resolve(null)}
}); }
function compressTo(platform, src, width, height, edge, quality) { return new Promise(resolve=>{
  if(typeof platform.compressImage!=='function')return resolve(fail('compression'));
  const dimensions=height>width?{compressedHeight:edge}:{compressedWidth:edge};
  try{platform.compressImage({src,quality,...dimensions,success:r=>resolve(r?.tempFilePath?{ok:true,path:r.tempFilePath}:fail('compression')),fail:e=>resolve(fail(reasonOf(e,'compression')))});}catch{resolve(fail('compression'))}
}); }
function upload(platform,url,auth,filePath) { return new Promise(resolve=>{
  if(typeof platform.uploadFile!=='function')return resolve(fail('upload'));
  try{platform.uploadFile({url,filePath,name:'image',header:{Authorization:'Bearer '+auth},timeout:20000,
    success:r=>{
      const status=Number(r.statusCode)||0;if(status>=200&&status<300)return resolve(ok());
      if(status===401)return resolve(fail('login'));
      if(status===403)return resolve(fail('server_permission'));
      if(status===413)return resolve(fail('too_large'));
      if(status===400||status===415)return resolve(fail('format'));
      if(status===429)return resolve(fail('rate'));
      return resolve(fail('service'));
    },fail:e=>resolve(fail(reasonOf(e,'upload')))});}catch{resolve(fail('upload'))}
}); }
export async function uploadMiniAvatar({platform,wxApi,url,auth,filePath,isCurrent,onSaved}) {
  if(!auth)return fail('login');if(!filePath)return fail('selection');
  const [info,size]=await Promise.all([metadata(platform,filePath),fileSize(wxApi,platform,filePath)]);
  if(!isCurrent())return fail('changed');
  const dimensionsTooLarge=info.width>4096||info.height>4096;
  let initial=fail('too_large');
  if(!dimensionsTooLarge&&(size===null||size<=LIMIT)){
    initial=await upload(platform,url,auth,filePath);if(!isCurrent())return fail('changed');
    if(initial.ok){onSaved(filePath);return initial;}if(initial.reason!=='too_large')return initial;
  }
  // 大图按最长边等比例缩放，优先保留 1024px 与较高质量；仍超限再逐级压缩。
  for(const [edge,quality] of [[1024,86],[768,80],[512,74],[384,68]]) {
    const result=await compressTo(platform,filePath,info.width,info.height,edge,quality);if(!isCurrent())return fail('changed');if(!result.ok)return result;
    const compressedSize=await fileSize(wxApi,platform,result.path);if(!isCurrent())return fail('changed');
    if(compressedSize!==null&&compressedSize>TARGET)continue;
    const sent=await upload(platform,url,auth,result.path);if(!isCurrent())return fail('changed');
    if(sent.ok){onSaved(result.path);return sent;}if(sent.reason!=='too_large')return sent;
  }
  return fail('too_large');
}
