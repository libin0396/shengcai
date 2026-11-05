<template>
  <view v-if="visible && !dismissed" class="ob">
    <text class="ob-t">⛵ 了解生财有术，查看加入方式</text>
    <text class="ob-go" @tap="go">看看 ›</text>
    <text class="ob-x" aria-label="关闭" @tap="dismiss">✕</text>
  </view>
</template>
<script setup>
import { ref } from 'vue';
defineProps({ visible: { type: Boolean, default: true } });
const KEY = 'ainpe:offer-bar-dismissed';
const today = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
const dismissed = ref(false);
try { dismissed.value = uni.getStorageSync(KEY) === today(); } catch {}
function dismiss() { dismissed.value = true; try { uni.setStorageSync(KEY, today()); } catch {} }
function go() { uni.pageScrollTo({ selector: '.jc', duration: 300, offsetTop: -80, fail: () => uni.pageScrollTo({ scrollTop: 999999, duration: 300 }) }); }
</script>
<style scoped>
.ob{position:fixed;z-index:80;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));width:min(560px,calc(100% - 24px));box-sizing:border-box;background:#0B2E20;color:#fff;border-radius:999px;display:flex;align-items:center;gap:8px;padding:8px 8px 8px 16px;font-size:13px;box-shadow:0 10px 24px -10px rgba(0,0,0,.5)}
.ob-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ob-p{color:#FFC94D;font-weight:900}
.ob-go{flex:none;background:#FFC94D;color:#0B2E20;border-radius:999px;padding:6px 12px;font-weight:900;cursor:pointer}
.ob-x{flex:none;color:#9FB8A7;padding:0 6px;cursor:pointer}
@media(min-width:701px){.ob{bottom:20px}}
</style>
