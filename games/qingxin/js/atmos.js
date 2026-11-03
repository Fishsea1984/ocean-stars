// 大气与压迫感绘制原语（960×620 场景坐标，最终被 0.5 缩放成 480×310 像素缓冲）
// 核心手法：巨物超出画面边界 / 强单光源 / 层叠雾与纵深 / 前景纯黑剪影压边 / 远景微小人影做尺度对照

const W = 960, H = 620;

export function R(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
export function hash(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

// 竖向渐变铺满
export function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

// 天光柱：上窄下宽/上宽下窄的梯形光，边缘柔和，随时间轻微呼吸
export function godRay(ctx, x, topW, botW, y0, y1, color, alpha, t, sway) {
  const k = 1 + Math.sin(t * 0.34) * 0.05;
  const sx = (sway || 0) * Math.sin(t * 0.22);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, color);
  g.addColorStop(0.5, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - topW / 2 + sx, y0);
  ctx.lineTo(x + topW / 2 + sx, y0);
  ctx.lineTo(x + botW / 2 * k, y1);
  ctx.lineTo(x - botW / 2 * k, y1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 雾带：中段浓、两端透明 + 几团缓慢横移的雾块
export function fogBand(ctx, y, h, color, alpha, t, seed) {
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.45, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h / 2, W, h);
  const s = seed || 0;
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 233 + s * 97 + t * (5 + i * 2)) % (W + 300)) - 150;
    const by = y + Math.sin(t * 0.3 + i + s) * h * 0.22;
    ctx.globalAlpha = alpha * (0.35 + 0.25 * Math.sin(t * 0.6 + i * 1.7 + s));
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(bx, by, 150 + i * 26, h * 0.30, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// 悬浮尘埃 / 灵气微粒
export function motes(ctx, t, n, color, alpha, y0, y1, seed) {
  const s = seed || 0;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const px = (i * 137 + s * 61) % W;
    const py = y0 + ((i * 97 + s * 31) % Math.max(1, (y1 - y0)));
    const dx = Math.sin(t * 0.5 + i * 1.3 + s) * 16;
    const dy = ((t * (7 + (i % 5) * 3) + i * 41 + s * 13) % (y1 - y0 + 60)) * -1;
    ctx.globalAlpha = alpha * (0.35 + 0.65 * Math.abs(Math.sin(t * 1.2 + i)));
    R(ctx, px + dx, py + dy + 60, 2, 2, color);
  }
  ctx.restore();
}

// 远景微小人影：一排极小的人，用来反衬主体尺度
export function tinyCrowd(ctx, y, x0, x1, n, color, t, seed) {
  const s = seed || 0;
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < n; i++) {
    const px = x0 + (x1 - x0) * ((i + 0.5) / n) + Math.sin(t * 0.35 + i + s) * 5;
    const hh = 7 + ((i * 7 + s) % 3);
    R(ctx, px, y - hh, 3, hh, color);
    R(ctx, px + 1, y - hh - 2, 2, 2, color);
  }
  ctx.restore();
}

// 巨像剪影：超出画面的守殿神像
export function colossus(ctx, x, baseY, height, color, o) {
  const opt = o || {};
  const hw = height * 0.115;            // 头宽
  const sw = height * 0.36;             // 肩宽
  const bw = height * 0.26;             // 腰宽
  ctx.save();
  ctx.fillStyle = color;
  // 底座
  ctx.fillRect(x - sw * 0.75, baseY - height * 0.06, sw * 1.5, height * 0.06);
  // 身躯（上宽下窄的梯形）
  ctx.beginPath();
  ctx.moveTo(x - sw / 2, baseY - height * 0.86);
  ctx.lineTo(x + sw / 2, baseY - height * 0.86);
  ctx.lineTo(x + bw / 2, baseY - height * 0.10);
  ctx.lineTo(x - bw / 2, baseY - height * 0.10);
  ctx.closePath(); ctx.fill();
  // 双肩
  ctx.beginPath();
  ctx.moveTo(x - sw / 2, baseY - height * 0.86);
  ctx.lineTo(x - sw / 2 - sw * 0.16, baseY - height * 0.80);
  ctx.lineTo(x - sw / 2, baseY - height * 0.70);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + sw / 2, baseY - height * 0.86);
  ctx.lineTo(x + sw / 2 + sw * 0.16, baseY - height * 0.80);
  ctx.lineTo(x + sw / 2, baseY - height * 0.70);
  ctx.closePath(); ctx.fill();
  // 头 + 冠
  ctx.fillRect(x - hw, baseY - height * 0.98, hw * 2, height * 0.12);
  ctx.beginPath();
  ctx.moveTo(x - hw * 1.5, baseY - height * 0.98);
  ctx.lineTo(x, baseY - height * 1.10);
  ctx.lineTo(x + hw * 1.5, baseY - height * 0.98);
  ctx.closePath(); ctx.fill();
  // 双目微光
  if (opt.eyes) {
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin((opt.t || 0) * 1.1);
    ctx.fillStyle = opt.eyes;
    ctx.fillRect(x - hw * 0.72, baseY - height * 0.935, hw * 0.5, hw * 0.32);
    ctx.fillRect(x + hw * 0.22, baseY - height * 0.935, hw * 0.5, hw * 0.32);
  }
  ctx.restore();
}

// 巨碑 / 方尖碑（顶部超出画面），带阴刻符文
export function monolith(ctx, x, baseY, w, h, c1, c2, runeColor, t) {
  ctx.save();
  // 碑体
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.lineTo(x - w * 0.40, baseY - h);
  ctx.lineTo(x + w * 0.40, baseY - h);
  ctx.lineTo(x + w / 2, baseY);
  ctx.closePath(); ctx.fill();
  // 受光侧
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.30, baseY);
  ctx.lineTo(x + w * 0.24, baseY - h * 0.96);
  ctx.lineTo(x + w * 0.40, baseY - h);
  ctx.lineTo(x + w / 2, baseY);
  ctx.closePath(); ctx.fill();
  // 符文
  if (runeColor) {
    ctx.fillStyle = runeColor;
    for (let i = 0; i < 7; i++) {
      const ry = baseY - h * (0.18 + i * 0.11);
      const rw = w * (0.16 + (i % 3) * 0.05);
      ctx.globalAlpha = 0.25 + 0.28 * Math.abs(Math.sin(t * 0.9 + i));
      ctx.fillRect(x - rw / 2, ry, rw, 3);
    }
  }
  ctx.restore();
}

// 巨链：垂落的锁链，带摆动
export function chain(ctx, x, y0, y1, w, color, t, phase, amp) {
  const n = Math.max(4, Math.floor((y1 - y0) / (w * 1.7)));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.45);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const sway = Math.sin(t * 0.5 + phase + u * 2.2) * (amp || 0) * u;
    const cy = y0 + (y1 - y0) * u;
    const cw = w * (0.75 + 0.25 * Math.cos(i * 1.7));
    ctx.beginPath();
    ctx.ellipse(x + sway, cy, cw * 0.5, w * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 断裂巨柱：柱身彻底跑出画面上边界
export function brokenPillar(ctx, x, baseY, w, h, c1, c2, t) {
  ctx.save();
  ctx.fillStyle = c1;
  ctx.fillRect(x - w / 2, baseY - h, w, h);
  ctx.fillStyle = c2;
  ctx.fillRect(x + w * 0.16, baseY - h, w * 0.34, h);
  // 断口
  ctx.fillStyle = c1;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const bx = x - w / 2 + (w / steps) * i;
    const bh = 10 + hash(i, 3) * 26;
    ctx.fillRect(bx, baseY - h, w / steps + 1, bh);
  }
  // 柱础
  ctx.fillStyle = c1;
  ctx.fillRect(x - w * 0.72, baseY - 26, w * 1.44, 26);
  ctx.fillRect(x - w * 0.60, baseY - 40, w * 1.20, 16);
  // 纵向凹槽
  ctx.globalAlpha = 0.35;
  for (let i = 1; i < 4; i++) R(ctx, x - w / 2 + (w / 4) * i - 1, baseY - h + 30, 2, h - 60, c2);
  ctx.restore();
}

// 悬空残岩 / 浮岛
export function floatingRock(ctx, x, y, w, h, c1, c2, t, phase) {
  const bob = Math.sin(t * 0.5 + (phase || 0)) * 5;
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.22, y - h * 0.55);
  ctx.lineTo(x + w * 0.30, y - h * 0.42);
  ctx.lineTo(x + w / 2, y + h * 0.05);
  ctx.lineTo(x + w * 0.16, y + h * 0.62);
  ctx.lineTo(x - w * 0.28, y + h * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.22, y - h * 0.55);
  ctx.lineTo(x + w * 0.30, y - h * 0.42);
  ctx.lineTo(x + w * 0.34, y - h * 0.24);
  ctx.lineTo(x - w * 0.18, y - h * 0.34);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// 巨大天体（月 / 血月 / 星辰），可带环
export function giantBody(ctx, cx, cy, r, c1, c2, ringColor, t) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, c2);
  g.addColorStop(1, c1);
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // 表面斑纹
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 7; i++) {
    const a = hash(i, 7) * 6.28, d = hash(i, 9) * r * 0.72;
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.08 + hash(i, 11) * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (ringColor) {
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = Math.max(2, r * 0.045);
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.55, r * 0.32, -0.32 + Math.sin(t * 0.1) * 0.03, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.85, r * 0.40, -0.32, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// 巨环 / 法阵：缓慢自转的同心环
export function giantRing(ctx, cx, cy, r, color, t, rot, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.4 : alpha;
  ctx.strokeStyle = color;
  const a0 = t * (rot || 0.2);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.42, 0.3, a0, a0 + 4.6); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.74, r * 0.31, 0.3, -a0 * 1.4, -a0 * 1.4 + 3.8); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = a0 + i * Math.PI / 4;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.42;
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }
  ctx.restore();
}

// 画面底部压黑（前景深渊 / 遮挡）
export function inkBottom(ctx, y, h, color) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, color || 'rgba(2,4,7,.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, h);
}

// 前景纯黑剪影：贴在画面四边、无细节的巨大暗块，制造"被包围"的压迫感
export function frameOccluders(ctx, t, color, seed) {
  const s = seed || 0;
  ctx.save();
  ctx.fillStyle = color;
  // 左上
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(150 + s * 6, 0);
  ctx.lineTo(96 + Math.sin(t * 0.2 + s) * 4, 74); ctx.lineTo(0, 128);
  ctx.closePath(); ctx.fill();
  // 右上
  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W - 128 - s * 4, 0);
  ctx.lineTo(W - 84, 96); ctx.lineTo(W, 146);
  ctx.closePath(); ctx.fill();
  // 底部两角
  ctx.beginPath();
  ctx.moveTo(0, H); ctx.lineTo(0, H - 76); ctx.lineTo(118, H - 22); ctx.lineTo(168, H);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, H); ctx.lineTo(W, H - 92); ctx.lineTo(W - 132, H - 18); ctx.lineTo(W - 186, H);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// 远处水平压暗（纵深分离）
export function depthShade(ctx, y, h, color, alpha) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = g; ctx.fillRect(0, y, W, h);
  ctx.restore();
}

// 地面软阴影（像素化，无抗锯齿）
export function groundShadow(ctx, x, y, w, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.2 : alpha;
  ctx.fillStyle = '#000';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), Math.round(w), 3);
  ctx.globalAlpha = (alpha == null ? 0.2 : alpha) * 0.55;
  ctx.fillRect(Math.round(x - w / 2 - 4), Math.round(y - 1), Math.round(w + 8), 2);
  ctx.restore();
}
