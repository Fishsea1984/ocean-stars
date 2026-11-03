// 大场景（压迫感版）：8 个区域全部重做
// 构图原则——① 主体巨物一定超出画面边界；② 只给一个强光源；③ 远景三层被雾吃掉；
// ④ 四角压纯黑前景剪影，让人物显得渺小；⑤ 每区都有"深渊/高不可测"的方向感。

import {
  vgrad, godRay, fogBand, motes, tinyCrowd, colossus, monolith,
  chain, brokenPillar, floatingRock, giantBody, giantRing,
  inkBottom, frameOccluders, depthShade, R, hash
} from './atmos.js';

const W = 960, H = 620;

// ---------- 1. 清修洞府：不见顶的巨殿 ----------
function caveHD(ctx, S, t, H2) {
  const SPOT = H2.AREA_SPOTS.cave;
  vgrad(ctx, 0, H, [[0, '#04070b'], [0.42, '#0a1119'], [0.72, '#0d1620'], [1, '#060a0f']]);
  // 穹顶拱券：向顶部收束的透视弧
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const k = i / 4;
    ctx.globalAlpha = 0.5 - k * 0.32;
    ctx.strokeStyle = '#16222f';
    ctx.lineWidth = 8 - i;
    ctx.beginPath();
    ctx.ellipse(W / 2, 470 + k * 40, 520 - k * 70, 400 - k * 60, 0, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
  }
  ctx.restore();
  // 顶部裂缝 + 天光柱
  R(ctx, 424, 0, 112, 26, '#0a1219');
  godRay(ctx, 480, 90, 300, 20, 470, 'rgba(150,196,236,.30)', 0.85, t, 6);
  // 双侧巨像（远超画面高度）
  colossus(ctx, 120, 468, 720, '#070c12', { eyes: '#4f8fb8', t: t });
  colossus(ctx, 842, 468, 720, '#070c12', { eyes: '#4f8fb8', t: t + 1.2 });
  // 巨柱
  brokenPillar(ctx, 268, 470, 64, 700, '#0b131c', '#131e2a', t);
  brokenPillar(ctx, 700, 470, 64, 700, '#0b131c', '#131e2a', t);
  // 垂链
  chain(ctx, 350, 0, 300, 13, '#1b2734', t, 0.6, 16);
  chain(ctx, 612, 0, 240, 11, '#1b2734', t, 2.4, 14);
  // 地面石台
  vgrad(ctx, 400, H, [[0, '#141d28'], [1, '#0a1017']]);
  for (let i = 0; i < 7; i++) R(ctx, 0, 404 + i * 30, W, 2, 'rgba(120,160,196,.05)');
  // 左右地裂（深渊）
  [92, 866].forEach((cxx, ci) => {
    ctx.save();
    ctx.fillStyle = '#020407';
    ctx.beginPath();
    ctx.moveTo(cxx - 66, 400);
    ctx.lineTo(cxx + 54, 404);
    ctx.lineTo(cxx + 34, H);
    ctx.lineTo(cxx - 48, H);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.5 + 0.12 * Math.sin(t * 0.9 + ci);
    const fg = ctx.createLinearGradient(0, 420, 0, H);
    fg.addColorStop(0, 'rgba(60,110,150,.20)');
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(cxx - 50, 420, 84, H - 420);
    ctx.restore();
  });
  // 祭台
  R(ctx, SPOT.x - 132, SPOT.y - 26, 264, 18, '#1a2634');
  R(ctx, SPOT.x - 108, SPOT.y - 12, 216, 14, '#131c27');
  R(ctx, SPOT.x - 82, SPOT.y + 2, 164, 12, '#0d151d');
  // 光池
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 1.4);
  const pg = ctx.createRadialGradient(SPOT.x, SPOT.y, 8, SPOT.x, SPOT.y, 220);
  pg.addColorStop(0, 'rgba(190,224,255,.85)');
  pg.addColorStop(1, 'rgba(120,170,220,0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y + 6, 220, 56, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 蒲团
  ctx.fillStyle = '#3c3220'; ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y + 8, 54, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#54462b'; ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y + 3, 45, 13, 0, 0, Math.PI * 2); ctx.fill();
  // 匾额（极高处，需要仰头）
  R(ctx, 402, 128, 156, 40, '#20170f');
  ctx.fillStyle = '#b9a06a'; ctx.textAlign = 'center';
  ctx.font = '600 20px "Songti SC","STSong",serif';
  ctx.fillText('清 心 洞', 480, 155);
  // 香炉（极小，做尺度对照）
  R(ctx, 596, 452, 22, 18, '#2c2c34'); R(ctx, 599, 446, 16, 6, '#3a3a44');
  ctx.strokeStyle = 'rgba(210,222,238,.18)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(607, 446);
    ctx.quadraticCurveTo(607 + Math.sin(t * 0.9 + i) * 16, 414 - i * 14, 607 + Math.sin(t * 0.7 + i * 2) * 26, 380 - i * 18);
    ctx.stroke();
  }
  // 尘 + 雾 + 压边
  motes(ctx, t, 40, '#cfe4ff', 0.5, 60, 460, 3);
  fogBand(ctx, 486, 190, 'rgba(96,140,180,.13)', 0.7, t, 2);
  depthShade(ctx, 0, 200, 'rgba(2,5,9,.85)', 1);
  frameOccluders(ctx, t, '#020408', 1);
}

// ---------- 2. 灵田：云海之上的巨田 ----------
function fieldHD(ctx, S, t, H2) {
  const { drawHerb, plotRect, HERBS } = H2;
  vgrad(ctx, 0, 400, [[0, '#101b26'], [0.35, '#26384a'], [0.72, '#5c7488'], [1, '#8ea2ae']]);
  // 压顶乌云
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 173 + t * 4) % (W + 320)) - 160;
    ctx.globalAlpha = 0.55 - i * 0.03;
    ctx.fillStyle = i % 2 ? '#0e1721' : '#16232f';
    ctx.beginPath();
    ctx.ellipse(cx, 26 + (i % 3) * 34, 190 + (i % 4) * 40, 54 + (i % 3) * 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // 云隙光
  godRay(ctx, 700, 120, 420, 40, 430, 'rgba(255,232,176,.22)', 0.9, t, 10);
  // 远景浮岛（巨大，被雾吃掉一半）
  floatingRock(ctx, 176, 214, 250, 96, '#243642', '#37505e', t, 0.4);
  floatingRock(ctx, 812, 176, 300, 120, '#1d2c38', '#2e4450', t, 2.1);
  // 浮岛垂瀑
  ctx.save();
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = '#cfe6f2';
  R(ctx, 806, 214, 7, 150); R(ctx, 828, 220, 5, 120);
  ctx.restore();
  // 三层远山
  for (let L = 0; L < 3; L++) {
    const base = 330 + L * 26, amp = 96 - L * 26;
    ctx.save();
    ctx.globalAlpha = 0.5 + L * 0.16;
    ctx.fillStyle = ['#22333f', '#2b4150', '#35505f'][L];
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, base - Math.abs(Math.sin(x * 0.006 + L * 1.7)) * amp - hash(x, L) * 18);
    }
    ctx.lineTo(W, base + 60); ctx.lineTo(0, base + 60);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    fogBand(ctx, base + 10, 90, 'rgba(150,178,194,.18)', 0.8, t, L);
  }
  // 地面（近大远小）
  vgrad(ctx, 366, H, [[0, '#3b5334'], [0.4, '#2e4429'], [1, '#1b2a1b']]);
  for (let i = 0; i < 150; i++) {
    const gy = 380 + (i * 53) % 240;
    const gx = (i * 149 + Math.sin(i) * 40) % W;
    R(ctx, gx, gy, 4 + (gy % 3), 6 + (gy % 4), i % 3 ? '#3f5c37' : '#496b3e');
  }
  // 田垄透视边线
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#6d8a5c'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + (i - 2.5) * 60, 392);
    ctx.lineTo(W / 2 + (i - 2.5) * 340, H);
    ctx.stroke();
  }
  ctx.restore();
  // 巨碑（超出顶）
  monolith(ctx, 74, 470, 78, 620, '#2a3a46', '#3d5361', '#7fd0c0', t);
  monolith(ctx, 892, 486, 62, 560, '#25333e', '#364a57', '#7fd0c0', t + 1);
  // 田块
  for (let i = 0; i < 8; i++) {
    const p = plotRect(i);
    const unlocked = i < S.plotCount;
    // 土垄投影
    ctx.globalAlpha = 0.5;
    R(ctx, p.x - 66, p.y - 16, 132, 48, '#0d140d');
    ctx.globalAlpha = 1;
    R(ctx, p.x - 62, p.y - 20, 124, 44, unlocked ? '#453022' : '#242a24');
    R(ctx, p.x - 57, p.y - 16, 114, 36, unlocked ? '#573c26' : '#2c332c');
    for (let k = 0; k < 10; k++) {
      const bx = p.x - 54 + (k % 5) * 23, by = p.y - 12 + Math.floor(k / 5) * 16;
      R(ctx, bx, by, 19, 12, hash(bx, by) > 0.5 ? '#63452a' : '#452f1f');
    }
    if (!unlocked) {
      ctx.fillStyle = 'rgba(200,210,200,.25)'; ctx.textAlign = 'center';
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
      ctx.fillStyle = 'rgba(220,226,214,.28)'; ctx.textAlign = 'center';
      ctx.font = '13px "PingFang SC",sans-serif';
      ctx.fillText('空地', p.x, p.y + 6);
    }
  }
  // 界牌 + 稻草人（小）
  R(ctx, 466, 372, 6, 54, '#2e2013');
  R(ctx, 452, 352, 82, 22, '#3a2a1a');
  ctx.fillStyle = '#d9b46a'; ctx.textAlign = 'center'; ctx.font = '600 15px "Songti SC",serif';
  ctx.fillText('灵  田', 493, 368);
  R(ctx, 128, 430, 5, 44, '#3a2a1a'); R(ctx, 108, 438, 45, 4, '#3a2a1a');
  ctx.fillStyle = '#6a5a36'; ctx.beginPath(); ctx.arc(130, 424, 9, 0, Math.PI * 2); ctx.fill();
  // 飞鸟（极小）
  ctx.save();
  ctx.globalAlpha = 0.45; ctx.strokeStyle = '#0d1620'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const bx = (t * 14 + i * 90) % (W + 120) - 60;
    const by = 150 + Math.sin(t * 0.6 + i) * 12 + i * 9;
    ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx, by - 4); ctx.lineTo(bx + 6, by); ctx.stroke();
  }
  ctx.restore();
  motes(ctx, t, 26, '#ffe9b0', 0.45, 120, 420, 5);
  fogBand(ctx, 404, 120, 'rgba(180,200,210,.16)', 0.75, t, 7);
  frameOccluders(ctx, t, '#0a1410', 3);
}

// ---------- 3. 灵兽园：巨兽骸骨围场 ----------
function petsHD(ctx, S, t, H2) {
  const { drawPetCritter, PET_MAP } = H2;
  vgrad(ctx, 0, 400, [[0, '#0b1520'], [0.5, '#1d2f36'], [1, '#40595a']]);
  // 远处巨兽剪影（伏卧，几乎不动）
  ctx.save();
  ctx.fillStyle = '#0a1418';
  ctx.beginPath();
  ctx.moveTo(700, 356);
  ctx.quadraticCurveTo(790, 300, 900, 330);
  ctx.lineTo(960, 330); ctx.lineTo(960, 400); ctx.lineTo(690, 400);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 0.7);
  ctx.fillStyle = '#7fd0c0';
  ctx.fillRect(806, 330, 8, 4); ctx.fillRect(824, 328, 8, 4);
  ctx.restore();
  // 巨兽肋骨拱（横跨画面，超出顶部）
  ctx.save();
  ctx.strokeStyle = '#26343a'; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const rx = 60 + i * 108;
    const rr = 150 + (i % 3) * 34;
    ctx.lineWidth = 13 - i * 0.4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(rx, 402);
    ctx.quadraticCurveTo(rx + 26, 402 - rr, rx + 60, 402 - rr * 1.24);
    ctx.stroke();
  }
  ctx.restore();
  // 脊骨横梁
  ctx.save();
  ctx.globalAlpha = 0.9; ctx.strokeStyle = '#2c3c42'; ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(-20, 96); ctx.quadraticCurveTo(480, 24, 980, 108); ctx.stroke();
  ctx.restore();
  // 地面
  vgrad(ctx, 396, H, [[0, '#3a4a38'], [0.5, '#2b3a2b'], [1, '#16211a']]);
  for (let i = 0; i < 120; i++) {
    const gy = 410 + (i * 47) % 210, gx = (i * 163) % W;
    R(ctx, gx, gy, 5, 7, i % 3 ? '#33452f' : '#3d5236');
  }
  // 高耸铁栏（前景两侧）
  [0, W].forEach((edge, ei) => {
    const dir = ei === 0 ? 1 : -1;
    ctx.save();
    ctx.strokeStyle = '#141c20'; ctx.lineWidth = 12;
    for (let i = 0; i < 5; i++) {
      const bx = edge + dir * (18 + i * 46);
      ctx.beginPath(); ctx.moveTo(bx, H); ctx.lineTo(bx + dir * 8, 300 - i * 8); ctx.stroke();
    }
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(edge, 470); ctx.lineTo(edge + dir * 250, 452); ctx.stroke();
    ctx.restore();
  });
  // 围场木栏（中景）
  R(ctx, 300, 424, 470, 10, '#3a2a1a');
  for (let i = 0; i < 16; i++) R(ctx, 306 + i * 29, 424, 7, 34, '#2e2013');
  // 石槽 / 兽舍
  R(ctx, 556, 452, 88, 24, '#3a3428'); R(ctx, 564, 458, 72, 14, '#4a4232');
  R(ctx, 700, 436, 130, 18, '#2e3630'); R(ctx, 712, 454, 106, 11, '#20281f');
  // 灵宠
  const list = S.pets || [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const baseX = 640 + (i % 2 === 0 ? -80 : 80);
    const baseY = 470 + Math.floor(i / 2) * 40;
    const wander = Math.sin(t * 0.85 + i * 2.1) * 34;
    drawPetCritter(ctx, baseX + wander, baseY, p.id, t);
  }
  if (!list.length) {
    ctx.fillStyle = 'rgba(225,232,225,.42)'; ctx.textAlign = 'center';
    ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText('尚无灵宠结契 · 机缘未至', 640, 470);
  }
  // 悬吊铁笼（巨大，从顶部垂下）
  ctx.save();
  ctx.strokeStyle = '#101820'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(210, 0); ctx.lineTo(210, 210); ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeRect(150, 210, 120, 150);
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(150 + i * 24, 210); ctx.lineTo(150 + i * 24, 360); ctx.stroke(); }
  ctx.restore();
  motes(ctx, t, 30, '#bfe8d8', 0.42, 80, 420, 9);
  fogBand(ctx, 470, 150, 'rgba(120,160,150,.14)', 0.7, t, 4);
  depthShade(ctx, 0, 170, 'rgba(3,7,10,.8)', 1);
  frameOccluders(ctx, t, '#050a0c', 5);
}

// ---------- 4. 练剑坪：剑冢 ----------
function swordHD(ctx, S, t, H2) {
  const SPOT = H2.AREA_SPOTS.sword;
  vgrad(ctx, 0, 400, [[0, '#0a1017'], [0.45, '#1b2836'], [1, '#43525f']]);
  // 风沙云
  ctx.save();
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#8a9aa8';
    ctx.beginPath();
    ctx.ellipse(120 + i * 240 + Math.sin(t * 0.2 + i) * 40, 120 + i * 18, 220, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // 中央巨剑（剑柄在画面上方外）
  const sx = 480;
  ctx.save();
  // 剑身（从 y=40 插到 460）
  const bg = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
  bg.addColorStop(0, '#5b7285'); bg.addColorStop(0.45, '#dceaf4'); bg.addColorStop(0.55, '#a8c2d4'); bg.addColorStop(1, '#42566a');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(sx - 34, 60); ctx.lineTo(sx + 34, 60);
  ctx.lineTo(sx + 22, 420); ctx.lineTo(sx, 470); ctx.lineTo(sx - 22, 420);
  ctx.closePath(); ctx.fill();
  // 血槽
  ctx.globalAlpha = 0.5; R(ctx, sx - 5, 80, 10, 330, '#7fa8c4');
  // 护手
  ctx.globalAlpha = 1; R(ctx, sx - 96, 44, 192, 18, '#c9a961');
  R(ctx, sx - 104, 40, 208, 8, '#8a6a2a');
  // 剑柄（延伸出画面）
  R(ctx, sx - 16, 0, 32, 46, '#3a2a1a');
  ctx.restore();
  // 剑光（呼吸）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.18 + 0.10 * Math.sin(t * 1.6);
  ctx.fillStyle = '#a8d8ff';
  ctx.beginPath(); ctx.ellipse(sx, 260, 150, 320, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  godRay(ctx, sx, 40, 460, 40, 470, 'rgba(150,210,255,.20)', 0.9, t, 4);
  // 万剑倒插（近大远小）
  for (let i = 0; i < 34; i++) {
    const depth = (i % 5) / 4;
    const bx = ((i * 137) % (W + 100)) - 50;
    const by = 402 + Math.floor(i / 5) * 22;
    const sw = 0.45 + depth * 0.9;
    const hh = (60 + (i % 4) * 26) * sw;
    ctx.save();
    ctx.globalAlpha = 0.55 + depth * 0.4;
    ctx.fillStyle = i % 3 ? '#8fa4b6' : '#b6c6d4';
    R(ctx, bx - 2.5 * sw, by - hh, 5 * sw, hh, i % 3 ? '#8fa4b6' : '#b6c6d4');
    R(ctx, bx - 10 * sw, by - hh - 4 * sw, 20 * sw, 5 * sw, '#7a6a4a');
    ctx.globalAlpha = 0.25 + depth * 0.35;
    R(ctx, bx - 1.2 * sw, by - hh + 3, 2.4 * sw, hh * 0.8, '#dfeef8');
    ctx.restore();
  }
  // 地面
  vgrad(ctx, 396, H, [[0, '#4a525c'], [0.45, '#333a43'], [1, '#1b2026']]);
  // 裂缝
  ctx.save();
  ctx.strokeStyle = '#0a0d11'; ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(120 + i * 160, 420);
    ctx.lineTo(150 + i * 160 + Math.sin(i) * 40, 480);
    ctx.lineTo(110 + i * 160, 560);
    ctx.stroke();
  }
  ctx.restore();
  // 剑影（人物脚下的光斑）
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#cfe9ff';
  ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y + 4, 180, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 破旗（前景左右）
  [70, 890].forEach((fx, fi) => {
    R(ctx, fx - 2, 300, 5, 170, '#2a2018');
    ctx.save();
    ctx.fillStyle = fi ? '#3a1a18' : '#241c14';
    ctx.beginPath();
    ctx.moveTo(fx, 306);
    for (let i = 0; i <= 6; i++) {
      const yy = 306 + i * 14;
      ctx.lineTo(fx + (fi ? -1 : 1) * (54 + Math.sin(t * 2.4 + i * 0.8) * 8), yy);
    }
    for (let i = 6; i >= 0; i--) {
      const yy = 306 + i * 14;
      ctx.lineTo(fx + (fi ? -1 : 1) * 8, yy);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  // 远景人影（对手/同门）
  tinyCrowd(ctx, 404, 300, 420, 4, '#0f151b', t, 2);
  motes(ctx, t, 34, '#cfe4ff', 0.5, 80, 440, 7);
  fogBand(ctx, 440, 160, 'rgba(140,170,196,.13)', 0.75, t, 6);
  depthShade(ctx, 0, 190, 'rgba(2,5,9,.8)', 1);
  frameOccluders(ctx, t, '#04080c', 7);
}

// ---------- 5. 丹房：巨炉 ----------
function alchemyHD(ctx, S, t, H2) {
  const SPOT = H2.AREA_SPOTS.alchemy;
  vgrad(ctx, 0, H, [[0, '#0d0805'], [0.4, '#1d120a'], [0.75, '#2a1a10'], [1, '#120b06']]);
  // 药架（高到看不见顶）
  [40, 700].forEach((bx, bi) => {
    for (let r = 0; r < 9; r++) {
      const ry = 40 + r * 52;
      R(ctx, bx, ry, 220, 7, '#2a1a10');
      R(ctx, bx, ry, 6, 420, '#20140c');
      R(ctx, bx + 214, ry, 6, 420, '#20140c');
      for (let i = 0; i < 8; i++) {
        const jx = bx + 14 + i * 25;
        R(ctx, jx, ry - 26, 16, 26, ['#4a3423', '#3c4a3a', '#4a3a4a', '#3a3a52'][(i + r + bi) % 4]);
        R(ctx, jx + 4, ry - 31, 8, 6, '#1a120a');
      }
    }
  });
  // 巨炉（直径超半幅）
  const cx = 560, cy = 400;
  ctx.save();
  // 炉身
  const rg = ctx.createLinearGradient(cx - 230, 0, cx + 230, 0);
  rg.addColorStop(0, '#1c1c22'); rg.addColorStop(0.35, '#3a3a46'); rg.addColorStop(0.62, '#4e4e5c'); rg.addColorStop(1, '#1a1a20');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.ellipse(cx, cy, 232, 210, 0, 0, Math.PI * 2); ctx.fill();
  // 炉腹箍
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = i % 2 ? '#5a4a2c' : '#3a3a44';
    ctx.beginPath(); ctx.ellipse(cx, cy - 120 + i * 78, 232 - Math.abs(i - 1.5) * 26, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 炉口（朝观众）
  ctx.fillStyle = '#0e0e12';
  ctx.beginPath(); ctx.ellipse(cx, cy + 54, 128, 66, 0, 0, Math.PI * 2); ctx.fill();
  // 炉火
  const fg = ctx.createRadialGradient(cx, cy + 54, 6, cx, cy + 54, 130);
  fg.addColorStop(0, 'rgba(255,226,150,.95)');
  fg.addColorStop(0.35, 'rgba(255,138,42,.75)');
  fg.addColorStop(1, 'rgba(120,30,10,0)');
  ctx.globalAlpha = 0.75 + 0.2 * Math.sin(t * 3.4);
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(cx, cy + 54, 128, 66, 0, 0, Math.PI * 2); ctx.fill();
  // 炉足（巨大）
  [-150, 0, 150].forEach((off) => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#24242c';
    R(ctx, cx + off - 26, cy + 150, 52, 100, '#24242c');
    R(ctx, cx + off - 34, cy + 236, 68, 18, '#1a1a22');
  });
  ctx.restore();
  // 炉口喷出的烟柱（冲出画面上边）
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const u = i / 16;
    const py = cy - 130 - u * 480;
    const px = cx + Math.sin(t * 0.8 + i * 0.7) * (18 + u * 90);
    ctx.globalAlpha = 0.16 * (1 - u * 0.7);
    ctx.fillStyle = '#8a5a3a';
    ctx.beginPath(); ctx.arc(px, py, 26 + u * 92, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // 天花排烟口
  R(ctx, cx - 120, 0, 240, 40, '#080503');
  // 地面
  vgrad(ctx, 470, H, [[0, '#2a1a12'], [1, '#120b06']]);
  // 药案（主角位置）
  R(ctx, SPOT.x - 90, SPOT.y - 30, 180, 16, '#3a2a1a');
  R(ctx, SPOT.x - 70, SPOT.y - 14, 140, 14, '#2a1e12');
  // 地面光斑
  ctx.save();
  ctx.globalAlpha = 0.22;
  const g2 = ctx.createRadialGradient(cx, 500, 20, cx, 500, 420);
  g2.addColorStop(0, 'rgba(255,150,60,.9)');
  g2.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 380, W, 240);
  ctx.restore();
  // 挂在炉旁的药葫芦（小）
  R(ctx, 856, 300, 9, 60, '#5a3a1e');
  ctx.fillStyle = '#8a6a2a'; ctx.beginPath(); ctx.arc(860, 372, 18, 0, Math.PI * 2); ctx.fill();
  motes(ctx, t, 44, '#ffb066', 0.55, 120, 480, 11);
  fogBand(ctx, 500, 170, 'rgba(200,120,60,.12)', 0.7, t, 8);
  depthShade(ctx, 0, 180, 'rgba(6,3,2,.85)', 1);
  frameOccluders(ctx, t, '#080402', 11);
}

// ---------- 6. 炼器台：熔炉深渊 ----------
function forgeHD(ctx, S, t, H2) {
  const SPOT = H2.AREA_SPOTS.forge;
  vgrad(ctx, 0, H, [[0, '#0a0503'], [0.45, '#1a0c06'], [1, '#0d0704']]);
  // 熔岩瀑布（从顶上落下）
  ctx.save();
  const lg = ctx.createLinearGradient(0, 0, 0, 500);
  lg.addColorStop(0, 'rgba(255,196,80,.0)');
  lg.addColorStop(0.3, 'rgba(255,150,40,.55)');
  lg.addColorStop(1, 'rgba(255,90,20,.18)');
  ctx.fillStyle = lg;
  R(ctx, 300, 0, 26 + Math.sin(t) * 3, 430);
  R(ctx, 344, 0, 15, 400);
  R(ctx, 676, 0, 20, 420);
  ctx.restore();
  // 熔池
  ctx.save();
  const pg = ctx.createRadialGradient(620, 500, 20, 620, 500, 380);
  pg.addColorStop(0, 'rgba(255,220,140,.9)');
  pg.addColorStop(0.4, 'rgba(255,120,30,.5)');
  pg.addColorStop(1, 'rgba(120,30,0,0)');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 400, W, 220);
  ctx.restore();
  // 巨大齿轮（背景两侧，超出顶）
  [96, 872].forEach((gx, gi) => {
    ctx.save();
    ctx.translate(gx, 300);
    ctx.rotate(t * (gi ? -0.12 : 0.12));
    ctx.strokeStyle = '#241a14'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 96, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      ctx.save(); ctx.rotate(a);
      ctx.fillStyle = '#241a14';
      ctx.fillRect(140, -16, 44, 32);
      ctx.restore();
    }
    ctx.restore();
  });
  // 悬空巨锤
  const hammerSwing = Math.sin(t * 1.1) * 0.28;
  ctx.save();
  ctx.translate(SPOT.x + 40, 40);
  ctx.rotate(hammerSwing);
  R(ctx, -10, 0, 20, 300, '#2a2018');
  R(ctx, -74, 300, 148, 84, '#3a343c');
  R(ctx, -60, 306, 120, 20, '#4a4450');
  ctx.restore();
  // 铁砧（主角工作点）
  R(ctx, SPOT.x - 96, SPOT.y - 26, 192, 26, '#33333c');
  R(ctx, SPOT.x - 62, SPOT.y - 2, 124, 22, '#24242c');
  R(ctx, SPOT.x - 84, SPOT.y + 18, 168, 20, '#1a1a22');
  // 砧上红光
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 4);
  ctx.fillStyle = '#ffb03a';
  ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y - 28, 62, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 熔池边缘岩石
  for (let i = 0; i < 12; i++) {
    const rx = (i * 149) % W, ry = 470 + (i * 37) % 130;
    ctx.fillStyle = i % 2 ? '#1a1210' : '#120c0a';
    ctx.beginPath();
    ctx.moveTo(rx - 38, ry + 30); ctx.lineTo(rx - 12, ry - 14); ctx.lineTo(rx + 26, ry + 4); ctx.lineTo(rx + 34, ry + 30);
    ctx.closePath(); ctx.fill();
  }
  // 火星如雨
  for (let i = 0; i < 40; i++) {
    const sp = (t * 90 + i * 53) % 520;
    const px = 320 + Math.sin(i * 2.1 + t * 0.6) * 200 + (i % 5) * 40;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
    R(ctx, px, 520 - sp, 3, 3, i % 3 ? '#ffb03a' : '#ffe0a0');
  }
  ctx.globalAlpha = 1;
  // 水槽
  R(ctx, 150, 470, 110, 34, '#2a2a32');
  ctx.fillStyle = '#1a4a6a'; ctx.beginPath(); ctx.ellipse(205, 474, 48, 12, 0, 0, Math.PI * 2); ctx.fill();
  motes(ctx, t, 40, '#ffa050', 0.55, 100, 500, 13);
  fogBand(ctx, 520, 160, 'rgba(180,90,40,.12)', 0.7, t, 12);
  depthShade(ctx, 0, 170, 'rgba(5,2,1,.85)', 1);
  frameOccluders(ctx, t, '#070301', 13);
}

// ---------- 7. 藏经阁：通天书塔 ----------
function libraryHD(ctx, S, t, H2) {
  const SPOT = H2.AREA_SPOTS.library;
  vgrad(ctx, 0, H, [[0, '#0a0813'], [0.45, '#151126'], [1, '#0d0a16']]);
  // 通天书架：两侧梯形状向上收束
  const rows = 14;
  for (let side = 0; side < 2; side++) {
    const dir = side === 0 ? 1 : -1;
    const ox = side === 0 ? -40 : W + 40;
    for (let r = 0; r < rows; r++) {
      const u = r / rows;
      const ry = 620 - r * 46;
      const depthW = 330 * (1 - u * 0.62);
      const x0 = ox;
      const x1 = ox + dir * depthW;
      // 层板
      R(ctx, Math.min(x0, x1), ry, Math.abs(x1 - x0), 8, '#3a2a1a');
      // 书简
      const cnt = Math.floor(depthW / 26);
      for (let i = 0; i < cnt; i++) {
        const jx = x0 + dir * (10 + i * 26);
        const jh = 22 + ((i * 7 + r * 3) % 14);
        R(ctx, jx, ry - jh, 18, jh, ['#8a6a3a', '#4a5a4a', '#5a4a6a', '#4a4a5a', '#6a4a3a'][(i + r + side) % 5]);
        R(ctx, jx + 4, ry - jh + 6, 10, 2, '#a99a6a');
      }
    }
    // 侧墙纵梁
    R(ctx, side === 0 ? 0 : W - 22, 0, 22, H, '#241a12');
  }
  // 塔心天光：从看不见顶的高处射下
  godRay(ctx, 480, 60, 260, 0, 470, 'rgba(190,220,255,.26)', 0.9, t, 5);
  // 悬空玉简如星辰（旋涡）
  for (let i = 0; i < 26; i++) {
    const a = t * 0.28 + i * 0.72;
    const rr = 90 + (i % 6) * 46;
    const gx = 480 + Math.cos(a) * rr;
    const gy = 210 + Math.sin(a) * rr * 0.42 + (i % 4) * 12;
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.6 + i);
    R(ctx, gx, gy, 7, 18, ['#a8e0c8', '#c9d9f0', '#f0d9a8'][i % 3]);
    ctx.restore();
  }
  // 中央悬浮巨典
  ctx.save();
  ctx.translate(480, 236);
  const tilt = Math.sin(t * 0.4) * 0.06;
  ctx.rotate(tilt);
  R(ctx, -62, -44, 124, 88, '#4a3a24');
  R(ctx, -56, -38, 112, 76, '#7a6a44');
  R(ctx, -6, -38, 12, 76, '#3a2a1a');
  ctx.fillStyle = '#c9a961'; ctx.font = '600 15px "Songti SC",serif'; ctx.textAlign = 'center';
  ctx.fillText('太', -30, -6); ctx.fillText('玄', 30, -6);
  ctx.restore();
  // 天光落到书案
  ctx.save();
  ctx.globalAlpha = 0.14 + 0.04 * Math.sin(t);
  const pg = ctx.createRadialGradient(SPOT.x, SPOT.y, 10, SPOT.x, SPOT.y, 240);
  pg.addColorStop(0, 'rgba(200,226,255,.9)');
  pg.addColorStop(1, 'rgba(140,180,230,0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(SPOT.x, SPOT.y + 6, 240, 54, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 地面
  vgrad(ctx, 430, H, [[0, '#1b1528'], [1, '#0b0812']]);
  for (let i = 0; i < 5; i++) R(ctx, 0, 440 + i * 34, W, 2, 'rgba(150,170,220,.05)');
  // 书案
  R(ctx, SPOT.x - 110, SPOT.y - 24, 220, 14, '#4a3423');
  R(ctx, SPOT.x - 82, SPOT.y - 10, 164, 12, '#33240f');
  R(ctx, SPOT.x - 34, SPOT.y - 40, 68, 16, '#c9b98a');
  // 长明灯
  R(ctx, 690, 404, 7, 46, '#3a2a1a');
  ctx.globalAlpha = 0.4 + 0.12 * Math.sin(t * 3);
  ctx.fillStyle = '#ffd08a'; ctx.beginPath(); ctx.arc(693, 396, 30, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  motes(ctx, t, 36, '#cfe0ff', 0.5, 60, 460, 15);
  fogBand(ctx, 470, 180, 'rgba(140,150,200,.12)', 0.7, t, 14);
  depthShade(ctx, 0, 200, 'rgba(4,3,8,.85)', 1);
  frameOccluders(ctx, t, '#050409', 15);
}

// ---------- 8. 秘境：虚空裂口 ----------
function riftHD(ctx, S, t, H2) {
  const d = H2.DUNGEON_MAP[S.dungeonId] || H2.DUNGEON_MAP.yaoshou;
  const c = d.color;
  vgrad(ctx, 0, H, [[0, '#05060a'], [0.5, '#0b0d14'], [1, '#040508']]);
  // 巨门 / 裂缝（超出画面）
  const mx = 480, mw = 620, top = -80, bot = 500;
  ctx.save();
  const mg = ctx.createLinearGradient(0, top, 0, bot);
  mg.addColorStop(0, c[0]); mg.addColorStop(0.5, c[1]); mg.addColorStop(1, c[2]);
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(mx - mw / 2, bot);
  ctx.lineTo(mx - mw / 2 + 70, top + 120);
  ctx.quadraticCurveTo(mx, top - 120, mx + mw / 2 - 70, top + 120);
  ctx.lineTo(mx + mw / 2, bot);
  ctx.closePath(); ctx.fill();
  // 门内混沌光
  ctx.globalAlpha = 0.5 + 0.18 * Math.sin(t * 1.4);
  const ig = ctx.createRadialGradient(mx, 260, 20, mx, 260, 320);
  ig.addColorStop(0, c[3]);
  ig.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ig;
  ctx.beginPath(); ctx.ellipse(mx, 260, 300, 280, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 门内星辰
  for (let i = 0; i < 40; i++) {
    const sx = mx - 250 + hash(i, 1) * 500;
    const sy = 40 + hash(i, 2) * 420;
    ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.1 + i));
    R(ctx, sx, sy, 2, 2, '#dfeaf8');
  }
  ctx.globalAlpha = 1;
  // 巨环法阵
  giantRing(ctx, mx, 300, 300, c[3], t, 0.22, 0.32);
  giantRing(ctx, mx, 300, 190, c[3], t, -0.34, 0.24);
  // 门框断裂岩
  ctx.save();
  ctx.fillStyle = '#0a0c12';
  ctx.beginPath();
  ctx.moveTo(mx - mw / 2 - 90, bot + 40);
  ctx.lineTo(mx - mw / 2 - 40, top + 150);
  ctx.lineTo(mx - mw / 2 + 20, top + 220);
  ctx.lineTo(mx - mw / 2 + 30, bot + 40);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(mx + mw / 2 + 90, bot + 40);
  ctx.lineTo(mx + mw / 2 + 40, top + 150);
  ctx.lineTo(mx + mw / 2 - 20, top + 220);
  ctx.lineTo(mx + mw / 2 - 30, bot + 40);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // 破碎浮岛
  floatingRock(ctx, 140, 250, 130, 54, '#101722', '#1b2735', t, 0.8);
  floatingRock(ctx, 828, 210, 150, 60, '#0e141d', '#182231', t, 2.6);
  floatingRock(ctx, 226, 372, 90, 36, '#0c1219', '#151d27', t, 4.1);
  // 地面（祭坛边缘）
  vgrad(ctx, 470, H, [[0, c[1]], [0.5, c[0]], [1, '#020305']]);
  for (let i = 0; i < 46; i++) R(ctx, (i * 191) % W, 486 + ((i * 97) % 130), 9, 6, c[0]);
  // 中央传送光池
  const px2 = 480, py2 = 470;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.16 * Math.sin(t * 2);
  const rg2 = ctx.createRadialGradient(px2, py2, 6, px2, py2, 150);
  rg2.addColorStop(0, c[3]); rg2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg2;
  ctx.beginPath(); ctx.ellipse(px2, py2, 150, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = c[3]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(px2, py2, 120, 40, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.ellipse(px2, py2, 78, 26, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c[3]; ctx.textAlign = 'center'; ctx.font = '600 18px "Songti SC",serif';
  ctx.fillText(d.name + ' · 第 ' + (S.dungeonFloor || 1) + ' 层', px2, py2 + 6);
  // 守关者剪影（远超画面高度）
  const fl = S.dungeonFloor || 1;
  for (let i = 0; i < Math.min(4, 1 + Math.floor(fl / 4)); i++) {
    const ex = 210 + i * 180;
    colossus(ctx, ex, 486, 300 + (i % 2) * 70, '#04060a', { eyes: '#e04a3a', t: t + i });
  }
  motes(ctx, t, 40, c[3], 0.45, 80, 480, 17);
  fogBand(ctx, 500, 150, 'rgba(20,26,40,.55)', 0.8, t, 16);
  depthShade(ctx, 0, 200, 'rgba(1,2,4,.9)', 1);
  frameOccluders(ctx, t, '#020305', 17);
}

const HD = {
  cave: caveHD, field: fieldHD, pets: petsHD, sword: swordHD,
  alchemy: alchemyHD, forge: forgeHD, library: libraryHD, rift: riftHD
};

export function drawSceneHD(ctx, area, S, t, helpers) {
  (HD[area] || caveHD)(ctx, S, t, helpers);
}
