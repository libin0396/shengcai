<template>
  <view class="wg" :class="{ done: finished }">
    <view class="wh">
      <text class="wk">{{ label }}</text>
      <text v-if="w.tag" class="wt">{{ w.tag }}</text>
      <text v-if="finished" class="wok">做好了</text>
    </view>
    <text v-if="w.ask" class="wask">{{ w.ask }}</text>

    <!-- 打码：点要隐去的词 -->
    <view v-if="w.kind === 'mask'" class="note">
      <view v-for="(line, li) in w.lines" :key="li" class="nline" :class="{ head: li === 0 }">
        <template v-for="(seg, si) in line" :key="si">
          <text v-if="isText(seg)">{{ seg }}</text>
          <text v-else class="tok" :class="{ hit: maskHit(seg) }" @tap="go({ word: seg.w })">{{ maskHit(seg) ? seg.to : seg.w }}</text>
        </template>
      </view>
      <text class="wcount">{{ maskLeft ? '还有 ' + maskLeft + ' 处要打码' : '都打好码了' }}</text>
    </view>

    <!-- 找茬：点出没依据、写错的句子 -->
    <view v-else-if="w.kind === 'spot'" class="col">
      <view v-if="w.ref" class="ref"><text class="ref-h">{{ w.ref.title }}</text><text v-for="(l, i) in w.ref.lines" :key="i" class="ref-l">{{ l }}</text></view>
      <view v-for="(L, i) in w.lines" :key="i" class="spot" :class="{ found: st.found[i] }" hover-class="press" @tap="go({ i })">
        <text :class="{ old: st.found[i] }">{{ L.t }}</text>
        <text v-if="st.found[i]" class="fix">{{ L.fix }}</text>
      </view>
      <text class="wcount">{{ spotLeft ? '还差 ' + spotLeft + ' 处' : '都找到了' }}</text>
    </view>

    <!-- 分一分：一张张卡片放进对的一边 -->
    <view v-else-if="w.kind === 'judge'" class="col">
      <view v-if="w.ref" class="ref"><text class="ref-h">{{ w.ref.title }}</text><text v-for="(l, i) in w.ref.lines" :key="i" class="ref-l">{{ l }}</text></view>
      <view class="dots"><view v-for="(x, i) in w.items" :key="i" class="dot" :class="{ on: i < st.i, cur: i === st.i }" /></view>
      <view v-if="judgeItem" :key="'j' + st.i" class="jcard" :class="{ img: judgeItem.img }">
        <view v-if="judgeItem.img" class="jimg" :class="{ crop: judgeItem.crop === 'right' }"><image class="jimg-i" :src="url(judgeItem.img)" :mode="judgeItem.crop === 'right' ? 'heightFix' : 'aspectFill'" /></view>
        <text v-else>{{ judgeItem.t }}</text>
      </view>
      <view v-if="judgeItem" class="bins" :class="{ three: w.bins.length > 2 }">
        <view v-for="(b, k) in w.bins" :key="k" class="bin" hover-class="press" @tap="go({ bin: k })">{{ b }}</view>
      </view>
      <view v-else class="jsum"><view v-for="(x, i) in w.items" :key="i" class="jsum-r"><text class="jsum-t">{{ x.t }}</text><text class="jsum-b">{{ w.bins[x.bin] }}</text></view></view>
    </view>

    <!-- 选一选 -->
    <view v-else-if="w.kind === 'pick'" class="col">
      <view v-if="w.imgs && w.imgs.length" class="pimgs" :class="{ two: w.imgs.length > 1 }">
        <view v-for="x in w.imgs" :key="x.src" class="pimg"><image :src="url(x.src)" mode="widthFix" class="pimg-i" /><text class="pimg-l">{{ x.label }}</text></view>
      </view>
      <view v-for="(o, i) in w.options" :key="i" class="opt" :class="{ right: st.chosen === i, wrong: st.tried[i] && !o.ok }" hover-class="press" @tap="go({ i })">{{ o.t }}</view>
    </view>

    <!-- 排顺序 -->
    <view v-else-if="w.kind === 'order'" class="col">
      <template v-if="orderImgs">
        <view class="track">
          <view v-for="(x, k) in w.items" :key="k" class="tslot" :class="{ on: k < st.placed.length }">
            <image v-if="k < st.placed.length" class="tslot-i" :src="url(w.items[st.placed[k]].img)" mode="aspectFill" />
            <text class="tslot-n">{{ k + 1 }}</text>
          </view>
        </view>
        <view v-if="st.pool.length" class="tpool">
          <view v-for="i in st.pool" :key="i" class="tthumb" hover-class="press" @tap="go({ i })"><image class="tslot-i" :src="url(w.items[i].img)" mode="aspectFill" /></view>
        </view>
      </template>
      <template v-else>
        <view v-for="(i, k) in st.placed" :key="'p' + i" class="oli"><text class="oli-n">{{ k + 1 }}</text><text class="oli-t">{{ w.items[i].t }}</text></view>
        <view v-for="i in st.pool" :key="'o' + i" class="obtn" hover-class="press" @tap="go({ i })">{{ w.items[i].t }}</view>
      </template>
    </view>

    <!-- 选词拼 -->
    <view v-else-if="w.kind === 'chips'" class="col">
      <view v-for="sl in w.slots" :key="sl.k" class="crow">
        <text class="crow-k">{{ sl.q || sl.k }}</text>
        <view class="cops"><view v-for="(o, j) in sl.options" :key="j" class="cop" :class="{ on: st.val[sl.k] === o.t }" hover-class="press" @tap="go({ k: sl.k, j })">{{ o.t }}</view></view>
      </view>
      <view v-if="w.preview" class="cprev"><text v-for="(x, i) in previewParts" :key="i" :class="{ fill: x.k && x.on, blank: x.k && !x.on }">{{ x.t }}</text></view>
    </view>

    <!-- 分时间 -->
    <view v-else-if="w.kind === 'alloc'" class="col">
      <view class="abar">
        <view v-for="(p, i) in w.parts" :key="i" class="aseg" :class="'s' + i" :style="{ flexGrow: st.v[i] }"><text>{{ p.k }}</text></view>
        <view v-if="allocSum < w.total" class="aseg gap" :style="{ flexGrow: w.total - allocSum }" />
      </view>
      <view v-for="(p, i) in w.parts" :key="i" class="arow">
        <text class="arow-k">{{ p.k }}</text>
        <view class="ab" hover-class="press" @tap="go({ p: i, d: -1 })">−</view>
        <text class="av">{{ st.v[i] }} 分钟</text>
        <view class="ab" hover-class="press" @tap="go({ p: i, d: 1 })">+</view>
      </view>
      <text class="wcount">合计 {{ allocSum }} / {{ w.total }} 分钟</text>
    </view>

    <!-- 放文字 -->
    <view v-else-if="w.kind === 'place'" class="col">
      <view class="ptexts"><view v-for="(t, i) in w.texts" :key="i" class="ptx" :class="{ on: st.sel === i && !placed(i), done: placed(i) }" @tap="go({ text: i })">{{ t.t }}</view></view>
      <view class="pic" :style="{ paddingTop: ratioPct }">
        <image class="pic-i" :src="url(w.img)" mode="aspectFill" />
        <view v-for="z in w.zones" :key="z.k" class="zone" :class="{ has: zoneTexts(z.k).length }" :style="{ left: z.x + '%', top: z.y + '%', width: z.w + '%', height: z.h + '%' }" @tap="go({ zone: z.k })">
          <text v-for="i in zoneTexts(z.k)" :key="i" class="ztext" :class="{ big: w.texts[i].big }">{{ w.texts[i].t }}</text>
          <text v-if="!zoneTexts(z.k).length" class="zlab">{{ z.label }}</text>
        </view>
      </view>
    </view>

    <!-- 读一遍 -->
    <view v-else-if="w.kind === 'read'" class="col">
      <view class="tp"><text v-for="(c, i) in chars" :key="i" :class="{ lit: i < lit }">{{ c }}</text></view>
      <text class="tclock">{{ st.phase === 'done' ? '用了 ' + st.secs + ' 秒' : secs + ' 秒' }}</text>
      <view class="btn" :class="{ soft: st.phase === 'reading' }" hover-class="press" @tap="readTap">{{ st.phase === 'idle' ? '开始读' : st.phase === 'reading' ? '读完了' : '再读一遍' }}</view>
    </view>

    <!-- 翻一翻 -->
    <view v-else-if="w.kind === 'book'" class="col">
      <view :key="'pg' + st.p" class="bpage" @touchstart="touchStart" @touchend="touchEnd">
        <image class="bpage-i" :src="url(w.pages[st.p].img)" mode="widthFix" />
        <text class="bpage-c">{{ w.pages[st.p].cap }}</text>
        <text v-if="w.pages[st.p].text" class="bpage-t">{{ w.pages[st.p].text }}</text>
      </view>
      <view class="bnav">
        <view class="ab" :class="{ off: st.p === 0 }" hover-class="press" @tap="go({ d: -1 })">‹</view>
        <view class="dots"><view v-for="(x, i) in w.pages" :key="i" class="dot" :class="{ cur: i === st.p, on: st.seen[i] && i !== st.p }" /></view>
        <view class="ab" :class="{ off: st.p === w.pages.length - 1 }" hover-class="press" @tap="go({ d: 1 })">›</view>
      </view>
    </view>

    <!-- 成片：时间线、字幕、导出 -->
    <view v-else-if="w.kind === 'film'" class="col">
      <view class="tl">
        <view v-for="(f, i) in w.frames" :key="i" class="tl-f">
          <image class="tl-i" :src="url(f)" mode="aspectFill" />
          <text v-if="i < subs" class="tl-s">{{ w.subs[i] }}</text>
        </view>
      </view>
      <view class="export"><text>导出</text><view class="ebar"><view class="efill" :style="{ width: exported ? '100%' : '0%' }" /></view><text>{{ exported ? '100%' : '0%' }}</text></view>
      <text class="cap">{{ w.caption }}</text>
      <video v-if="exported && props.video" class="film" :src="url(props.video.src)" :poster="url(props.poster)" controls object-fit="cover" :show-center-play-btn="true" />
    </view>

    <view v-if="fb && fb.msg" :key="'fb' + fbKey" class="wfb" :class="{ ok: fb.ok === true && !plainFb, no: fb.ok === false }">
      <text v-if="fb.ok === true && !plainFb" class="wfb-tag">对了</text><text>{{ fb.msg }}</text>
    </view>
  </view>
</template>

<script setup>
// 「跟着做」里的一种玩法。规则（怎么算对、做完）都在 data/zuo-core.js（由网页版 static/learn/zuo-core.js 生成），这里只管画出来。
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import core from '../data/zuo-core.js';
import { mediaUrl } from '../data/ai-core.js';

const props = defineProps({
  w: { type: Object, required: true },
  lite: { type: Object, default: () => ({}) },
  solved: { type: Boolean, default: false },
  video: { type: Object, default: null },
  poster: { type: String, default: '' },
});
const emit = defineEmits(['done', 'react']);
const LABEL = { mask: '打码', spot: '找茬', judge: '分一分', pick: '选一选', order: '排顺序', chips: '选词拼', alloc: '分时间', place: '放文字', read: '读一遍', book: '翻一翻', film: '看成片' };
const label = LABEL[props.w.kind] || '玩一玩';
const st = reactive(core.start(props.w));
const fb = ref(null);
const fbKey = ref(0);
const finished = ref(false);
const plainFb = props.w.kind === 'read' || props.w.kind === 'alloc';
const url = (p) => mediaUrl(p, props.lite);

function check() {
  if (finished.value || !core.done(props.w, st)) return;
  finished.value = true;
  emit('done', core.saved(props.w, st));
}
function go(a) {
  const r = core.act(props.w, st, a) || { ok: null, msg: '' };
  if (props.w.kind !== 'book' && props.w.kind !== 'film') emit('react', r.ok);
  if (r.msg) { fb.value = r; fbKey.value++; } else if (props.w.kind === 'pick' || props.w.kind === 'chips') fb.value = null;
  check();
}

/* 打码、找茬 */
const maskWords = core.K.mask.words(props.w);
const isText = (seg) => !seg || typeof seg !== 'object';
const maskHit = (seg) => Object.prototype.hasOwnProperty.call(maskWords.need, seg.w) && !!st.hit && !!st.hit[seg.w];
const maskLeft = computed(() => (props.w.kind === 'mask' ? core.K.mask.left(props.w, st) : 0));
const spotLeft = computed(() => (props.w.kind === 'spot' ? core.K.spot.left(props.w, st) : 0));
/* 分一分 */
const judgeItem = computed(() => (props.w.kind === 'judge' ? props.w.items[st.i] || null : null));
/* 排顺序 */
const orderImgs = (props.w.items || []).some((x) => x.img);
/* 选词拼 */
const previewParts = computed(() => String(props.w.preview || '').split(/(\{[^}]+\})/).filter(Boolean).map((part) => {
  const m = /^\{([^}]+)\}$/.exec(part);
  if (!m) return { t: part };
  const on = st.val && Object.prototype.hasOwnProperty.call(st.val, m[1]);
  return { k: m[1], on, t: on ? st.val[m[1]] : '____' };
}));
/* 分时间 */
const allocSum = computed(() => (props.w.kind === 'alloc' ? core.K.alloc.sum(props.w, st) : 0));
/* 放文字 */
const placed = (i) => !!st.at && Object.prototype.hasOwnProperty.call(st.at, i);
const zoneTexts = (k) => (props.w.texts || []).map((t, i) => (placed(i) && st.at[i] === k ? i : -1)).filter((i) => i >= 0);
const ratioPct = computed(() => { const m = String(props.w.ratio || '4/3').split('/'); return (Number(m[1]) / Number(m[0]) * 100).toFixed(2) + '%'; });
/* 读一遍 */
const chars = Array.from(String(props.w.text || ''));
const lit = ref(0);
const secs = ref(0);
let readTimer = 0;
function readStop() {
  clearInterval(readTimer);
  const r = core.act(props.w, st, { stop: true, now: Date.now() });
  lit.value = chars.length;
  if (r.msg) { fb.value = { ok: null, msg: r.msg }; fbKey.value++; }
  check();
}
function readTap() {
  if (st.phase === 'reading') { readStop(); return; }
  core.act(props.w, st, { go: true, now: Date.now() });
  lit.value = 0; secs.value = 0; fb.value = null;
  const per = 1000 / (props.w.cps || 4.5);
  clearInterval(readTimer);
  readTimer = setInterval(() => {
    const ms = Date.now() - st.t0;
    secs.value = Math.round(ms / 1000);
    lit.value = Math.min(chars.length, Math.floor(ms / per));
    if (lit.value >= chars.length && ms > chars.length * per + 1500) readStop();
  }, 120);
}
/* 翻一翻 */
let x0 = null;
function touchStart(e) { x0 = e.touches && e.touches[0] ? e.touches[0].clientX : null; }
function touchEnd(e) {
  if (x0 == null || !e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - x0; x0 = null;
  if (Math.abs(dx) > 40) go({ d: dx < 0 ? 1 : -1 });
}
/* 成片 */
const subs = ref(0);
const exported = ref(false);
let filmTimers = [];
function filmEnd() { subs.value = (props.w.subs || []).length; exported.value = true; if (!st.end) go({ end: true }); }
onMounted(() => {
  if (props.w.kind === 'film' && !props.solved) {
    (props.w.subs || []).forEach((_, i) => filmTimers.push(setTimeout(() => { subs.value = i + 1; }, 300 + i * 450)));
    filmTimers.push(setTimeout(() => { exported.value = true; }, 300 + (props.w.subs || []).length * 450 + 200));
    filmTimers.push(setTimeout(filmEnd, 300 + (props.w.subs || []).length * 450 + 1400));
  }
  if (props.solved) solveNow();
  check();
});
onUnmounted(() => { clearInterval(readTimer); filmTimers.forEach(clearTimeout); });

/* 跳过练习：直接摆成做好的样子 */
function solveNow() {
  clearInterval(readTimer); filmTimers.forEach(clearTimeout);
  core.solve(props.w, st);
  if (props.w.kind === 'read') lit.value = chars.length;
  if (props.w.kind === 'film') { subs.value = (props.w.subs || []).length; exported.value = true; }
  check();
}
watch(() => props.solved, (v) => { if (v) solveNow(); });
</script>

<style scoped>
.wg{display:flex;flex-direction:column;gap:10px;background:#fff;border-radius:20px;padding:14px 16px;animation:rise .3s ease both}
.wh{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.wk{font-size:12px;font-weight:900;color:#fff;background:#2b44e6;border-radius:8px;padding:2px 9px}
.done .wk{background:#eceffe;color:#2b44e6}
.wt{font-size:11px;font-weight:700;color:#5f6675;background:#f3f4f6;border-radius:6px;padding:2px 7px}
.wok{margin-left:auto;font-size:12px;font-weight:900;color:#2b44e6}
.wask{font-size:16px;font-weight:800;line-height:1.55}
.col{display:flex;flex-direction:column;gap:10px}
.wcount{font-size:13px;font-weight:800;color:#5f6675;text-align:center}
.wfb{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#f3f4f6;border-radius:12px;padding:9px 12px;font-size:14px;line-height:1.6;animation:rise .25s ease both}
.wfb.ok{background:#eceffe}
.wfb.no{animation:shake .4s ease}
.wfb-tag{background:#2b44e6;color:#fff;font-size:12px;font-weight:900;border-radius:7px;padding:1px 8px}
.press{opacity:.75}
/* 打码 */
.note{background:#f3f4f6;border-radius:14px;padding:12px 14px;font-size:15px;line-height:2.1;display:flex;flex-direction:column}
.nline.head{font-weight:900;line-height:1.6;margin-bottom:4px}
.tok{font-weight:700;padding:1px 3px;border-radius:6px;border-bottom:2px solid #2b44e6}
.tok.hit{background:#161a23;color:#f3f4f6;border-bottom:0}
/* 找茬 */
.ref{display:flex;flex-direction:column;background:#f3f4f6;border-radius:14px;padding:10px 14px}
.ref-h{font-size:12px;font-weight:900;color:#5f6675}
.ref-l{font-size:14px;line-height:1.7}
.spot{display:flex;flex-direction:column;gap:2px;border:2px solid #e6e8ec;border-radius:12px;padding:9px 12px;font-size:15px;font-weight:700;line-height:1.5}
.spot.found{border-color:#2b44e6;background:#eceffe}
.old{text-decoration:line-through;color:#5f6675;font-size:13px;font-weight:600}
.fix{color:#2b44e6}
/* 分一分 */
.dots{display:flex;justify-content:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%;background:#e6e8ec}
.dot.on{background:#2b44e6}.dot.cur{background:#2b44e6;transform:scale(1.35)}
.jcard{border:2px solid #e6e8ec;border-radius:18px;padding:18px 16px;text-align:center;font-size:18px;font-weight:800;line-height:1.5;animation:cardin .4s ease both}
.jcard.img{padding:8px}
.jimg{position:relative;width:100%;padding-top:56.25%;overflow:hidden;border-radius:12px}
.jimg.crop{padding-top:100%}
.jimg-i{position:absolute;left:0;top:0;width:100%;height:100%}
.jimg.crop .jimg-i{left:auto;right:0;width:auto}
.bins{display:flex;gap:10px}
.bins.three{flex-direction:column}
.bin{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;border:2px solid #2b44e6;color:#2b44e6;border-radius:14px;min-height:52px;padding:6px 10px;font-size:16px;font-weight:900}
.jsum{display:flex;flex-direction:column;gap:6px}
.jsum-r{display:flex;justify-content:space-between;gap:10px;background:#f3f4f6;border-radius:10px;padding:7px 10px;font-size:14px;line-height:1.5}
.jsum-t{flex:1;min-width:0}.jsum-b{flex:none;color:#2b44e6;font-size:13px;font-weight:800}
/* 选一选 */
.pimgs{display:flex;flex-direction:column;gap:8px}
.pimgs.two{flex-direction:row}
.pimg{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.pimg-i{width:100%;border-radius:12px;display:block}
.pimg-l{font-size:11px;font-weight:800;color:#5f6675}
.opt{border:2px solid #e6e8ec;border-radius:16px;padding:13px 15px;font-size:16px;line-height:1.55;font-weight:600}
.opt.right{border-color:#2b44e6;box-shadow:0 0 0 1px #2b44e6}
.opt.wrong{color:#5f6675;text-decoration:line-through}
/* 排顺序 */
.oli{display:flex;align-items:flex-start;gap:10px;background:#eceffe;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700;line-height:1.6;animation:pop .28s ease both}
.oli-n{flex:none;width:24px;height:24px;line-height:24px;text-align:center;border-radius:8px;background:#2b44e6;color:#fff;font-size:13px}
.oli-t{flex:1;min-width:0}
.obtn{border:2px solid #e6e8ec;border-radius:12px;min-height:48px;padding:8px 12px;font-size:15px;font-weight:700;line-height:1.5}
.track,.tpool{display:flex;gap:6px}
.track{background:#f3f4f6;border-radius:12px;padding:6px}
.tslot,.tthumb{position:relative;flex:1;min-width:0;padding-top:42%;border-radius:8px;overflow:hidden}
.tslot{border:2px dashed #e6e8ec}
.tslot.on{border:0}
.tslot-i{position:absolute;left:0;top:0;width:100%;height:100%}
.tslot-n{position:absolute;left:4px;top:4px;width:20px;height:20px;line-height:20px;text-align:center;border-radius:6px;background:#fff;color:#2b44e6;font-size:12px;font-weight:800}
/* 选词拼 */
.crow{display:flex;flex-direction:column;gap:6px}
.crow-k{font-size:13px;font-weight:900;color:#5f6675}
.cops{display:flex;flex-wrap:wrap;gap:8px}
.cop{border:2px solid #e6e8ec;border-radius:12px;min-height:40px;padding:6px 12px;font-size:15px;font-weight:700;line-height:1.4;display:flex;align-items:center}
.cop.on{border-color:#2b44e6;background:#eceffe;color:#2b44e6}
.cprev{background:#f3f4f6;border-radius:12px;padding:10px 12px;font-size:15px;line-height:1.8}
.cprev .fill{color:#2b44e6;font-weight:800}
.cprev .blank{color:#5f6675}
/* 分时间 */
.abar{display:flex;height:34px;border-radius:10px;overflow:hidden;gap:2px;background:#f3f4f6}
.aseg{flex-basis:0;min-width:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;background:#2b44e6;overflow:hidden;white-space:nowrap;transition:flex-grow .3s}
.aseg.s1{background:#1f33b8}.aseg.s2{background:#5b6cf0}.aseg.s3{background:#8a97f5}
.aseg.gap{background:#e6e8ec}
.arow{display:flex;align-items:center;gap:8px}
.arow-k{flex:1;font-size:15px;font-weight:800}
.ab{flex:none;width:44px;height:44px;line-height:40px;text-align:center;border:2px solid #e6e8ec;border-radius:12px;font-size:22px;font-weight:800;box-sizing:border-box}
.ab.off{opacity:.35}
.av{width:74px;text-align:center;font-size:15px;font-weight:900}
/* 放文字 */
.ptexts{display:flex;flex-wrap:wrap;gap:8px}
.ptx{border:2px solid #e6e8ec;border-radius:12px;min-height:40px;padding:6px 12px;font-size:15px;font-weight:800;display:flex;align-items:center}
.ptx.on{border-color:#2b44e6;background:#eceffe;color:#2b44e6}
.ptx.done{opacity:.4;text-decoration:line-through}
.pic{position:relative;width:100%;height:0;border-radius:12px;overflow:hidden;background:#f3f4f6}
.pic-i{position:absolute;left:0;top:0;width:100%;height:100%}
.zone{position:absolute;box-sizing:border-box;border:2px dashed rgba(255,255,255,.95);background:rgba(43,68,230,.14);border-radius:10px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:4px;padding:4px 8px}
.zone.has{border-color:transparent;background:transparent}
.zlab{font-size:11px;font-weight:800;color:#161a23;background:rgba(255,255,255,.9);border-radius:6px;padding:1px 6px}
.ztext{font-size:12px;font-weight:700;color:#3a4a2e;animation:fly .45s ease both}
.ztext.big{font-size:17px;font-weight:900;color:#2f3d24}
/* 读一遍 */
.tp{background:#1c2550;color:rgba(255,255,255,.45);border-radius:14px;padding:14px 16px;font-size:19px;font-weight:800;line-height:1.8}
.tp .lit{color:#fff}
.tclock{text-align:center;font-size:26px;font-weight:900}
.btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.btn.soft{background:#eceffe;color:#2b44e6}
/* 翻一翻 */
.bpage{display:flex;flex-direction:column;gap:6px;animation:flip .45s ease both}
.bpage-i{width:100%;border-radius:12px;display:block}
.bpage-c{font-size:12px;font-weight:800;color:#5f6675}
.bpage-t{font-size:15px;line-height:1.6}
.bnav{display:flex;align-items:center;justify-content:space-between}
/* 成片 */
.tl{display:flex;gap:6px}
.tl-f{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.tl-i{width:100%;height:132px;border-radius:8px;display:block}
.tl-s{font-size:11px;line-height:1.35;font-weight:700;color:#2b44e6;background:#eceffe;border-radius:6px;padding:3px 4px;animation:pop .3s ease both}
.export{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;color:#5f6675}
.ebar{flex:1;height:8px;border-radius:4px;background:#e6e8ec;overflow:hidden}
.efill{height:100%;background:#2b44e6;transition:width 1.1s ease}
.cap{font-size:12px;color:#5f6675;line-height:1.5}
.film{width:236px;height:420px;border-radius:16px;align-self:center}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes shake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes cardin{from{opacity:0;transform:translateX(40px) rotate(4deg)}to{opacity:1;transform:none}}
@keyframes fly{from{opacity:0;transform:translateY(-30px) scale(.8)}to{opacity:1;transform:none}}
@keyframes flip{from{opacity:0;transform:perspective(900px) rotateY(-70deg)}to{opacity:1;transform:none}}
</style>
