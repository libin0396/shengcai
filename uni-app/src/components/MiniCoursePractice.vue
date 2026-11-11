<template>
  <view class="practice">
    <view class="head">课件制作 · 五步选择练习</view>
    <view class="sub">选择一个示例课题，按步骤思考制作方式。练习展示的是预设示例；真正的课件还需要到 AI 工具里制作。</view>
    <view v-if="levelIndex < 0" class="panel">
      <view class="question">先选一节示例课</view>
      <view v-for="(lesson,key) in lessons" :key="key" class="option" :class="{'on':lessonKey===key}" @tap="lessonKey=key">{{lesson.name}}</view>
      <button class="primary panel-primary" @tap="start">开始五步练习</button>
    </view>
    <view v-else-if="levelIndex < levels.length" class="panel">
      <view class="step-label">第 {{levelIndex+1}} / {{levels.length}} 步 · {{current.title}}</view>
      <view class="sub">{{current.intro}}</view>
      <view v-for="(q,qi) in current.questions" :key="qi" class="question-wrap">
        <view class="question">{{q.q}}</view>
        <view v-for="(option,oi) in q.opts" :key="oi" class="option" :class="{'on':answerAt(qi)===oi}" @tap="choose(qi,oi)">{{option}}</view>
        <view v-if="answerAt(qi)!==undefined" class="feedback">{{q.why[answerAt(qi)]}}</view>
      </view>
      <view v-if="allAnswered" class="learned"><text class="bold">这一步学到了：</text>{{current.learned}}</view>
      <view v-if="allAnswered && current.sample" class="sample"><text class="bold">{{levelIndex===3?'通用自查示例：':'以下以三年级语文课题为示例：'}}</text>{{current.sample}}</view>
      <view v-if="allAnswered && current.prompt" class="prompt">{{current.prompt}}</view>
      <button v-if="allAnswered && current.prompt" class="copy" @tap="copy(current.prompt)">复制提示词去 AI 工具试试</button>
      <view class="actions"><button class="secondary" @tap="previous">上一步</button><button class="primary" :class="{'primary-disabled':!allAnswered}" :disabled="!allAnswered" @tap="next">{{levelIndex===levels.length-1?'查看练习成果':'下一步'}}</button></view>
    </view>
    <view v-else class="panel">
      <view class="question">五步练习完成</view>
      <view class="sub">这是根据你的选择整理的课件助手提示词，不是已生成的课件。复制后到常用的 AI 工具中使用，再按实际情况修改和核对。</view>
      <view class="prompt">{{assistantPrompt}}</view>
      <button class="primary panel-primary" @tap="copy(assistantPrompt)">复制课件助手提示词</button>
      <button class="secondary again" @tap="restart">重新练习</button>
    </view>
  </view>
</template>
<script setup>
import {computed,ref} from 'vue';
import data from '../data/mini-course-practice.json';
const KEY='ainpe_mini_course_practice_v1';
const levels=data.levels,lessons=data.lessons;
let saved={};try{saved=uni.getStorageSync(KEY)||{}}catch{}
const levelIndex=ref(Number.isInteger(saved.levelIndex)?Math.max(-1,Math.min(levels.length,saved.levelIndex)):-1),lessonKey=ref(lessons[saved.lessonKey]?saved.lessonKey:'yuwen3'),answers=ref(saved.answers&&typeof saved.answers==='object'?saved.answers:{});
const current=computed(()=>levels[levelIndex.value]||null);
const answerAt=qi=>answers.value[levelIndex.value+':'+qi];
const allAnswered=computed(()=>current.value&&current.value.questions.every((q,i)=>Number.isInteger(answerAt(i))));
const assistantPrompt=computed(()=>{let prefs={buyer:'teacher',struct:'classic',style:'huamian'};levels.forEach((level,li)=>level.questions.forEach((q,qi)=>{const answer=answers.value[li+':'+qi];if(q.pref&&Number.isInteger(answer)&&q.vals?.[answer])prefs[q.pref]=q.vals[answer]}));return data.assistants[[lessonKey.value,prefs.buyer,prefs.struct,prefs.style].join('|')]||''});
function persist(){try{uni.setStorageSync(KEY,{levelIndex:levelIndex.value,lessonKey:lessonKey.value,answers:answers.value})}catch{uni.showToast({title:'进度保存失败',icon:'none'})}}
function start(){levelIndex.value=0;persist()}
function choose(qi,oi){answers.value={...answers.value,[levelIndex.value+':'+qi]:oi};persist()}
function previous(){levelIndex.value=Math.max(-1,levelIndex.value-1);persist()}
function next(){if(!allAnswered.value)return;levelIndex.value++;persist()}
function restart(){levelIndex.value=-1;answers.value={};persist()}
function copy(text){if(!text)return;uni.setClipboardData({data:text,fail:()=>uni.showToast({title:'复制失败，请重试',icon:'none'})})}
</script>
<style scoped>
.practice{margin-top:22px}.head{font-size:20px;font-weight:800;color:#1a2433}.sub{font-size:13px;line-height:1.7;color:#68778a;margin-top:8px}.panel{margin-top:12px;padding:16px;background:#fff;border:1px solid #e6e9ef;border-radius:14px}.step-label{font-size:15px;font-weight:800;color:#294be8}.question-wrap{margin-top:20px}.question{font-size:16px;line-height:1.5;font-weight:800;color:#1d2a3f}.option{margin-top:8px;padding:11px 12px;border:1px solid #e1e6ef;border-radius:9px;background:#fff;color:#41516a;font-size:13px;line-height:1.5}.option.on{border-color:#3153ec;background:#eff3ff;color:#2849d3;font-weight:700}.feedback,.learned,.sample{margin-top:10px;padding:11px;border-radius:8px;background:#eef6f0;color:#476454;font-size:13px;line-height:1.7}.sample{background:#f5f6fa;color:#536278}.bold{font-weight:800}.prompt{margin-top:12px;padding:12px;background:#f3f5fb;border-radius:8px;color:#26354a;white-space:pre-wrap;font-size:13px;line-height:1.7;overflow-wrap:anywhere}.actions{display:flex;gap:8px;margin-top:16px}.primary,.secondary,.copy{box-sizing:border-box;margin:0;padding:0 10px;border-radius:9px;font-size:13px;line-height:44px}.primary{background:#2849e9;color:#fff;font-weight:700}.primary-disabled{background:#d9deeb;color:#8590a0}.secondary{background:#eef1f7;color:#526278}.copy{margin-top:10px;background:#edf2ff;color:#2849e9}.actions .primary{flex:2}.actions .secondary{flex:1}.panel-primary,.again,.copy{margin-top:12px}.primary:after,.secondary:after,.copy:after{border:0}
</style>
