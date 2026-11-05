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

export async function createCampSharePoster(url, scale = 3) {
  try {
  if (document.fonts?.ready) await document.fonts.ready;
  // Rasterize the vector illustration at export resolution, not at preview size.
  const illustration = await imageFromSvg(campIllo(646 * scale));
  const qrCellSize = 18;
  const qr = makeCampQr(url, qrCellSize);
  const canvas = document.createElement('canvas');
  canvas.width = 750 * scale; canvas.height = 1334 * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.scale(scale, scale);
  const font = '"PingFang SC", "Microsoft YaHei", sans-serif';
  function text(str, x, y, size, color, weight = 700) {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${font}`; ctx.fillText(str, x, y);
  }
  function rounded(x, y, width, height, radius, color) {
    ctx.fillStyle = color; ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius);
    else ctx.rect(x, y, width, height);
    ctx.fill();
  }
  ctx.fillStyle = '#0b2e20'; ctx.fillRect(0, 0, 750, 1334);
  const glow = ctx.createRadialGradient(600, 120, 0, 600, 120, 350);
  glow.addColorStop(0, 'rgba(255,201,77,.22)'); glow.addColorStop(1, 'rgba(255,201,77,0)');
  ctx.fillStyle = glow; ctx.fillRect(250, 0, 500, 480);
  rounded(52, 44, 44, 44, 10, '#ffc94d');
  text('↗', 60, 76, 29, '#0b2e20', 900);
  text('AINPE · AI 实战情报站', 110, 75, 22, '#f7f3ea');
  rounded(462, 44, 236, 42, 21, '#ee5a24');
  text('生财有术 · AI 成万事', 478, 72, 19, '#fff', 800);
  text('3 天', 52, 190, 80, '#ffc94d', 900);
  text('，迈出', 216, 190, 80, '#fff', 900);
  text('AI 实战第一步', 52, 280, 72, '#fff', 900);
  text('没方向？没路径？没人带？这次有人拉你一把。', 52, 335, 25, '#ffb394', 800);
  ctx.drawImage(illustration, 52, 356, 646, 530);
  text('2', 52, 963, 40, '#fff', 900); text('场直播大课', 82, 963, 21, '#c7dacd');
  text('3', 265, 963, 40, '#fff', 900); text('天答疑群', 295, 963, 21, '#c7dacd');
  text('1', 466, 963, 40, '#fff', 900); text('张体验卡', 496, 963, 21, '#c7dacd');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 1046, 750, 288);
  // Whole output pixels per module keep QR edges sharp after the canvas scale.
  const modules = qr.width / qrCellSize;
  const qrSize = Math.floor(218 * scale / modules) * modules / scale;
  ctx.imageSmoothingEnabled = false; ctx.drawImage(qr, 48, 1071, qrSize, qrSize); ctx.imageSmoothingEnabled = true;
  text('微信扫码', 294, 1125, 32, '#13241b', 900);
  text('加入 3 天体验营', 294, 1170, 32, '#13241b', 900);
  rounded(294, 1184, 235, 34, 9, '#ee5a24');
  text('企业微信 · 生财有术', 306, 1208, 19, '#fff', 800);
  text('不保证收入；费用和开营时间以入口说明为准。', 294, 1251, 16, '#718477', 500);
  text('还没想好方向？先体验：ainpe.aisen.xin', 294, 1278, 16, '#718477', 500);
  const result = canvas.toDataURL('image/png');
  if (!result.startsWith('data:image/png')) throw new Error('poster_unavailable');
  return result;
  } catch (error) {
    if (scale > 2) return createCampSharePoster(url, 2);
    throw error;
  }
}
