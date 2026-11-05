import qrcode from 'qrcode-generator';
import {campIllo} from './camp-illustration.js';

// Draw whole square modules and a four-module white quiet zone for reliable scanning.
export function makeCampQr(url, cellSize = 10) {
  if (!url) throw new Error('missing_target');
  const qr = qrcode(0, 'H');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount(), quiet = 4;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = (n + quiet * 2) * cellSize;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0b2e20';
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    if (qr.isDark(row, col)) ctx.fillRect((col + quiet) * cellSize, (row + quiet) * cellSize, cellSize, cellSize);
  }
  return canvas;
}

function imageFromSvg(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('illustration_unavailable'));
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function createCampSharePoster(url) {
  if (document.fonts?.ready) await document.fonts.ready;
  const illustration = await imageFromSvg(campIllo(646));
  const qr = makeCampQr(url, 10);
  const canvas = document.createElement('canvas');
  canvas.width = 1500; canvas.height = 2668;
  const ctx = canvas.getContext('2d'); ctx.scale(2, 2);
  const font = '"PingFang SC", "Microsoft YaHei", sans-serif';
  function text(str, x, y, size, color, weight = 700) {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${font}`; ctx.fillText(str, x, y);
  }
  ctx.fillStyle = '#0b2e20'; ctx.fillRect(0, 0, 750, 1334);
  ctx.fillStyle = '#ffc94d'; ctx.fillRect(52, 44, 44, 44);
  text('↗', 60, 76, 29, '#0b2e20', 900);
  text('AINPE · AI 实战情报站', 110, 75, 22, '#f7f3ea');
  text('3 天，迈出', 52, 190, 72, '#ffc94d', 900);
  text('AI 实战第一步', 52, 280, 72, '#fff', 900);
  text('没方向？没路径？没人带？', 52, 339, 29, '#ffb394', 800);
  text('先了解体验营，再决定下一步。', 52, 379, 25, '#d5e5d8', 600);
  ctx.drawImage(illustration, 52, 390, 646, 530);
  text('2 场直播大课', 52, 994, 26, '#fff', 800);
  text('3 天答疑群', 268, 994, 26, '#fff', 800);
  text('1 张体验卡', 478, 994, 26, '#fff', 800);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 1046, 750, 288);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(qr, 48, 1071, 218, 218); ctx.imageSmoothingEnabled = true;
  text('微信扫码了解', 294, 1132, 31, '#13241b', 900);
  text('AI 成万事 · 3 天体验营', 294, 1177, 25, '#13241b', 800);
  text('不保证收入，费用与时间以入口说明为准。', 294, 1221, 18, '#718477', 500);
  text('先体验项目：ainpe.aisen.xin', 294, 1256, 18, '#718477', 500);
  return canvas.toDataURL('image/png');
}
