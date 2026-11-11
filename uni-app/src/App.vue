<script>
// #ifndef MP-WEIXIN
import {refreshFeed} from './data/content.js';
let feedTimer;
export default {onShow(){refreshFeed();if(!feedTimer)feedTimer=setInterval(refreshFeed,300000)},onHide(){if(feedTimer)clearInterval(feedTimer);feedTimer=null}};
// #endif
// #ifdef MP-WEIXIN
export default {};
// #endif
</script>

<style>
page { color: #19382c; background: #f4f4ef; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 14px; }
view, text, image, button, input, textarea, scroll-view { box-sizing: border-box; }
button { font-family: inherit; }
button::after { border: 0; }
.page-shell { max-width: 1200px; margin: 0 auto; padding: 24px 24px 64px; }
.visually-muted { color: #718477; }
@media (max-width: 700px) { .page-shell { padding: 18px 16px 48px; } page, uni-page-body { padding-bottom: calc(52px + env(safe-area-inset-bottom)); } }
</style>
