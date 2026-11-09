<template>
  <view class="admin-page">
    <view class="admin-shell">
      <view class="topline">
        <view><text class="brand">AINPE</text><text class="top-label">站长中心</text></view>
        <button v-if="authenticated" class="logout" :disabled="busy" @click="logout">退出登录</button>
      </view>

      <view v-if="checking" class="status-card" role="status">正在检查登录状态…</view>
      <view v-else-if="!authenticated" class="login-card">
        <text class="eyebrow">PRIVATE DASHBOARD</text>
        <text class="login-title">查看网站数据</text>
        <text class="muted login-copy">输入站长密码，查看模拟体验和推广入口的使用情况。</text>
        <text class="field-label">站长密码</text>
        <input v-model="password" class="password-field" type="text" :password="true" aria-label="站长密码" autocomplete="current-password" placeholder="请输入密码" :disabled="busy" @confirm="login" />
        <text v-if="message" class="error" role="alert">{{ message }}</text>
        <button class="primary login-button" :disabled="busy || !password" @click="login">{{ busy ? '正在验证…' : '登录查看' }}</button>
        <text class="login-hint">密码仅用于本次登录，不会保存在此页面。</text>
      </view>

      <view v-else>
        <view class="heading">
          <view><text class="eyebrow">WEBSITE OVERVIEW</text><text class="title">网站数据</text><text class="subtitle">看看大家如何体验项目、了解体验营。</text></view>
          <button class="refresh" :disabled="busy" @click="loadStats">{{ busy ? '更新中…' : '↻ 刷新' }}</button>
        </view>
        <view class="periods" aria-label="统计时间范围">
          <button v-for="option in periods" :key="option" :class="{selected:days===option}" :disabled="busy" @click="setDays(option)">近 {{ option }} 天</button>
        </view>
        <text v-if="message" class="error card-error" role="alert">{{ message }}</text>
        <view v-if="busy && !stats" class="status-card" role="status">正在读取统计…</view>
        <view v-else-if="stats && !stats.available" class="status-card">统计数据暂不可用。网站还没有可读取的统计记录，请稍后再试。</view>
        <template v-else-if="stats && stats.available">
          <view class="range-line"><text>{{ rangeLabel }}</text><text>北京时间</text></view>
          <view class="metric-grid">
            <view v-for="item in coreMetrics" :key="item.key" class="metric-card">
              <view class="metric-title">{{ item.label }}<text v-if="item.badge" class="metric-badge">{{ item.badge }}</text></view>
              <view class="metric-value">{{ count(item.key,'browsers') }}<text> 个浏览器</text></view>
              <text class="metric-detail">{{ count(item.key,'events') }} 次{{ item.unit }}</text>
            </view>
          </view>
          <view class="notice"><text class="notice-title">前台活跃时长估算</text><text>{{ activeTimeLabel }}</text><text>每 15 秒采样：页面在前台且最近 30 秒内有操作才计入；按有采样的浏览器平均。后台、无操作和屏蔽统计不计，多标签可能重复，结果不是精确阅读或停留时间，仅从功能上线后开始。</text></view>
          <view class="section-head"><text class="section-title">找用法反馈</text><text class="section-note">从新版上线后开始</text></view>
          <view class="extra-list"><view class="extra-row"><view><text class="extra-name">有效搜索</text><text class="extra-hint">非空搜索，重复搜索按次数计算</text></view><text class="extra-count">{{ count('findSearches','events') }} 次</text></view><view class="extra-row"><view><text class="extra-name">未找到结果</text><text class="extra-hint">完全无结果的比例 {{ findMissRate }}</text></view><text class="extra-count">{{ count('findMisses','events') }} 次</text></view><view class="extra-row"><view><text class="extra-name">仅找到相关内容</text><text class="extra-hint">有相关案例或模拟，未找到直接用法或教程</text></view><text class="extra-count">{{ count('findRelated','events') }} 次</text></view><view v-for="item in findFeedbackTopics" :key="item.key" class="extra-row"><view><text class="extra-name">{{ item.label }}</text><text class="extra-hint">用户自愿提交的方向</text></view><text class="extra-count">{{ findFeedbackCount(item.key) }} 次</text></view></view><text class="funnel-note">只记录结果类型和用户主动选择的分类，不收集搜索原文；“有结果”不代表结果有帮助。屏蔽统计、网络失败及内部设备不会计入。</text>
          <view class="notice"><text class="notice-title">先看懂这些数字</text><text>人数按匿名浏览器估算，同一人使用不同设备会分别计数；屏蔽统计、清除数据或网络异常也会影响结果。</text><text>“海报来源访问”包括人格卡选项目页和挑战或对战卡挑战页的带标记访问；无法确认是否实际扫码或报名。</text><text>体验营按钮点击不等于加入或报名，当前二维码长按也不会产生该点击事件。</text></view>
          <template v-if="stats.funnel"><view class="section-head"><text class="section-title">模拟后的下一步</text><text class="section-note">按浏览器和项目匹配</text></view><view class="funnel-card"><view class="funnel-step"><text>开始模拟</text><strong>{{ funnelCount('started') }}</strong><small>项体验</small></view><view class="funnel-arrow">→</view><view class="funnel-step"><text>完成模拟</text><strong>{{ funnelCount('finished') }}</strong><small>完成率 {{ funnelRate('finishRate') }}</small></view><view class="funnel-arrow">→</view><view class="funnel-step"><text>完成后访问体验营</text><strong>{{ funnelCount('campVisitsAfterFinish') }}</strong><small>访问率 {{ funnelRate('campAfterFinishRate') }}</small></view></view><text class="funnel-note">同一浏览器按项目分别计数，并按开始、完成、访问体验营的时间顺序匹配；不是实名人数或实际报名，原帖中转也可能产生访问。</text></template>
          <view class="section-head"><text class="section-title">AI 实操学习</text><text class="section-note">浏览器数 / 次数</text></view>
          <view class="extra-list"><view v-for="item in learningMetrics" :key="item.key" class="extra-row"><view><text class="extra-name">{{ item.label }}</text><text class="extra-hint">{{ item.hint }}</text></view><text class="extra-count">{{ stats.metrics?.[item.key] === null ? '暂不可统计' : `${count(item.key,'browsers')} / ${count(item.key,'events')}` }}</text></view></view>
          <view v-if="stats.learnByTopic" class="extra-list" style="margin-top:10px"><view v-for="topic in learningTopics" :key="topic.key" class="extra-row"><view><text class="extra-name">{{ topic.label }}</text><text class="extra-hint">{{ topic.key==='jijiu' ? '历史版本将两个入口合并，无法拆分' : (topic.key==='find' || topic.key==='library' ? '页面访问浏览器数；从新版上线后开始' : '学习页访问 / 标记完成（浏览器数）') }}</text></view><text class="extra-count">{{ topic.key==='find' || topic.key==='library' || topic.key==='jijiu' ? learningTopicCount(topic.key,'browsers') : `${learningTopicCount(topic.key,'browsers')} / ${learningTopicCount(topic.key,'doneBrowsers')}` }}</text></view></view>
          <view v-if="stats.wants" class="extra-list" style="margin-top:10px"><view v-for="item in wantedTopics" :key="item.key" class="extra-row"><view><text class="extra-name">{{ item.label }}</text><text class="extra-hint">表达过此方向兴趣的浏览器数</text></view><text class="extra-count">{{ wantCount(item.key) }}</text></view></view>
          <text class="funnel-note">完成以页面内的完成或标记事件计算，不代表已完成真实作品；需求只记录分类，不记录输入原文，不会自动通知用户。</text>
          <view class="section-head"><text class="section-title">更多入口</text><text class="section-note">浏览器数 / 次数</text></view>
          <view class="extra-list"><view v-for="item in extraMetrics" :key="item.key" class="extra-row"><view><text class="extra-name">{{ item.label }}</text><text class="extra-hint">{{ item.hint }}</text></view><text class="extra-count">{{ stats.metrics?.[item.key] === null ? '暂不可统计' : `${count(item.key,'browsers')} / ${count(item.key,'events')}` }}</text></view></view>
          <view class="section-head"><text class="section-title">每日趋势</text><text class="section-note">显示事件次数 · 北京时间</text></view>
          <view class="daily-card"><view class="daily-row daily-header"><text>日期</text><text>访问</text><text>开始</text><text>完成</text><text>海报访问</text></view><view v-for="row in dailyRows" :key="row.date" class="daily-row"><text>{{ shortDate(row.date) }}</text><text>{{ dailyCount(row.siteViews) }}</text><text>{{ dailyCount(row.simStarts) }}</text><text>{{ dailyCount(row.simFinishes) }}</text><text>{{ dailyCount(row.posterQrVisits) }}</text></view><view v-if="!dailyRows.length" class="empty">这段时间暂无每日数据。</view></view>
        </template>
        <view class="section-head"><text class="section-title">用户意见</text><text class="section-note">用户自愿提交 · 约 30 天后删除</text></view>
        <view class="extra-list"><view v-if="feedbackMessage" class="empty">{{feedbackMessage}}</view><view v-else-if="!feedbackItems.length" class="empty">暂时没有用户意见。</view><view v-for="(item,index) in feedbackItems" :key="index" class="extra-row"><view><text class="extra-name feedback-text">{{item.message}}</text><text class="extra-hint">{{beijing(item.createdAt)}} · 北京时间</text></view></view></view>
        <text class="footer-note">统计数据最多保留 {{ retentionDays }} 天；用户主动提交的意见单独保存，约 30 天后删除，仅站长可查看。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';

const periods=[7,30,90];
const days=ref(30), password=ref(''), authenticated=ref(false), checking=ref(true), busy=ref(false), message=ref(''), stats=ref(null);
const feedbackItems=ref([]),feedbackMessage=ref('');
const coreMetrics=[
  {key:'simStarts',label:'开始模拟',unit:'开始'},
  {key:'simFinishes',label:'完成模拟',unit:'完成'},
  {key:'campViews',label:'体验营页面访问',unit:'访问'},
  {key:'posterQrVisits',label:'海报来源访问',unit:'访问',badge:'非扫码人数'}
];
const extraMetrics=[
  {key:'siteViews',label:'网站访问',hint:'有记录的页面访问事件'},
  {key:'personaPosterVisits',label:'人格卡来源访问',hint:'带人格卡来源标记的选项目页访问'},
  {key:'challengePosterVisits',label:'挑战 / 对战卡来源访问',hint:'带海报来源标记的挑战页访问'},
  {key:'campClicks',label:'体验营按钮点击（旧版）',hint:'当前长按二维码不会触发此事件'},
  {key:'shareLinkVisits',label:'分享链接访问',hint:'通过带分享来源标记的链接进入挑战页'},
  {key:'posterDownloads',label:'战报下载操作',hint:'仅统计下载按钮，不含微信长按保存'},
  {key:'joinClicks',label:'直接加入入口点击',hint:'点击不代表已加入或付款'}
];
const learningMetrics=[
  {key:'learnViews',label:'学习页访问',hint:'学习相关页面的访问事件'},
  {key:'learnSteps',label:'学习步骤操作',hint:'含引导、点击步骤或展开内容'},
  {key:'onboardOpens',label:'新手引导打开',hint:'包含主动重看，不等于独立新用户'},
  {key:'onboardSkips',label:'新手引导跳过',hint:'按下跳过、点遮罩或按 Esc'},
  {key:'onboardStarts',label:'引导完成或前往课件',hint:'包含新版引导完成和旧版前往课件，不代表已完成课件'},
  {key:'learnDone',label:'标记完成',hint:'含入门标记和进阶流程结束'},
  {key:'workCardSaves',label:'作品卡保存操作',hint:'按钮操作，不含微信长按'},
  {key:'skillCopies',label:'助手内容复制或下载',hint:'操作次数，不代表实际使用'},
  {key:'promptCopies',label:'提示词复制操作',hint:'操作次数，不代表实际使用'},
  {key:'wantSubmits',label:'方向兴趣操作',hint:'仅记录类别，不保存输入原文'},
  {key:'learnCampClicks',label:'学习页访问生财入口',hint:'仅统计点击，不代表报名'}
];
const learningTopics=[{key:'kejian',label:'AI 课件'},{key:'huiben',label:'亲子绘本'},{key:'library',label:'用法库（新版）'},{key:'find',label:'找用法（新版）'},{key:'jijiu',label:'用法库 / 找用法（历史混合）'}];
const wantedTopics=[{key:'kejian',label:'课件'},{key:'huiben',label:'绘本'},{key:'video',label:'故事短片'},{key:'novel',label:'写小说'},{key:'tuwen',label:'图文号'},{key:'assistant',label:'AI 助手'},{key:'money',label:'副业或变现'},{key:'other',label:'其他'}];
const findFeedbackTopics=[{key:'drama',label:'AI 短剧'},{key:'video',label:'AI 视频'},{key:'office',label:'办公与工作'},{key:'content',label:'内容创作'},{key:'education',label:'教育与学习'},{key:'business',label:'项目与副业'},{key:'other',label:'其他'}];
const findMissRate=computed(()=>{const total=stats.value?.metrics?.findSearches?.events,miss=stats.value?.metrics?.findMisses?.events;return Number.isSafeInteger(total)&&total>0&&Number.isSafeInteger(miss)&&miss>=0?`${Math.round(miss/total*1000)/10}%`:'暂无数据'});
function findFeedbackCount(key){return stats.value?.findFeedback===null?'—':nonnegative(stats.value?.findFeedback?.[key]?.events)}
const activeTimeLabel=computed(()=>{const item=stats.value?.metrics?.activeSamples;if(!item||!Number.isSafeInteger(item.events)||!Number.isSafeInteger(item.browsers)||item.browsers<1)return '暂无可统计的活跃时长样本';const seconds=Math.round(item.events*15/item.browsers);return '平均每个有样本的浏览器约 '+Math.floor(seconds/60)+' 分 '+seconds%60+' 秒（'+item.browsers+' 个浏览器）'});
function nonnegative(value){return Number.isSafeInteger(value)&&value>=0?value.toLocaleString('zh-CN'):'0'}
function learningTopicCount(key,field){return nonnegative(stats.value?.learnByTopic?.[key]?.[field])}
function wantCount(key){return nonnegative(stats.value?.wants?.[key])}
const dailyRows=computed(()=>Array.isArray(stats.value?.daily)?stats.value.daily.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))):[]);
const retentionDays=computed(()=>Number.isInteger(stats.value?.period?.retentionDays)?stats.value.period.retentionDays:90);
function count(key,field){const n=stats.value?.metrics?.[key]?.[field];return Number.isSafeInteger(n)&&n>=0?n.toLocaleString('zh-CN'):'—'}
function funnelCount(key){const n=stats.value?.funnel?.[key];return Number.isSafeInteger(n)&&n>=0?n.toLocaleString('zh-CN'):'—'}
function funnelRate(key){const n=stats.value?.funnel?.[key];return typeof n==='number'&&Number.isFinite(n)&&n>=0?`${n}%`:'—'}
function dailyCount(value){const n=typeof value==='object'&&value!==null?value.events:value;return Number.isSafeInteger(n)&&n>=0?n.toLocaleString('zh-CN'):'—'}
function shortDate(date){return /^\d{4}-\d{2}-\d{2}$/.test(String(date))?String(date).slice(5).replace('-','/'):'—'}
function beijing(value){try{return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value))}catch{return '—'}}
const rangeLabel=computed(()=>stats.value?.period?.since&&stats.value?.period?.until?`${beijing(stats.value.period.since)} 至 ${beijing(stats.value.period.until)}`:`近 ${days.value} 天`);
async function request(url,options={}){
  // #ifdef H5
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  let body={};try{body=await response.json()}catch{}
  return {status:response.status,body};
  // #endif
  // #ifndef H5
  return {status:503,body:{}};
  // #endif
}
async function loadStats(){
  if(busy.value)return;busy.value=true;message.value='';
  try{
    const result=await request(`/api/admin/stats?days=${days.value}`);
    if(result.status===401){authenticated.value=false;stats.value=null;feedbackItems.value=[];return}
    if(result.status===429){message.value='请求较频繁，请稍后再试。';return}
    if(result.status!==200 || typeof result.body?.available!=='boolean'){message.value='统计暂不可用，请稍后再试。';return}
    authenticated.value=true;stats.value=result.body;await loadFeedback();
  }catch{message.value='无法连接统计服务，请检查网络后重试。'}finally{checking.value=false;busy.value=false}
}
async function loadFeedback(){
  feedbackMessage.value='';
  try{const result=await request('/api/admin/feedback');if(result.status!==200||!Array.isArray(result.body?.items))throw Error('unavailable');feedbackItems.value=result.body.items.filter(item=>typeof item.message==='string'&&typeof item.createdAt==='string').slice(0,100)}catch{feedbackItems.value=[];feedbackMessage.value='用户意见暂时无法加载，请稍后刷新。'}
}
async function login(){
  if(busy.value||!password.value)return;busy.value=true;message.value='';const value=password.value;password.value='';
  try{
    const result=await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:value})});
    if(result.status===200 && result.body?.ok===true){authenticated.value=true;busy.value=false;await loadStats();return}
    message.value=result.status===429?'尝试次数过多，请稍后再试。':result.status===401?'密码不正确，请重试。':'登录服务暂不可用，请稍后再试。';
  }catch{message.value='无法连接登录服务，请检查网络后重试。'}finally{busy.value=false}
}
async function logout(){
  if(busy.value)return;busy.value=true;message.value='';
  try{const result=await request('/api/admin/logout',{method:'POST'});if(result.status!==200)throw Error('logout_failed');authenticated.value=false;stats.value=null;feedbackItems.value=[];feedbackMessage.value='';password.value=''}catch{message.value='退出失败，请稍后重试。'}finally{busy.value=false}
}
function setDays(value){if(days.value===value)return;days.value=value;stats.value=null;loadStats()}
onMounted(loadStats);
</script>

<style scoped>
.feedback-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
.admin-page{min-height:100vh;background:#f4f4ef;color:#183b2e}.admin-shell{max-width:1040px;margin:0 auto;padding:0 24px 80px}.topline{height:72px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce6dc}.brand{font-size:19px;font-weight:900;letter-spacing:.05em;color:#0d442e}.top-label{margin-left:12px;font-size:12px;color:#819486}.logout,.refresh{background:transparent;border:1px solid #d6e1d4;color:#42624e;font-size:13px;line-height:36px;padding:0 14px;margin:0}.login-card{max-width:460px;margin:70px auto 0;background:#fff;border:1px solid #dde8dc;border-radius:16px;padding:36px}.eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#9aaf91}.login-title,.title{display:block;font-size:30px;line-height:1.3;font-weight:850;color:#123b2b;margin-top:9px}.muted,.subtitle{color:#738a78;font-size:14px;line-height:1.7}.login-copy{display:block;margin-top:10px}.field-label{display:block;font-size:13px;font-weight:700;margin-top:28px}.password-field{height:48px;margin-top:9px;background:#fafbf8;border:1px solid #d7e4d4;border-radius:8px;padding:0 13px;color:#16392b;font-size:16px}.primary{background:#155d3b;color:#fff;font-weight:750}.login-button{width:100%;margin:20px 0 0;line-height:48px;font-size:15px}.login-hint{display:block;margin-top:14px;color:#96a698;font-size:12px;line-height:1.6}.error{display:block;color:#bc3e2e;font-size:13px;line-height:1.6;margin-top:12px}.heading{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin:32px 0 22px}.subtitle{display:block;margin-top:8px}.periods{display:flex;gap:8px;margin-bottom:18px}.periods button{margin:0;padding:0 15px;line-height:38px;background:#e9efe7;color:#607c69;font-size:13px}.periods button.selected{background:#174f35;color:white;font-weight:700}.card-error{padding:12px 14px;border-radius:8px;background:#fff0eb;margin-bottom:14px}.status-card{padding:24px;background:#fff;border:1px solid #e0e8dd;border-radius:12px;color:#78907c;font-size:14px;line-height:1.6}.range-line{display:flex;justify-content:space-between;gap:10px;color:#8b9d8c;font-size:12px;margin-bottom:12px}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric-card{background:#fff;border:1px solid #dde8dc;border-radius:12px;padding:19px 16px;min-width:0}.metric-title{font-size:13px;font-weight:750;color:#526f5c;line-height:1.5}.metric-badge{display:inline-block;margin-left:6px;padding:2px 6px;background:#f0f3e8;color:#84927b;border-radius:8px;font-size:10px;vertical-align:middle}.metric-value{font-size:28px;font-weight:850;color:#0e5a39;margin-top:15px;line-height:1.25}.metric-value text{font-size:11px;color:#839b88;font-weight:500}.metric-detail{display:block;font-size:12px;color:#91a391;margin-top:9px}.notice{background:#edf4e9;border:1px solid #d9e8d5;border-radius:12px;padding:17px 19px;margin-top:18px;color:#5c7961;font-size:12px;line-height:1.8}.notice text{display:block;margin:4px 0}.notice .notice-title{color:#31583d;font-size:13px;font-weight:800}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:28px 0 11px}.section-title{font-size:19px;font-weight:800;color:#173f2f}.section-note{font-size:11px;color:#92a394}.funnel-card{display:flex;align-items:stretch;gap:10px;background:#fff;border:1px solid #dde8dc;border-radius:12px;padding:18px}.funnel-step{flex:1;min-width:0}.funnel-step text,.funnel-step strong,.funnel-step small{display:block}.funnel-step text{font-size:12px;color:#698270;line-height:1.5}.funnel-step strong{font-size:24px;color:#0e5a39;margin:8px 0 4px}.funnel-step small,.funnel-note{font-size:11px;color:#8b9e8e;line-height:1.6}.funnel-arrow{color:#b7cab7;align-self:center}.funnel-note{display:block;margin-top:8px}.extra-list,.daily-card{background:#fff;border:1px solid #dde8dc;border-radius:12px;overflow:hidden}.extra-row{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px 16px;border-bottom:1px solid #edf2ec}.extra-row:last-child{border-bottom:0}.extra-name,.extra-hint{display:block}.extra-name{font-size:13px;font-weight:750}.extra-hint{font-size:11px;color:#91a392;line-height:1.5;margin-top:3px}.extra-count{font-size:14px;color:#1c6140;font-weight:800;white-space:nowrap}.daily-row{display:grid;grid-template-columns:1.2fr repeat(4,1fr);gap:6px;align-items:center;padding:11px 16px;border-top:1px solid #edf2ec;color:#577460;font-size:12px;text-align:right}.daily-row text:first-child{text-align:left}.daily-header{border:0;background:#f7faf5;color:#8ba08c;font-size:11px;font-weight:700}.empty{padding:20px;color:#91a392;font-size:13px}.footer-note{display:block;color:#98aa99;font-size:12px;line-height:1.6;margin-top:18px}@media(max-width:700px){.admin-shell{padding:0 16px 80px}.topline{height:60px}.login-card{margin-top:38px;padding:25px 20px}.heading{margin-top:25px}.title,.login-title{font-size:26px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.metric-card{padding:15px 12px}.metric-title{font-size:12px}.metric-value{font-size:25px}.metric-badge{display:block;width:max-content;margin:4px 0 0}.daily-row{padding:10px 9px;font-size:11px}.daily-header{font-size:10px}.section-note{text-align:right}.refresh{white-space:nowrap}.funnel-card{padding:14px 10px;gap:5px}.funnel-step text{font-size:11px}.funnel-step strong{font-size:20px}.funnel-step small{font-size:10px}}
</style>
