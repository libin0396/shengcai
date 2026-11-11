<template>
  <view class="practice">
    <view class="head">和孩子一起点一点</view>
    <view class="sub">每一题让孩子来选，家长负责操作。故事按选择拼成，插画是预设示例，不是本次生成的图片。</view>
    <view class="panel">
      <view v-for="group in groups" :key="group.key" class="group">
        <view class="question">{{group.title}}</view>
        <view class="options"><view v-for="option in group.options" :key="option.value" class="option" :class="{'on': selections[group.key]===option.value}" @tap="choose(group.key,option.value)">{{option.label}}</view></view>
      </view>
      <button class="primary" @tap="showStory">看看四页故事示例</button>
    </view>
    <view v-if="show" class="panel">
      <view class="question">《{{hero.label}}的故事》</view>
      <view class="sub">以下是根据选择拼接的故事文字。插画是本站预设的 AI 示例，未根据你的选择生成。</view>
      <view v-for="(page,index) in pages" :key="index" class="story-page">
        <image class="story-image" :src="page.image" mode="widthFix" lazy-load/><view class="caption">预设示意图 · 第 {{index+1}} 页</view><view class="story-text">{{page.text}}</view>
      </view>
      <view class="question result-head">想做自己的绘本？</view>
      <view class="sub">复制下面的提示词，到可用的 AI 工具里继续；家长请不要上传孩子的照片、声音或真实姓名。</view>
      <view class="prompt">{{prompt}}</view>
      <button class="primary" @tap="copy">复制绘本助手提示词</button>
    </view>
  </view>
</template>
<script setup>
import {computed,ref} from 'vue';
const KEY='ainpe_mini_book_practice_v1';
const groups=[
 {key:'age',title:'孩子几岁？',options:[{value:'2-3',label:'2–3 岁'},{value:'4-6',label:'4–6 岁'},{value:'7-9',label:'7–9 岁'}]},
 {key:'hero',title:'主角是谁？',options:[{value:'girl',label:'一个小女孩'},{value:'boy',label:'一个小男孩'},{value:'turtle',label:'一只小海龟'}]},
 {key:'place',title:'想去哪儿？',options:[{value:'sea',label:'海底'},{value:'island',label:'一座小岛'},{value:'beach',label:'海边沙滩'}]},
 {key:'trouble',title:'路上遇到了什么？',options:[{value:'lost',label:'迷路了'},{value:'accident',label:'遇到意外'},{value:'sad',label:'遇到不开心的朋友'}]},
 {key:'fix',title:'最后怎么解决？',options:[{value:'friend',label:'请新朋友帮忙'},{value:'self',label:'自己想办法'},{value:'share',label:'分享自己的东西'}]},
 {key:'style',title:'画成什么样？',options:[{value:'warm',label:'暖色水彩'},{value:'crayon',label:'蜡笔画'},{value:'clean',label:'清爽扁平插画'}]},
];
const defaults={age:'4-6',hero:'girl',place:'sea',trouble:'lost',fix:'friend',style:'warm'};
let stored={};try{stored=uni.getStorageSync(KEY)||{}}catch{}
const selections=ref(groups.reduce((result,g)=>{result[g.key]=g.options.some(o=>o.value===stored[g.key])?stored[g.key]:defaults[g.key];return result},{}));
const show=ref(false);
const lookup=(key)=>groups.find(g=>g.key===key).options.find(o=>o.value===selections.value[key]);
const hero=computed(()=>lookup('hero'));const place=computed(()=>lookup('place'));const trouble=computed(()=>lookup('trouble'));const fix=computed(()=>lookup('fix'));const age=computed(()=>lookup('age'));const style=computed(()=>lookup('style'));
const img='https://ainpe.aisen.xin/static/learn/media/picturebook/fox-page-';
const ending=computed(()=>{const t=selections.value.trouble,f=selections.value.fix;if(t==='sad')return f==='share'?'它把自己喜欢的东西分享给朋友，朋友慢慢笑了。':f==='friend'?'新朋友和它一起陪着伙伴说话，伙伴慢慢笑了。':'它坐下来听朋友说话，朋友慢慢笑了。';if(t==='lost')return f==='self'?'它静下心，沿着熟悉的记号找到了回家的路。':f==='share'?'它分享了自己的东西，也从新朋友那里问到了回家的路。':'一位新朋友为它指明了回家的路。';return f==='self'?'它仔细想了想，找到了应对意外的办法。':f==='share'?'它分享了自己的东西，大家一起想办法解决了意外。':'它和新朋友一起想办法，解决了意外。'});
const pages=computed(()=>[
  {image:img+'1.png',text:'有一天，'+hero.value.label+'想去'+place.value.label+'看看。'},
  {image:img+'2.png',text:'带上小背包，'+hero.value.label+'出发了。'},
  {image:img+'3.png',text:'走着走着，'+hero.value.label+trouble.value.label+'。'},
  {image:img+'4.png',text:ending.value},
]);
const prompt=computed(()=>['你是陪家长和孩子做绘本的助手。','孩子年龄：'+age.value.label+'；故事由孩子做主，家长负责操作。','主角：'+hero.value.label+'；地点：'+place.value.label+'；遇到：'+trouble.value.label+'；解决办法：'+fix.value.label+'。','请把故事写成 4 页，每页正文 1–2 句，再写一句画面描述；文字适合孩子年龄，不要吓人。','画面风格：'+style.value.label+'；主角外观保持一致，每次只生成一页图片，画面里不要出现文字。','不使用孩子的照片、声音或真实姓名。'].join('\n'));
function choose(key,value){selections.value={...selections.value,[key]:value};show.value=false;try{uni.setStorageSync(KEY,selections.value)}catch{uni.showToast({title:'选择未能保存',icon:'none'})}}
function showStory(){show.value=true}
function copy(){uni.setClipboardData({data:prompt.value,fail:()=>uni.showToast({title:'复制失败，请重试',icon:'none'})})}
</script>
<style scoped>
.practice{margin-top:22px}.head{font-size:20px;font-weight:800;color:#1a2433}.sub{font-size:13px;line-height:1.7;color:#68778a;margin-top:8px}.panel{margin-top:12px;padding:16px;background:#fff;border:1px solid #e6e9ef;border-radius:14px}.group{margin-bottom:20px}.question{font-size:16px;line-height:1.5;font-weight:800;color:#1d2a3f}.options{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}.option{padding:9px 10px;border:1px solid #e1e6ef;border-radius:8px;background:#fff;color:#51617a;font-size:13px}.option.on{border-color:#3153ec;background:#eff3ff;color:#2849d3;font-weight:700}.primary{margin:12px 0 0;border-radius:9px;font-size:14px;line-height:44px;background:#2849e9;color:#fff;font-weight:700}.primary:after{border:0}.story-page{margin-top:15px;padding-bottom:12px;border-bottom:1px solid #edf0f4}.story-image{width:100%;height:auto;border-radius:9px}.caption{margin-top:4px;font-size:11px;color:#8a95a5}.story-text{margin-top:7px;color:#40506a;font-size:14px;line-height:1.7}.result-head{margin-top:18px}.prompt{margin-top:12px;padding:12px;background:#f3f5fb;border-radius:8px;color:#26354a;white-space:pre-wrap;font-size:13px;line-height:1.7;overflow-wrap:anywhere}
</style>
