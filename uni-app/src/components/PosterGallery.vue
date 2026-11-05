<template>
  <view class="collection gallery">
    <view class="block-head"><view><text class="block-title">我的模拟战报</text><text class="block-sub">仅保存在当前浏览器，最多保留 50 条记录和 20 张战报图片。</text></view></view>
    <view v-if="history.length" class="poster-grid">
      <button v-for="(record,index) in visible" :key="record.recordId || index" class="poster-tile" @click="open(index)">
        <view class="poster-thumb" :class="{hidden: isHidden(record)}">
          <!-- #ifdef H5 -->
          <img v-if="imageFor(record)" :src="imageFor(record)" alt="已保存的模拟战报缩略图" />
          <!-- #endif -->
          <view v-if="!imageFor(record)" class="poster-placeholder"><text>↗</text><text>{{ loading(record) ? '正在读取战报' : (record.persona || '模拟战报') }}</text><text v-if="!loading(record)" class="ph-sub">{{ record.result || '' }}</text></view>
          <text v-if="isHidden(record)" class="hidden-mark">✦ 隐藏</text>
        </view>
        <text class="poster-name">{{ record.persona || '实践探索者' }}</text>
        <text class="poster-meta">{{ record.project || 'AI 项目模拟' }} · {{ formatDate(record.time) }}</text>
      </button>
    </view>
    <button v-if="history.length > 4" class="more" @click="expanded=!expanded">{{ expanded ? '收起较早记录 ↑' : `查看更早的 ${history.length-4} 张 ↓` }}</button>
    <view v-if="!history.length" class="empty">还没有模拟记录，体验后可以在这里看到结果。<button @click="$emit('simulate')">去体验项目 →</button></view>
  </view>

  <view v-if="selectedIndex >= 0 && current" class="viewer" role="dialog" aria-modal="true" aria-label="模拟战报" @click="close" @touchstart="touchStart" @touchend="touchEnd">
    <view class="viewer-inner" @click.stop>
      <button class="viewer-close" aria-label="关闭战报" @click="close">×</button>
      <view v-if="imageFor(current)" class="viewer-image-wrap">
        <!-- #ifdef H5 -->
        <img class="viewer-image" :src="imageFor(current)" alt="本局模拟战报，长按可以保存" />
        <!-- #endif -->
        <text class="viewer-help">长按图片保存到相册或发送给朋友</text>
        <text class="viewer-help">朋友可以扫码体验同一个项目</text>
      </view>
      <view v-else class="record-fallback">
        <text class="fallback-label">{{ loading(current) ? '正在读取战报…' : '这张战报图片没有保存在本机' }}</text>
        <text class="fallback-note">{{ loading(current) ? '' : '早期记录、浏览器清理或空间限制可能导致图片不可用，模拟记录仍在。' }}</text>
        <text class="fallback-title">{{current.persona || '实践探索者'}} · {{current.result || '体验完成'}}</text>
        <text class="fallback-meta">{{current.project || 'AI 项目模拟'}} · {{formatDate(current.time)}}</text>
        <text v-if="typeof current.amount === 'number'" class="fallback-amount">模拟收益 ¥{{current.amount}}</text>
        <text class="fallback-note">金额为游戏设定，不是收入预测。</text>
        <view v-if="Array.isArray(current.issues) && current.issues.length" class="record-issues"><text v-for="(issue,i) in current.issues.slice(0,3)" :key="i">{{issue}}</text></view>
        <button class="record-replay" @click="$emit('replay',current)">再体验一次 →</button>
      </view>
      <view v-if="history.length > 1" class="viewer-nav"><button :disabled="selectedIndex===0" @click="move(-1)">上一张</button><text>{{selectedIndex+1}} / {{history.length}}</text><button :disabled="selectedIndex===history.length-1" @click="move(1)">下一张</button></view>
    </view>
  </view>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
// #ifdef H5
import '../static/simulation-games/poster-history.js';
// #endif

const props = defineProps({history: {type:Array,default:()=>[]}});
defineEmits(['replay','simulate']);
const expanded=ref(false), selectedIndex=ref(-1), urls=ref({}), states=ref({});
const visible=computed(()=>expanded.value?props.history:props.history.slice(0,4));
const current=computed(()=>props.history[selectedIndex.value] || null);
let active=false, generation=0, startX=null;
const idOf=record=>typeof record?.recordId==='string'?record.recordId:'';
const imageFor=record=>urls.value[idOf(record)]||'';
const loading=record=>states.value[idOf(record)]==='loading';
function isHidden(record){const n=Number(record?.personaIndex);return Number.isInteger(n)&&n>=18&&n<24}
function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?'时间未记录':`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`}
function release(){
  generation++;
  urls.value={};states.value={};
}
// #ifdef H5
function posterDataUrl(blob){return new Promise(resolve=>{try{const reader=new FileReader();reader.onload=()=>resolve(typeof reader.result==='string'&&reader.result.startsWith('data:image/jpeg;base64,')?reader.result:'');reader.onerror=()=>resolve('');reader.readAsDataURL(blob)}catch{resolve('')}})}
// #endif
async function ensure(record){
  const id=idOf(record);if(!id || states.value[id])return;
  states.value={...states.value,[id]:'loading'};
  // #ifdef H5
  const run=generation;let blob=null;
  try{blob=await window.AINPEPosterHistory?.get(id)}catch{}
  if(!active||run!==generation)return;
  if(blob){const url=await posterDataUrl(blob);if(!active||run!==generation)return;if(url){urls.value={...urls.value,[id]:url};states.value={...states.value,[id]:'ready'};return}}
  // #endif
  states.value={...states.value,[id]:'missing'};
}
function loadVisible(){if(active)visible.value.forEach(ensure)}
function pause(){active=false;close();release()}
function resume(){active=true;loadVisible()}
defineExpose({pause,resume});
function open(index){selectedIndex.value=index;ensure(props.history[index])}
function close(){selectedIndex.value=-1}
function move(delta){const n=selectedIndex.value+delta;if(n>=0&&n<props.history.length){selectedIndex.value=n;ensure(props.history[n])}}
function touchStart(event){startX=event.touches?.[0]?.clientX??null}
function touchEnd(event){const end=event.changedTouches?.[0]?.clientX;if(startX!==null&&typeof end==='number'&&Math.abs(end-startX)>60)move(end<startX?1:-1);startX=null}
// #ifdef H5
function onKey(event){if(selectedIndex.value<0)return;if(event.key==='Escape')close();else if(event.key==='ArrowLeft')move(-1);else if(event.key==='ArrowRight')move(1)}
// #endif
onMounted(()=>{resume();
  // #ifdef H5
  window.addEventListener('keydown',onKey);
  // #endif
});
watch(()=>props.history,()=>{release();loadVisible()});
watch(expanded,loadVisible);
onUnmounted(()=>{pause();
  // #ifdef H5
  window.removeEventListener('keydown',onKey);
  // #endif
});
</script>

<style scoped>
.poster-placeholder .ph-sub{font-size:11px;opacity:.75;margin-top:2px}
.collection{background:#fff;border:1px solid #e1e9dc;border-radius:8px;padding:20px;margin:15px 0}.block-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.block-title,.block-sub{display:block}.block-title{font-size:19px;color:#173d2b;font-weight:800}.block-sub{font-size:12px;color:#8a9c8a;margin-top:5px}.poster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.poster-tile{display:block;width:100%;margin:0;padding:0;background:transparent;text-align:left;line-height:1.5;border:0;min-width:0}.poster-thumb{position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:9px;background:#133d2a;border:1px solid #d8e4d5}.poster-thumb.hidden{border:2px solid #d1a43e}.poster-thumb img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}.poster-placeholder{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(145deg,#123d2b,#0b281d);color:#bfd0bf;font-size:12px}.poster-placeholder text:first-child{font-size:30px;color:#f3c955}.hidden-mark{position:absolute;top:7px;right:7px;padding:2px 7px;border-radius:12px;background:#edc75b;color:#372b10;font-size:11px;font-weight:800}.poster-name,.poster-meta{display:block;overflow-wrap:anywhere}.poster-name{font-size:14px;font-weight:800;color:#214b34;margin-top:7px}.poster-meta{font-size:12px;color:#8a9c8a;margin-top:2px}.more{margin:14px auto 0;padding:0 12px;background:#eef5ec;color:#236342;font-size:12px;line-height:38px}.empty{padding:20px;color:#859a83;background:#fafcf8;font-size:13px;line-height:1.7}.empty button{margin:10px 0 0;display:inline-block;background:#dcebd3;color:#355d3f;font-size:13px;line-height:36px}.viewer{position:fixed;inset:0;z-index:10000;background:#07150df5;display:flex;align-items:center;justify-content:center;padding:16px}.viewer-inner{width:100%;max-width:480px;max-height:100%;position:relative;overflow:auto;text-align:center}.viewer-close{position:sticky;top:0;z-index:1;margin:0 0 8px auto;padding:0;width:40px;height:40px;line-height:40px;border-radius:50%;background:#ffffffed;color:#153b2a;font-size:26px}.viewer-image{display:block;margin:auto;width:auto;max-width:100%;max-height:calc(100vh - 180px);object-fit:contain}.viewer-help{display:block;color:#d0ddd1;font-size:12px;line-height:1.6;margin-top:5px}.viewer-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px;color:white;font-size:12px}.viewer-nav button{margin:0;padding:0 14px;line-height:36px;background:#ffffff24;color:#fff;font-size:12px}.viewer-nav button[disabled]{opacity:.35}.record-fallback{background:#fff;border-radius:10px;padding:24px;text-align:left;color:#173d2b}.fallback-label,.fallback-note,.fallback-title,.fallback-meta,.fallback-amount,.record-issues text{display:block}.fallback-label{font-size:16px;font-weight:800;color:#a25d32}.fallback-note,.fallback-meta{font-size:12px;line-height:1.7;color:#839685;margin-top:8px}.fallback-title{font-size:20px;font-weight:800;margin-top:16px}.fallback-amount{font-size:19px;font-weight:800;margin-top:12px}.record-issues{background:#f2f7ed;padding:12px;margin-top:14px;font-size:13px;line-height:1.6}.record-replay{margin:16px 0 0;padding:0 14px;display:inline-block;background:#e95d28;color:white;font-size:13px;line-height:38px}@media(min-width:701px){.poster-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>
