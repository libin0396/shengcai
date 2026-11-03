import test from 'node:test';
import assert from 'node:assert/strict';
import {isAiArticle,matchesAiCategory} from '../src/article-categories.js';

test('AI classification requires text evidence, not broad source topic tags',()=>{
  assert.equal(isAiArticle({title:'文旅赛道：3天成交700客户',summary:'线下流量与文旅行业复盘',topics:['ai-growth']}),false);
  assert.equal(isAiArticle({title:'小程序运营复盘',summary:'我用 AI 做小程序',topics:['community']}),true);
  assert.equal(isAiArticle({title:'企业 FDE 的五种能力',summary:'',topics:[]}),true);
  assert.equal(isAiArticle({title:'一个 plain 说明',summary:'普通销售故事',topics:[]}),false);
});

test('AI article categories can overlap without inventing details',()=>{
  const item={title:'用 AI 开发工具的实战复盘',kind:'案例',summary:'介绍开发和工作流'};
  assert.equal(matchesAiCategory(item,'cases'),true);
  assert.equal(matchesAiCategory(item,'tools'),true);
  assert.equal(matchesAiCategory(item,'development'),true);
  assert.equal(matchesAiCategory(item,'content'),false);
});

test('summary evidence must relate actual AI use to the article subject',()=>{
  assert.equal(isAiArticle({title:'让自己不消失，才是做项目型IP的开始',summary:'不是让 AI 从头到尾生成的，交给 AI 做转写和修整'}),false);
  assert.equal(isAiArticle({title:'99元的小课卖了1200单后，我们开始收50万',summary:'我是张可粒，专做全案操盘，AI私塾赋能。'}),false);
  assert.equal(isAiArticle({title:'小红书累计百万曝光：一个小学老师的小程序运营复盘',summary:'一名小学老师，也是一个正在用 AI 做小程序的生财新人'}),true);
  assert.equal(isAiArticle({title:'Paseo：多模型协作怎么用？自动分工、交叉比对',summary:'GPT、DeepSeek，我手上同时用着这么几个'}),true);
  assert.equal(isAiArticle({title:'全网视频制作开源工具 & Skills 终极藏宝图',summary:'70+ 开源项目与 Agent Skills 工业化全流程指南'}),true);
  assert.equal(isAiArticle({title:'小店的经营经验',summary:'作者是一位 AI 行业顾问',topics:['ai-growth']}),false);
  assert.equal(isAiArticle({title:'传统视频制作复盘',summary:'本篇由 AI 帮我润色',topics:['ai-video']}),false);
});

test('subcategories use the subject rather than incidental summary words',()=>{
  const teacher={title:'报名豆包合作讲师审核通过，成为特邀讲师还能接几千块一场的线下课',summary:'在豆包合作的创作者群看到消息',kind:'分享'};
  const ad={title:'分享个抖音电脑版AI获客系统，各行业低成本精准获客',summary:'获取同行视频下方的评论',kind:'讨论'};
  const fde={title:'去广州做FDE服务，才发现成都的AI智能体知识库比北上广还强！',summary:'去广州交流FDE',kind:'分享'};
  assert.equal(matchesAiCategory(teacher,'content'),false);
  assert.equal(matchesAiCategory(ad,'content'),false);
  assert.equal(matchesAiCategory(ad,'development'),false);
  assert.equal(matchesAiCategory(fde,'tools'),false);
  assert.equal(matchesAiCategory(fde,'development'),true);
  assert.equal(matchesAiCategory({title:'AI短视频带货实操教程',kind:'教程'},'content'),true);
});
