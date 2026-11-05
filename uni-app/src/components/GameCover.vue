<template>
  <view class="project-cover" :class="[game.id, {compact}]">
    <view class="cover-top">
      <text class="cover-tag">{{ tag || labels[game.id] }}</text>
      <view class="cover-question">{{ questions[game.id] }}</view>
      <view class="cover-art" aria-hidden="true"><view class="art-disc"></view><view class="art-object"><view class="art-screen"></view><text>{{symbols[game.id]}}</text></view></view>
      <view class="cover-story"><text>模拟中可能遇到</text>{{ stories[game.id]?.[storyIndex] }}</view>
    </view>
    <view class="cover-body">
      <view class="cover-name">{{ game.title }}</view>
      <view class="cover-meta"><text>{{game.id==='miniapp'?'约 2 分钟':'约 3 分钟'}}</text><text>{{decisionCounts[game.id]}} 个决策</text><text>6 种结局</text></view>
      <view v-if="reason" class="cover-reason">{{reason}}</view>
      <button class="cover-action" @click="$emit('start',game.id)">{{played ? '再挑战一局' : '直接开局'}} ▶</button>
    </view>
  </view>
</template>
<script setup>
defineProps({game:{type:Object,required:true},tag:{type:String,default:''},reason:{type:String,default:''},compact:Boolean,played:Boolean});
defineEmits(['start']);
const labels={miniapp:'产品项目',video:'接单项目','education-ppt':'内容项目'};
const questions={miniapp:'30 天，你的小程序能回本吗？',video:'接一单定制视频，能赚到吗？','education-ppt':'一套课件，能卖出去吗？'};
// These are simulated events from the corresponding game, not user results.
const stories={miniapp:['首页按钮颜色调了一个下午。','前 10 篇笔记平均 30 次浏览。','模拟器正常，真机分享没反应。'],video:['客户要竖屏，你做成了横屏。','生成费用超过了这单报价。','交付一周，尾款仍在走流程。'],'education-ppt':['预览图露出了占位文字。','教材版本选错，买家申请退款。','新号 5 条笔记曝光不到 200。']};
const decisionCounts={miniapp:5,video:6,'education-ppt':5};
const storyIndex=Math.floor(Math.random()*3);
const symbols={miniapp:'↗',video:'▶','education-ppt':'✎'};
</script>
<style scoped>
.project-cover{display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 12px 28px -20px #14291e80;color:#13241b;min-width:0}.cover-top{position:relative;min-height:185px;box-sizing:border-box;padding:16px;background:#0b2e20;color:#fff;overflow:hidden}.video .cover-top{background:#a93b1a}.education-ppt .cover-top{background:#0f5c4e}.cover-tag{display:inline-block;background:#ffc94d;color:#133327;padding:4px 9px;border-radius:20px;font-size:12px;font-weight:800}.video .cover-tag,.education-ppt .cover-tag{background:#ffffff30;color:#fff}.cover-question{position:relative;z-index:1;font-size:20px;font-weight:850;line-height:1.32;max-width:175px;margin-top:9px}.cover-story{position:absolute;left:15px;bottom:13px;z-index:2;background:#fff3cf;color:#533b0b;border-radius:10px 10px 10px 3px;padding:6px 9px;max-width:175px;font-size:12px;font-weight:700;line-height:1.4}.cover-story text{display:block;font-size:12px;color:#94743c}.cover-art{position:absolute;right:5px;bottom:8px;width:125px;height:130px}.art-disc{position:absolute;right:12px;top:5px;border-radius:50%;background:#ffc94d;width:50px;height:50px;opacity:.9}.art-object{position:absolute;right:26px;bottom:0;width:61px;height:100px;background:#f7f3ea;border-radius:12px;box-shadow:0 8px 18px #0003;transform:rotate(5deg)}.art-screen{position:absolute;inset:12px 7px 19px;background:#cfe4d5;border-radius:5px}.art-object text{position:absolute;left:20px;top:25px;font-size:28px;font-weight:900;color:#ee5a24}.video .art-object{width:88px;height:60px;right:8px;bottom:17px;border-radius:8px;transform:rotate(-4deg)}.video .art-screen{inset:8px;background:#e7e7dc}.video .art-object text{left:35px;top:12px}.education-ppt .art-object{width:88px;height:64px;right:5px;bottom:28px;border-radius:7px;transform:rotate(3deg)}.education-ppt .art-screen{inset:8px;background:repeating-linear-gradient(#dce9e0 0 5px,#f7f3ea 5px 12px)}.education-ppt .art-object text{left:55px;top:24px}.cover-body{display:flex;flex:1;flex-direction:column;padding:15px}.cover-name{font-size:17px;font-weight:850}.cover-meta{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0 14px}.cover-meta text{font-size:12px;font-weight:700;background:#f7f3ea;color:#6e8073;padding:4px 7px;border-radius:7px}.cover-reason{font-size:12px;line-height:1.5;color:#698273;margin-bottom:10px}.cover-action{width:100%;margin:auto 0 0;border:0;border-radius:10px;background:#ee5a24;color:#fff;font-size:14px;font-weight:800;line-height:44px}.cover-action:after{border:0}.video .cover-action{background:#a93b1a}.education-ppt .cover-action{background:#0f5c4e}
@media(max-width:700px){.compact .cover-top{min-height:190px;padding:12px}.compact .cover-question{font-size:15px;max-width:125px;line-height:1.35}.compact .cover-story{left:10px;bottom:10px;max-width:125px;font-size:12px}.compact .cover-story text{font-size:12px}.compact .cover-art{transform:scale(.5);transform-origin:right bottom;right:0;bottom:7px}.compact .cover-body{padding:11px}.compact .cover-name{font-size:14px}.compact .cover-meta text{font-size:12px}.compact .cover-action{font-size:12px}}
</style>
