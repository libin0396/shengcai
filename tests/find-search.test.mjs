import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const searchSource=await readFile('uni-app/src/static/learn/find-search.js','utf8');
const caseSource=await readFile('uni-app/src/static/learn/find-cases.js','utf8');
const published=JSON.parse(await readFile('uni-app/src/data/case-studies-published.json','utf8'));
const context={window:{}};vm.runInNewContext(searchSource,context);vm.runInNewContext(caseSource,context);
const search=context.window.AINPEFindSearch.search,cases=context.window.AINPE_FIND_CASES;
vm.runInNewContext(await readFile('uni-app/src/static/learn/guides-data.js','utf8'),context);
const guides=context.window.AINPE_GUIDES;

test('reviewed case index retains the exact reviewed IDs, titles, and topics',()=>{
  assert.deepEqual(JSON.parse(JSON.stringify(cases)),published.map(x=>({id:x.id,title:x.title,topics:x.topics})));
});
test('short-drama search surfaces source-backed posts and clearly related video simulation',()=>{
  const feed=[
    {id:'123',title:'有人用 AI 把英语课本拍成短剧，收获 9 万人收藏'},
    {id:'124',title:'AI跑出来的副业机会｜短剧挂载实操复盘'},
    {id:'125',title:'普通短剧聚会活动'},
    {id:'126',title:'AI 短剧月入7万经验'},
    {id:'javascript:1',title:'AI 短剧学习'},
  ];
  const result=search('怎么做短剧',feed,cases);
  assert.equal(result.isShortDrama,true);
  assert.ok(result.cases.some(x=>x.id==='123'&&x.kind==='帖子导读'));
  assert.ok(result.cases.some(x=>x.id==='14588481121824442'&&x.kind==='完整解读'));
  assert.ok(!result.cases.some(x=>['125','126','javascript:1'].includes(x.id)));
  assert.equal(result.simulation.title,'AI 视频定制');
  assert.match(result.simulation.note,/并非短剧制作教程/);
});
test('an unrelated search does not manufacture a related project',()=>{
  const result=search('如何修自行车',[],cases);
  assert.equal(result.cases.length,0);assert.equal(result.simulation,null);
});

test('tutorial-first searches omit source cases without requesting the feed',async()=>{
  const form={handlers:{},addEventListener(type,fn){this.handlers[type]=fn}},input={value:'怎么做短剧',blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
  const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount};
  const outcomes=[],requests=[];
  const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
  const win={Learn:L,AINPE_AIDS:[],AINPE_GUIDES:guides,AINPE_FIND_CASES:cases,AINPE_SITE_MODE:{tutorialFirst:true},AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
  const script=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  vm.runInNewContext(script,{window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},
    fetch:(...args)=>{requests.push(args);return Promise.reject(new Error('unexpected fetch'))},setTimeout(){},Promise,Date,Number,String});
  form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,0);assert.doesNotMatch(results.innerHTML,/相关案例与帖子|完整解读|帖子导读/);
  assert.match(results.innerHTML,/从零做一条 AI 短剧/);assert.match(results.innerHTML,/guide.html\?id=short-drama/);
  assert.doesNotMatch(results.innerHTML,/AI 视频定制|尚未上线/);
  assert.equal(outcomes.length,1);assert.equal(outcomes[0][2],false);
});

test('search sends no user text in feed requests or feedback calls',async()=>{
  const form={handlers:{},addEventListener(type,fn){this.handlers[type]=fn}};
  const input={value:'如何修自行车',blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
  const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount};
  const requests=[],outcomes=[];
  const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
  const win={Learn:L,AINPE_AIDS:[],AINPE_FIND_CASES:cases,AINPEFindSearch:context.window.AINPEFindSearch,
    AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
  const script=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  vm.runInNewContext(script,{window:win,location:{search:''},URLSearchParams,
    sessionStorage:{getItem(){return null},removeItem(){}},
    fetch:(...args)=>{requests.push(args);return Promise.resolve({ok:true,json:()=>Promise.resolve({articles:[]})})},
    setTimeout(){},Promise,Date,Number,String});
  form.handlers.submit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,1);assert.equal(requests[0][0],'/api/feed');
  assert.equal(JSON.stringify(requests).includes('如何修自行车'),false);
  assert.equal(outcomes.length,1);assert.equal(outcomes[0][0],false);
  assert.equal(JSON.stringify(outcomes).includes('如何修自行车'),false);
  assert.match(results.innerHTML,/暂时没找到/);
});

test('project prompts do not become false hits from generic AI or single-character keywords',async()=>{
  const aidsSource=await readFile('uni-app/src/static/learn/aids-data.js','utf8');
  const pageSource=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  for(const [query,expected,related] of [['AI项目选题',false,false],['怎么做AI短剧',true,true],['短剧怎么说',true,true],['写一部AI短剧故事',true,true],['短剧文案怎么写',true,true]]){
    const form={handlers:{},addEventListener(type,fn){this.handlers[type]=fn}},input={value:query,blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
    const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount};
    const outcomes=[];
    const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
    const win={Learn:L,AINPE_FIND_CASES:cases,AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
    const ctx={window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},
      fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({articles:[]})}),setTimeout(){},Promise,Date,Number,String};
    vm.runInNewContext(aidsSource,ctx);vm.runInNewContext(pageSource,ctx);
    form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
    assert.equal(outcomes.length,1,query);
    assert.equal(outcomes[0][0],expected,query);assert.equal(outcomes[0][2],related,query);
    assert.doesNotMatch(results.innerHTML,/孩子的题我不会讲|第一次用 AI 不知道问什么|一条不好开口的消息|和孩子做一本绘本|发朋友圈不知道写啥/,query);
  }
});

test('failed feed leaves feedback available without counting an incomplete search',async()=>{
  const form={handlers:{},addEventListener(type,fn){this.handlers[type]=fn}},input={value:'如何修自行车',blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
  const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount};
  const outcomes=[];
  const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
  const win={Learn:L,AINPE_AIDS:[],AINPE_FIND_CASES:cases,AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
  const page=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  vm.runInNewContext(page,{window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},
    fetch:()=>Promise.reject(new Error('offline')),setTimeout(){},Promise,Date,Number,String});
  form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(outcomes.length,1);assert.equal(outcomes[0][0],false);assert.equal(outcomes[0][1],mount);assert.equal(outcomes[0][3],true);
  assert.match(results.innerHTML,/部分站内资料暂时无法读取/);
});

test('common tutorial searches return the matching guide without sending the query',async()=>{
  const script=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  for(const [query,id] of [['怎么做短剧','short-drama'],['写短视频脚本','video-script'],['做商品宣传图','product-poster'],['整理会议纪要','meeting-notes'],['写小红书笔记','content-notes'],['笔记','content-notes'],['生图','product-poster']]){
    const form={handlers:{},addEventListener(t,fn){this.handlers[t]=fn}},input={value:query,blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
    const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount},requests=[];
    const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
    const win={Learn:L,AINPE_AIDS:[],AINPE_GUIDES:guides,AINPE_FIND_CASES:cases,AINPE_SITE_MODE:{tutorialFirst:true},AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(){}}};
    vm.runInNewContext(script,{window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},fetch:(...a)=>{requests.push(a);return Promise.reject(new Error('unexpected'))},setTimeout(){},Promise,Date,Number,String});
    form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
    assert.ok(results.innerHTML.includes('guide.html?id='+id),query);assert.equal(requests.length,0,query);
  }
});

test('generic short-video questions show relevant tutorials as suggestions and keep feedback',async()=>{
  const script=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  for(const query of ['能教我用手机做一条短片吗','想用AI剪个视频']){
    const form={handlers:{},addEventListener(t,fn){this.handlers[t]=fn}},input={value:query,blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={};
    const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount},outcomes=[];
    const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
    const win={Learn:L,AINPE_AIDS:[],AINPE_GUIDES:guides,AINPE_SITE_MODE:{tutorialFirst:true},AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
    vm.runInNewContext(script,{window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},Promise,Date,Number,String});
    form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
    assert.match(results.innerHTML,/暂时没有完全匹配的教程/);assert.match(results.innerHTML,/guide.html\?id=short-drama/);
    assert.equal(outcomes[0][0],true);assert.equal(outcomes[0][2],true);
  }
});

test('specific searches avoid generic mismatches and ambiguous requests do not promise a match',async()=>{
  const script=await readFile('uni-app/src/static/learn/find-page.js','utf8');
  const aidsSource=await readFile('uni-app/src/static/learn/aids-data.js','utf8');
  for(const query of ['会议笔记','录音转文字','AI视频怎么做']){
    const form={handlers:{},addEventListener(t,fn){this.handlers[t]=fn}},input={value:query,blur(){}},results={innerHTML:''},chips={innerHTML:''},mount={},out={innerHTML:''},copy={addEventListener(){}};
    const byId={'#fsearch':form,'#fq':input,'#fres':results,'#fchips':chips,'#find-feedback-mount':mount,'#fout':out,'#fcopy':copy},outcomes=[];
    const L={chrome(){},$(s){return byId[s]},$$(){return []},track(){},esc(s){return String(s)},aidIcon(){return ''}};
    const win={Learn:L,AINPE_GUIDES:guides,AINPE_SITE_MODE:{tutorialFirst:true},AINPEFindSearch:context.window.AINPEFindSearch,AINPEFindFeedback:{onSearch(...args){outcomes.push(args)}}};
    const ctx={window:win,location:{search:''},URLSearchParams,sessionStorage:{getItem(){return null},removeItem(){}},Promise,Date,Number,String};
    vm.runInNewContext(aidsSource,ctx);vm.runInNewContext(script,ctx);
    form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
    if(query==='会议笔记'){
      assert.match(results.innerHTML,/guide.html\?id=meeting-notes/);
      assert.doesNotMatch(results.innerHTML,/guide.html\?id=content-notes/);
      assert.ok(results.innerHTML.indexOf('guide.html?id=meeting-notes')<results.innerHTML.indexOf('复制提示词'));
    }else if(query==='录音转文字'){
      assert.match(results.innerHTML,/暂时没找到站内相关内容/);
      assert.doesNotMatch(results.innerHTML,/会议记录整理成纪要/);
      assert.match(results.innerHTML,/自愿提交想补充的方向/);
      assert.equal(outcomes[0][0],false);
    }else{
      assert.match(results.innerHTML,/暂时没有完全匹配的教程/);
      assert.match(results.innerHTML,/guide.html\?id=short-drama/);
      assert.equal(outcomes[0][2],true);
    }
  }
});
