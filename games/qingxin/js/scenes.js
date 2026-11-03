// 场景绘制（宏大重做版）：洞府内景 / 室外灵田(QQ农场式) / 灵兽园 / 练剑坪 / 丹房 / 炼器台 / 藏经阁 / 秘境
// 每个区域是独立大场景，含远景天穹、中景建筑、近景地块与走动的道童

import { HERB_MAP, PET_MAP, DUNGEON_MAP, HERBS } from './data.js';
import { SPR, ready, blit, shadow as pxShadow } from './sprites.js';
import { drawSceneHD } from './scenes-hd.js';

// 各区域角色工作点（场景坐标 960×620）
export const AREA_SPOTS = {
  cave:    { x: 470, y: 430 },
  field:   { x: 300, y: 470 },
  pets:    { x: 620, y: 452 },
  sword:   { x: 520, y: 432 },
  alchemy: { x: 600, y: 452 },
  forge:   { x: 700, y: 456 },
  library: { x: 330, y: 420 },
  rift:    { x: 520, y: 400 }
};

const W = 960, H = 620;

// ---------- 像素绘制工具 ----------
function R(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
function hash(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function stoneWall(ctx, x, y, w, h, base, seed) {
  R(ctx, x, y, w, h, base);
  const bw = 34, bh = 18;
  for (let r = 0; y + r * bh < y + h; r++) {
    const off = (r % 2) * (bw / 2);
    for (let c = -1; x + c * bw + off < x + w; c++) {
      const bx = x + c * bw + off, by = y + r * bh;
      const v = hash(bx + seed, by + seed);
      let col = base;
      if (v > 0.72) col = shade(base, 14); else if (v < 0.28) col = shade(base, -12);
      R(ctx, bx, by, bw - 2, bh - 2, col);
      R(ctx, bx, by, bw - 2, 2, shade(base, 22));
    }
  }
}
function ground(ctx, y, c1, c2, seed) {
  R(ctx, 0, y, W, H - y, c1);
  for (let i = 0; i < 90; i++) {
    const gx = (i * 97 + seed * 13) % W, gy = y + ((i * 53) % (H - y));
    const v = hash(gx + seed, gy);
    if (v > 0.6) R(ctx, gx, gy, 8, 4, shade(c1, -10));
    else if (v < 0.3) R(ctx, gx, gy, 6, 3, c2);
  }
}
function mountains(ctx, t, col1, col2) {
  ctx.fillStyle = col1;
  ctx.beginPath(); ctx.moveTo(0, 300);
  [[90, 190], [180, 255], [270, 160], [370, 245], [470, 180], [580, 260], [700, 175], [820, 250], [960, 205]]
    .forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(960, 350); ctx.lineTo(0, 350); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col2;
  ctx.beginPath(); ctx.moveTo(0, 335);
  [[120, 262], [240, 315], [360, 245], [500, 318], [640, 250], [780, 318], [960, 270]]
    .forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(960, 390); ctx.lineTo(0, 390); ctx.closePath(); ctx.fill();
}
function tree(ctx, x, y, s, c1, c2) {
  R(ctx, x - 4 * s, y - 26 * s, 8 * s, 26 * s, '#3a2a1e');
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x, y - 40 * s, 22 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c2;
  ctx.beginPath(); ctx.arc(x - 8 * s, y - 32 * s, 14 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 10 * s, y - 46 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
}
function cloud(ctx, x, y, s, a) {
  ctx.globalAlpha = a; ctx.fillStyle = '#e8f0f8';
  ctx.beginPath(); ctx.arc(x, y, 16 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 20 * s, y + 4 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 18 * s, y + 6 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}
function pillar(ctx, x, y, w, h, c1, c2) {
  R(ctx, x, y, w, h, c1);
  R(ctx, x, y, w * 0.22, h, c2);
  R(ctx, x + w * 0.78, y, w * 0.22, h, shade(c1, -14));
  R(ctx, x - 6, y - 10, w + 12, 12, shade(c1, 8));
  R(ctx, x - 6, y + h, w + 12, 12, shade(c1, 8));
}
function plankFence(ctx, x1, x2, y) {
  for (let x = x1; x < x2; x += 46) R(ctx, x, y, 7, 40, '#7a5a34');
  R(ctx, x1, y + 10, x2 - x1, 5, '#8a6a3e');
  R(ctx, x1, y + 26, x2 - x1, 5, '#8a6a3e');
}
function well(ctx, x, y) {
  R(ctx, x - 32, y, 64, 30, '#5a5a60');
  R(ctx, x - 28, y + 4, 56, 22, '#3a3a40');
  ctx.fillStyle = '#2a5a7a'; ctx.beginPath(); ctx.ellipse(x, y + 8, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  R(ctx, x - 36, y - 46, 6, 48, '#6a4a2a'); R(ctx, x + 30, y - 46, 6, 48, '#6a4a2a');
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x - 36, y - 46); ctx.lineTo(x, y - 70); ctx.lineTo(x + 30, y - 46); ctx.stroke();
}
function signboard(ctx, x, y, text, c) {
  R(ctx, x - 4, y, 8, 46, '#5a3a1e');
  R(ctx, x - 56, y - 40, 112, 40, '#4a3423');
  R(ctx, x - 50, y - 34, 100, 28, c || '#6a4a2a');
  ctx.fillStyle = '#f0e0b0'; ctx.textAlign = 'center';
  ctx.font = '600 20px "Songti SC","STSong",serif';
  ctx.fillText(text, x, y - 14);
}
function scarecrow(ctx, x, y) {
  R(ctx, x - 3, y - 40, 6, 60, '#6a4a2a');
  R(ctx, x - 26, y - 26, 52, 5, '#6a4a2a');
  ctx.fillStyle = '#8a7448'; ctx.beginPath(); ctx.arc(x, y - 52, 13, 0, Math.PI * 2); ctx.fill();
  R(ctx, x - 9, y - 56, 5, 5, '#1a1a1a'); R(ctx, x + 5, y - 56, 5, 5, '#1a1a1a');
  R(ctx, x - 22, y - 24, 14, 26, '#7a5a34'); R(ctx, x + 8, y - 24, 14, 26, '#7a5a34');
}

// ---------- 主角（方块兜底：素材未加载完时使用）----------
function drawHeroBlock(ctx, x, y, o) {
  const seated = o.seated, facing = o.facing || 1, walking = o.walking, ph = o.phase || 0;
  const sc = o.scale || 1;
  const P = o.pal || { robe1: '#e8efe9', robe2: '#b8c8be', robe3: '#8a9a92', hair: '#1a2226', hair2: '#2a363c', skin: '#e9d7c2', skin2: '#d2b69b', trim: '#c9a961' };
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing * sc, sc);
  const sw = walking ? Math.sin(ph * 7) : 0;
  if (seated) {
    R(ctx, -26, -22, 52, 22, P.robe2);
    R(ctx, -30, -20, 60, 6, P.robe3);
    R(ctx, -14, -22, 6, 10, P.skin); R(ctx, 8, -22, 6, 10, P.skin);
    R(ctx, -17, -56, 34, 36, P.robe1);
    R(ctx, -19, -52, 38, 6, P.trim);
    R(ctx, -13, -46, 26, 26, P.robe2);
    R(ctx, -24, -40, 9, 20, P.robe1); R(ctx, 15, -40, 9, 20, P.robe1);
    R(ctx, -25, -24, 11, 7, P.skin); R(ctx, 14, -24, 11, 7, P.skin);
  } else {
    R(ctx, -11 + sw * 3, -26, 9, 26, P.robe3); R(ctx, 2 - sw * 3, -26, 9, 26, P.robe3);
    R(ctx, -13 + sw * 3, -4, 13, 5, '#2a2420'); R(ctx, 0 - sw * 3, -4, 13, 5, '#2a2420');
    R(ctx, -15, -58, 30, 34, P.robe1);
    R(ctx, -17, -54, 34, 6, P.trim);
    R(ctx, -11, -50, 22, 26, P.robe2);
    R(ctx, -22, -52, 8, 22, P.robe1); R(ctx, 14, -52, 8, 22, P.robe1);
    R(ctx, -23, -32, 10, 8, P.skin); R(ctx, 13, -32, 10, 8, P.skin);
  }
  R(ctx, -4, -62, 8, 6, P.skin2);
  R(ctx, -11, -86, 22, 24, P.skin);
  R(ctx, -13, -92, 26, 12, P.hair);
  R(ctx, -13, -92, 26, 5, P.hair2);
  R(ctx, -3, -100, 6, 8, P.hair);
  R(ctx, -1, -102, 3, 4, P.trim);
  R(ctx, -8, -80, 3, 3, '#241f1d'); R(ctx, 4, -80, 3, 3, '#241f1d');
  R(ctx, -2, -72, 4, 2, 'rgba(186,104,96,.55)');
  R(ctx, -17, -56, 6, 8, P.trim); R(ctx, 11, -56, 6, 8, P.trim);
  ctx.restore();
}

// ---------- 主角：优先绘制真像素精灵（站立呼吸 / 两帧行走 / 打坐吐纳）----------
// 缩放取 2：1 个精灵像素 = 2 场景像素 = 1 个缓冲像素，放大后最锐利、不糊
export function drawHero(ctx, x, y, o) {
  const seated = o.seated, facing = o.facing || 1, walking = o.walking, ph = o.phase || 0;
  const k = o.scale || 1;
  const s = k * 2;
  pxShadow(ctx, x, y, 30 * k);
  let im = null, bob = 0;
  if (seated) {
    im = SPR.heroSit;
    bob = Math.sin(ph * 1.5) * 1.2;                        // 打坐：缓慢吐纳
  } else if (walking) {
    im = SPR.heroWalk[Math.floor(ph * 7) % SPR.heroWalk.length];
    bob = -Math.abs(Math.sin(ph * 7 * Math.PI)) * 2.2;     // 步伐起伏
  } else {
    im = SPR.heroIdle;
    bob = Math.sin(ph * 1.7) * 0.8;                        // 站立呼吸
  }
  if (im && ready(im) && blit(ctx, im, x, y, s, facing, bob)) return;
  drawHeroBlock(ctx, x, y, o);
}

const ATTENDANT_PAL = {
  robe1: '#dfe7e3', robe2: '#a8bab3', robe3: '#7c908b',
  hair: '#1a2226', hair2: '#2a363c', skin: '#e9d7c2', skin2: '#d2b69b', trim: '#9ad9c3'
};

// ---------- 道童：自然随机漫步（不再是机械来回）----------
// 每个区域一套独立状态机：走去某点 → 站一会儿 → 左右张望 → 再走去下一个点
// 速度、停留时长、张望次数都随机，且每个区域起始相位不同，不会整齐划一
const ATT_ZONE = {
  cave:    { x0: 175, x1: 800, y0: 446, y1: 470 },
  field:   { x0: 165, x1: 825, y0: 530, y1: 556 },
  pets:    { x0: 495, x1: 800, y0: 464, y1: 508 },
  sword:   { x0: 185, x1: 440, y0: 462, y1: 484 },
  alchemy: { x0: 145, x1: 440, y0: 462, y1: 484 },
  forge:   { x0: 175, x1: 430, y0: 462, y1: 484 },
  library: { x0: 115, x1: 530, y0: 462, y1: 486 },
  rift:    { x0: 245, x1: 770, y0: 462, y1: 486 }
};

const ATT = {};

function attInit(z, t) {
  const r = Math.random;
  const s = {
    x: z.x0 + (z.x1 - z.x0) * r(), y: (z.y0 + z.y1) / 2,
    tx: 0, ty: 0,
    mode: 'idle', until: t + 0.2 + r() * 1.2,
    facing: r() < 0.5 ? 1 : -1, spd: 26,
    looks: 0, lookAt: 0, lastT: t, ph: r() * 6.28
  };
  return s;
}

export function drawAttendant(ctx, area, t) {
  const z = ATT_ZONE[area] || ATT_ZONE.cave;
  let s = ATT[area];
  if (!s) s = ATT[area] = attInit(z, t);
  const dt = Math.max(0, Math.min(0.08, t - s.lastT));
  s.lastT = t;

  if (s.mode === 'walk') {
    const dx = s.tx - s.x, dy = s.ty - s.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2.5) {
      s.x = s.tx; s.y = s.ty;
      s.mode = 'idle';
      s.until = t + 0.9 + Math.random() * 2.4;
      if (Math.random() < 0.5) {                 // 到点后有时东张西望
        s.looks = 1 + (Math.random() * 2 | 0);
        s.lookAt = t + 0.5 + Math.random() * 1.0;
      }
    } else {
      const step = Math.min(d, s.spd * dt);
      s.x += dx / d * step;
      s.y += dy / d * step;
      if (Math.abs(dx) > 1.5) s.facing = dx > 0 ? 1 : -1;
    }
  } else {
    if (s.looks > 0 && t >= s.lookAt) {          // 张望：转身看另一边
      s.facing = -s.facing;
      s.looks--;
      s.lookAt = t + 0.35 + Math.random() * 0.5;
      if (s.looks === 0) s.until = t + 0.45 + Math.random() * 1.6;
    } else if (s.looks === 0 && t >= s.until) {  // 溜达到下一个点
      s.tx = z.x0 + (z.x1 - z.x0) * Math.random();
      s.ty = z.y0 + (z.y1 - z.y0) * Math.random();
      s.spd = 22 + Math.random() * 15;
      s.mode = 'walk';
    }
  }

  const walking = s.mode === 'walk';
  const sc = 1.5;                                 // 道童比主角矮小
  pxShadow(ctx, s.x, s.y, 22);
  const im = walking ? SPR.attWalk : SPR.attIdle;
  const bob = walking
    ? -Math.abs(Math.sin(t * 9 + s.ph)) * 2.0
    : Math.sin(t * 1.6 + s.ph) * 0.9 + (s.looks > 0 ? Math.sin(t * 9) * 0.5 : 0);
  if (!(im && ready(im) && blit(ctx, im, s.x, s.y, sc, s.facing, bob))) {
    drawHeroBlock(ctx, s.x, s.y, {
      seated: false, facing: s.facing, walking: walking,
      phase: t, scale: 0.62, pal: ATTENDANT_PAL
    });
  }
}

// ---------- 灵草（7 种，生长阶段 0-3）----------
export function drawHerb(ctx, x, y, id, stage, t) {
  const h = HERB_MAP[id]; if (!h) return;
  const c = h.color;
  const g = [0.4, 0.62, 0.85, 1][Math.max(0, Math.min(3, stage))];
  const ripe = stage >= 3;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(g, g);
  R(ctx, -11, -3, 22, 6, '#3a2a1e');
  const pulse = ripe ? 0.6 + 0.4 * Math.sin(t * 3) : 1;
  switch (id) {
    case 'ninglu':
      R(ctx, -1, -30, 2, 30, c[1]);
      R(ctx, -1, -22, -11, -6, c[1]); R(ctx, -12, -26, 10, 4, c[2]);
      R(ctx, 2, -18, 11, -6, c[1]); R(ctx, 2, -22, 10, 4, c[2]);
      if (stage >= 2) { ctx.globalAlpha = pulse; ctx.fillStyle = c[3]; ctx.beginPath(); ctx.arc(0, -33, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      break;
    case 'chiyang':
      R(ctx, -6, -16, 12, 16, c[1]); R(ctx, -8, -12, 16, 5, c[2]);
      for (let i = 0; i < 3; i++) {
        const ly = -30 - i * 6;
        R(ctx, -13 + i, ly, 10, 4, c[1]); R(ctx, -13 + i, ly - 2, 8, 3, c[2]);
        R(ctx, 3 - i, ly + 2, 10, 4, c[1]);
      }
      if (stage >= 2) R(ctx, -3, -22, 6, 6, c[3]);
      break;
    case 'yuehua':
      R(ctx, -2, -18, 4, 18, c[1]);
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(0, -22, 13, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c[3]; ctx.beginPath(); ctx.ellipse(0, -25, 9, 5, 0, Math.PI, 0); ctx.fill();
      if (ripe) { ctx.globalAlpha = pulse; ctx.fillStyle = c[3]; [[-6, -26], [2, -28], [7, -23]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1; }
      break;
    case 'qixing':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const lx = Math.cos(a) * 11, ly = Math.sin(a) * 5 - 10;
        ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(lx, ly, 6, 3.4, a, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(lx, ly - 1, 3.4, 1.8, a, 0, Math.PI * 2); ctx.fill();
      }
      if (stage >= 2) { ctx.globalAlpha = pulse; ctx.fillStyle = c[3]; ctx.beginPath(); ctx.arc(0, -12, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      break;
    case 'longxue':
      ctx.strokeStyle = c[1]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(12, -14, 0, -30); ctx.stroke();
      R(ctx, -10, -20, 8, 4, c[2]); R(ctx, 4, -26, 8, 4, c[2]);
      if (stage >= 2) { R(ctx, -1, -22, 5, 5, c[2]); R(ctx, -6, -14, 5, 5, c[2]); if (ripe) { ctx.globalAlpha = pulse; R(ctx, -1, -22, 5, 5, c[3]); ctx.globalAlpha = 1; } }
      break;
    case 'youming':
      R(ctx, -1, -26, 2, 26, c[1]);
      for (const s of [-1, 1]) { ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(s * 7, -30, 6, 3, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(0, -34, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c[3]; ctx.beginPath(); ctx.ellipse(0, -36, 2.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      if (ripe) { ctx.globalAlpha = 0.35 * pulse; ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(0, -20, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      break;
    case 'jiuzhuan':
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(0, -6, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      for (let ring = 0; ring < 3; ring++) {
        const n = 6 + ring * 2, rr = 13 - ring * 3;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + ring * 0.4;
          ctx.fillStyle = ring === 2 ? c[3] : (ring === 1 ? c[2] : c[1]);
          ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr, -20 - ring * 5 + Math.sin(a) * 4, 5, 3, a, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (ripe) { ctx.globalAlpha = 0.5 * pulse; ctx.fillStyle = c[3]; ctx.beginPath(); ctx.arc(0, -26, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      break;
  }
  ctx.restore();
}

// ---------- 灵宠像素形象 ----------
export function drawPetCritter(ctx, x, y, id, t) {
  const p = PET_MAP[id]; if (!p) return;
  const c = p.color;
  const bob = Math.sin(t * 2.4 + x) * 2;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y) + bob);
  switch (id) {
    case 'fox':
      R(ctx, -13, -12, 26, 12, c[1]); R(ctx, -18, -22, 12, 12, c[1]);
      R(ctx, -20, -28, 4, 7, c[0]); R(ctx, -10, -28, 4, 7, c[0]);
      R(ctx, -16, -20, 3, 3, '#1a1a1a'); R(ctx, -9, -20, 3, 3, '#1a1a1a');
      R(ctx, 12, -20, 12, 6, c[2]); R(ctx, -10, 0, 5, 5, c[0]); R(ctx, 6, 0, 5, 5, c[0]); break;
    case 'crane':
      R(ctx, -12, -10, 24, 12, c[1]); R(ctx, -16, -30, 7, 22, c[2]); R(ctx, -20, -36, 12, 9, c[2]);
      R(ctx, -10, -36, 6, 4, '#d94f3d'); R(ctx, 6, -26, 16, 9, c[3]);
      R(ctx, -6, 2, 5, 8, '#c98b3c'); R(ctx, 3, 2, 5, 8, '#c98b3c'); break;
    case 'turtle':
      R(ctx, -16, -14, 32, 12, c[1]);
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(0, -16, 17, 11, 0, Math.PI, 0); ctx.fill();
      R(ctx, 14, -12, 10, 8, c[2]); R(ctx, 20, -9, 3, 3, '#1a1a1a');
      R(ctx, -18, 0, 7, 5, c[1]); R(ctx, 10, 0, 7, 5, c[1]); break;
    case 'qilin':
      R(ctx, -15, -14, 30, 14, c[1]); R(ctx, -19, -26, 13, 13, c[1]); R(ctx, -14, -34, 4, 9, c[3]);
      R(ctx, -16, -22, 3, 3, '#1a1a1a'); R(ctx, -8, -22, 3, 3, '#1a1a1a');
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(-19, -30, 8, 6, 0.4, 0, Math.PI * 2); ctx.fill();
      R(ctx, 14, -18, 12, 7, c[2]); R(ctx, -11, 0, 6, 6, c[0]); R(ctx, 6, 0, 6, 6, c[0]); break;
    case 'qingluan':
      R(ctx, -12, -10, 24, 12, c[1]); R(ctx, -15, -28, 7, 20, c[2]); R(ctx, -19, -34, 12, 9, c[2]);
      R(ctx, 4, -30, 18, 11, c[3]); R(ctx, 12, -22, 12, 7, c[2]);
      R(ctx, -6, 2, 5, 8, '#5ab8d8'); R(ctx, 3, 2, 5, 8, '#5ab8d8'); break;
    case 'baize':
      R(ctx, -16, -14, 32, 14, c[1]); R(ctx, -20, -26, 14, 13, c[2]); R(ctx, -16, -36, 4, 11, c[3]);
      R(ctx, -17, -22, 3, 3, '#1a1a1a'); R(ctx, -8, -22, 3, 3, '#1a1a1a');
      R(ctx, 14, -18, 12, 7, c[2]); R(ctx, -12, 0, 6, 6, c[0]); R(ctx, 7, 0, 6, 6, c[0]); break;
  }
  ctx.restore();
}

// ---------- 灵田地块（室外 QQ 农场式 4×2）----------
function plotRect(i) {
  const col = i % 4, row = Math.floor(i / 4);
  return { x: 226 + col * 152, y: 392 + row * 88 };
}

// ---------- 各区域大场景 ----------
function drawCave(ctx, S, t) {
  // 洞府内景：宏大石殿
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1018'); g.addColorStop(0.55, '#111a26'); g.addColorStop(1, '#0d1420');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stoneWall(ctx, 0, 0, W, 430, '#141c28', 3);
  // 洞顶钟乳
  ctx.fillStyle = '#0e1622';
  for (let i = 0; i < 11; i++) {
    const sx = 40 + i * 88, sh = 46 + (i % 4) * 26;
    ctx.beginPath(); ctx.moveTo(sx - 14, 0); ctx.lineTo(sx + 14, 0); ctx.lineTo(sx, sh); ctx.closePath(); ctx.fill();
  }
  // 立柱
  pillar(ctx, 96, 120, 34, 330, '#1c2634', '#26303e');
  pillar(ctx, 830, 120, 34, 330, '#1c2634', '#26303e');
  pillar(ctx, 250, 150, 26, 300, '#182230', '#222c3a');
  pillar(ctx, 684, 150, 26, 300, '#182230', '#222c3a');
  ground(ctx, 430, '#1a2230', '#232d3d', 7);
  for (let i = 0; i < 6; i++) R(ctx, 0, 452 + i * 26, W, 2, 'rgba(120,150,180,.06)');
  // 匾额
  R(ctx, 386, 54, 188, 50, '#241a12');
  R(ctx, 394, 62, 172, 34, '#3a2a1a');
  ctx.fillStyle = '#d9b46a'; ctx.textAlign = 'center';
  ctx.font = '600 24px "Songti SC","STSong",serif';
  ctx.fillText('清心洞', 480, 88);
  // 石阶祭台
  R(ctx, 360, 400, 240, 16, '#202a38');
  R(ctx, 380, 416, 200, 14, '#1a2432');
  // 香炉
  R(ctx, 176, 372, 40, 30, '#3a3a42'); R(ctx, 182, 364, 28, 10, '#4a4a52');
  ctx.strokeStyle = 'rgba(200,210,230,.16)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(196, 364);
    ctx.quadraticCurveTo(196 + Math.sin(t * 1.1 + i) * 14, 338 - i * 12, 196 + Math.sin(t + i * 2) * 20, 312 - i * 16);
    ctx.stroke();
  }
  // 宫灯
  [262, 718].forEach((lx, i) => {
    R(ctx, lx - 3, 140, 6, 66, '#2a2418');
    R(ctx, lx - 16, 202, 32, 36, '#8a2a22');
    R(ctx, lx - 13, 207, 26, 26, '#e0a03c');
    ctx.globalAlpha = 0.30 + 0.12 * Math.sin(t * 2 + i);
    ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.arc(lx, 220, 36, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
  // 蒲团
  const cx = AREA_SPOTS.cave.x, cy = AREA_SPOTS.cave.y;
  ctx.fillStyle = '#5a4a2e'; ctx.beginPath(); ctx.ellipse(cx, cy + 10, 52, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a6742'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, 44, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a7448'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
  // 玉简架
  R(ctx, 786, 320, 96, 9, '#3a2a1a');
  for (let i = 0; i < 6; i++) R(ctx, 794 + i * 14, 258, 9, 62, i % 2 ? '#c9b98a' : '#a8c8b8');
}

function drawField(ctx, S, t) {
  // 室外灵田：QQ 农场式大田
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#2f5c86'); g.addColorStop(1, '#8fb0c4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 360);
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(846, 88, 38, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.28; ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(846, 88, 62, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  cloud(ctx, 150 + Math.sin(t * 0.08) * 60, 96, 1.1, 0.75);
  cloud(ctx, 520 + Math.sin(t * 0.06 + 2) * 70, 70, 0.85, 0.6);
  cloud(ctx, 760 + Math.sin(t * 0.05 + 4) * 50, 120, 1.0, 0.5);
  mountains(ctx, t, '#3f6a52', '#2c5040');
  R(ctx, 0, 330, W, H - 330, '#33652f');
  for (let i = 0; i < 90; i++) {
    const gx = (i * 137) % W, gy = 340 + ((i * 71) % 260);
    R(ctx, gx, gy, 5, 7, i % 3 ? '#3c7238' : '#437d3e');
  }
  tree(ctx, 60, 372, 0.9, '#2a5a32', '#3a7a42');
  tree(ctx, 900, 380, 1.0, '#285030', '#387a40');
  tree(ctx, 150, 358, 0.7, '#2a5a32', '#3a7a42');
  plankFence(ctx, 120, 850, 348);
  R(ctx, 150, 486, 660, 16, '#7a6242');
  for (let i = 0; i < 22; i++) R(ctx, 160 + i * 30, 488, 18, 12, '#8a7050');
  well(ctx, 862, 452);
  scarecrow(ctx, 128, 470);
  signboard(ctx, 480, 366, '灵  田', '#5a4029');
  for (let i = 0; i < 8; i++) {
    const p = plotRect(i);
    const unlocked = i < S.plotCount;
    R(ctx, p.x - 62, p.y - 20, 124, 44, unlocked ? '#4a3423' : '#2b2b2b');
    R(ctx, p.x - 57, p.y - 16, 114, 36, unlocked ? '#5c4128' : '#333');
    for (let k = 0; k < 10; k++) {
      const bx = p.x - 54 + (k % 5) * 23, by = p.y - 12 + Math.floor(k / 5) * 16;
      R(ctx, bx, by, 19, 12, hash(bx, by) > 0.5 ? '#6b4c2f' : '#4a3423');
    }
    if (!unlocked) {
      ctx.fillStyle = 'rgba(220,220,220,.28)'; ctx.textAlign = 'center';
      ctx.font = '13px "PingFang SC",sans-serif';
      ctx.fillText('未开垦', p.x, p.y + 6);
      continue;
    }
    const pl = S.plots[i];
    if (pl && pl.herb) {
      const total = pl.total || 1;
      const prog = 1 - Math.max(0, Math.min(1, pl.left / total));
      const stage = prog >= 1 ? 3 : (prog > 0.66 ? 2 : (prog > 0.33 ? 1 : 0));
      drawHerb(ctx, p.x, p.y + 6, pl.herb, stage, t);
      R(ctx, p.x - 32, p.y + 24, 64, 6, 'rgba(0,0,0,.55)');
      R(ctx, p.x - 32, p.y + 24, 64 * prog, 6, prog >= 1 ? '#d9b46a' : '#79c9a3');
      if (prog >= 1) {
        ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.font = '12px "PingFang SC",sans-serif';
        ctx.fillText('可收', p.x, p.y + 20);
      }
    } else {
      ctx.fillStyle = 'rgba(230,230,230,.30)'; ctx.textAlign = 'center';
      ctx.font = '13px "PingFang SC",sans-serif';
      ctx.fillText('空地', p.x, p.y + 6);
    }
  }
}

function drawPets(ctx, S, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#3d6a92'); g.addColorStop(1, '#a8c4d4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 360);
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(150, 92, 30, 0, Math.PI * 2); ctx.fill();
  cloud(ctx, 420 + Math.sin(t * 0.07) * 50, 84, 1.0, 0.6);
  cloud(ctx, 700 + Math.sin(t * 0.05 + 3) * 60, 112, 0.9, 0.5);
  mountains(ctx, t, '#4a7460', '#36604c');
  R(ctx, 0, 320, W, H - 320, '#2f5a33');
  for (let i = 0; i < 100; i++) {
    const gx = (i * 113) % W, gy = 330 + ((i * 61) % 270);
    R(ctx, gx, gy, 5, 8, i % 3 ? '#37663a' : '#407043');
  }
  tree(ctx, 96, 386, 1.25, '#25502d', '#357a3c');
  tree(ctx, 848, 400, 1.4, '#234c2b', '#337238');
  tree(ctx, 760, 356, 0.95, '#25502d', '#357a3c');
  tree(ctx, 200, 344, 0.8, '#25502d', '#357a3c');
  ctx.fillStyle = '#2a5a7a'; ctx.beginPath(); ctx.ellipse(216, 486, 96, 36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a80a4'; ctx.beginPath(); ctx.ellipse(216, 481, 84, 29, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 5; i++) R(ctx, 188 + i * 18, 476 + Math.sin(t * 1.5 + i) * 5, 11, 4, '#63add0');
  R(ctx, 380, 396, 132, 10, '#6a4a2a');
  R(ctx, 390, 350, 8, 48, '#6a4a2a'); R(ctx, 494, 350, 8, 48, '#6a4a2a');
  ctx.fillStyle = '#8a3a30'; ctx.beginPath(); ctx.moveTo(360, 350); ctx.lineTo(446, 316); ctx.lineTo(532, 350); ctx.closePath(); ctx.fill();
  R(ctx, 560, 470, 88, 26, '#6a4a2a'); R(ctx, 568, 476, 72, 16, '#8a6a3a');
  R(ctx, 700, 452, 130, 18, '#7a7a72'); R(ctx, 712, 470, 106, 12, '#5a5a52');
  const petList = S.pets || [];
  for (let i = 0; i < petList.length; i++) {
    const p = petList[i];
    const baseX = 640 + (i % 2 === 0 ? -80 : 80);
    const baseY = 470 + Math.floor(i / 2) * 40;
    const wander = Math.sin(t * 0.85 + i * 2.1) * 34;
    drawPetCritter(ctx, baseX + wander, baseY, p.id, t);
  }
  if (!petList.length) {
    ctx.fillStyle = 'rgba(235,235,235,.45)'; ctx.textAlign = 'center';
    ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText('尚无灵宠结契 · 机缘未至', 640, 470);
  }
  signboard(ctx, 480, 350, '灵兽园', '#4a6a3a');
}

function drawSword(ctx, S, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#22344a'); g.addColorStop(1, '#7a8a9a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 360);
  mountains(ctx, t, '#2c4054', '#1e2e3c');
  R(ctx, 0, 340, W, H - 340, '#4c4c56');
  for (let i = 0; i < 9; i++) R(ctx, 0, 340 + i * 32, W, 2, '#3c3c46');
  for (let i = 0; i < 15; i++) R(ctx, i * 66, 340, 2, H - 340, '#3c3c46');
  R(ctx, 60, 330, 840, 12, '#5a5a64');
  [[742, 300], [812, 300]].forEach((d) => {
    R(ctx, d[0], d[1], 18, 150, '#6a4a2a');
    R(ctx, d[0] - 7, d[1] + 140, 32, 14, '#5a3a1e');
    R(ctx, d[0] - 28, d[1] + 28, 74, 13, '#7a5a34');
    R(ctx, d[0] - 38, d[1] + 14, 13, 28, '#7a5a34'); R(ctx, d[0] + 43, d[1] + 14, 13, 28, '#7a5a34');
  });
  R(ctx, 140, 340, 150, 11, '#5a3a1e');
  R(ctx, 150, 296, 9, 48, '#5a3a1e'); R(ctx, 272, 296, 9, 48, '#5a3a1e');
  for (let i = 0; i < 5; i++) { R(ctx, 168 + i * 21, 302, 4, 40, '#b8c8d8'); R(ctx, 164 + i * 21, 342, 12, 5, '#8a6a3a'); }
  [[420, 408], [500, 408]].forEach((tg) => {
    ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(tg[0], tg[1], 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c94a3a'; ctx.beginPath(); ctx.arc(tg[0], tg[1], 21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.arc(tg[0], tg[1], 10, 0, Math.PI * 2); ctx.fill();
  });
  const swing = Math.sin(t * 2.2);
  if (swing > 0.35) {
    ctx.globalAlpha = (swing - 0.35) * 0.5;
    ctx.strokeStyle = '#cfe9ff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(AREA_SPOTS.sword.x, AREA_SPOTS.sword.y - 44, 66, -0.7, 1.0); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  signboard(ctx, 480, 344, '练剑坪', '#5a5a64');
}

function drawAlchemy(ctx, S, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a120c'); g.addColorStop(1, '#2c1e14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stoneWall(ctx, 0, 0, W, 420, '#241a12', 5);
  ground(ctx, 420, '#2a2018', '#3a2a1e', 11);
  [[76, 150], [252, 150]].forEach((sh, si) => {
    const bx = sh[0], bw = sh[1];
    for (let r = 0; r < 2; r++) {
      R(ctx, bx, 132 + r * 76, bw, 10, '#4a3423');
      for (let i = 0; i < 7; i++) {
        const jx = bx + 12 + i * 20, jy = 146 + r * 76;
        R(ctx, jx, jy, 15, 24, ['#7a5a34', '#5a7a5a', '#7a5a7a', '#5a5a7a'][(i + r + si) % 4]);
        R(ctx, jx + 4, jy - 5, 7, 6, '#3a2a1a');
      }
    }
  });
  for (let i = 0; i < 6; i++) {
    const hx = 520 + i * 46;
    R(ctx, hx, 52, 3, 54, '#3a2a1a');
    drawHerb(ctx, hx, 108, HERBS[i % HERBS.length].id, 3, t);
  }
  const cx = 648, cy = 452;
  R(ctx, cx - 62, cy - 12, 124, 18, '#25252c');
  ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(cx, cy - 16, 74, 26, 0, 0, Math.PI * 2); ctx.fill();
  R(ctx, cx - 68, cy - 36, 136, 30, '#4a4a56');
  R(ctx, cx - 74, cy - 44, 148, 12, '#5a5a68');
  ctx.fillStyle = '#25252c'; ctx.beginPath(); ctx.ellipse(cx, cy - 44, 58, 17, 0, 0, Math.PI * 2); ctx.fill();
  R(ctx, cx - 50, cy - 30, 100, 5, '#6a5a3a');
  R(ctx, cx - 54, cy + 4, 14, 16, '#25252c'); R(ctx, cx - 7, cy + 6, 14, 14, '#25252c'); R(ctx, cx + 40, cy + 4, 14, 16, '#25252c');
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 4);
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(cx, cy - 44, 40, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  R(ctx, 830, 300, 100, 9, '#4a3423');
  for (let i = 0; i < 5; i++) R(ctx, 842 + i * 18, 268, 14, 32, ['#c9a961', '#79c9a3', '#e4833f'][i % 3]);
}

function drawForge(ctx, S, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#140f0c'); g.addColorStop(1, '#261814');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stoneWall(ctx, 0, 0, W, 420, '#1e1610', 9);
  ground(ctx, 420, '#241a14', '#2e221a', 13);
  const fx2 = 748, fy = 404;
  R(ctx, fx2 - 60, fy - 24, 120, 66, '#2a2420');
  R(ctx, fx2 - 52, fy - 18, 104, 34, '#191512');
  ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.ellipse(fx2, fy + 2, 48, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.ellipse(fx2, fy, 30, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t * 5);
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(fx2, fy, 72, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  R(ctx, fx2 + 38, 288, 30, 82, '#2a2420');
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#c8c8d0';
    ctx.beginPath(); ctx.arc(fx2 + 52 + Math.sin(t + i) * 16, 270 - i * 34, 16 + i * 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  R(ctx, 288, 424, 100, 18, '#3a3a42');
  R(ctx, 312, 442, 54, 32, '#2a2a30');
  R(ctx, 288, 474, 100, 14, '#3a3a42');
  ctx.fillStyle = '#4a4a52'; ctx.beginPath(); ctx.ellipse(338, 424, 50, 11, 0, 0, Math.PI * 2); ctx.fill();
  R(ctx, 118, 404, 76, 44, '#5a3a1e'); R(ctx, 130, 416, 54, 22, '#6a4a2a');
  R(ctx, 540, 322, 150, 11, '#4a3423');
  for (let i = 0; i < 5; i++) R(ctx, 558 + i * 28, 288, 5, 38, '#a8b8c8');
  for (let i = 0; i < 14; i++) {
    const sp = (t * 60 + i * 37) % 110;
    R(ctx, fx2 + Math.sin(i * 2 + t) * 34, fy - sp, 3, 3, '#ffb03a');
  }
  R(ctx, 430, 452, 46, 40, '#4a3a26');
  ctx.fillStyle = '#2a5a7a'; ctx.beginPath(); ctx.ellipse(453, 454, 21, 7, 0, 0, Math.PI * 2); ctx.fill();
}

function drawLibrary(ctx, S, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#15121f'); g.addColorStop(1, '#241e30');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stoneWall(ctx, 0, 0, W, 420, '#1b1727', 17);
  ground(ctx, 420, '#241e2e', '#2c2640', 19);
  [[56, 150], [312, 150], [712, 190]].forEach((sh, si) => {
    const bx = sh[0], bw = sh[1];
    for (let r = 0; r < 3; r++) R(ctx, bx, 126 + r * 74, bw, 10, '#4a3423');
    R(ctx, bx, 126, 8, 236, '#3a2a1a'); R(ctx, bx + bw - 8, 126, 8, 236, '#3a2a1a');
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < Math.floor(bw / 17); i++) {
        const jx = bx + 12 + i * 16, jy = 138 + r * 74;
        R(ctx, jx, jy, 12, 62, ['#8a6a3a', '#5a7a5a', '#7a5a7a', '#5a5a7a', '#8a5a4a'][(i + r + si) % 5]);
        R(ctx, jx + 2, jy + 7, 8, 3, '#d9c98a');
      }
    }
  });
  for (let i = 0; i < 9; i++) {
    const gx = 480 + Math.sin(t * 0.7 + i * 0.9) * 150;
    const gy = 176 + Math.cos(t * 0.5 + i * 1.3) * 66;
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 2 + i);
    R(ctx, gx, gy, 9, 22, ['#a8e0c8', '#c9d9f0', '#f0d9a8'][i % 3]);
    ctx.globalAlpha = 1;
  }
  R(ctx, 540, 444, 200, 13, '#5a3a1e');
  R(ctx, 552, 457, 13, 52, '#4a2e18'); R(ctx, 716, 457, 13, 52, '#4a2e18');
  R(ctx, 590, 424, 68, 18, '#d9c98a');
  ctx.fillStyle = '#c9a961'; ctx.textAlign = 'center'; ctx.font = '14px "Songti SC",serif';
  ctx.fillText('清心', 624, 438);
  R(ctx, 452, 404, 8, 44, '#3a2a1a');
  ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 3);
  ctx.fillStyle = '#ffd08a'; ctx.beginPath(); ctx.arc(456, 396, 34, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  signboard(ctx, 480, 344, '藏经阁', '#4a3a5a');
}

function drawRift(ctx, S, t) {
  const d = DUNGEON_MAP[S.dungeonId] || DUNGEON_MAP.yaoshou;
  const c = d.color;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c[0]); g.addColorStop(0.6, c[1]); g.addColorStop(1, c[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = c[3];
    ctx.beginPath(); ctx.arc(110 + i * 165, 116 + Math.sin(t * 0.4 + i) * 32, 42 + i * 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 8; i++) {
    const rx = 40 + i * 126, ry = 268 + Math.sin(t * 0.6 + i * 1.7) * 28;
    R(ctx, rx, ry, 74 + (i % 3) * 22, 24, c[1]);
    R(ctx, rx + 10, ry + 22, 54 + (i % 3) * 16, 16, c[0]);
    ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(rx + 36, ry, 36 + (i % 3) * 11, 10, 0, 0, Math.PI * 2); ctx.fill();
  }
  R(ctx, 0, 424, W, H - 424, c[1]);
  for (let i = 0; i < 50; i++) R(ctx, (i * 191) % W, 434 + ((i * 97) % 176), 9, 6, c[0]);
  const px = 480, py = 412;
  ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 2);
  const rg = ctx.createRadialGradient(px, py, 6, px, py, 96);
  rg.addColorStop(0, c[3]); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(px, py, 92, 44, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c[3]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(px, py, 78, 36, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(px, py, 54, 25, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = c[3]; ctx.textAlign = 'center'; ctx.font = '600 18px "Songti SC",serif';
  ctx.fillText(d.name + ' · 第 ' + (S.dungeonFloor || 1) + ' 层', px, py + 8);
  const fl = S.dungeonFloor || 1;
  for (let i = 0; i < Math.min(5, 1 + Math.floor(fl / 3)); i++) {
    const ex = 196 + i * 168, ey = 406;
    ctx.globalAlpha = 0.78;
    R(ctx, ex - 15, ey - 44, 30, 44, c[0]);
    R(ctx, ex - 11, ey - 60, 22, 18, c[0]);
    R(ctx, ex - 8, ey - 55, 4, 4, '#e04a3a'); R(ctx, ex + 4, ey - 55, 4, 4, '#e04a3a');
    ctx.globalAlpha = 1;
  }
}

const SCENE_FN = {
  cave: drawCave, field: drawField, pets: drawPets, sword: drawSword,
  alchemy: drawAlchemy, forge: drawForge, library: drawLibrary, rift: drawRift
};

export function drawScene(ctx, area, S, t) {
  // 大场景（压迫感版）：巨物出画、单一强光源、层叠雾、四角压黑
  drawSceneHD(ctx, area, S, t, {
    AREA_SPOTS, drawHerb, drawPetCritter, plotRect,
    HERBS, PET_MAP, DUNGEON_MAP
  });
  drawAttendant(ctx, area, t);   // 道童在各区域走动
}

export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, 120, W / 2, H / 2, 620);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.55, 'rgba(0,0,0,.26)');
  g.addColorStop(0.82, 'rgba(0,0,0,.46)');
  g.addColorStop(1, 'rgba(0,0,0,.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 顶部再压一道，制造低天压顶
  const s = ctx.createLinearGradient(0, 0, 0, 150);
  s.addColorStop(0, 'rgba(0,0,0,.34)');
  s.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = s; ctx.fillRect(0, 0, W, 150);
}
