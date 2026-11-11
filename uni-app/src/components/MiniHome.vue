<template>
  <view class="mini-home">
    <view class="brand" :style="{paddingTop: statusBarHeight + 'px'}"><view class="brand-mark">↗</view><text class="brand-name">AINPE实战情报站</text></view>
    <view class="content">
      <view class="eyebrow"><text class="dot">●</text> AI 实用教程 · 从一件小事开始</view>
      <view class="headline">让普通人，<br/>也能用 AI 做成事</view>
      <view class="intro">从生活里的小问题开始，跟着步骤练习，一步步用好 AI。</view>
      <view class="hero-actions"><button class="primary" @tap="openPrompt('reply')">开始做第一件事 ↗</button><button class="text-link" @tap="showHelp">第一次来？看看怎么用 ›</button></view>

      <view class="section-head"><view><view class="section-title">选一件事，开始做</view><view class="section-sub">从适合自己的地方出发，不用按顺序。</view></view><text class="more" @tap="openGuides">全部教程 ↗</text></view>
      <view class="level-card first" @tap="openPrompt('reply')">
        <view class="cover-wrap"><image class="cover-image" src="https://ainpe.aisen.xin/static/design/write-message-illustration.jpg" mode="aspectFill"/><text class="cover-label">配图示意</text></view>
        <view class="level-content"><view class="card-top"><text class="badge beginner">初级 · 开始使用</text><text class="minor">第一次来推荐</text></view><view class="card-title">写一条不好开口的消息</view><view class="card-description">告诉 AI 你的情况，试着写一条合适的消息。</view><view class="card-link">开始尝试 <text class="card-arrow">↗</text></view></view>
      </view>
      <view class="level-card" @tap="openPrompt('homework')">
        <view class="cover-wrap"><image class="cover-image" src="https://ainpe.aisen.xin/static/design/kids.jpg" mode="aspectFill"/><text class="cover-label">配图示意</text></view>
        <view class="level-content"><view class="card-top"><text class="badge middle">中级 · 完成任务</text></view><view class="card-title">陪孩子讲懂一道题</view><view class="card-description">补充孩子的情况，让 AI 帮你理清讲题思路。</view><view class="card-link">看看怎么用 <text class="card-arrow">↗</text></view></view>
      </view>
      <view class="level-card future">
        <view class="cover-wrap"><image class="cover-image" src="https://ainpe.aisen.xin/static/design/ai-assistant-illustration.jpg" mode="aspectFill"/><text class="cover-label">配图示意</text></view>
        <view class="level-content"><view class="card-top"><text class="badge advanced">高级 · 完成项目</text><text class="minor">筹备中</text></view><view class="card-title">做一个自己的 AI 助手</view><view class="card-description">设定任务、反复调整，做出可复用的助手。</view><view class="card-muted">完整教程正在准备</view></view>
      </view>

      <view class="search-entry" @tap="openSearch"><text>⌕　搜索教程和快捷提示词</text><text class="search-action">搜索 ›</text></view>
      <view class="section-head section-space"><view><view class="section-title">跟着做，做出自己的作品</view><view class="section-sub">按步骤在 AI 工具中亲手完成。</view></view><text class="more" @tap="openGuides">全部教程 ↗</text></view>
      <view class="lesson-list">
        <view v-for="lesson in lessons" :key="lesson.id" class="lesson" @tap="openGuide(lesson.id)">
          <image class="lesson-image" :src="lesson.image" mode="aspectFill"/><view class="lesson-body"><text class="lesson-tag">{{lesson.label}}</text><view class="lesson-title">{{lesson.title}}</view><view class="lesson-description">{{lesson.description}}</view><text class="more">查看教程 ↗</text></view>
        </view>
      </view>
      <view class="prompt-entry" @tap="openLibrary"><view><view class="prompt-title">生活里遇到小事？</view><view class="section-sub">打开快捷提示词，复制一句话就能开始。</view></view><text class="more">查看 ›</text></view>
      <view class="bottom-note">提示词需要在你常用的 AI 工具中使用。</view>
    </view>
    <MiniNav active="home" />
  </view>
</template>

<script setup>
import MiniNav from './MiniNav.vue';
let statusBarHeight=0;
try { const info = typeof wx !== 'undefined' && typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : uni.getSystemInfoSync(); statusBarHeight = Number(info.statusBarHeight) || 0; } catch {}
const lessons = [
  {id:'kejian',image:'https://ainpe.aisen.xin/static/learn/media/covers/kejian.jpg',label:'实操成品',title:'给孩子做一份课件',description:'跟着步骤整理教案，再到 AI 工具中制作。'},
  {id:'huiben',image:'https://ainpe.aisen.xin/static/learn/media/covers/huiben.jpg',label:'实操成品',title:'和孩子做一本绘本',description:'从孩子的故事开始，一起设计画面和文字。'},
  {id:'short-drama',image:'https://ainpe.aisen.xin/static/learn/media/covers/short-drama.jpg',label:'AI 角色参考图',title:'从零做一条 AI 短剧',description:'从故事、分镜到剪成短片。'},
];
function openGuides(){uni.navigateTo({url:'/pages/learn/guides'});}
function openSearch(){uni.navigateTo({url:'/pages/learn/find'});}
function openLibrary(){uni.navigateTo({url:'/pages/learn/library'});}
function openPrompt(id){uni.navigateTo({url:'/pages/learn/library?id='+encodeURIComponent(id)});}
function openGuide(id){uni.navigateTo({url:'/pages/learn/guide?id='+encodeURIComponent(id)});}
function showHelp(){uni.showModal({title:'第一次来？这样用',content:'先选一件想做的事，跟着步骤复制提示词，再到你常用的 AI 工具里粘贴使用。完成后记得检查结果。',showCancel:false,confirmText:'知道了'});}
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
</style>
