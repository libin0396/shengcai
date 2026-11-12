// 只在小程序首次启动时介绍登录。点击“先体验”不会调用登录或同步接口。
import { account, accountGeneration, loginAccount } from './mini-account.js';
const KEY = 'ainpe_mini_login_welcome_seen_v1';

// 注入依赖便于检查取消、重复触发和弹窗期间账号变化等情形。
export function createWelcomeGate({ read, write, defer, show, loggedIn, generation, login }) {
  let scheduled = false;
  return function offer() {
    if (scheduled) return;
    try {
      if (read(KEY)) return;
      // 先记录已展示，避免异常关闭后反复打扰；存储不可写时不展示。
      write(KEY, true);
    } catch { return; }
    if (loggedIn()) return;
    scheduled = true;
    const initialGeneration = generation();
    defer(() => {
      if (loggedIn() || generation() !== initialGeneration) return;
      show({
        title: '欢迎使用 AINPE',
        content: '微信登录后，可同步学习进度、等级和收藏。也可以先体验，之后在“我的”登录。',
        confirmText: '微信登录',
        cancelText: '先体验',
        success(result) {
          if (result?.confirm && !loggedIn() && generation() === initialGeneration) login();
        },
      });
    });
  };
}

export const offerFirstWechatLogin = createWelcomeGate({
  read: key => uni.getStorageSync(key),
  write: (key, value) => uni.setStorageSync(key, value),
  defer: fn => setTimeout(fn, 350),
  show: options => uni.showModal(options),
  loggedIn: () => account.value.loggedIn,
  generation: accountGeneration,
  login: () => loginAccount(),
});
