// 把网页版的学 AI、每日 AI、跟着做内容导出给小程序用。改了网页版内容后跑一次：
//   node scripts/build-mini-ai-content.mjs
// 生成三个文件（都不要手改）：
//   uni-app/src/data/mini-ai.json   ← static/learn/xue-ai-data.js、meiri-ai-data.js
//   uni-app/src/data/mini-zuo.json  ← static/learn/zuo-data.js（课件、绘本两篇的教程正文小程序用 mini-guides.json 里的同一份）
//   uni-app/src/data/zuo-core.js    ← static/learn/zuo-core.js（跟着做的玩法规则，网页和小程序共用一份）
// tests/mini-ai.test.mjs、tests/zuo.test.mjs 会检查两边是否一致。
import {readFileSync, writeFileSync} from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../uni-app/src/static/learn/', import.meta.url);
const ctx = {window: {}};
vm.createContext(ctx);
for (const f of ['xue-ai-data.js', 'meiri-ai-data.js', 'zuo-data.js']) vm.runInContext(readFileSync(new URL(f, dir), 'utf8'), ctx, {filename: f});
const X = JSON.parse(JSON.stringify(ctx.window.AINPE_XUE));
const M = JSON.parse(JSON.stringify(ctx.window.AINPE_MEIRI));
// 小程序只用课程和每期内容；网页地址（PROJECT_PAGES）不带过去，跟着做在小程序里打开 pages/learn/guide。
const out = {
  note: '由 scripts/build-mini-ai-content.mjs 从 static/learn/xue-ai-data.js、meiri-ai-data.js 生成，请改源文件后重新生成。',
  xue: {UNITS: X.UNITS, LESSONS: X.LESSONS, ORDER: X.ORDER, DEMO: X.DEMO},
  meiri: {ISSUES: M.ISSUES, XP: M.XP, DEMO: M.DEMO, UNLOCK_ALL: M.UNLOCK_ALL},
};
const text = JSON.stringify(out, null, 1) + '\n';

// 跟着做：角色剧本、玩法、大图的手机版对照表（媒体路径都是相对 static/learn/ 的，小程序里拼成完整网址）
const Z = JSON.parse(JSON.stringify(ctx.window.AINPE_ZUO));
const zuo = {
  note: '由 scripts/build-mini-ai-content.mjs 从 static/learn/zuo-data.js 生成，请改源文件后重新生成。',
  SCRIPTS: Z.SCRIPTS, LITE: Z.LITE, ORDER: Z.ORDER,
};
const zuoText = JSON.stringify(zuo, null, 1) + '\n';

// 玩法规则：把网页用的脚本包成 ES 模块
const coreSrc = readFileSync(new URL('zuo-core.js', dir), 'utf8');
const tail = "})(typeof window!=='undefined'?window:globalThis);";
if (!coreSrc.trimEnd().endsWith(tail)) throw new Error('zuo-core.js 的结尾变了，生成脚本也要跟着改');
const coreText = '// 由 scripts/build-mini-ai-content.mjs 从 static/learn/zuo-core.js 生成，请改源文件后重新生成。\n' +
  'const holder = {};\n' + coreSrc.trimEnd().slice(0, -tail.length) + '})(holder);\n' + 'export default holder.AINPE_ZUO_CORE;\n';

const outputs = [
  ['../uni-app/src/data/mini-ai.json', text],
  ['../uni-app/src/data/mini-zuo.json', zuoText],
  ['../uni-app/src/data/zuo-core.js', coreText],
];
for (const [, t] of outputs) if (/(^|[^n])\/static\//.test(t.replace(/https:\/\/ainpe\.aisen\.xin\/static\//g, ''))) throw new Error('小程序内容里不能出现站内 /static/ 路径');
if (process.argv.includes('--check')) {
  let bad = 0;
  for (const [f, t] of outputs) {
    let now = '';
    try { now = readFileSync(new URL(f, import.meta.url), 'utf8'); } catch {}
    if (now !== t) { console.error(f.replace('../', '') + ' 和网页版内容不一致，请运行 node scripts/build-mini-ai-content.mjs'); bad++; }
  }
  if (bad) process.exit(1);
  console.log('小程序内容已是最新');
} else {
  for (const [f, t] of outputs) { writeFileSync(new URL(f, import.meta.url), t); console.log('已写入 ' + f.replace('../', '')); }
}
