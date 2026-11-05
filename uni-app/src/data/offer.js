// 生财有术直接加入：价格、截止时间、推荐链接集中在这里，页面不要写死。
export const OFFER = {
  start: Date.parse('2026-11-01T00:00:00+08:00'),
  end: Date.parse('2026-11-12T00:00:00+08:00'), // 11/11 23:59 后结束
  price: 2965, list: 3365, save: 400,
  deadlineText: '截至 11/11 23:59（北京时间）',
  reasons: ['一年的项目库、圈友实战分享随时查', '11.18 航海实战，跟着教练做 21 天', '加入 72 小时内不满意可退'],
};
export const REFERRAL_URL = 'https://t.zsxq.com/6dPqb';
export function offerActive(now = Date.now()) { return now >= OFFER.start && now < OFFER.end; }
const bjDay = t => Math.floor((t + 8 * 3600000) / 86400000);
export function daysLeftLabel(now = Date.now()) {
  if (!offerActive(now)) return '';
  const left = OFFER.end - now;
  if (left <= 6 * 3600000) return `最后 ${Math.max(1, Math.ceil(left / 3600000))} 小时`;
  const d = bjDay(OFFER.end - 1) - bjDay(now);
  return d <= 0 ? '今天 23:59 截止' : d === 1 ? '明天 23:59 截止' : `还剩 ${d + 1} 天`;
}
const MEMBER_KEY = 'ainpe:is-member';
export function isMember() { try { return !!uni.getStorageSync(MEMBER_KEY); } catch { return false; } }
export function markMember() { try { uni.setStorageSync(MEMBER_KEY, 1); } catch {} }
export function openExternal(url) {
  if (!url) return;
  // #ifdef H5
  window.location.href = url; return;
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }) });
  // #endif
}
