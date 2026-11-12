// 微信小程序账号：仅在用户主动登录后同步学习记录；不上传教程中输入的内容。
import { ref } from 'vue';
import { uploadMiniAvatar } from './mini-avatar.js';
const BASE = 'https://ainpe.aisen.xin';
const SESSION = 'ainpe_mini_account_session_v1', BASELINE = 'ainpe_mini_account_baseline_v1', OWNER = 'ainpe_mini_account_owner_v1';
const DEVICE_KEYS = ['ainpe_mini_learning_v1','ainpe_mini_favorites_v1','ainpe_mini_ai_level_v1','ainpe_mini_potential_v1','ainpe_mini_zuo_v1','ainpe_mini_book_practice_v1','ainpe_mini_course_practice_v1','ainpe_mini_badges_seen_v1'];
const backupKey = id => 'ainpe_mini_account_backup_v1_' + id;
const baselineKey = id => BASELINE + '_' + id;
const pendingKey = id => 'ainpe_mini_account_pending_v1_' + id;
const attemptKey = id => 'ainpe_mini_account_backup_attempt_v1_' + id;
const KEYS = { learning: 'ainpe_mini_learning_v1', favorites: 'ainpe_mini_favorites_v1', ai: 'ainpe_mini_ai_level_v1', potential: 'ainpe_mini_potential_v1' };
const read = (k, fallback) => { try { return uni.getStorageSync(k) || fallback; } catch { return fallback; } };
const write = (k, v) => uni.setStorageSync(k, v);
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const copy = v => JSON.parse(JSON.stringify(v));
const empty = () => ({ learning: {}, favorites: [], ai: {v:1,xp:0,daily:{},lessons:{}}, potential: {} });
let token = '', accountId = '', revision = null, baseline = empty(), timer, syncing = false, queued = false, epoch = 0;
export const account = ref({ loggedIn:false, nickname:'', avatar:'', status:'未登录，记录保存在本机' });
export const conflictView = ref(null);
export const accountBackups = ref([]);
export const accountGeneration = () => epoch;
function confirmImport() { return new Promise(resolve=>uni.showModal({title:'同步本机学习记录',content:'是否将本机的学习进度、收藏、等级和潜力卡同步到当前微信账号？',confirmText:'同意同步',cancelText:'暂不同步',success:r=>resolve(!!r.confirm),fail:()=>resolve(false)})); }
function hasLocalData(s) { return Object.keys(s.learning).length || s.favorites.length || s.ai.xp || Object.keys(s.ai.daily).length || Object.keys(s.ai.lessons).length || Object.keys(s.potential.answers).length; }
function isolateAccount(oldId,newId) { const snapshot={};for(const k of DEVICE_KEYS)snapshot[k]=read(k,null);const previous=read(backupKey(newId),{});write(backupKey(oldId),snapshot);try{for(const k of DEVICE_KEYS){if(previous[k]!==null&&previous[k]!==undefined)write(k,previous[k]);else uni.removeStorageSync(k);}write(OWNER,newId);}catch(e){for(const k of DEVICE_KEYS){if(snapshot[k]!==null&&snapshot[k]!==undefined)write(k,snapshot[k]);else uni.removeStorageSync(k);}throw e;} }
function profileText(p) { return typeof p?.nickname === 'string' ? p.nickname.slice(0, 40) : ''; }
function stateLocal() {
  const l = obj(read(KEYS.learning, {})), learning = {};
  for (const [id,v] of Object.entries(l)) { if (!v || typeof v !== 'object') continue; learning[id] = { completedSteps: Array.isArray(v.completedSteps) ? [...new Set(v.completedSteps.filter(x=>Number.isInteger(x)&&x>=0&&x<100))] : [] }; if(typeof v.updatedAt==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v.updatedAt))learning[id].updatedAt=v.updatedAt; }
  const favorites=read(KEYS.favorites, []), rawAi=obj(read(KEYS.ai,{})), p=obj(read(KEYS.potential,{}));
  return { learning, favorites:Array.isArray(favorites)?favorites.filter(x=>typeof x==='string'):[], ai:{v:1,xp:typeof rawAi.xp==='number'&&Number.isFinite(rawAi.xp)&&rawAi.xp>=0?rawAi.xp:0,daily:obj(rawAi.daily),lessons:obj(rawAi.lessons)}, potential:{answers:obj(p.answers)} };
}
function normalized(v) { const x=obj(v), d=empty(); return {learning:obj(x.learning),favorites:Array.isArray(x.favorites)?x.favorites.filter(y=>typeof y==='string'):[],ai:{...d.ai,...obj(x.ai),daily:obj(x.ai?.daily),lessons:obj(x.ai?.lessons)},potential:{answers:obj(x.potential?.answers)}}; }
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function map3(base,local,remote) { const out={}; for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){ const b=base[k], l=local[k], r=remote[k]; const v=eq(l,b)?r:eq(r,b)||eq(l,r)?l:undefined; if(v===undefined && !eq(l,b) && !eq(r,b) && !eq(l,r)) throw Error('conflict'); if(v!==undefined) out[k]=v; } return out; }
function list3(b,l,r){return Object.keys(map3(Object.fromEntries(b.map(x=>[x,true])),Object.fromEntries(l.map(x=>[x,true])),Object.fromEntries(r.map(x=>[x,true]))));}
function merge(base, local, remote) {
  base=normalized(base); local=normalized(local); remote=normalized(remote); const out=empty();
  for(const id of new Set([...Object.keys(base.learning),...Object.keys(local.learning),...Object.keys(remote.learning)])) { const b=base.learning[id]||{}, l=local.learning[id]||{}, r=remote.learning[id]||{}; out.learning[id]={completedSteps:list3(b.completedSteps||[],l.completedSteps||[],r.completedSteps||[]).map(Number).sort((a,b)=>a-b)};const time=[b.updatedAt,l.updatedAt,r.updatedAt].filter(Boolean).sort().pop();if(time)out.learning[id].updatedAt=time; }
  out.favorites=list3(base.favorites,local.favorites,remote.favorites);
  out.ai.daily=map3(base.ai.daily,local.ai.daily,remote.ai.daily); out.ai.lessons=map3(base.ai.lessons,local.ai.lessons,remote.ai.lessons);
  const localDelta=local.ai.xp-base.ai.xp, remoteDelta=remote.ai.xp-base.ai.xp;
  if(localDelta<0||remoteDelta<0) throw Error('conflict');
  if(localDelta && remoteDelta){ const ld=Object.keys(local.ai.daily).filter(k=>!base.ai.daily[k]), rd=new Set(Object.keys(remote.ai.daily).filter(k=>!base.ai.daily[k])); if(ld.some(k=>rd.has(k))) throw Error('conflict'); }
  out.ai.xp=base.ai.xp+localDelta+remoteDelta;
  out.potential.answers=map3(base.potential.answers,local.potential.answers,remote.potential.answers);
  return out;
}
function apply(s) { const before=stateLocal(); try { write(KEYS.learning,s.learning);write(KEYS.favorites,s.favorites);write(KEYS.ai,s.ai); const old=obj(read(KEYS.potential,{}));write(KEYS.potential,{...old,answers:s.potential.answers}); } catch(e) { try{write(KEYS.learning,before.learning);write(KEYS.favorites,before.favorites);write(KEYS.ai,before.ai);}catch{} throw e; } }
function request(path, method='GET', data, auth=token) { return new Promise((resolve,reject)=>uni.request({url:BASE+path,method,data,header:auth?{Authorization:'Bearer '+auth}:{},success:r=>r.statusCode>=200&&r.statusCode<300?resolve(r.data):reject(Object.assign(Error('request'),{status:r.statusCode,code:r.data?.error})),fail:()=>reject(Error('network'))})); }
function avatar() { if(!token)return; const e=epoch,auth=token;uni.downloadFile({url:BASE+'/api/mini-user/avatar',header:{Authorization:'Bearer '+auth},success:r=>{if(e===epoch&&auth===token&&r.statusCode===200)account.value={...account.value,avatar:r.tempFilePath};}}); }
function updateProfile(p) { account.value={...account.value,nickname:profileText(p)}; if(p?.hasAvatar)avatar(); }
export function restoreAccount() { if(token)return;const s=read(SESSION,{}); if(!s.token||!s.accountId)return; if(s.expiresAt&&Date.now()>=Number(new Date(s.expiresAt)))return; token=s.token;accountId=s.accountId;epoch++;const b=read(baselineKey(accountId),{}); if(b.accountId===accountId){baseline=normalized(b.state);revision=b.revision;}account.value={...account.value,loggedIn:true,status:'准备同步'}; syncAccount(); }
export async function loginAccount() {
  const startEpoch=++epoch;account.value={...account.value,status:'正在登录…'};
  try { const code=await new Promise((resolve,reject)=>uni.login({provider:'weixin',success:r=>r.code?resolve(r.code):reject(Error('login')),fail:reject}));if(startEpoch!==epoch)return;const result=await request('/api/mini-auth/login','POST',{code},'');if(startEpoch!==epoch)return;
    if(!result?.token||!result?.accountId)throw Error('invalid'); const candidateToken=result.token,candidateId=result.accountId;
    const owner=read(OWNER,'');if(owner&&owner!==candidateId)isolateAccount(owner,candidateId);else if(!owner&&hasLocalData(stateLocal())){const accepted=await confirmImport();if(startEpoch!==epoch){request('/api/mini-auth/logout','POST',{},candidateToken).catch(()=>{});return;}if(!accepted){request('/api/mini-auth/logout','POST',{},candidateToken).catch(()=>{});account.value={...account.value,status:'未登录，记录保存在本机'};return;}}
    if(startEpoch!==epoch)return;token=candidateToken;accountId=candidateId;revision=null;baseline=empty();const b=read(baselineKey(accountId),{});if(b.accountId===accountId){baseline=normalized(b.state);revision=b.revision;}
    if(startEpoch!==epoch)return;write(SESSION,{token,accountId,expiresAt:result.expiresAt});account.value={...account.value,loggedIn:true,status:'正在同步…'};updateProfile(result.profile);await syncAccount();
  } catch {if(startEpoch===epoch){const failed=token;token='';accountId='';try{uni.removeStorageSync(SESSION)}catch{}if(failed)request('/api/mini-auth/logout','POST',{},failed).catch(()=>{});account.value={...account.value,loggedIn:false,status:'登录或同步未完成，记录仍保存在本机'};}}
}
export async function syncAccount() {
  if(!token)return; if(syncing){queued=true;return;} syncing=true;const startEpoch=epoch;account.value={...account.value,status:'正在同步…'};
  try { const owner=read(OWNER,''); if(owner&&owner!==accountId){account.value={...account.value,status:'本机记录属于其他账号，暂未同步'};return;}
    for(let n=0;n<3;n++) { const remote=await request('/api/mini-user/state'); if(startEpoch!==epoch)return;updateProfile(remote.profile); const pending=read(pendingKey(accountId),null);if(pending){if(eq(normalized(remote.state),normalized(pending.state)) && remote.revision>pending.baseRevision){const local=stateLocal();if(pending.resolution){if(!eq(local,pending.current))throw Error('conflict');apply(normalized(pending.state));}else apply(merge(pending.current,local,pending.state));baseline=normalized(pending.state);revision=remote.revision;write(baselineKey(accountId),{accountId,revision,state:baseline});write(OWNER,accountId);uni.removeStorageSync(pendingKey(accountId));}else if(remote.revision===pending.baseRevision){uni.removeStorageSync(pendingKey(accountId));}else throw Error('conflict');} const current=stateLocal(), combined=merge(baseline,current,normalized(remote.state));
      try { write(pendingKey(accountId),{baseRevision:remote.revision,state:combined,current});const result=await request('/api/mini-user/state','PUT',{baseRevision:remote.revision,state:combined}); if(startEpoch!==epoch)return;const latest=stateLocal(), updated=eq(latest,current)?combined:merge(current,latest,combined);apply(updated);baseline=combined;revision=result.revision;write(baselineKey(accountId),{accountId,revision,state:combined});write(OWNER,accountId);uni.removeStorageSync(pendingKey(accountId));if(!eq(latest,current))queued=true; account.value={...account.value,status:'学习记录已同步'};break; }
      catch(e){if(startEpoch!==epoch)return;if(e.status===409&&n<2){uni.removeStorageSync(pendingKey(accountId));continue;}throw e;}
    }
  } catch(e) { if(startEpoch===epoch)account.value={...account.value,status:e.message==='conflict'?'两端记录有冲突，已保留本机记录':'暂未同步，记录保存在本机'}; }
  finally {syncing=false;if(queued){queued=false;scheduleSync();}}
}
export function scheduleSync() { if(!token)return;clearTimeout(timer);timer=setTimeout(syncAccount,1000); }
export async function updateNickname(nickname) { const name=Array.from(String(nickname||'').trim()).slice(0,30).join(''),e=epoch,auth=token;if(!auth||!name)return false;try{const p=await request('/api/mini-user/profile','PUT',{nickname:name},auth);if(e!==epoch)return false;updateProfile(p.profile||p);return true}catch{return false} }
export function updateAvatar(filePath) { const auth=token,e=epoch;return uploadMiniAvatar({platform:uni,wxApi:typeof wx==='undefined'?null:wx,url:BASE+'/api/mini-user/avatar',auth,filePath,isCurrent:()=>e===epoch&&auth===token,onSaved:path=>{account.value={...account.value,avatar:path};try{avatar()}catch{}}}); }
export async function logoutAccount(){conflictView.value=null;accountBackups.value=[];clearTimeout(timer);const auth=token;epoch++;token='';accountId='';revision=null;baseline=empty();try{uni.removeStorageSync(SESSION)}catch{} account.value={loggedIn:false,nickname:'',avatar:'',status:'已退出，记录保存在本机'};if(auth)try{await request('/api/mini-auth/logout','POST',{},auth)}catch{}}

// 一旦两个设备的数据有冲突，不擅自计算经验；由用户比较后选择。
const brief = s => { s=normalized(s);return {xp:s.ai.xp, daily:Object.keys(s.ai.daily).length, lessons:Object.keys(s.ai.lessons).length, favorites:s.favorites.length, guides:Object.values(s.learning).filter(v=>Array.isArray(v.completedSteps)&&v.completedSteps.length).length}; };
const changed = () => Object.assign(Error('changed'),{code:'changed'});
function msg(e) { return e.message==='random_unavailable'?'请更新微信后重试，原记录已保留':e.code==='backup_limit'?'备份已满，请先查看并删除不需要的备份':e.code==='revision_conflict'||e.status===409||e.code==='changed'?'记录刚刚发生变化，请重新查看后选择':'网络或保存失败，原记录已保留'; }
function getUuid() { return new Promise((resolve,reject)=>{if(typeof wx==='undefined'||!wx.getRandomValues)return reject(Error('random_unavailable'));wx.getRandomValues({length:16,success:r=>{const a=new Uint8Array(r.randomValues);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const x=Array.from(a,n=>n.toString(16).padStart(2,'0')).join('');resolve(x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20));},fail:reject});}); }
function confirmChoice(text,title='确认恢复记录'){return new Promise(resolve=>uni.showModal({title,content:text,confirmText:'确认',cancelText:'取消',success:r=>resolve(!!r.confirm),fail:()=>resolve(false)}));}
async function exclusive(fn) { if(!token||syncing){if(token)account.value={...account.value,status:'正在同步，请稍后再试'};return false;}const e=epoch,id=accountId,auth=token;syncing=true;try{return await fn({e,id,auth})}catch(error){if(e===epoch)account.value={...account.value,status:msg(error)};return false}finally{syncing=false;if(queued){queued=false;scheduleSync();}} }
function valid(c){return c.e===epoch && c.id===accountId && c.auth===token;}
async function capture(c){const local=stateLocal(),remote=await request('/api/mini-user/state','GET',undefined,c.auth);if(!valid(c)||!eq(local,stateLocal()))throw changed();return {local,remote:normalized(remote.state),baseRevision:remote.revision};}
export async function inspectAccountConflict(){return exclusive(async c=>{const snapshot=await capture(c);if(!valid(c))return false;conflictView.value={snapshot,choices:[{key:'local',label:'使用本机记录',summary:brief(snapshot.local)},{key:'remote',label:'使用云端记录',summary:brief(snapshot.remote)}],heading:'本机和云端记录不同',description:'请选择要使用的一份。两份记录会先保存到备份，之后可以查看和恢复。'};return true;});}
export async function loadAccountBackups(){return exclusive(async c=>{const data=await request('/api/mini-user/backups','GET',undefined,c.auth);if(!valid(c))return false;accountBackups.value=Array.isArray(data.backups)?data.backups:[];return true;});}
export async function inspectAccountBackup(id,side){return exclusive(async c=>{if(!['local','remote'].includes(side))return false;const saved=await request('/api/mini-user/backups/'+encodeURIComponent(id),'GET',undefined,c.auth);if(!valid(c))return false;const snapshot=await capture(c);if(!valid(c))return false;const restored=normalized(saved[side]);conflictView.value={snapshot,choices:[{key:'restore',label:'恢复这份备份',summary:brief(restored)}],restored,heading:'恢复备份',description:'将用这份备份替换当前记录；替换前，会先备份当前本机和云端记录。'};return true;});}
export async function deleteAccountBackup(id){const c={e:epoch,id:accountId,auth:token};if(!c.auth||!await confirmChoice('删除后，这份备份将无法恢复。确定删除吗？','删除备份')||!valid(c))return false;return exclusive(async x=>{await request('/api/mini-user/backups/'+encodeURIComponent(id),'DELETE',undefined,x.auth);if(!valid(x))return false;accountBackups.value=accountBackups.value.filter(b=>b.id!==id);return true;});}
export async function chooseAccountResolution(key){const originalView=conflictView.value,c={e:epoch,id:accountId,auth:token};if(!originalView||!c.auth||!originalView.choices.some(x=>x.key===key))return false;const view=copy(originalView);const selected=key==='restore'?view.restored:view.snapshot[key];if(!await confirmChoice('确认使用所选记录？替换前会先保存两端备份，之后可在备份记录中恢复。')||!valid(c)||conflictView.value!==originalView)return false;
 return exclusive(async x=>{if(!valid(c)||!eq(view.snapshot.local,stateLocal()))throw changed();const oldPending=read(pendingKey(x.id),null);const states=[view.snapshot.local];if(oldPending){for(const v of [oldPending.current,oldPending.state])if(v&&!states.some(s=>eq(s,v)))states.push(v);}let attempt=read(attemptKey(x.id),null);if(!attempt||attempt.baseRevision!==view.snapshot.baseRevision||!eq(attempt.states,states)){const ids=[];for(const _ of states){ids.push(await getUuid());if(!valid(x))return false;}attempt={baseRevision:view.snapshot.baseRevision,states,ids};write(attemptKey(x.id),attempt);}for(let i=0;i<states.length;i++){await request('/api/mini-user/backups','POST',{requestId:attempt.ids[i],baseRevision:view.snapshot.baseRevision,local:states[i]},x.auth);if(!valid(x))return false;if(!eq(view.snapshot.local,stateLocal()))throw changed();}
  const chosen=normalized(selected);write(pendingKey(x.id),{baseRevision:view.snapshot.baseRevision,state:chosen,current:view.snapshot.local,resolution:true});const result=await request('/api/mini-user/state','PUT',{baseRevision:view.snapshot.baseRevision,state:chosen},x.auth);if(!valid(x))return false;const latest=stateLocal();apply(eq(latest,view.snapshot.local)?chosen:merge(view.snapshot.local,latest,chosen));baseline=chosen;revision=result.revision;write(baselineKey(x.id),{accountId:x.id,revision,state:chosen});write(OWNER,x.id);uni.removeStorageSync(pendingKey(x.id));uni.removeStorageSync(attemptKey(x.id));conflictView.value=null;account.value={...account.value,status:'学习记录已同步，另一份已存入备份'};if(!eq(latest,view.snapshot.local))queued=true;return true; });}
