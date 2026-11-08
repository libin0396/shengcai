// Presentation-only summaries of reviewed case figures. Each entry includes
// the source value, so later data updates cannot silently reuse a stale summary.
// The original numbers and source notes remain in case-studies-published.json.
const figures = {
  '45548881815182188': {
    '订单': ['8 单', '不到 10 单'],
    '预估收入': ['276.32 元', '两百多元'],
  },
  '45548854528444458': { '累计广告收入': ['7.25 美元', '不到 10 美元'] },
  '14588481121824442': {
    '2025 年 8 月': ['月收入 6000+ 元', '月收入六千元以上'],
    '2025 年 12 月': ['月收入突破 2 万元', '月收入超过两万元'],
  },
  '22258215525112441': {
    '单月签单业绩': ['12 万元', '十多万元'],
    '稿件成本': ['1500 元', '一千多元'],
    '团队新人': ['10 人中 7 人', '大多数人'],
  },
  '14422114455242422': { '团队带货 GMV': ['月均 500 万元以上', '月均五百万元以上'] },
  '82255821128414422': { '较好阶段': ['月收入 3 万至 5 万元', '月收入数万元'] },
  '55521425885428284': {
    '课程内容': ['12 门 / 141 课时', '十几门 / 一百多课时'],
    '豆包订阅': ['198 元/月', '两百元左右/月'],
  },
  '14425125822512542': {
    '视频材料': ['49 个', '约 50 个'],
    'PPT 材料': ['18 份', '十几份'],
  },
  '22258212425811581': {
    '素材镜头': ['234 段', '两百多段'],
    '缺失标签': ['97 段', '近百段'],
  },
  '55521521254555184': {
    '阶段性表现': ['8 月中旬约 1000 元/天', '8 月中旬约千元/天'],
    '广告投入': ['约 300 元/天', '推广期间每天约三百元'],
  },
};

// Narrative replacements are likewise guarded by the exact reviewed text.
const narratives = {
  '82255821128414422': {
    revenueModel: [
      '销售不同功能和服务范围的工作流套餐；作者披露基础套餐 999 元、全功能套餐 5000 元。',
      '销售不同功能和服务范围的工作流套餐；作者披露基础套餐约千元、全功能套餐约五千元。',
    ],
  },
  '22258212425811581': {
    firstPitfall: [
      '作者称 234 段镜头中有 97 段无标签、59 段误套标签，随后逐段重标。',
      '作者称两百多段镜头中有近百段无标签、约六十段误套标签，随后逐段重标。',
    ],
  },
  '55521521254555184': {
    budget: [
      '尝试过十多天约 300 元/天的付费推广；工具和其他完整成本未披露。',
      '尝试过十多天每天约三百元的付费推广；工具和其他完整成本未披露。',
    ],
  },
};

function summary(original, pair) {
  return pair && original === pair[0] ? pair[1] : original;
}

export function displayCase(study) {
  if (!study) return study;
  const id = String(study.id), lookup = figures[id] || {}, text = narratives[id] || {};
  const result = {
    ...study,
    numbers: (study.numbers || []).map(n => {
      let note = n.note;
      // This count is shown in the note, rather than in a number-card value.
      if (id === '14425125822512542' && n.label === 'PPT 材料' && note === '作者自述；总计约 1139 页。') {
        note = '作者自述；总计一千多页。';
      }
      return {...n, value: summary(n.value, lookup[n.label]), note};
    }),
    project: {...study.project},
    start: {...study.start},
    pitfalls: (study.pitfalls || []).map(p => ({...p})),
  };
  if (text.revenueModel) result.project.revenueModel = summary(study.project?.revenueModel, text.revenueModel);
  if (text.budget) result.start.budget = summary(study.start?.budget, text.budget);
  if (text.firstPitfall && result.pitfalls[0]) result.pitfalls[0].detail = summary(study.pitfalls[0].detail, text.firstPitfall);
  return result;
}
