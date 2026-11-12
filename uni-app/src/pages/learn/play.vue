<template>
  <view class="page">
    <view class="top">
      <view class="back" hover-class="press" aria-label="回到每日 AI" @tap="goDaily"><text>‹</text></view>
      <view class="top-t"><text class="tag-l">{{issue ? '周' + wd + ' · ' + issue.kind : '每日 AI'}}</text><text class="title">{{issue ? issue.title : '没有找到这一期'}}</text></view>
    </view>
    <view class="prog"><view v-for="i in state.prog.total" :key="i" class="seg" :class="{on: i <= state.prog.n}" /></view>
    <view class="narr"><text :key="state.narrKey" class="narr-t">{{blocked ? '这一期还没到日子，到那天再来玩。' : state.narr}}</text></view>

    <view v-if="state.result" class="done-box">
      <image class="done-a" :src="roles.a.src" mode="aspectFill" />
      <text class="xp">{{state.result.first ? '+' + (state.result.gain + state.result.bonus) + ' 经验' : '已完成'}}</text>
      <text v-if="state.result.bonus" class="done-p">含连续参与奖励 +{{state.result.bonus}}</text>
      <text v-if="state.result.levelUp" class="done-strong">你升到了「{{state.result.info.name}}」</text>
      <text class="done-p">{{state.result.line}}</text>
    </view>

    <template v-else>
      <!-- 故事分支 -->
      <view v-if="v.kind === 'story'">
        <view class="scene" :class="'s-' + (v.scene || 'night')">
          <view v-for="s in stars" :key="s.k" class="star" :style="{left: s.left, top: s.top, animationDelay: s.delay}" />
          <view class="moon" /><view class="ground" />
          <image v-if="v.prop" :key="v.prop" class="prop" :class="'p-' + v.prop" :src="art('prop-' + v.prop)" mode="widthFix" />
          <image class="bunny" :class="{sleep: v.sleep}" :src="art('bunny')" mode="aspectFit" />
          <text v-if="v.sleep" class="zz">Z z</text>
        </view>
        <view class="storyline"><text>{{v.line}}</text></view>
      </view>

      <!-- 找茬 -->
      <view v-else-if="v.kind === 'spot'" class="chat">
        <view class="row2"><image class="ava" :src="roles[v.who].src" mode="aspectFill" /><view class="bub">{{v.ask}}</view></view>
        <view class="row2"><image class="ava" :src="roles.a.src" mode="aspectFill" />
          <view class="ans"><view v-for="(s, i) in v.sentences" :key="i" class="sent" :class="{hit: s.hit, shake: s.shake, click: v.clickable}" hover-class="press" @tap="onSpot(i)"><text>{{s.text}}</text><text v-if="s.hit" class="hit-tag"> ← 错在这</text></view></view>
        </view>
      </view>

      <!-- 连续选择题（防骗） -->
      <view v-else-if="v.kind === 'quiz'" class="phone">
        <template v-if="v.chat">
          <view class="msg"><view class="from">{{v.chat.from}}</view><view class="voice"><view class="wave"><view v-for="i in 7" :key="i" class="wv" :class="'w' + (i % 3)" /></view><text>语音 {{v.chat.voice}}</text></view></view>
          <view class="msg"><view class="from">{{v.chat.from}}</view>
            <view class="text-msg"><template v-if="v.chat.segs"><text v-for="(s, i) in v.chat.segs" :key="i" :class="{red: s.m, on: s.on}">{{s.t}}</text></template><text v-else>{{v.chat.typed}}</text></view>
          </view>
        </template>
      </view>

      <!-- 拼一句 -->
      <view v-else-if="v.kind === 'puzzle'" class="chat">
        <view class="row2"><image class="ava" :src="roles[v.who].src" mode="aspectFill" />
          <view class="bub"><text v-if="!v.parts.length" class="ph">（还没拼好）</text><text v-for="(t, i) in v.parts" :key="i" class="add">{{t}}</text></view>
        </view>
        <view v-if="v.replyShow" class="row2"><image class="ava" :src="roles.a.src" mode="aspectFill" /><view class="bub ai">{{v.reply}}</view></view>
      </view>

      <!-- 今日一句 -->
      <view v-else-if="v.kind === 'oneline'" class="oneline">
        <text class="scene-tx">{{v.scene}}</text>
        <view class="quote"><text>{{v.line}}</text></view>
        <text class="tip">{{v.tip}}</text>
      </view>

      <!-- 能不能 -->
      <view v-else-if="v.kind === 'sort'" class="sorthero">
        <image class="hero-img" :src="roles[v.who].src" mode="aspectFill" /><image class="hero-img h2" :src="roles.a.src" mode="aspectFill" />
      </view>

      <!-- 新工具尝鲜 -->
      <view v-else-if="v.kind === 'walk'" class="mock">
        <view class="screen">
          <view v-if="v.screen === 'photo'" class="viewfinder"><image class="fridge" :src="art('fridge')" mode="widthFix" /></view>
          <template v-if="v.screen === 'ask' || v.screen === 'answer'">
            <view class="mine"><image class="fridge" :src="art('fridge')" mode="widthFix" /></view>
            <view v-if="v.question" class="mine-q">{{v.question}}</view>
            <view v-if="v.screen === 'answer'" class="reply"><text>{{v.answer}}</text></view>
          </template>
        </view>
        <view class="inputbar">
          <view class="cam" :class="{glow: v.cam}"><view class="cam-body"><view class="cam-lens" /></view></view>
          <view class="field"><text>{{v.field}}</text></view>
          <view class="sendbtn" :class="{glow: v.send}">发送</view>
        </view>
      </view>
    </template>

    <view v-if="state.panel.kind === 'done'" class="two">
      <view class="btn soft" hover-class="press" @tap="goLearn">去学 AI</view>
      <view class="btn" hover-class="press" @tap="goDaily">回到每日 AI</view>
    </view>
    <AiPanel v-else :panel="state.panel" @next="onNext" @choose="onChoose" @sort="onSort" @piece="onPiece" @copy="onCopy" />
  </view>
</template>

<script setup>
// 每日 AI 的一期。演出顺序在 data/ai-runner.js，内容在 data/mini-ai.json（由网页版内容生成）。
import { reactive, ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import AiPanel from '../../components/AiPanel.vue';
import mini from '../../data/mini-ai.json';
import { ROLES, ART, loadStore, saveStore, finishIssue, ymd, weekday, playable } from '../../data/ai-core.js';
import { createIssuePlayer, issueState } from '../../data/ai-runner.js';

const M = mini.meiri, roles = ROLES;
const state = reactive(issueState());
const v = computed(() => state.view);
const issueId = ref('');
const issue = computed(() => M.ISSUES.find((x) => x.id === issueId.value) || null);
const wd = computed(() => (issue.value ? weekday(issue.value.date) : ''));
const blocked = ref(false);
const art = (key) => ART(key);
const stars = Array.from({ length: 12 }, (_, k) => ({ k, left: (4 + ((k * 41) % 92)) + '%', top: (6 + ((k * 29) % 45)) + '%', delay: (k % 4) * 0.5 + 's' }));
let player = null;

// 做完：当天 +10、补玩 +5、连续奖励，记在本机
function onFinish(is) {
  const r = finishIssue(loadStore(uni), M.ISSUES, is, ymd(new Date()), M.XP);
  saveStore(uni, r.store);
  return r;
}
onLoad((options) => {
  issueId.value = String(options?.id || '');
  if (!issue.value) { state.narr = '没有找到这一期，回到每日 AI 看看。'; return; }
  if (!playable(issue.value, ymd(new Date()), M.UNLOCK_ALL)) { blocked.value = true; return; }
  player = createIssuePlayer(issue.value, state, { onFinish });
  player.start();
});
onUnload(() => { if (player) player.stop(); });
function onNext() { if (player) player.next(); }
function onChoose(i) { if (player) player.choose(i); }
function onSort(k) { if (player) player.sortPick(k); }
function onPiece(i) { if (player) player.piecePick(i); }
function onSpot(i) { if (player) player.spotPick(i); }
function onCopy() {
  const text = state.panel.text; if (!text) return;
  uni.setClipboardData({ data: text, success: () => { if (player) player.copied(); uni.showToast({ title: '已复制，去你的 AI 里试试', icon: 'none' }); } });
}
function goDaily() { if (player) player.stop(); uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/learn/daily' }) }); }
function goLearn() { const id = issue.value && issue.value.learn; uni.redirectTo({ url: id ? '/pages/learn/lesson?id=' + encodeURIComponent(id) : '/pages/learn/learning' }); }
</script>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:16px 16px calc(32px + env(safe-area-inset-bottom));background:#f3f4f6;color:#161a23;display:flex;flex-direction:column;gap:12px}
.top{display:flex;align-items:center;gap:10px}
.back{flex:none;width:44px;height:44px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1}
.top-t{flex:1;min-width:0;display:flex;flex-direction:column}.tag-l{font-size:12px;font-weight:700;color:#5f6675}.title{font-size:21px;font-weight:900;line-height:1.3}
.prog{display:flex;gap:5px}.seg{flex:1;height:6px;border-radius:3px;background:#e6e8ec}.seg.on{background:#2b44e6}
.narr{min-height:52px;display:flex;align-items:center}.narr-t{font-size:17px;font-weight:700;line-height:1.5;animation:rise .35s ease both}
/* 故事 */
.scene{position:relative;height:230px;border-radius:22px;overflow:hidden;background:linear-gradient(170deg,#1c2550,#33407f)}
.s-forest{background:linear-gradient(170deg,#1d4a3a,#3e7a57)}.s-sea{background:linear-gradient(170deg,#0f3f66,#2c79a8)}.s-home{background:linear-gradient(170deg,#4a2e55,#8e5a6e)}
.star{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;animation:twinkle 2.4s ease-in-out infinite}
.moon{position:absolute;right:26px;top:22px;width:40px;height:40px;border-radius:50%;background:#ffe7a1;box-shadow:0 0 30px 6px rgba(255,231,161,.35)}
.ground{position:absolute;left:-10%;right:-10%;bottom:-60px;height:110px;border-radius:50%;background:rgba(0,0,0,.22)}
.prop{position:absolute;left:12px;bottom:26px;animation:fadeUp .6s ease both}.p-forest{width:90px}.p-sea{width:110px}.p-home{width:110px}
.bunny{position:absolute;left:50%;bottom:22px;width:96px;height:96px;margin-left:-48px;animation:hop 1.6s ease-in-out infinite}
.bunny.sleep{animation:breathe 3s ease-in-out infinite}
.zz{position:absolute;left:58%;bottom:110px;color:#fff;font-weight:900;font-size:18px;animation:zz 2.4s ease-in-out infinite}
.storyline{margin-top:12px;background:#fff;border-radius:18px;padding:12px 16px;min-height:76px;font-size:16px;line-height:1.7}
/* 对话 */
.chat,.phone{background:#fff;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px}
.row2{display:flex;gap:10px;align-items:flex-start}
.ava{flex:none;width:44px;height:44px;border-radius:50%}
.bub{flex:1;min-width:0;background:#eceffe;border-radius:16px;padding:9px 13px;font-size:15px;font-weight:600;line-height:1.65}
.bub.ai{background:#f3f4f6;font-weight:500;animation:pop .3s ease both}
.ph{color:#5f6675;font-weight:500}
.add{background:#2b44e6;color:#fff;border-radius:6px;padding:1px 3px;margin:0 1px}
.ans{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.sent{border:2px solid transparent;background:#f3f4f6;border-radius:12px;padding:8px 12px;font-size:15px;line-height:1.55}
.sent.click{border-color:#e6e8ec;background:#fff}
.sent.hit{border-color:#ffc83d;background:#fff}
.hit-tag{font-weight:900}
.msg{display:flex;gap:10px;align-items:flex-start}
.from{flex:none;width:40px;height:40px;line-height:40px;text-align:center;border-radius:12px;background:#e6e8ec;font-weight:900;color:#5f6675}
.voice{display:flex;align-items:center;gap:10px;background:#eceffe;border-radius:14px;padding:10px 14px;font-weight:700}
.wave{display:flex;align-items:center;gap:3px;height:20px}
.wv{width:3px;height:10px;border-radius:2px;background:#2b44e6;animation:wave 1s ease-in-out infinite}.w1{animation-delay:.2s}.w2{animation-delay:.4s}
.text-msg{flex:1;min-width:0;background:#f3f4f6;border-radius:14px;padding:10px 14px;font-size:15px;line-height:1.6}
.red{border-radius:6px;transition:background .3s}.red.on{background:#ffc83d;color:#161a23;font-weight:800;padding:1px 4px}
/* 今日一句 */
.oneline{background:#fff;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px}
.scene-tx{font-size:15px;color:#5f6675;line-height:1.6}
.quote{background:#eceffe;border-radius:16px;padding:14px 16px;font-size:18px;font-weight:800;line-height:1.6;min-height:84px}
.tip{font-size:14px;color:#5f6675;line-height:1.6}
/* 能不能 */
.sorthero{display:flex;justify-content:center;gap:16px;background:#fff;border-radius:20px;padding:16px}
.hero-img{width:76px;height:76px;border-radius:50%;animation:bob 2.6s ease-in-out infinite}.h2{animation-delay:.4s}
/* 新工具尝鲜：手机样子 */
.mock{background:#fff;border-radius:26px;border:8px solid #161a23;overflow:hidden;display:flex;flex-direction:column;height:360px}
.screen{flex:1;padding:12px;display:flex;flex-direction:column;gap:8px;overflow:hidden;background:#f3f4f6}
.viewfinder{border-radius:12px;overflow:hidden;box-shadow:0 0 0 3px #2b44e6;animation:pop .35s ease both}
.fridge{display:block;width:100%}
.mine{align-self:flex-end;width:60%;border-radius:12px;overflow:hidden}
.mine-q{align-self:flex-end;max-width:80%;background:#2b44e6;color:#fff;border-radius:14px;padding:6px 10px;font-size:13px;font-weight:700}
.reply{align-self:flex-start;max-width:90%;background:#fff;border-radius:14px;padding:8px 12px;font-size:13px;line-height:1.6;white-space:pre-wrap}
.inputbar{display:flex;align-items:center;gap:8px;padding:8px 10px;border-top:1px solid #e6e8ec;background:#fff}
.cam{flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.cam-body{width:20px;height:15px;border:2px solid #5f6675;border-radius:4px;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.cam-lens{width:7px;height:7px;border:2px solid #5f6675;border-radius:50%;box-sizing:border-box}
.cam.glow{box-shadow:0 0 0 3px #2b44e6;animation:pulse 1.2s ease-in-out infinite}.cam.glow .cam-body,.cam.glow .cam-lens{border-color:#2b44e6}
.field{flex:1;min-width:0;font-size:13px;color:#5f6675;background:#f3f4f6;border-radius:12px;padding:6px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sendbtn{flex:none;font-size:13px;font-weight:800;color:#5f6675;padding:6px 8px;border-radius:10px}
.sendbtn.glow{color:#2b44e6;box-shadow:0 0 0 3px #2b44e6;animation:pulse 1.2s ease-in-out infinite}
/* 做完 */
.done-box{background:#fff;border-radius:22px;padding:22px 18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.done-a{width:96px;height:96px;border-radius:50%;animation:jump .7s ease 2}
.xp{font-size:32px;font-weight:900;color:#161a23;background:#ffc83d;border-radius:14px;padding:2px 16px;animation:stamp .5s ease both}
.done-p{font-size:15px;color:#5f6675;line-height:1.6}.done-strong{font-size:17px;font-weight:900}
.two{display:flex;gap:10px}
.btn{flex:1;display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:16px;font-weight:800}
.btn.soft{background:#eceffe;color:#2b44e6}
.shake{animation:shake .4s ease}
.press{opacity:.75}
@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-14px)}60%{transform:translateY(0) scale(1.05,.95)}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03,.97)}}
@keyframes zz{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(18px,-30px)}}
@keyframes fadeUp{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes wave{0%,100%{height:5px}50%{height:18px}}
@keyframes pulse{50%{box-shadow:0 0 0 6px rgba(43,68,230,.25)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}}
@keyframes pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes stamp{from{opacity:0;transform:rotate(-14deg) scale(2)}to{opacity:1;transform:rotate(-3deg) scale(1)}}
@keyframes shake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
</style>
