<template>
  <view class="mini-home">
    <view class="brand" :style="{paddingTop: statusBarHeight + 'px'}"><view class="brand-mark">↗</view><text class="brand-name">AINPE实战情报站</text></view>
    <view class="content">
      <view class="eyebrow"><text class="dot">●</text> AI 实用教程 · 从一件小事开始</view>
      <view class="headline">让普通人，<br/>也能用 AI 做成事</view>
      <!-- 小A 和三位朋友：点谁谁说话，带你去合适的地方 -->
      <view class="meet">
        <view class="meet-top">
          <view class="big-a" :class="{hop: hopA}" @tap="tapA"><image class="big-a-img" :src="faceSrc" mode="aspectFill" /></view>
          <view class="speech"><text class="speech-who">{{speaker.name}}</text><text class="speech-t">{{typed}}</text></view>
        </view>
        <view class="friends">
          <view v-for="f in friends" :key="f.k" class="friend" :class="{on: who===f.k}" hover-class="press" @tap="tapFriend(f.k)">
            <image class="friend-img" :src="roles[f.k].src" mode="aspectFill" />
            <view class="friend-t"><text class="friend-n">{{roles[f.k].name}}</text><text class="friend-s">{{f.tag}}</text></view>
          </view>
        </view>
        <view v-if="lines[who].go" class="meet-go" hover-class="press" @tap="goLine"><text>{{lines[who].go}}</text><text>›</text></view>
      </view>
      <view class="search-entry" @tap="openSearch"><text>⌕　你遇到了什么事？说一句就行</text><text class="search-action">找用法 ›</text></view>
      <view class="hero-actions"><button class="primary" @tap="openGuides">开始做第一件事 ↗</button><button class="text-link" @tap="showHelp">第一次来？看看怎么用 ›</button></view>

      <!-- 今天的每日 AI -->
      <view v-if="daily" class="daily" hover-class="press" @tap="openDaily">
        <view class="daily-cv">
          <view v-for="st in stars" :key="st.k" class="star" :style="{left: st.left, top: st.top, animationDelay: st.delay}" />
          <text class="daily-tag">{{daily.isToday ? '今天 · ' : '最近一期 · '}}{{daily.issue.kind}}</text>
          <text class="daily-q">{{daily.issue.cover}}</text>
          <image class="daily-b" :src="roles[daily.issue.who].src" mode="aspectFill" />
          <image class="daily-a" :src="roles.a.src" mode="aspectFill" />
        </view>
        <view class="daily-tx">
          <view class="daily-k"><text>每日 AI · {{todayLabel}}</text><view class="dots"><view v-for="d in weekDays" :key="d.date" class="dot2" :class="{done: d.onTime || d.late, today: d.today}" /></view></view>
          <text class="daily-title">{{daily.issue.title}}</text>
          <view class="daily-btn" :class="{done: dailyDone}">{{dailyDone ? '已完成 · 再玩一次' : daily.issue.btn + ' · 得 ' + (daily.isToday ? xp.today : xp.makeup) + ' 经验'}}</view>
        </view>
      </view>

      <!-- 学 AI 进度 -->
      <view class="learn" hover-class="press" @tap="openLearn">
        <text class="learn-k">{{learn.k}}</text>
        <text class="learn-title">{{learn.title}}</text>
        <view class="stairs"><view v-for="(s, i) in learn.stairs" :key="i" class="stair" :class="['h' + i, s]" /></view>
        <view class="stairs-lb"><text v-for="l in stairLabels" :key="l" class="stair-l">{{l}}</text></view>
        <view class="learn-meta"><text>已学完 {{learn.done}} / {{learn.total}} 节</text><text>Lv.{{level.number}} {{level.name}}</text></view>
      </view>

      <view class="section-head"><view><view class="section-title">选一件事，开始做</view><view class="section-sub">从适合自己的地方出发，不用按顺序。</view></view><text class="more" @tap="openGuides">全部教程 ↗</text></view>
      <view v-for="(guide, index) in homeGuides" :key="guide.id" class="level-card" :class="{first: index === 0}" @tap="openGuide(guide.id)">
        <view class="cover-wrap"><image class="cover-image" :src="guide.cover" mode="aspectFill"/><text class="cover-label">{{guide.coverLabel}}</text></view>
        <view class="level-content"><view class="card-top"><text class="badge" :class="guideBadge(guide.level)">{{guide.level}}</text><text v-if="index === 0" class="minor">第一次来推荐</text></view><view class="card-title">{{guide.title}}</view><view class="card-description">{{guide.intro}}</view><view class="card-link">跟着步骤做 <text class="card-arrow">↗</text></view></view>
      </view>
      <view class="level-card future">
        <view class="cover-wrap"><image class="cover-image" src="https://ainpe.aisen.xin/static/design/ai-assistant-illustration.jpg" mode="aspectFill"/><text class="cover-label">配图示意</text></view>
        <view class="level-content"><view class="card-top"><text class="badge advanced">超级挑战</text><text class="minor">筹备中</text></view><view class="card-title">做一个自己的 AI 助手</view><view class="card-description">设定任务、反复调整，做出可复用的助手。</view><view class="card-muted">完整教程正在准备</view></view>
      </view>

      <view class="prompt-entry" @tap="openLibrary"><view><view class="prompt-title">生活里遇到小事？</view><view class="section-sub">打开快捷提示词，复制一句话就能开始。</view></view><text class="more">查看 ›</text></view>
      <view class="bottom-note">提示词需要在你常用的 AI 工具中使用。</view>
    </view>
    <MiniNav active="home" />
  </view>
</template>

<script setup>
import zuoData from '../data/mini-zuo.json';
import guides from '../data/mini-guides.json';
const zuoScripts=zuoData.SCRIPTS||{};
const homeGuides=['meeting-notes','video-script','short-drama'].map(id=>guides.find(guide=>guide.id===id)).filter(Boolean);
function guideBadge(level){return level==='简单'?'beginner':level==='一般'?'middle':'advanced';}
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import MiniNav from './MiniNav.vue';
import mini from '../data/mini-ai.json';
import { ROLES, A_FACES, loadStore, levelInfo, ymd, mmdd, currentIssue, week, resumeLesson, unitOf, unitNo } from '../data/ai-core.js';
const props = defineProps({ tick: { type: Number, default: 0 } });
const roles = ROLES;
let statusBarHeight=0;
try { const info = typeof wx !== 'undefined' && typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : uni.getSystemInfoSync(); statusBarHeight = Number(info.statusBarHeight) || 0; } catch {}
function openGuides(){uni.navigateTo({url:'/pages/learn/guides'});}
function openSearch(){uni.navigateTo({url:'/pages/learn/find'});}
function openLibrary(){uni.navigateTo({url:'/pages/learn/library'});}
function openGuide(id){uni.navigateTo({url:(zuoScripts[id]?'/pages/learn/zuo?id=':'/pages/learn/guide?id=')+encodeURIComponent(id)});}
function showHelp(){uni.showModal({title:'第一次来？小A 带你看看',content:'底部五个入口：「每日 AI」每天一期 3 分钟的小互动，做完能涨经验；「学 AI」六个单元按顺序学；中间的小A 是「找用法」，说一句你遇到的事就行；「我的」里看等级和徽章。提示词要复制到你常用的 AI 工具里用，用完记得检查结果。',showCancel:false,confirmText:'知道了'});}

/* ---------- 小A 和三位朋友 ---------- */
const lines = {
  a: { text: ['你好，我是小A。', '遇到什么事，说一句，我帮你找用法。', '每天来玩 3 分钟，慢慢就会用 AI 了。'] },
  lin: { text: ['写消息、整理资料、做计划，我常找小A 帮忙。'], go: '学一节：把话说清楚', url: '/pages/learn/lesson?id=clear' },
  yuan: { text: ['讲题、编睡前故事、问生活里的小事，孩子也爱一起玩。'], go: '和孩子一起：给它看个例子', url: '/pages/learn/lesson?id=example' },
  zhou: { text: ['我刚开始学，很多基础问题都想问问。'], go: '从第一课开始：AI 能帮你做什么', url: '/pages/learn/lesson?id=can' },
};
const friends = [{ k: 'lin', tag: '上班族' }, { k: 'yuan', tag: '带孩子' }, { k: 'zhou', tag: '刚入门' }];
const who = ref('a'), typed = ref(''), hopA = ref(false), blinking = ref(false);
const speaker = computed(() => roles[who.value]);
const faceSrc = computed(() => (blinking.value ? A_FACES.blink : A_FACES.happy));
let lineIdx = 0, typeTimer = null, rotateTimer = null, blinkTimer = null;
function say(k) {
  who.value = k; clearTimeout(typeTimer); clearTimeout(rotateTimer);
  const list = lines[k].text, text = list[k === 'a' ? lineIdx % list.length : 0];
  typed.value = ''; let i = 0;
  (function step() { if (i >= text.length) { rotateTimer = setTimeout(() => { lineIdx++; say('a'); }, k === 'a' ? 3800 : 6500); return; } typed.value += text.charAt(i++); typeTimer = setTimeout(step, 55); })();
}
function tapA() { hopA.value = false; setTimeout(() => { hopA.value = true; }, 20); lineIdx++; say('a'); }
function tapFriend(k) { say(k); }
function goLine() { const url = lines[who.value].url; if (url) uni.navigateTo({ url }); }
function blink() { blinkTimer = setTimeout(() => { blinking.value = true; setTimeout(() => { blinking.value = false; blink(); }, 170); }, 3200 + Math.random() * 1800); }
onMounted(() => { refresh(); say('a'); blink(); });
onUnmounted(() => { clearTimeout(typeTimer); clearTimeout(rotateTimer); clearTimeout(blinkTimer); });

/* ---------- 今天的每日 AI、学 AI 进度（只读本机记录） ---------- */
const xp = mini.meiri.XP;
const today = ref(ymd(new Date())), store = ref(loadStore(uni));
function refresh() { today.value = ymd(new Date()); store.value = loadStore(uni); }
watch(() => props.tick, refresh);
const daily = computed(() => { const c = currentIssue(mini.meiri.ISSUES, today.value); return c.issue ? c : null; });
const dailyDone = computed(() => !!(daily.value && store.value.daily[daily.value.issue.id]));
const weekDays = computed(() => week(store.value, mini.meiri.ISSUES, today.value));
const todayLabel = computed(() => mmdd(today.value));
const level = computed(() => levelInfo(store.value.xp));
const stairLabels = ['认识', '表达', '文字', '图声', '视频', '作品'];
const learn = computed(() => {
  const X = mini.xue, s = store.value, total = X.ORDER.length, done = X.ORDER.filter((id) => s.lessons[id]).length;
  const resume = resumeLesson(X.ORDER, s);
  let current = -1;
  const stairs = X.UNITS.map((u, k) => { const all = u.lessons.every((id) => s.lessons[id]); if (!all && current < 0) { current = k; return 'now'; } return all ? 'done' : ''; });
  if (!resume) return { k: '学 AI', title: '动画课都学完了', total, done, stairs, id: '' };
  const u = unitOf(X.UNITS, resume);
  return { k: (done ? '学 AI · 接着学 · ' : '学 AI · 从这里开始 · ') + unitNo(u) + '第 ' + (u.lessons.indexOf(resume) + 1) + ' 节', title: X.LESSONS[resume].title, total, done, stairs, id: resume };
});
const stars = Array.from({ length: 10 }, (_, k) => ({ k, left: (5 + ((k * 37) % 55)) + '%', top: (10 + ((k * 53) % 60)) + '%', delay: (k % 5) * 0.4 + 's' }));
function openDaily() { const d = daily.value; uni.navigateTo({ url: d ? '/pages/learn/play?id=' + encodeURIComponent(d.issue.id) : '/pages/learn/daily' }); }
function openLearn() { const id = learn.value.id; uni.navigateTo({ url: id ? '/pages/learn/lesson?id=' + encodeURIComponent(id) : '/pages/learn/learning' }); }
</script>

<style scoped>
.mini-home{min-height:100vh;background:#f3f4f6;color:#161d2a;padding-bottom:calc(72px + env(safe-area-inset-bottom));box-sizing:border-box}
.brand{height:50px;box-sizing:content-box;background:#fff;display:flex;align-items:center;gap:8px;padding-left:16px;padding-right:110px;font-size:15px;font-weight:800}
.brand-mark{display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:#ffce54;color:#163426;border-radius:7px;font-size:21px}
.brand-name{white-space:nowrap;font-size:14px}
.content{padding:20px 16px 0}
.eyebrow{color:#53627c;font-size:11px;font-weight:700;letter-spacing:.02em}.dot{color:#5269ea;margin-right:5px}
.headline{font-size:31px;line-height:1.2;letter-spacing:-.5px;font-weight:900;margin-top:15px}.intro{font-size:14px;line-height:1.7;color:#5f6b7c;margin-top:11px}
.hero-actions{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;margin-top:20px}.primary,.text-link{margin:0;padding:0;border:0;font-size:13px;font-weight:800}.primary{min-height:44px;line-height:44px;padding:0 16px;background:#2849e9;color:#fff;border-radius:10px}.text-link{min-height:44px;line-height:44px;color:#2849e9;background:transparent}.primary::after,.text-link::after{border:0}
.section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin:24px 0 14px}.section-title{font-size:19px;line-height:1.35;font-weight:850}.section-sub{margin-top:4px;color:#738199;font-size:12px;line-height:1.5}.more{flex-shrink:0;color:#2849e9;font-size:12px;font-weight:800}
.level-card{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #e5e9f0;border-radius:14px;padding:14px;margin-bottom:9px}.level-card.first{border:2px solid #6882ff;padding:13px}.level-card.future{cursor:default}.level-content{flex:1;min-width:0}.cover-wrap{position:relative;flex:0 0 76px;width:76px;height:76px;border-radius:12px;overflow:hidden}.cover-image{width:100%;height:100%;display:block}.cover-label{position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,.55);color:#fff;font-size:9px;border-radius:3px;padding:1px 3px}.card-top{display:flex;align-items:center;justify-content:space-between;gap:4px}.badge{display:inline-block;padding:4px 6px;border-radius:6px;font-size:10px;font-weight:800;white-space:nowrap}.beginner{color:#008d49;background:#e4f8ec}.middle{color:#2849e9;background:#edf1ff}.advanced{color:#dd511d;background:#fff0e8}.minor{font-size:10px;color:#8291a6;white-space:nowrap}.card-title{margin-top:7px;font-size:15px;font-weight:850;line-height:1.4}.card-description{margin-top:4px;color:#75839a;font-size:12px;line-height:1.55}.card-link,.card-muted{margin-top:7px;font-size:12px;font-weight:800;color:#2849e9}.card-arrow{float:right}.card-muted{color:#8d99aa}
.search-entry{display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding:14px;background:#fff;border:1px solid #e3e7ef;border-radius:12px;color:#8490a1;font-size:13px}.search-action{color:#2849e9;font-weight:800}.section-space{margin-top:34px}.lesson-list{display:grid;gap:10px}.lesson{display:flex;gap:13px;align-items:center;padding:12px;background:#fff;border:1px solid #e5e9f0;border-radius:14px}.lesson-image{width:100px;height:82px;flex-shrink:0;border-radius:9px}.lesson-body{flex:1;min-width:0}.lesson-tag{font-size:10px;color:#6f7d91}.lesson-title{font-size:15px;font-weight:800;margin-top:3px}.lesson-description{font-size:12px;color:#748298;line-height:1.5;margin:4px 0}.prompt-entry{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#e9eefc;border-radius:14px;padding:17px;margin-top:24px}.prompt-title{font-size:15px;font-weight:800}.bottom-note{color:#8793a5;font-size:11px;line-height:1.6;margin:22px 0;text-align:center}
/* 小A 和三位朋友、今天的每日 AI、学 AI 进度 */
.meet{margin-top:16px;background:#fff;border-radius:22px;padding:14px;box-shadow:0 14px 30px -24px rgba(22,26,35,.5)}
.meet-top{display:flex;align-items:flex-end;gap:12px}
.big-a{flex:none;width:88px;height:88px;border-radius:50%;overflow:hidden;animation:homeBob 2.6s ease-in-out infinite}
.big-a.hop{animation:homeJump .7s ease 1}
.big-a-img{display:block;width:88px;height:88px}
.speech{flex:1;min-width:0;display:flex;flex-direction:column;background:#eceffe;border-radius:18px 18px 18px 6px;padding:10px 13px;min-height:60px}
.speech-who{font-size:12px;font-weight:900;color:#2849e9}.speech-t{font-size:15px;font-weight:700;line-height:1.55;color:#161d2a}
.friends{display:flex;gap:8px;margin-top:12px}
.friend{flex:1;min-width:0;display:flex;align-items:center;gap:6px;border:2px solid transparent;background:#f3f4f6;border-radius:14px;padding:6px}
.friend.on{border-color:#2849e9;background:#fff}
.friend-img{flex:none;width:36px;height:36px;border-radius:50%;animation:homeBob 2.6s ease-in-out infinite}
.friend-t{display:flex;flex-direction:column;min-width:0}.friend-n{font-size:13px;font-weight:900}.friend-s{font-size:10px;font-weight:700;color:#738199;white-space:nowrap}
.meet-go{display:flex;justify-content:space-between;align-items:center;margin-top:10px;min-height:44px;padding:0 14px;border-radius:12px;background:#2849e9;color:#fff;font-size:14px;font-weight:800}
.daily{margin-top:18px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 14px 30px -24px rgba(22,26,35,.5)}
.daily-cv{position:relative;height:140px;overflow:hidden;background:linear-gradient(160deg,#1c2550,#33407f)}
.star{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;animation:homeTwinkle 2.4s ease-in-out infinite}
.daily-tag{position:absolute;left:12px;top:12px;font-size:12px;font-weight:800;color:#fff;background:rgba(255,255,255,.18);border-radius:8px;padding:3px 9px}
.daily-q{position:absolute;left:14px;top:42px;right:160px;color:#fff;font-size:14px;font-weight:800;line-height:1.5}
.daily-a,.daily-b{position:absolute;border-radius:50%;border:4px solid rgba(255,255,255,.9)}
.daily-a{right:12px;bottom:-10px;width:74px;height:74px;animation:homeBob 2.6s ease-in-out infinite}
.daily-b{right:76px;bottom:-14px;width:62px;height:62px;animation:homeBob 2.6s ease-in-out .4s infinite}
.daily-tx{padding:12px 14px 14px;display:flex;flex-direction:column}
.daily-k{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;color:#2849e9}
.dots{display:flex;gap:4px}.dot2{width:8px;height:8px;border-radius:50%;background:#e6e8ec}.dot2.done{background:#2849e9}.dot2.today{box-shadow:0 0 0 2px #2849e9}
.daily-title{font-size:19px;font-weight:900;margin-top:6px}
.daily-btn{margin-top:10px;min-height:46px;line-height:46px;text-align:center;border-radius:12px;background:#2849e9;color:#fff;font-size:15px;font-weight:800}
.daily-btn.done{background:#ffc83d;color:#161d2a}
.learn{margin-top:12px;background:#fff;border-radius:20px;padding:14px;display:flex;flex-direction:column}
.learn-k{font-size:12px;font-weight:800;color:#2849e9}.learn-title{font-size:18px;font-weight:900;margin-top:4px}
.stairs{display:flex;align-items:flex-end;gap:4px;height:40px;margin-top:10px}
.stair{flex:1;border-radius:6px 6px 3px 3px;background:#e6e8ec}
.h0{height:30%}.h1{height:42%}.h2{height:56%}.h3{height:70%}.h4{height:84%}.h5{height:100%}
.stair.done{background:#ffc83d}.stair.now{background:#2849e9;animation:homePulse 1.8s ease-in-out infinite}
.stairs-lb{display:flex;gap:4px;margin-top:4px}.stair-l{flex:1;text-align:center;font-size:10px;font-weight:700;color:#738199}
.learn-meta{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;font-weight:700;color:#738199}
.press{opacity:.75}
@keyframes homeBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes homeJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}
@keyframes homeTwinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes homePulse{50%{opacity:.7}}
</style>
