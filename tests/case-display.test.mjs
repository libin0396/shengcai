import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayCase, publicNumbers} from '../uni-app/src/data/case-display.mjs';

const originals = JSON.parse(readFileSync(new URL('../uni-app/src/data/case-studies-published.json', import.meta.url), 'utf8'));
const source = id => originals.find(c => c.id === id);
const number = (c, label) => c.numbers.find(n => n.label === label);

test('summaries are display-only and preserve source data, notes, dates and links', () => {
  const input = source('45548881815182188');
  const before = structuredClone(input);
  const shown = displayCase(input);
  assert.equal(number(shown, '订单').value, '不到 10 单');
  assert.equal(number(shown, '预估收入').value, '两百多元');
  assert.equal(number(shown, '预估收入').note, number(input, '预估收入').note);
  assert.equal(shown.sourceUrl, input.sourceUrl);
  assert.equal(shown.publishedAt, input.publishedAt);
  assert.deepEqual(input, before);
  assert.equal(number(input, '预估收入').value, '276.32 元');
});

test('summaries do not invent upper bounds or remove dates and cost context', () => {
  const video = displayCase(source('14588481121824442'));
  assert.equal(number(video, '2025 年 8 月').value, '月收入六千元以上');
  assert.equal(number(video, '2025 年 12 月').value, '月收入超过两万元');
  const team = displayCase(source('14422114455242422'));
  assert.equal(number(team, '团队带货 GMV').value, '月均五百万元以上');
  assert.match(number(team, '团队带货 GMV').note, /不是 Agent 收入或利润/);
  const course = displayCase(source('55521521254555184'));
  assert.equal(number(course, '阶段性表现').value, '8 月中旬约千元/天');
  assert.equal(number(course, '广告投入').value, '推广期间每天约三百元');
  assert.match(course.start.budget, /推广/);
  assert.match(course.start.budget, /工具和其他完整成本未披露/);
});

test('reviewed narrative summaries retain distinct data meanings', () => {
  const workshop = displayCase(source('22258212425811581'));
  assert.equal(number(workshop, '素材镜头').value, '两百多段');
  assert.equal(number(workshop, '缺失标签').value, '近百段');
  assert.match(workshop.pitfalls[0].detail, /约六十段误套标签/);
  const sop = displayCase(source('14425125822512542'));
  assert.match(number(sop, 'PPT 材料').note, /一千多页/);
  assert.equal(number(sop, 'PPT 材料').value, '十几份');
});

test('a changed source value never inherits an outdated summary', () => {
  const input = structuredClone(source('45548881815182188'));
  number(input, '预估收入').value = '1024 元';
  assert.equal(number(displayCase(input), '预估收入').value, '1024 元');
});


test('public case figures hide earnings and revenue while retaining costs and activity', () => {
  const input = [
    {label:'月收入',value:'两万元'}, {label:'较好阶段',value:'月收入数万元'},
    {label:'单月 GMV',value:'五百万'}, {label:'净利润',value:null},
    {label:'广告投入',value:'三百元/天'}, {label:'订阅费用',value:'198 元/月'},
    {label:'曝光',value:'一百万人'},
  ];
  const before = structuredClone(input);
  assert.deepEqual(publicNumbers(input).map(n => n.label), ['广告投入','订阅费用','曝光']);
  assert.deepEqual(input,before);
  assert.deepEqual(publicNumbers(null),[]);
});


test('public summaries keep the sales model without pricing figures', () => {
  const input = source('82255821128414422');
  const before = structuredClone(input);
  const shown = displayCase(input);
  assert.equal(shown.project.revenueModel,'销售不同功能和服务范围的工作流套餐。');
  assert.deepEqual(input,before);
});
