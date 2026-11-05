import test from 'node:test';
import assert from 'node:assert/strict';
import {isCaseLibraryItem,cleanCaseTitle,shortCaseSummary,relatedReviewedCases} from '../uni-app/src/data/case-library.mjs';

test('case library filters source promotions, solicitations, events and bypass content even when tagged AI',()=>{
  for(const title of [
    '教你白嫖deepseekv4.1flash',
    '11月8日苍述线下组局：新手如何入局FDE拿订单搞钱？',
    '11月全国21场AI项目沙龙开启，涵盖自媒体、小程序、企业服务等方向',
    '求经验丰富、知名度高的内训FDE方案，解决AI落地需求可私聊',
    '标题：做了一个 AI 资讯、价格和副业案例网站，分享一下目前的思路',
    '关于生财的这期航海我真笑了，亦仁啊，有些时候不能听员工的，我这个帖子可以去用AI去验证。',
    '佛山的圈友们，这周六下午我们在南海组了个小局，聊聊 AI 获客和实际落地。',
    '拿下 AI 落地最值钱的一公里 | 11月7日 北京【航海家 | FDE大会】来啦！',
    '分享个抖音电脑版AI获客系统，各行业低成本精准获客',
    'AI 订阅支付总被卡脖子？请享用这一份半小时开卡、充值、订阅的喂饭级教程',
    '最近又用了两天 Cluade，体感是质量确实比 Codex 高一点，但速度实在是太慢了。',
  ]) assert.equal(isCaseLibraryItem({title,kind:'案例',summary:'AI 项目'}),false,title);
});

test('case library keeps AI-related first-hand practice and does not treat broad tags as AI evidence',()=>{
  for(const title of [
    '半年变现7w AI定制视频项目经验复盘与总结分享',
    '用大模型做视频，一条抖音视频拿85万播放涨1.4万粉',
    'AI小白半个月实操：把赛道课拆成可落地SOP的完整经验',
  ]) assert.equal(isCaseLibraryItem({title,kind:'分享'}),true,title);
  assert.equal(isCaseLibraryItem({title:'传统门店运营项目经验复盘',topics:['agent'],summary:'普通经营经验'}),false);
  assert.equal(isCaseLibraryItem({title:'AI时代有两个重要的东西',kind:'分享'}),false);
  // 正文核对发现该帖流程不适合作推荐，仅靠标题摘要无法判断。
  assert.equal(isCaseLibraryItem({id:'82258452224185212',title:'快手挂件项目——AI短视频带货实操',kind:'分享'}),false);
});

test('short summaries show a truncation cue and remove source labels',()=>{
  assert.equal(cleanCaseTitle('标题：一个 AI 案例'),'一个 AI 案例');
  assert.equal(shortCaseSummary('标题：作者做了一个项目'),'作者做了一个项目…');
  assert.equal(shortCaseSummary('已经完整。'),'已经完整。');
  assert.equal(shortCaseSummary(''),'当前资料不足，暂无法展示摘要。');
});

test('related reviewed cases preserve editorial choices and only fill with meaningful matches',()=>{
  const current={id:'1',category:'video',topics:['ai','content','video'],related:['2','2','1','missing']};
  const all=[current,
    {id:'2',category:'miniapp',topics:['miniapp'],publishedAt:1},
    {id:'3',category:'video',topics:['video'],publishedAt:2},
    {id:'4',category:'agent',topics:['video'],publishedAt:3},
    {id:'5',category:'agent',topics:['ai','content'],publishedAt:4},
  ];
  assert.deepEqual(relatedReviewedCases(current,all).map(c=>c.id),['2','3','4']);
  assert.deepEqual(relatedReviewedCases({id:'1',category:'fde',topics:['ai','content'],related:[]},all),[]);
});
