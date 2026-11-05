<template>
  <view class="sc-page">
    <SiteHeader hide-camp />
    <view class="sc-back" @tap="goBack">← 返回上页</view>

    <view class="sc-hero">
      <image class="sc-hero-illo" src="/static/assets/join-boat.svg" mode="widthFix" />
      <view class="sc-in">
        <text class="sc-k">生财有术 · 让想法走向实践</text>
        <text class="sc-h1">本站的每个案例，<br />原帖都在<text class="sc-em">这里</text></text>
        <text class="sc-lead">看看真实案例、实践项目和同行交流，再决定适合自己的下一步。</text>
      </view>
    </view>

    <view class="sc-in sc-body">
      <view v-if="showPlayedNote" class="sc-played"><text>你刚体验了 {{ played.project }}</text><text v-if="played.issues && played.issues.length"> · 回顾：{{ played.issues.slice(0, 2).join('、') }}</text></view>
      <view class="sc-sec">
        <text class="sc-h2">能看到、能参与什么</text><text class="sc-s">内容与参与方式以生财有术当期说明为准</text>
        <view class="sc-data"><view v-for="d in data" :key="d[0]"><text class="sc-dv">{{ d[0] }}</text><text class="sc-dl">{{ d[1] }}</text></view></view>
      </view>

      <view class="sc-sec sc-voy">
        <text class="sc-voy-t">⛵ 了解这些 AI 实战方向</text>
        <view v-for="v in voyage" :key="v[0]" class="sc-voy-r"><text class="sc-voy-a">{{ v[0] }}</text><text class="sc-voy-ar">→</text><text class="sc-voy-b">{{ v[1] }}</text></view>
        <text v-if="voyageOpen" class="sc-voy-f">2026 年 11 月航海：11 月 12 日 23:59 报名截止，11 月 18 日 20:00 开船。具体项目和报名条件以当期公告为准。</text><text v-else class="sc-voy-f">实际开放方向、报名条件与时间以生财有术当期公告为准。</text>
      </view>

      <view class="sc-sec">
        <text class="sc-h2">原帖里都是这样的经验</text><text class="sc-s">作者自述 · 个案收入非净利润或收益保证 · 左右滑动</text>
        <scroll-view scroll-x class="sc-rail" :show-scrollbar="false">
          <view class="sc-rail-in">
            <view v-for="c in cases" :key="c.id" class="sc-cs" @tap="openCase(c.id)">
              <text class="sc-tg">{{ c.tag }}</text><text class="sc-big">{{ c.big }}</text><text class="sc-lb">{{ c.label }}</text>
              <text class="sc-ct">{{ c.title }}</text>
              <view class="sc-au"><text class="sc-av">{{ c.author.slice(0, 1) }}</text><text>{{ c.author }}</text><text class="sc-go">看解读 ›</text></view>
            </view>
          </view>
        </scroll-view>
      </view>


      <view class="sc-sec">
        <text class="sc-h2">这些人不适合</text>
        <view class="sc-no"><view v-for="n in notFor" :key="n[0]"><text class="sc-non">{{ n[0] }}</text><text>{{ n[1] }}</text></view></view>
      </view>

      <view id="sc-choose" class="sc-sec">
        <text class="sc-h2">两种方式，怎么选</text>
        <view class="sc-box">
          <view class="sc-tr sc-th"><text></text><text>3 天体验营</text><text class="sc-hl">直接加入 ★</text></view>
          <view class="sc-tr"><text>适合</text><text>还没方向，先看看</text><text class="sc-hl">想认真做一年</text></view>
          <view class="sc-tr"><text>内容</text><text>2 场直播 + 答疑</text><text class="sc-hl">全部内容 + 可报名航海 + 线下</text></view>
          <view class="sc-rec"><view class="sc-go-btn" @tap="openJoin">了解加入生财有术 ↗</view></view>
        </view>
      </view>

      <view id="sc-camp" class="sc-sec">
        <text class="sc-h2">先体验 3 天</text>
        <view class="sc-camp"><CampCard from="camp" :show-more="false" /></view>
        <view v-if="source" class="sc-mem"><text>{{ from === 'event' ? '了解体验营后可继续查看活动报名方式' : '了解体验营后可继续查看生财原帖' }}</text><text class="sc-mem-go" @tap="openSource">{{ from === 'event' ? '查看报名方式 ›' : '查看原帖 ›' }}</text></view>
        <view class="sc-poster"><text class="sc-poster-title">查看体验营完整海报</text><text class="sc-s">海报标注 11 月 2 日开营；当前排期与参与方式以入口说明为准。</text><image class="sc-poster-image" :src="campaign.posterUrl" mode="widthFix" @tap="preview(campaign.posterUrl)" /><text class="sc-poster-link" @tap="preview(campaign.posterUrl)">点击查看完整海报 ›</text></view>
        <!-- #ifdef H5 -->
        <button class="sc-share-btn" @tap="showSharePoster" :disabled="sharing">{{ sharing ? '正在生成海报…' : '生成体验营分享海报' }}</button>
        <text v-if="shareError" class="sc-s">{{ shareError }}</text>
        <!-- #endif -->
      </view>

      <view class="sc-sec">
        <text class="sc-h2">常见问题</text>
        <view class="sc-faq">
          <view v-for="(f, i) in faq" :key="f[0]" class="sc-fi" @tap="openFaq = openFaq === i ? -1 : i">
            <view class="sc-fq"><text>{{ f[0] }}</text><text class="sc-fx">{{ openFaq === i ? '⌃' : '⌄' }}</text></view>
            <text v-if="openFaq === i" class="sc-fa">{{ f[1] }}</text>
          </view>
        </view>
      </view>
      <view class="sc-contact"><text class="sc-contact-title">有问题？联系站长</text><text>报名或内容相关问题，欢迎微信交流。</text><image class="sc-contact-qr" :src="contact.qrUrl" mode="widthFix" @tap="preview(contact.qrUrl)" /><view class="sc-contact-row"><text>微信号 {{ contact.wechatId }}</text><text class="sc-copy" @tap="copyId">复制</text></view></view>
    </view>

    <view class="sc-sticky">
      <view class="sc-s1" @tap="toCamp">先体验 3 天</view>
      <view class="sc-s2" @tap="openJoin"><text>了解加入生财</text></view>
    </view>
    <!-- #ifdef H5 -->
    <view v-if="shareOpen" class="sc-overlay" @click="shareOpen=false"><view class="sc-modal" @click.stop><view class="sc-modal-head"><text>体验营分享海报</text><button @click="shareOpen=false" aria-label="关闭">×</button></view><text class="sc-s">手机可长按图片保存或识别二维码</text><img v-if="shareImage" :src="shareImage" alt="体验营分享海报" class="sc-share-image" /><a v-if="shareImage" :href="shareImage" download="AINPE-体验营.png" class="sc-share-download">保存分享海报</a></view></view>
    <!-- #endif -->
    <SiteFooter />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import SiteHeader from '../../components/SiteHeader.vue';
import SiteFooter from '../../components/SiteFooter.vue';
import CampCard from '../../components/CampCard.vue';
import { campaign, contact } from '../../data/content.js';
// #ifdef H5
import { createCampSharePoster } from './camp-poster.js';
// #endif
import { track } from '../../data/track.js';
import { REFERRAL_URL, openExternal } from '../../data/offer.js';

const data = [['实战案例', '了解真实项目过程'], ['项目经验', '阅读圈友复盘'], ['航海训练', '探索当期实战方向'], ['线下交流', '认识同行、交流经验']];
const voyage = [['AI 小程序副业', '产品开发'], ['AI 视频带货', '内容与带货'], ['AI 热词游戏站', '海外产品'], ['工厂 AI 落地', 'FDE 企业服务'], ['AI 视频定制', '视频制作'], ['小红书教育 PPT', '教育资料']];
const cases = [
  { id: '22258221581184141', tag: 'AI 小程序', big: '3 个月 10 万+', label: '小红书变现 · 非净利润', title: '不懂代码，用 AI 做了 6 个小程序', author: '蓝子鱼' },
  { id: '22258215525112441', tag: 'AI 获客', big: '单月 12 万', label: '单名运营签单额 · 非利润', title: '教育行业用 AI 辅助小红书获客', author: '汐米' },
  { id: '55521521254555184', tag: '教育资料', big: '2 万+ / 月', label: '作者自述月收入 · 非净利润', title: '45 岁新手整理小学课件', author: '新手老白40+' },
];
const notFor = [['急功近利者', '期待一夜暴富'], ['内容搬运工', '抄袭、盗版付费内容'], ['纯粹引流者', '在社群里发广告'], ['规则破坏者', '不守规则、态度不友好']];
const faq = [
  ['会保证赚钱吗？', '不会。生财有术提供经验、航海和圈友交流，结果取决于你自己的投入。'],
  ['不满意能退吗？', '退款条件以加入页面的最新说明为准。'],
  ['航海怎么报名？', '加入后可了解当期航海报名方式，具体时间与条件以生财有术说明为准。'],
  ['体验营和直接加入有什么区别？', '体验营是 3 天的短体验；直接加入是一整年的全部内容，可以报名航海和参加线下活动。'],
];

const source = ref(''), from = ref('direct'), openFaq = ref(-1), played = ref(null), now = ref(Date.now());
const voyageOpen = computed(() => now.value >= Date.parse('2026-11-01T00:00:00+08:00') && now.value < Date.parse('2026-11-13T00:00:00+08:00'));
const showPlayedNote = computed(() => { const time = Date.parse(played.value?.time || ''); const age = now.value - time; return ['game-result','game-case'].includes(from.value) && !!played.value?.project && Number.isFinite(age) && age >= 0 && age < 7200000; });
onShow(() => { try { let p = uni.getStorageSync('ainpe:played'); if (typeof p === 'string') p = JSON.parse(p); played.value = p && typeof p === 'object' ? p : null; } catch { played.value = null; } });
let clock; onMounted(() => { clock = setInterval(() => { now.value = Date.now(); }, 60000); }); onUnmounted(() => clearInterval(clock));
const shareOpen=ref(false), shareImage=ref(''), sharing=ref(false), shareError=ref('');
// #ifdef H5
function closeOnEscape(event){if(event.key==='Escape')shareOpen.value=false}
function syncSourceFromHash(){const hash=window.location.hash, question=hash.indexOf('?'), params=new URLSearchParams(question<0?'':hash.slice(question+1)); const raw=params.get('source')||'', f=params.get('from')||'direct'; from.value=/^[a-z0-9_-]{1,40}$/.test(f)?f:'direct'; try { const u=decodeURIComponent(raw); source.value=/^https:\/\/(?:www\.)?scys\.com\//i.test(u)?u:''; } catch { source.value=''; }}
onMounted(()=>{window.addEventListener('keydown',closeOnEscape);window.addEventListener('hashchange',syncSourceFromHash);});
onUnmounted(()=>{window.removeEventListener('keydown',closeOnEscape);window.removeEventListener('hashchange',syncSourceFromHash);});
async function showSharePoster(){if(sharing.value)return;sharing.value=true;shareError.value='';try{shareImage.value=await createCampSharePoster(campaign.targetUrl);shareOpen.value=true}catch{shareError.value='分享海报生成失败，请稍后重试。'}finally{sharing.value=false}}
// #endif
onLoad((opts) => {
  const f = String(opts?.from || 'direct'); from.value = /^[a-z0-9_-]{1,40}$/.test(f) ? f : 'direct';
  let hasPlayed = false; try { hasPlayed = !!uni.getStorageSync('ainpe:played'); } catch {}
  track('camp_view', { page: 'camp', from: from.value, played: hasPlayed });
  source.value = '';
  try { const u = decodeURIComponent(opts?.source || ''); if (/^https:\/\/(?:www\.)?scys\.com\//i.test(u)) source.value = u; } catch {}
});
function openSource() { if (!source.value) return; track('outbound_click', { target: from.value === 'event' ? 'event' : 'source', from: 'camp' }); openExternal(source.value); }
function openJoin() { track('outbound_click', { target: 'join', from: 'camp' }); openExternal(REFERRAL_URL); }
function openCase(id) { uni.navigateTo({ url: '/pages/article/index?id=' + id }); }
function toCamp() { uni.pageScrollTo({ selector: '#sc-camp', duration: 300 }); }
function goBack() { uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/discover/index' }) }); }
function preview(url) { uni.previewImage({ current: url, urls: [url] }); }
function copyId() { uni.setClipboardData({ data: contact.wechatId, success: () => track('contact_copy', { from: 'camp' }) }); }
</script>

<style scoped>
.sc-poster{margin:10px 0;padding:14px;background:#fff;border:1px solid #e5decf;border-radius:16px}.sc-poster-title{display:block;font-weight:800;font-size:15px}.sc-poster-image{display:block;width:160px;max-width:75%;margin:10px auto;border-radius:8px;cursor:pointer}.sc-poster-link{display:block;text-align:center;color:#0e5a3a;font-size:13px;font-weight:800;cursor:pointer}.sc-played{margin:14px 0 0;padding:12px 14px;border-radius:10px;background:#e2f1e7;color:#0e5a3a;font-size:13px;font-weight:700}.sc-back{padding:10px 16px;background:#0b2e20;color:#b3cabb;font-size:12px;cursor:pointer}.sc-contact{background:#fff;border:1px solid #e5decf;border-radius:16px;padding:16px;margin:14px 0 6px;color:#45594d;font-size:13px}.sc-contact-title{display:block;font-size:16px;font-weight:900;color:#13241b;margin-bottom:5px}.sc-contact-qr{display:block;width:200px;margin:12px auto}.sc-contact-row{display:flex;align-items:center;gap:8px}.sc-share-btn{margin-top:10px;background:#fff;color:#0e5a3a;border:1px solid #0e5a3a;font-weight:700;font-size:14px}.sc-overlay{position:fixed;inset:0;background:#0009;z-index:120;display:flex;align-items:center;justify-content:center;padding:16px}.sc-modal{background:#fff;border-radius:16px;padding:18px;max-width:420px;width:100%;max-height:90vh;overflow:auto;box-sizing:border-box}.sc-modal-head{display:flex;justify-content:space-between;align-items:center;font-size:17px;font-weight:900}.sc-modal-head button{margin:0}.sc-share-image{display:block;width:100%;max-height:65vh;object-fit:contain;margin:10px auto}.sc-share-download{display:block;text-align:center;color:#0e5a3a;padding:10px}.sc-page{min-height:100vh;background:#f7f3ea;color:#13241b;padding-bottom:76px}
.sc-in{max-width:720px;margin:0 auto;padding:0 16px;box-sizing:border-box}
.sc-mem{display:flex;align-items:center;background:#fff1c9;color:#5c3d00;font-size:13px;padding:9px 16px}.sc-mem-go{margin-left:auto;color:#0e5a3a;font-weight:800;cursor:pointer}
.sc-hero{background:#0b2e20;color:#fff;position:relative;overflow:hidden;padding:22px 0 18px}
.sc-hero-illo{position:absolute;right:-4px;top:10px;width:130px}
.sc-hero .sc-in{position:relative}
.sc-k,.sc-h1,.sc-lead,.sc-b,.sc-bl,.sc-h2,.sc-s,.sc-dv,.sc-dl,.sc-voy-t,.sc-voy-f,.sc-tg,.sc-big,.sc-lb,.sc-ct,.sc-qn,.sc-qr,.sc-qp,.sc-src,.sc-non,.sc-li,.sc-fn,.sc-fa{display:block}
.sc-k{color:#9fd8b5;font-weight:900;font-size:12.5px}
.sc-h1{font-size:27px;line-height:1.3;font-weight:900;margin-top:4px;max-width:250px}.sc-em{color:#ffc94d}
.sc-lead{font-size:13.5px;color:#c7dacd;margin-top:6px;line-height:1.6}
.sc-big3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:14px}.sc-big3>view{background:rgba(255,255,255,.07);border-radius:12px;padding:8px}
.sc-b{font-size:19px;font-weight:900;color:#ffc94d;line-height:1.2}.sc-bl{font-size:11px;color:#c7dacd}
.sc-body{padding-bottom:10px}
.sc-sec{margin-top:22px}.sc-h2{font-size:19px;font-weight:900}.sc-s{font-size:12px;color:#7c897f;margin-top:1px}
.sc-data{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.sc-data>view{background:#fff;border:1px solid #e5decf;border-radius:14px;padding:10px 12px}
.sc-dv{font-size:21px;font-weight:900;color:#0e5a3a;line-height:1.2}.sc-dl{font-size:12px;color:#45594d}
.sc-voy{background:#0b2e20;color:#fff;border-radius:18px;padding:14px}
.sc-voy-t{font-size:16px;font-weight:900;margin-bottom:4px}
.sc-voy-r{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.1);font-size:13px}
.sc-voy-a{flex:1;color:#dce9e0}.sc-voy-ar{color:#ffc94d;font-weight:900}.sc-voy-b{flex:1.2;text-align:right;font-weight:800}
.sc-voy-f{font-size:11.5px;color:#9fb8a7;margin-top:8px}
.sc-rail{margin-top:10px;white-space:nowrap}.sc-rail-in{display:flex;gap:10px;padding-bottom:4px}
.sc-cs{flex:none;width:250px;white-space:normal;background:#fff;border:1px solid #e5decf;border-radius:18px;padding:14px;box-sizing:border-box;cursor:pointer}
.sc-tg{display:inline-block!important;font-size:11px;font-weight:900;color:#0e5a3a;background:#e2f1e7;border-radius:6px;padding:2px 7px}
.sc-big{font-size:26px;font-weight:900;line-height:1.15;margin-top:8px}.sc-lb{font-size:11.5px;color:#7c897f}
.sc-ct{font-size:14px;font-weight:700;line-height:1.5;margin-top:8px;min-height:42px}
.sc-au{display:flex;align-items:center;gap:7px;margin-top:10px;padding-top:10px;border-top:1px solid #e5decf;font-size:12.5px;font-weight:800;color:#45594d}
.sc-av{width:24px;height:24px;border-radius:50%;background:#ffe7a3;color:#7a5200;display:flex;align-items:center;justify-content:center;font-size:12px}
.sc-go{margin-left:auto;color:#0e5a3a}
.sc-qt{background:#fff;border:1px solid #e5decf;border-radius:16px;padding:12px 14px;margin-top:8px}
.sc-qh{display:flex;align-items:center;gap:10px}.sc-qa{width:34px;height:34px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex:none}
.sc-qn{font-size:13.5px;font-weight:900}.sc-qr{font-size:11.5px;color:#7c897f}.sc-qm{margin-left:auto;font-size:40px;line-height:.6;color:#ffc94d;font-family:serif}
.sc-qp{font-size:14px;line-height:1.6;margin-top:8px}
.sc-src{font-size:11px;color:#7c897f;margin-top:6px}
.sc-no{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.sc-no>view{background:#f1eee6;border-radius:12px;padding:8px 10px;font-size:12px;color:#45594d}.sc-non{font-size:13.5px;font-weight:900;color:#13241b}
.sc-box{background:#fff;border:1px solid #e5decf;border-radius:16px;margin-top:10px;overflow:hidden}
.sc-tr{display:grid;grid-template-columns:52px 1fr 1fr;font-size:13px;border-top:1px solid #e5decf}.sc-tr>text{padding:9px 8px}.sc-tr>text:first-child{color:#7c897f}
.sc-th{border-top:0;background:#f7f3ea;font-weight:900}.sc-hl{background:#fff8e6}.sc-th .sc-hl{background:#ffe7a3}
.sc-rec{background:#0b2e20;color:#fff;padding:14px 16px}
.sc-pr{display:flex;align-items:baseline;gap:8px}.sc-now{font-size:30px;font-weight:900;color:#ffc94d}.sc-was{color:#9fb8a7;font-size:13px;text-decoration:line-through}
.sc-left{margin-left:auto;background:#ffc94d;color:#3e2d00;font-size:12px;font-weight:900;border-radius:999px;padding:3px 9px}
.sc-li{font-size:13px;color:#dce9e0;padding:2px 0}
.sc-go-btn{display:flex;height:46px;border-radius:12px;background:#ee5a24;align-items:center;justify-content:center;font-weight:900;margin-top:12px;cursor:pointer}
.sc-fn{font-size:11px;color:#9fb8a7;text-align:center;margin-top:6px}
.sc-camp{margin-top:10px}
.sc-faq{background:#fff;border:1px solid #e5decf;border-radius:16px;margin-top:10px;padding:0 14px}
.sc-fi{border-top:1px solid #e5decf;padding:11px 2px;cursor:pointer}.sc-fi:first-child{border-top:0}
.sc-fq{display:flex;justify-content:space-between;font-size:14px;font-weight:800}.sc-fx{color:#7c897f}
.sc-fa{font-size:13px;color:#45594d;line-height:1.6;margin-top:6px}
.sc-ct{display:flex;margin:14px 0 6px;font-size:13px;color:#45594d}.sc-copy{margin-left:auto;color:#0e5a3a;font-weight:800;cursor:pointer}
.sc-sticky{position:fixed;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom));z-index:90;display:flex;gap:8px;padding:10px 14px;background:#fff;border-top:1px solid #e5decf;box-sizing:border-box}
.sc-s1{flex:0 0 36%;height:46px;border-radius:12px;border:1.5px solid #0e5a3a;color:#0e5a3a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;box-sizing:border-box;cursor:pointer}
.sc-s2{flex:1;height:46px;border-radius:12px;background:#ee5a24;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:14px;line-height:1.2;cursor:pointer}.sc-s2s{font-size:11px;font-weight:800;opacity:.9}
@media(min-width:768px){.sc-sticky{bottom:0;max-width:720px;margin:0 auto;border-radius:16px 16px 0 0}.sc-hero-illo{right:calc(50% - 360px);width:170px}}
</style>
