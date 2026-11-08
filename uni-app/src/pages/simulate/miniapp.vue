<template>
  <view class="sim-page">
    <SiteHeader active="simulate"/>
    <view class="sim-main">
      <view class="sim-actions top-actions"><button class="sim-small" @click="backToList">← 返回模拟项目</button><button v-if="state.step>=0" class="sim-small" @click="confirmReset">重新开始</button></view>
      <view v-if="state.step===-1" class="sim-intro">
        <text class="sim-kicker">项目体验 / AI 产品 · 微信小程序</text>
        <text class="sim-title">这一次，你来做产品负责人。</text>
        <text class="sim-lead">老师们正在寻找好用的课堂壁纸。你需要了解需求、搭出第一版，亲手测试、修复问题，再准备上线。</text>
        <view class="sim-chip-row"><text class="sim-chip">约 6–10 分钟</text><text class="sim-chip">5 个项目任务</text><text class="sim-chip">进度保存在本机</text></view>
        <view class="sim-panel"><text class="sim-panel-title">项目工作台 · 模拟任务</text><text class="sim-copy">起始预算 ¥500。你会得到一份需求卡、一版可操作的预览、一份测试记录和一张上线材料单。</text><text class="sim-note">角色、消息、故障、花费和结果是虚构的游戏设定；不会注册账号、调用 AI、生成真实代码或提交微信审核。</text></view>
        <view v-if="state.legacyNotice" class="sim-note">检测到旧版模拟记录，产品名称和需求已带入；原记录保留，新体验从头开始。</view>
        <button class="sim-primary" @click="state.step=0">打开项目工作台 →</button>
        <text class="sim-note source-note">参考生财有术 2026 年 8 月「AI 产品（国内-微信小程序）」航海手册的任务节点及一位圈友的案例，由 AINPE 独立编排；不是官方课程，也不是逐日打卡复刻。</text>
      </view>
      <template v-else-if="state.step<5">
        <view class="sim-box">
          <view class="sim-top"><text>项目推进 {{state.step+1}} / 5</text><text>{{state.step===0?'模拟初始预算 ¥500':`方案预算预计剩余 ¥${remaining}`}}</text></view>
          <view class="sim-progress"><view class="sim-progress-bar" :style="{width:((state.step+1)/5*100)+'%'}"/></view>
          <template v-if="state.step===0">
            <text class="sim-kicker">01 / 找需求</text><text class="sim-title">先问清楚，老师到底需要什么。</text>
            <text class="sim-lead">你可以向虚构的试用者提问。点击问题，看她的预设回复，再整理成需求卡。</text>
            <view class="chat-window"><view class="chat-name">林老师 · 模拟试用者</view><view class="message theirs">你好！我想找适合老师用的手机壁纸，但每次找图都要翻很久。</view><template v-for="q in questions" :key="q.id"><template v-if="state.asked.includes(q.id)"><view class="message mine">{{q.question}}</view><view class="message theirs">{{q.reply}}</view></template></template></view>
            <view class="ask-row"><button v-for="q in questions" :key="q.id" class="sim-small" :disabled="state.asked.includes(q.id)" @click="ask(q.id)">{{state.asked.includes(q.id)?'✓ 已问过：':'问：'}}{{q.short}}</button></view>
            <view class="sim-panel"><text class="sim-panel-title">填写需求卡</text><text class="sim-note">至少问一条，再用自己的话整理；不会自动判断答案好坏。</text>
              <label class="sim-field"><text class="sim-label">用户是谁？</text><input class="sim-input" v-model="state.audience" maxlength="60" placeholder="例如：需要课堂素材的一线老师"/></label>
              <label class="sim-field"><text class="sim-label">她最想解决什么问题？</text><textarea class="sim-textarea" v-model="state.problem" maxlength="200" placeholder="例如：快速找到并保存合适的壁纸"/></label>
              <button class="sim-small" @click="fillBrief">填入示例，继续编辑</button>
            </view>
          </template>
          <template v-if="state.step===1">
            <text class="sim-kicker">02 / 制作首版</text><text class="sim-title">搭一版能用的产品。</text><text class="sim-lead">模拟制作台：给产品命名并选择功能，右侧预览会同步变化。预算与费用为游戏设定。</text>
            <view class="workbench"><view>
              <label class="sim-field"><text class="sim-label">小程序名称</text><input class="sim-input" v-model="state.name" maxlength="20" placeholder="例如：教师壁纸盒"/></label>
              <text class="sim-label">首版功能 · 点击添加或移除</text>
              <view class="feature-list"><button v-for="f in features" :key="f.id" :class="['feature',{'feature-on':state.modules.includes(f.id)}]" @click="toggleModule(f.id)"><text>{{state.modules.includes(f.id)?'✓':'＋'}} {{f.label}}</text><text>¥{{f.cost}}</text></button></view>
              <text class="sim-note">已选功能花费 ¥{{buildCost}}；这是模拟配置，不会生成代码。</text>
            </view><view class="phone"><view class="phone-head">{{state.name || '未命名小程序'}}</view><view class="phone-content"><text class="phone-label">发现适合你的壁纸</text><view v-if="state.modules.includes('filter')" class="phone-filter">年级筛选 ▾</view><view v-else class="phone-empty">未添加筛选功能</view><view v-if="state.modules.includes('tags')" class="phone-tags"><text>治愈</text><text>励志</text></view><view class="wallpaper">{{state.modules.includes('browse')?'今天，也要元气满满':'未添加浏览功能'}}</view><view class="phone-action">{{state.modules.includes('save')?'保存壁纸':'未添加保存功能'}}</view></view></view></view>
            <text class="sim-note">你的需求卡：{{state.audience}} · {{state.problem}}</text>
          </template>
          <template v-if="state.step===2">
            <text class="sim-kicker">03 / 测试与修复</text><text class="sim-title">亲手试一遍，再交给用户。</text><text class="sim-lead">在模拟手机中点击浏览、筛选和保存。这里的故障和修复均为演示；不会连接真实小程序。</text>
            <view class="workbench reverse"><view class="phone"><view class="phone-head">{{state.name}}</view><view class="phone-content"><text class="phone-label">发现适合你的壁纸</text><button class="phone-button" @click="runFilter">{{state.filterApplied?'已筛选：一年级':'试试年级筛选'}}</button><view v-if="state.modules.includes('tags')" class="phone-tags"><button v-for="tag in ['治愈','励志']" :key="tag" :class="{'tag-active':state.tagChoice===tag}" @click="chooseTag(tag)">{{tag}}</button></view><view class="wallpaper" @click="runBrowse">{{state.modules.includes('browse')?wallpaperLabel:'当前没有壁纸浏览功能'}}</view><button class="phone-button main-phone" @click="runSave">保存壁纸</button><text class="sim-note">{{state.testMessage || '点击预览中的控件开始测试'}}</text></view></view><view>
              <view class="sim-panel"><text class="sim-panel-title">测试记录</text><text class="sim-copy">筛选：{{state.triedFilter?'已尝试':'待尝试'}} · 保存：{{state.triedSave?'已尝试':'待尝试'}} · 重新测试：{{state.retested?'已完成':'待完成'}}</text>
                <label class="sim-field"><text class="sim-label">预期发生什么？</text><input class="sim-input" v-model="state.expected" maxlength="100" placeholder="例如：点击保存后提示成功"/></label>
                <label class="sim-field"><text class="sim-label">实际发生什么？</text><textarea class="sim-textarea" v-model="state.bugNote" maxlength="200" placeholder="例如：点击保存后没有反应"/></label>
                <button class="sim-small" @click="fillTest">填入示例</button>
                <button v-if="state.triedSave && state.modules.includes('save') && !state.fixed" class="sim-primary fix-button" :disabled="!state.bugNote.trim()" @click="applyFix">提交模拟修复 · 花费 ¥30</button>
                <text v-if="state.fixed" class="sim-note">模拟修复已完成，请再次点击手机里的“保存壁纸”确认。</text>
                <text v-if="state.retested" class="sim-note ok">已复测：保存操作在演示中成功。</text>
              </view><text class="sim-note">也可以记录问题后暂不修复，继续后会看到它对模拟反馈的影响。</text>
            </view></view>
          </template>
          <template v-if="state.step===3">
            <text class="sim-kicker">04 / 提交材料</text><text class="sim-title">整理你的模拟上线材料。</text><text class="sim-lead">项目名称和材料名称需要一致；用途至少写 8 个字。本关只检查这两项，不代表实际微信审核。</text>
            <view class="sim-panel"><text class="sim-panel-title">审核材料单 · 模拟填写</text><text class="sim-copy">当前产品：{{state.name}} · 功能：{{moduleLabels}}</text>
              <label class="sim-field"><text class="sim-label">提交名称</text><input class="sim-input" v-model="state.reviewName" maxlength="20" placeholder="填写与你产品一致的名称"/></label>
              <label class="sim-field"><text class="sim-label">向审核人员描述它能做什么</text><textarea class="sim-textarea" v-model="state.reviewDescription" maxlength="200" placeholder="写出小程序的用途和主要功能"/></label>
              <view class="sim-actions"><button class="sim-small" @click="fillReview">带入产品资料，再修改</button><button class="sim-primary" @click="submitReview">提交模拟审核</button></view>
              <view v-if="state.reviewStatus" :class="['notice',state.reviewStatus==='passed'?'notice-good':'notice-bad']">{{state.reviewMessage}}</view>
            </view><text class="sim-note">真实上线还需自行核实主体、类目、备案及平台规定；此演示没有提交任何申请。</text>
          </template>
          <template v-if="state.step===4">
            <text class="sim-kicker">05 / 给第一批用户看</text><text class="sim-title">写一句介绍，准备发布。</text><text class="sim-lead">先写出你准备告诉用户的话，再选择一种模拟触达方式；仅游戏内展示，不会发布到外部平台。</text>
            <label class="sim-field"><text class="sim-label">推广文案</text><textarea class="sim-textarea" v-model="state.promo" maxlength="200" placeholder="例如：老师找壁纸太费时间？试试按年级筛选…"/></label>
            <view class="sim-actions"><button class="sim-small" @click="fillPromo">参考需求卡填入示例</button></view>
            <text class="sim-label">首批用户从哪里来？</text><view class="ask-row"><button v-for="c in channels" :key="c.id" :class="['sim-small',{'selected-small':state.channel===c.id}]" @click="state.channel=c.id">{{state.channel===c.id?'✓ ':''}}{{c.label}}</button></view>
            <text class="sim-label">是否准备了一项模拟付费内容？</text><view class="ask-row"><button :class="['sim-small',{'selected-small':state.paid==='yes'}]" @click="state.paid='yes'">准备一套 ¥9 壁纸</button><button :class="['sim-small',{'selected-small':state.paid==='no'}]" @click="state.paid='no'">暂时免费，先收集反馈</button></view>
            <text class="sim-note">触达人数、收入与花费只是固定游戏规则，不是真实市场数据或收益预测。</text>
          </template>
          <view class="sim-actions"><button v-if="state.step>0" class="sim-secondary" @click="state.step--">← 上一步</button><button class="sim-primary" :disabled="!canContinue" @click="state.step++">{{state.step===4?'查看项目复盘':'完成任务，继续'}} →</button></view>
          <text v-if="!canContinue" class="sim-note">{{hint}}</text>
        </view>
      </template>
      <view v-else class="sim-box">
        <text class="sim-kicker">项目复盘 / 全部是模拟数据</text><text class="sim-title">第一轮试跑结束。</text><text class="sim-lead">下面是你在这次练习中的操作与结果；它们不能预测真实项目收入。</text>
        <view class="numbers"><view><text>模拟花费</text><text>¥{{cost}}</text></view><view><text>模拟访问</text><text>{{visits}} 人</text></view><view><text>完成核心操作</text><text>{{completed}} 人</text></view><view><text>模拟收入 / 盈亏</text><text>¥{{income}} / {{profit>=0?'+':''}}¥{{profit}}</text></view></view>
        <text class="sim-note">访问、转化、成本与收益由固定游戏规则虚构；未计真实工时，不代表案例作者的收入或净利润。</text>
        <view class="sim-panel"><text class="sim-panel-title">你的选择如何影响结果</text><text class="sim-copy">你采访了 {{state.asked.length}} 个问题，整理出需求：“{{state.problem}}”。</text><text class="sim-copy">{{state.modules.includes('filter')?'你添加了筛选功能。':'你没有添加筛选功能，用户找图更费力，本次模拟完成核心操作的人数减少。'}}</text><text class="sim-copy">{{state.retested?'你记录问题、修复并复测了保存流程。':'保存流程尚未复测成功，本次模拟完成核心操作的人数减少。'}}</text><text class="sim-copy">{{state.paid==='yes'?'你在模拟中准备了付费壁纸，订单按完成核心操作人数的 2% 向下取整，单价 ¥9。':'你选择先免费观察，本轮没有付费收入。'}}</text><text class="sim-note">游戏规则：访问人数由渠道设定；完成核心操作人数从访问人数开始，依次乘以浏览、筛选、复测的模拟系数（未具备时分别为 35%、75%、40%），向下取整。</text></view>
        <view class="sim-panel"><text class="sim-panel-title">你的项目资料</text><text class="sim-copy">{{state.name}} · 给 {{state.audience}} 使用</text><text class="sim-copy">问题：{{state.problem}}</text><text class="sim-copy">首版功能：{{moduleLabels}}</text><text class="sim-copy">测试记录：{{state.bugNote || '未填写'}}</text><text class="sim-copy">推广文案：{{state.promo}}</text><button class="sim-small" @click="copyBrief">复制项目资料</button></view>
        <view class="sim-panel"><text class="sim-panel-title">真实案例带来的启发</text><text class="sim-copy">一位圈友复盘过教师壁纸小程序，并用小红书探索引流；她提到流量出现时，付费产品还没有准备好。她自述截至撰文时自然流累计百万曝光、小程序累计变现几千元，属于个人案例，不是本次模拟结果。</text><text class="sim-note">来源：生财有术 MCP，一位圈友的小程序复盘原帖；任务参考 2026 年 8 月「AI 产品（国内-微信小程序）」航海手册，流程为独立改编。</text></view>
        <view class="sim-actions"><button class="sim-secondary" @click="state.step=0">调整决策，再试一次</button><button class="sim-secondary" @click="confirmReset">从头开始</button></view><SimCamp/>
      </view>
    </view>
  <SiteFooter /></view>
</template>
<script setup>
import SiteFooter from '../../components/SiteFooter.vue';
import {computed, reactive, watch} from 'vue';
import SiteHeader from '../../components/SiteHeader.vue';
import SimCamp from './SimCamp.vue';
const KEY='ainpe:sim:miniapp:v2', OLD_KEY='ainpe:sim:miniapp:v1';
const fresh=()=>({step:-1,legacyNotice:false,asked:[],audience:'',problem:'',name:'',modules:['browse','save'],triedFilter:false,triedSave:false,filterApplied:false,tagChoice:'',testMessage:'',expected:'',bugNote:'',fixed:false,retested:false,reviewName:'',reviewDescription:'',reviewStatus:'',reviewMessage:'',promo:'',channel:'',paid:''});
let saved={},legacy={};try{saved=uni.getStorageSync(KEY)||{};if(!saved||typeof saved!=='object'||!Object.keys(saved).length)legacy=uni.getStorageSync(OLD_KEY)||{};}catch{}
const legacyFound=Boolean(legacy&&typeof legacy==='object'&&(legacy.audience||legacy.problem||legacy.name));
const carry=legacyFound?{legacyNotice:true,audience:String(legacy.audience||''),problem:String(legacy.problem||''),name:String(legacy.name||'')}:{};
const state=reactive({...fresh(),...carry,...(saved&&typeof saved==='object'?saved:{})});
if(!Array.isArray(state.modules))state.modules=['browse','save'];if(!Array.isArray(state.asked))state.asked=[];
watch(state,()=>{try{uni.setStorageSync(KEY,{...state});}catch{}},{deep:true});
const questions=[{id:'pain',short:'最麻烦的是什么？',question:'你现在找壁纸最麻烦的是什么？',reply:'大部分图片不适合老师，我要一张张翻，还很难找到适合自己年级的。'},{id:'scene',short:'什么时候会用？',question:'你通常什么时候需要壁纸？',reply:'备课间隙想快速换一张；最好几步就能找到和保存。'},{id:'pay',short:'会愿意付费吗？',question:'如果有一组特别喜欢的壁纸，你会考虑付费吗？',reply:'也许会，先让我看看质量和适不适合我。'}];
const features=[{id:'browse',label:'浏览壁纸',cost:70},{id:'save',label:'保存壁纸',cost:50},{id:'filter',label:'按年级筛选',cost:40},{id:'tags',label:'主题标签',cost:30}];
const channels=[{id:'social',label:'写一篇内容分享'},{id:'ads',label:'小额广告测试 · ¥100'},{id:'feedback',label:'邀请熟人试用'}];
const buildCost=computed(()=>features.filter(f=>state.modules.includes(f.id)).reduce((sum,f)=>sum+f.cost,0));
const cost=computed(()=>buildCost.value+(state.fixed?30:0)+(state.channel==='ads'?100:0));
const remaining=computed(()=>Math.max(0,500-cost.value));
const visits=computed(()=>({social:120,ads:200,feedback:35}[state.channel]||0));
const completed=computed(()=>Math.floor(visits.value*(state.modules.includes('browse')?1:0.35)*(state.modules.includes('filter')?1:0.75)*(state.retested?1:0.4)));
const income=computed(()=>state.paid==='yes'?Math.floor(completed.value*0.02)*9:0),profit=computed(()=>income.value-cost.value);
const moduleLabels=computed(()=>features.filter(f=>state.modules.includes(f.id)).map(f=>f.label).join('、')||'无');
const wallpaperLabel=computed(()=>`${state.filterApplied?'一年级 · ':''}${state.tagChoice==='治愈'?'温暖课堂':state.tagChoice==='励志'?'今天，也要元气满满':state.filterApplied?'温暖课堂':'今天，也要元气满满'}`);
const canContinue=computed(()=>[state.asked.length>0&&state.audience.trim()&&state.problem.trim(),state.name.trim()&&state.modules.length>0,state.triedFilter&&state.triedSave&&state.expected.trim()&&state.bugNote.trim(),state.reviewStatus==='passed',state.promo.trim()&&state.channel&&state.paid][state.step]);
const hint=computed(()=>['请先提问，并完成需求卡。','请填写名称并至少添加一项功能。','请尝试筛选和保存，写下预期和实际结果。','请提交模拟审核；如退回，请修改材料后重试。','请填写推广文案，并完成两个选择。'][state.step]);
function ask(id){if(!state.asked.includes(id))state.asked.push(id)}
function fillBrief(){state.audience='需要课堂素材的一线老师';state.problem='快速找到并保存适合自己的手机壁纸'}
function fillTest(){state.expected='点击保存后提示成功';state.bugNote='点击保存后没有反应，用户无法完成保存。'}
function toggleModule(id){const next=state.modules.includes(id)?state.modules.filter(x=>x!==id):[...state.modules,id];state.modules=next;state.triedFilter=false;state.triedSave=false;state.filterApplied=false;state.tagChoice='';state.testMessage='';state.retested=false;state.fixed=false;state.reviewStatus=''}
function runFilter(){state.triedFilter=true;if(!state.modules.includes('filter')){state.testMessage='筛选功能未加入首版，可以回上一步添加。';return}state.filterApplied=true;state.testMessage=state.modules.includes('browse')?'筛选后显示了一年级的壁纸（模拟效果）。':'已选择一年级，但首版没有壁纸浏览功能。'}
function chooseTag(tag){if(!state.modules.includes('tags'))return;state.tagChoice=tag;state.testMessage=state.modules.includes('browse')?`已选择“${tag}”主题，展示对应的模拟壁纸。`:`已选择“${tag}”主题，但首版没有壁纸浏览功能。`}
function runBrowse(){state.testMessage=state.modules.includes('browse')?'已打开一张模拟壁纸。':'首版没有壁纸浏览功能，可以回上一步添加。'}
function runSave(){state.triedSave=true;if(!state.modules.includes('save')){state.testMessage='首版没有保存功能，可以回上一步添加。';return}if(!state.modules.includes('browse')){state.testMessage='还没有壁纸可保存，请先添加浏览功能。';return}if(!state.fixed){state.testMessage='模拟故障：点击保存后没有反应。请把问题记下来。';return}state.retested=true;state.testMessage='模拟保存成功：复测完成，未向设备保存文件。'}
function applyFix(){if(!state.triedSave||!state.bugNote.trim()||!state.modules.includes('save'))return;state.fixed=true;state.testMessage='已模拟修复，请再次点击保存来复测。'}
function fillReview(){state.reviewName=state.name;state.reviewDescription=`为${state.audience}提供壁纸服务，支持${moduleLabels.value}。`;state.reviewStatus=''}
function submitReview(){if(state.reviewName.trim()!==state.name.trim()){state.reviewStatus='returned';state.reviewMessage='模拟退回：提交名称与当前产品名称不一致，请修改后重新提交。';return}if(state.reviewDescription.trim().length<8){state.reviewStatus='returned';state.reviewMessage='模拟退回：请用至少 8 个字描述产品用途和功能。';return}state.reviewStatus='passed';state.reviewMessage='模拟检查通过：名称一致且描述长度符合本关要求。实际审核以平台为准。'}
watch(()=>[state.name,state.reviewName,state.reviewDescription,state.modules.join(',')],()=>{if(state.reviewStatus)state.reviewStatus=''});
watch(()=>[state.audience,state.problem,state.name],()=>{state.triedFilter=false;state.triedSave=false;state.filterApplied=false;state.tagChoice='';state.retested=false;state.fixed=false;state.testMessage='';state.reviewStatus=''});
function fillPromo(){state.promo=`${state.audience}找壁纸不方便？来看看${state.name}，${state.problem}。`}
function backToList(){uni.navigateBack({fail:()=>uni.redirectTo({url:'/pages/simulate/index'})})}
function copyBrief(){uni.setClipboardData({data:`产品：${state.name}\n目标用户：${state.audience}\n问题：${state.problem}\n首版功能：${moduleLabels.value}\n测试预期：${state.expected}\n测试记录：${state.bugNote}\n推广文案：${state.promo}\n状态：模拟草稿，尚需真实验证`})}
function confirmReset(){uni.showModal({title:'重新开始？',content:'将清除本设备保存的新版模拟进度，旧版记录不会删除。',success:r=>{if(r.confirm)Object.assign(state,fresh())}})}
</script>
<style src="./simulate.css"></style>
<style scoped>
.phone-tags{display:flex;gap:6px;margin-top:8px}.phone-tags text,.phone-tags button{margin:0;padding:3px 9px;border-radius:12px;background:#e9f2e4;color:#567258;font-size:11px;line-height:1.5}.phone-tags button.tag-active{background:#315c3b;color:#fff}
.top-actions{margin:0 0 14px}.source-note{margin-top:18px}.chat-window{background:#f0f5eb;padding:18px;border-radius:8px;margin:20px 0}.chat-name{font-size:13px;color:#67816b;font-weight:700;margin-bottom:14px}.message{max-width:84%;padding:10px 13px;margin:9px 0;border-radius:8px;font-size:14px;line-height:1.65}.theirs{background:#fff;color:#354f3d}.mine{margin-left:auto;background:#d8edba;color:#25422f}.ask-row,.feature-list{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0 18px}.ask-row button{margin:0}.selected-small{background:#285b3b!important;color:#fff!important}.workbench{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:22px;align-items:start;margin:20px 0}.workbench.reverse{grid-template-columns:245px minmax(0,1fr)}.feature-list{display:grid;grid-template-columns:1fr;gap:8px}.feature{margin:0;background:#f5f8f2;border:1px solid #dce7d8;color:#46634c;display:flex;justify-content:space-between;text-align:left;font-size:14px;line-height:1.4;padding:12px}.feature-on{border-color:#719b73;background:#e6f0df;color:#1f4d30}.phone{background:#1a2c20;border-radius:20px;padding:9px;min-width:0;box-shadow:0 7px 22px #1d3d2720}.phone-head{background:#f9fbf8;text-align:center;padding:13px 8px;font-size:13px;font-weight:700;border-radius:13px 13px 0 0;color:#263c2c}.phone-content{background:#f9fbf8;padding:13px;border-radius:0 0 13px 13px;min-height:235px}.phone-label{display:block;font-size:13px;color:#31543a;font-weight:700;margin-bottom:10px}.phone-filter,.phone-empty{font-size:11px;color:#668267;background:#eaf3e4;padding:7px;border-radius:5px}.phone-empty{background:#f0f0ed;color:#999}.wallpaper{background:linear-gradient(145deg,#d2e9c8,#eef4da);min-height:96px;display:flex;align-items:center;justify-content:center;text-align:center;color:#456e4a;font-size:13px;margin:10px 0;padding:10px}.phone-action,.phone-button{display:block;margin:0;width:100%;font-size:12px;text-align:center;background:#e3efe0;color:#366c42;padding:7px;border-radius:5px;line-height:1.4}.phone-button{border:0}.main-phone{background:#315c3b;color:white}.fix-button{margin-top:15px}.notice{margin-top:15px;padding:12px;border-radius:5px;font-size:14px;line-height:1.6}.notice-good{background:#e7f3df;color:#285d37}.notice-bad{background:#fcebe6;color:#954832}.ok{color:#2d7440}.numbers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}.numbers view{background:#f1f6ec;border-radius:7px;padding:15px}.numbers text{display:block;color:#718a70;font-size:12px;line-height:1.5}.numbers text+text{font-size:21px;color:#224e34;font-weight:700;margin-top:5px}@media(max-width:700px){.workbench,.workbench.reverse{grid-template-columns:1fr}.phone{max-width:270px;width:100%;margin:auto}.numbers{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
