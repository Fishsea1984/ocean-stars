// 主循环：区域切换、行动系统、HUD 与交互面板

import { freshState, normalize, loadLocal, saveLocal, Save, PX_W, PX_H, PX_S } from './state.js';
import { drawScene, drawVignette, drawHero, AREA_SPOTS } from './scenes.js';
import { loadSprites } from './sprites.js';
import { FX, FXMOD } from './fx.js';
import * as SYS from './systems.js';
import * as STORY from './story.js';
import {
  needCult, needBody, realmText, worldText, bandFor, fmt,
  AREAS, HERBS, HERB_MAP, RECIPES, RECIPE_MAP, TREASURES, TREASURE_MAP,
  PETS, PET_MAP, ARTS, ART_MAP, SKILLS, SKILL_MAP, DUNGEONS, DUNGEON_MAP,
  PATH_NAMES, MOODS, INJURY_NAMES, totalLayer
} from './data.js';

const el = id => document.getElementById(id);
const cv = el('cv');
const ctx = cv.getContext('2d');

let S = loadLocal() || freshState();
let speed = 1, auto = true, resetting = false;
let now = 0, selectedHerb = 'ninglu';
const fxl = { flash: 0, shake: 0, bolt: 0, msg: '', msgT: 0, msgKind: 'gold' };

function fit() {
  cv.width = PX_W; cv.height = PX_H;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
fit();
FX.init();

// ---------- 提示 ----------
function showMsg(text, kind) {
  fxl.msg = text; fxl.msgT = 2.4; fxl.msgKind = kind || 'gold';
  const t = el('toast'); t.textContent = text;
  t.style.color = kind === 'fail' ? '#ee846a' : '#f0d59e';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
  const cx = S.ch.x, cy = S.ch.y;
  if (/破境|飞升/.test(text)) { FX.spawn(FXMOD.lightning, cx, cy - 56); FX.spawn(FXMOD.mana, cx, cy - 10); FX.spawn(FXMOD.heal, cx, cy - 10); }
  else if (kind === 'fail') FX.spawn(FXMOD.hit, cx, cy - 20);
  else if (/收获|炼成|锻成|得手/.test(text)) FX.spawn(FXMOD.collect, cx, cy - 14);
  else if (/结契|晋至|修成|领悟/.test(text)) FX.spawn(FXMOD.heal, cx, cy - 10);
}
function addLog(text, kind) { SYS.addLog(S, text, kind); renderLog(); }

// ---------- 行动 ----------
function isMeditating() { return S.area === 'cave' && S.ch.action === 'cultivate' && S.ch.state === 'acting'; }

function actionDur(a) {
  // 打坐/参悟时长拉长：旧版 8 秒一次，人物大半时间耗在往返路上
  if (a === 'cultivate' || a === 'study') return 14;
  if (a === 'train') return 10;
  if (a === 'explore') return 5;
  return 3.5;
}

function startAction() {
  const a = auto ? SYS.pickAutoAction(S) : { area: S.area, action: 'cultivate' };
  S.area = a.area;
  S.ch.action = a.action;
  S.ch.task = a;
  S.ch.state = 'moving';
  S.ch.t = 0; S.ch.dur = 0;
  markArea();
}

function bestSeed() {
  // 按境界解锁更高阶灵草
  const cap = Math.min(HERBS.length, 1 + Math.floor(S.insight / 6) + S.world);
  const pool = HERBS.slice(0, Math.max(1, cap));
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function doAction(act) {
  const task = S.ch.task || {};
  if (act === 'harvest') {
    const r = SYS.harvestAll(S);
    if (r.ok) { showMsg(r.msg); FX.spawn(FXMOD.collect, S.ch.x, S.ch.y - 14); }
  } else if (act === 'plant') {
    const r = SYS.plantAll(S, bestSeed);
    if (r.ok) showMsg(r.msg);
  } else if (act === 'brew') {
    const rid = task.recipe;
    const r = SYS.brew(S, rid || pickRecipe());
    if (r.ok) { showMsg(r.msg); FX.spawn(FXMOD.collect, S.ch.x, S.ch.y - 14); }
  } else if (act === 'forge') {
    for (const t of TREASURES) {
      if (!S.treasures.includes(t.id) && S.stone >= t.cost.stone) { const r = SYS.craft(S, t.id); if (r.ok) { showMsg(r.msg); FX.spawn(FXMOD.spark, S.ch.x, S.ch.y - 14); } return; }
    }
  } else if (act === 'feed') {
    for (let i = 0; i < S.pets.length; i++) {
      const r = SYS.feedPet(S, i); if (r.ok) { showMsg(r.msg); return; }
    }
  } else if (act === 'trainArt') {
    const r = SYS.trainArt(S, task.art || 'qingxin'); if (r.ok) showMsg(r.msg);
  } else if (act === 'explore') {
    const r = SYS.explore(S, { onBattle: () => FX.spawn(FXMOD.crit, S.ch.x, S.ch.y - 24) });
    if (r.ok) { showMsg('第' + (r.floor - 1) + '层 · 历练得手', 'gold'); S.dungeonCd = 8; }
    else { showMsg('负伤而退', 'fail'); fxl.shake = 26; S.dungeonCd = 14; }
  } else if (act === 'breakthrough') {
    tryBreak();
  }
}
function pickRecipe() {
  for (const r of RECIPES) {
    let ok = true;
    for (const k in r.need) if ((S.herbs[k] || 0) < r.need[k]) ok = false;
    if (ok) return r.id;
  }
  return null;
}

function tryBreak() {
  const r = SYS.doBreakthrough(S, {
    onTrial: (ok) => {
      FX.spawn(FXMOD.lightning, S.ch.x, S.ch.y - 60);
      fxl.shake = ok ? 14 : 30;
      fxl.flash = 0.5;
    },
    onSuccess: () => {
      FX.spawn(FXMOD.heal, S.ch.x, S.ch.y - 10);
      FX.spawn(FXMOD.mana, S.ch.x, S.ch.y - 10);
    }
  });
  if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg + '（成功率 ' + Math.round(r.rate * 100) + '%）', 'gold'); }
  else if (r.msg !== '火候未到') { showMsg(r.msg, 'fail'); addLog(r.msg, 'fail'); fxl.shake = 30; }
  else addLog('天劫未至 · 火候未到', '');
}

// ---------- 主线剧情（全自动：到境界即自动触发 / 自动播放 / 自动奖励）----------
const STY = { active: false, ch: null, phase: 'card', i: 0, t: 0, dur: 0, typed: 0, cool: 1.2 };

function cnNum(n) {
  const a = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n <= 9) return a[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + a[n - 10];
  return a[Math.floor(n / 10)] + '十' + (n % 10 ? a[n % 10] : '');
}

function paintProg() {
  const box = el('cineProg');
  const n = STY.ch ? STY.ch.beats.length : 0;
  let h = '';
  for (let i = 0; i < n; i++) h += '<i class="' + (i <= STY.i ? 'on' : '') + '"></i>';
  box.innerHTML = h;
}

function startChapter(ch) {
  STY.active = true; STY.ch = ch; STY.i = -1; STY.t = 0; STY.phase = 'card'; STY.typed = 0;
  // 切到本章场景，人物站定
  if (ch.area) S.area = ch.area;
  S.ch.action = null; S.ch.task = null; S.ch.state = 'idle'; S.ch.t = 0;
  const spot = AREA_SPOTS[S.area] || AREA_SPOTS.cave;
  S.ch.x = spot.x; S.ch.y = spot.y; S.ch.facing = 1;
  markArea();
  S.story.last = ch.id;
  // 章节卡
  el('cineNo').textContent = '第' + cnNum(ch.no) + ' 章';
  el('cineTitle').textContent = ch.title;
  el('cineSub').textContent = ch.sub || '';
  el('cineProg').innerHTML = '';
  el('cine').classList.add('show');
  el('cineCh').classList.add('show');
  el('cineLine').classList.remove('show');
  addLog('主线开启 ·『' + ch.title + '』', 'gold');
  fxl.flash = 0.25;
}

function nextBeat() {
  STY.i++;
  const b = STY.ch && STY.ch.beats[STY.i];
  if (!b) { finishChapter(); return; }
  STY.t = 0; STY.typed = 0; STY.phase = 'beat';
  STY.dur = STORY.beatDuration(b);
  const line = el('cineLine');
  line.classList.toggle('dim', !!b.dim);
  el('cineWho').textContent = b.who || '';
  el('cineWho').style.visibility = b.who ? 'visible' : 'hidden';
  el('cineText').textContent = '';
  line.classList.add('show');
  paintProg();
  // 台词附带演出
  const ch = S.ch;
  if (b.fx === 'shake') fxl.shake = 24;
  else if (b.fx === 'flash') { fxl.flash = 0.75; fxl.shake = 8; }
  else if (b.fx === 'bolt') {
    FX.spawn(FXMOD.lightning, ch.x, ch.y - 60);
    FX.spawn(FXMOD.mana, ch.x, ch.y - 10);
    fxl.shake = 18; fxl.flash = 0.4;
  } else if (b.fx === 'ember') FX.spawn(FXMOD.fireball, ch.x, ch.y - 26, { seed: 3 });
  else if (b.fx === 'heal') { FX.spawn(FXMOD.heal, ch.x, ch.y - 10); FX.spawn(FXMOD.halo, ch.x, ch.y - 40, { seed: 4 }); }
}

function finishChapter() {
  const ch = STY.ch;
  STY.active = false; STY.ch = null; STY.cool = 1.0;
  el('cineLine').classList.remove('show');
  el('cineCh').classList.remove('show');
  el('cine').classList.remove('show');
  if (ch && (!S.story.done || S.story.done.indexOf(ch.id) === -1)) {
    S.story = S.story || { done: [], last: '', at: 0 };
    S.story.done.push(ch.id);
    S.story.at = S.time || 0;
    const gifts = STORY.applyReward(S, ch.reward);
    if (gifts.length) addLog('『' + ch.title + '』完 · ' + gifts.join('，'), 'gold');
    showMsg('主线 · ' + ch.title, 'gold');
  }
  S.ch.state = 'idle'; S.ch.t = 0;
  hud(); renderLog(); saveGame();
}

// 返回 true 表示正在过场
function updateStory(dt) {
  if (!STY.active) {
    STY.cool -= dt;
    if (STY.cool <= 0) {
      STY.cool = 0.8;
      const c = STORY.nextChapter(S);
      if (c) { startChapter(c); return true; }
    }
    return false;
  }
  STY.t += dt;
  if (STY.phase === 'card') {
    if (STY.t >= 2.2) { el('cineCh').classList.remove('show'); nextBeat(); }
    return true;
  }
  const b = STY.ch.beats[STY.i];
  if (!b) { finishChapter(); return false; }
  // 打字机
  const full = b.text || '';
  if (STY.typed < full.length) {
    STY.typed = Math.min(full.length, STY.typed + dt * Math.max(14, full.length / 1.1));
    el('cineText').textContent = full.slice(0, Math.floor(STY.typed));
  }
  if (STY.t >= STY.dur) {
    if (STY.i + 1 >= STY.ch.beats.length) finishChapter();
    else nextBeat();
  }
  return true;
}

// ---------- 更新 ----------
function update(dt) {
  S.time += dt; S.day = 1 + Math.floor(S.time / 150);

  const cineOn = updateStory(dt);

  if (cineOn) {
    // 过场中人物定住，但修为仍以六成流转——故事与成长同时前进
    S.cult += SYS.cultRate(S) * dt * 0.6;
    S.body += SYS.bodyRate(S) * dt * 0.2;
  } else {
    const spot = AREA_SPOTS[S.area] || AREA_SPOTS.cave;
    const ch = S.ch;
    const dx = spot.x - ch.x, dy = spot.y - ch.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (ch.state === 'moving') {
      if (dist < 7) { ch.state = 'acting'; ch.t = 0; ch.dur = actionDur(ch.action); }
      else { ch.x += dx / dist * 140 * dt; ch.y += dy / dist * 140 * dt; ch.facing = dx >= 0 ? 1 : -1; ch.phase += dt * 7; }
    } else if (ch.state === 'acting') {
      ch.t += dt;
      const act = ch.action;
      if (act === 'cultivate') { S.cult += SYS.cultRate(S) * dt; S.body += SYS.bodyRate(S) * dt * 0.3; }
      else if (act === 'train') { S.body += SYS.bodyRate(S) * dt; S.cult += SYS.cultRate(S) * dt * 0.3; }
      else if (act === 'study') { S.insightExp = (S.insightExp || 0) + SYS.insightRate(S) * dt; S.insight += dt * 0.02; }
      if (ch.t >= ch.dur) {
        doAction(act);
        if (auto) startAction(); else { ch.state = 'idle'; }
      }
    } else {
      if (auto) startAction();
    }
  }

  // 灵田生长
  for (let i = 0; i < S.plotCount; i++) { const p = S.plots[i]; if (p && p.herb && p.left > 0) p.left = Math.max(0, p.left - dt); }
  // 灵力 / 冷却 / 时间
  S.qi = Math.min(S.maxQi, S.qi + dt * 2.5);
  if (S.dungeonCd > 0) S.dungeonCd = Math.max(0, S.dungeonCd - dt);
  // 伤势恢复
  if (S.injury > 0 && Math.random() < dt * 0.02) { S.injury--; addLog('伤势好转', ''); }

  // 特效
  fxl.flash = Math.max(0, fxl.flash - dt * 1.5);
  fxl.shake = Math.max(0, fxl.shake - dt * 160);
  fxl.bolt = Math.max(0, fxl.bolt - dt * 90);
  fxl.msgT = Math.max(0, fxl.msgT - dt);
  FX.update(dt);
  syncAmbient();

  // 自动突破（过场时不打断）
  if (!cineOn && auto && SYS.readyToBreak(S) && Math.random() < dt * 0.6) tryBreak();
}

function syncAmbient() {
  const ch = S.ch;
  // 位置跟随新场景构图（巨炉炉口 / 铁砧 / 门内光池 / 悬浮巨典）
  if (S.area === 'alchemy') FX.ambSet('fire', FXMOD.campfire, 560, 450, { seed: 3, light: 1.2 }); else FX.ambClear('fire');
  if (S.area === 'forge') FX.ambSet('spark', FXMOD.spark, 700, 424, { seed: 5, light: 1.1 }); else FX.ambClear('spark');
  if (S.area === 'rift') FX.ambSet('portal', FXMOD.portal, 480, 434, { seed: 2, light: 1.2 }); else FX.ambClear('portal');
  if (S.area === 'library') FX.ambSet('rune', FXMOD.rune, 480, 240, { seed: 7, light: 0.7 }); else FX.ambClear('rune');
  if (isMeditating()) FX.ambSet('halo', FXMOD.halo, ch.x, ch.y - 46, { seed: 4, light: 0.7 }); else FX.ambClear('halo');
  if (S.injury >= 2) FX.ambSet('burn', FXMOD.burning, ch.x, ch.y - 18, { seed: 1 }); else FX.ambClear('burn');
  const np = Math.min(2, S.pets.length);
  for (let i = 0; i < 2; i++) {
    if (i < np) FX.ambSet('pet' + i, FXMOD.wisp, ch.x + (i === 0 ? -36 : 36) * ch.facing, ch.y - 8, { seed: i + 1 });
    else FX.ambClear('pet' + i);
  }
}

// ---------- 渲染 ----------
function render() {
  ctx.save();
  ctx.scale(PX_S, PX_S);
  if (fxl.shake > 0) ctx.translate((Math.random() - 0.5) * fxl.shake * 0.12, (Math.random() - 0.5) * fxl.shake * 0.12);
  drawScene(ctx, S.area, S, now);
  const ch = S.ch;
  drawHero(ctx, ch.x, ch.y, {
    seated: isMeditating(), facing: ch.facing, walking: ch.state === 'moving', phase: now
  });
  drawVignette(ctx);
  if (fxl.flash > 0) { ctx.fillStyle = 'rgba(214,236,255,' + (fxl.flash * 0.35) + ')'; ctx.fillRect(0, 0, 960, 620); }
  ctx.restore();
  FX.draw(ctx);
}

// ---------- HUD ----------
function hud() {
  const nd = needCult(S.world, S.major, S.layer);
  const nb = needBody(S.world, S.major, S.layer);
  const b = bandFor(S.world);
  el('realmName').textContent = worldText(S.world) + ' · ' + realmText(S.world, S.major, S.layer);
  el('worldTag').textContent = '第 ' + (S.world + 1) + '/21 界 · ' + b.name;
  el('rateTxt').textContent = '+' + (SYS.cultRate(S)).toFixed(1) + '/s';
  const cp = Math.min(1, S.cult / nd), bp = Math.min(1, S.body / nb);
  el('cultFill').style.width = (cp * 100) + '%';
  el('bodyFill').style.width = (bp * 100) + '%';
  el('cultTxt').textContent = '法 ' + fmt(S.cult) + '/' + fmt(nd);
  el('bodyTxt').textContent = '体 ' + fmt(S.body) + '/' + fmt(nb);
  el('pathTxt').textContent = PATH_NAMES[S.path];
  el('moodTxt').textContent = S.mood + (S.injury ? ' · ' + INJURY_NAMES[S.injury] : '');

  el('vStone').textContent = fmt(S.stone || 0);
  el('vPower').textContent = fmt(SYS.power(S));
  el('vInsight').textContent = fmt(S.insight);
  el('vInsightExp').textContent = fmt(S.insightExp || 0);
  el('vContrib').textContent = fmt(S.contribution || 0);
  el('vQi').textContent = Math.floor(S.qi);
  let hc = 0; for (const k in S.herbs) hc += S.herbs[k];
  let pc = 0; for (const k in S.pills) pc += S.pills[k];
  el('vHerbCnt').textContent = hc; el('vPillCnt').textContent = pc; el('vTreasureCnt').textContent = S.treasures.length;

  // 状态
  const ch = S.ch;
  const area = AREAS.find(a => a.id === S.area);
  let label = area ? area.name : '洞府';
  if (ch.state === 'moving') label = '前往 · ' + label;
  el('sAct').textContent = label;
  el('sNote').textContent = area ? area.desc : '';
  el('sFill').style.width = (ch.state === 'acting' && ch.dur > 0 ? Math.min(1, ch.t / ch.dur) * 100 : 0) + '%';
  let sub = '自动运转中';
  if (SYS.readyToBreak(S)) sub = '火候已足 · 可破境';
  else if (SYS.ripeCount(S) > 0) sub = '灵草已熟 · 待收';
  else if (ch.action === 'explore') sub = (DUNGEON_MAP[S.dungeonId] || {}).name + ' 第' + S.dungeonFloor + '层';
  if (STY.active && STY.ch) sub = '主线 ·『' + STY.ch.title + '』';
  else if (sub === '自动运转中') {
    const pr = STORY.chapterProgress(S);
    const nx = STORY.CHAPTERS[pr];
    const gap = STORY.gapLeft(S);
    if (!nx) sub = '主线 ' + pr + '/' + STORY.STORY_TOTAL + ' · 已终章';
    else if (gap > 0) sub = '主线 ' + pr + '/' + STORY.STORY_TOTAL + ' · 下一章待启（约 ' + Math.ceil(gap / 150) + ' 日）';
    else sub = '主线 ' + pr + '/' + STORY.STORY_TOTAL + ' · 下一章「' + nx.title + '」';
  }
  el('sSub').textContent = sub;
}

function renderLog() {
  const box = el('logList');
  const items = S.journal.slice(-8).reverse();
  box.innerHTML = items.map(i => '<div class="log-item ' + (i.kind || '') + '">· ' + escapeHtml(i.text) + '</div>').join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------- 区域导航 ----------
function markArea() {
  document.querySelectorAll('.area-btn').forEach(b => b.classList.toggle('active', b.dataset.area === S.area));
}
function buildAreaNav() {
  const nav = el('areaNav');
  nav.innerHTML = AREAS.map(a =>
    '<button class="area-btn" data-area="' + a.id + '">' + a.name + '<small>' + a.desc.slice(0, 6) + '</small></button>'
  ).join('');
  nav.querySelectorAll('.area-btn').forEach(b => {
    b.addEventListener('click', () => {
      S.area = b.dataset.area;
      S.ch.action = (AREAS.find(x => x.id === S.area) || {}).act || 'cultivate';
      S.ch.task = null; S.ch.state = 'moving'; S.ch.t = 0;
      markArea();
      // 切区域时角色从场景边缘走入
      const spot = AREA_SPOTS[S.area] || AREA_SPOTS.cave;
      S.ch.x = spot.x + (Math.random() < 0.5 ? -220 : 220);
      S.ch.y = spot.y;
    });
  });
  markArea();
}

// ---------- 弹窗 ----------
function openM(id) { el(id).classList.add('show'); }
function closeM() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('show')); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeM));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeM(); }));

function renderField() {
  let html = '';
  for (let i = 0; i < S.plotCount; i++) {
    const p = S.plots[i];
    if (p.herb) {
      const h = HERB_MAP[p.herb];
      const prog = 1 - Math.max(0, Math.min(1, p.left / (p.total || 1)));
      const ripe = p.left <= 0;
      html += '<div class="mrow"><div><div class="t">' + h.name + '</div><div class="d">' +
        (ripe ? '已成熟 · 可收获' : '生长中 ' + Math.floor(prog * 100) + '%') + '</div></div>' +
        (ripe ? '<button class="mbtn" data-harvest="' + i + '">收获</button>' : '') + '</div>';
    } else {
      html += '<div class="mrow"><div><div class="t">空地 ' + (i + 1) + '</div><div class="d">可播种</div></div>' +
        '<button class="mbtn" data-plant="' + i + '">播种</button></div>';
    }
  }
  el('fieldList').innerHTML = html;
  el('herbPick').innerHTML = HERBS.map(h =>
    '<button data-herb="' + h.id + '" style="' + (h.id === selectedHerb ? 'border-color:#d9b46a;color:#d9b46a' : '') + '">' + h.name + '</button>'
  ).join('');
  el('fieldList').querySelectorAll('[data-harvest]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.harvest(S, +b.dataset.harvest); if (r.ok) { showMsg(r.msg); addLog(r.msg, ''); } renderField(); hud();
  }));
  el('fieldList').querySelectorAll('[data-plant]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.plant(S, +b.dataset.plant, selectedHerb); if (r.ok) { showMsg(r.msg); } renderField(); hud();
  }));
  el('herbPick').querySelectorAll('[data-herb]').forEach(b => b.addEventListener('click', () => { selectedHerb = b.dataset.herb; renderField(); }));
}

function renderPets() {
  if (!S.pets.length) { el('petList').innerHTML = '<div class="empty">尚无灵宠结契</div>'; }
  else {
    el('petList').innerHTML = S.pets.map((p, i) => {
      const pd = PET_MAP[p.id];
      const cost = 20 + p.level * 15;
      return '<div class="mrow"><div><div class="t">' + pd.name + ' · ' + p.level + '阶</div>' +
        '<div class="d">亲密 ' + Math.round(p.intimacy || 0) + ' · 技能 ' + pd.skill + ' · 喂养 ' + cost + ' 灵石</div></div>' +
        '<button class="mbtn" data-feed="' + i + '">喂养</button></div>';
    }).join('');
    el('petList').querySelectorAll('[data-feed]').forEach(b => b.addEventListener('click', () => {
      const r = SYS.feedPet(S, +b.dataset.feed); showMsg(r.msg); renderPets(); hud();
    }));
  }
  const cost = 300 + S.pets.length * 250;
  el('bondHint').innerHTML = '<button class="mbtn" id="bondBtn">结契新灵宠（' + cost + ' 灵石）</button>';
  const bb = el('bondBtn'); if (bb) bb.addEventListener('click', () => {
    const r = SYS.bondPet(S); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); } else showMsg(r.msg, 'fail');
    renderPets(); hud();
  });
}

function renderAlchemy() {
  el('recipeList').innerHTML = RECIPES.map(r => {
    let can = true, needTxt = [];
    for (const k in r.need) {
      const own = S.herbs[k] || 0;
      needTxt.push(HERB_MAP[k].name + ' ' + own + '/' + r.need[k]);
      if (own < r.need[k]) can = false;
    }
    return '<div class="mrow"><div><div class="t">' + r.name + '</div><div class="d">' + r.desc + ' · ' + needTxt.join('，') + '</div></div>' +
      '<button class="mbtn" data-brew="' + r.id + '"' + (can ? '' : ' disabled') + '>炼制</button></div>';
  }).join('');
  el('recipeList').querySelectorAll('[data-brew]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.brew(S, b.dataset.brew); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); } else showMsg(r.msg, 'fail');
    renderAlchemy(); hud();
  }));
}

function renderForge() {
  el('forgeList').innerHTML = TREASURES.map(t => {
    const own = S.treasures.includes(t.id);
    const can = !own && S.stone >= t.cost.stone;
    return '<div class="mrow"><div><div class="t">' + t.name + ' · 战力+' + t.power + '</div>' +
      '<div class="d">' + t.desc + ' · 需灵石 ' + t.cost.stone + '</div></div>' +
      (own ? '<span class="d">已拥有</span>' : '<button class="mbtn" data-forge="' + t.id + '"' + (can ? '' : ' disabled') + '>锻造</button>') + '</div>';
  }).join('');
  el('forgeList').querySelectorAll('[data-forge]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.craft(S, b.dataset.forge); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); } else showMsg(r.msg, 'fail');
    renderForge(); hud();
  }));
}

function renderLibrary() {
  el('artsList').innerHTML = ARTS.map(a => {
    const lv = S.arts[a.id] || 0;
    const cost = lv === 0 ? a.cost : Math.floor(a.cost * Math.pow(1.6, lv));
    const can = lv < a.maxLevel && (S.insightExp || 0) >= cost;
    return '<div class="mrow"><div><div class="t">' + a.name + '（' + a.tier + '阶）' + (lv ? ' · ' + lv + '层' : ' · 未修') + '</div>' +
      '<div class="d">' + a.desc + ' · 需感悟 ' + cost + '</div></div>' +
      (lv >= a.maxLevel ? '<span class="d">圆满</span>' : '<button class="mbtn" data-art="' + a.id + '"' + (can ? '' : ' disabled') + '>' + (lv ? '精进' : '修习') + '</button>') + '</div>';
  }).join('');
  el('artsList').querySelectorAll('[data-art]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.trainArt(S, b.dataset.art); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); } else showMsg(r.msg, 'fail');
    renderLibrary(); hud();
  }));
  el('skillList').innerHTML = SKILLS.map(s => {
    const own = S.skills.includes(s.id);
    const cost = Math.floor(s.power * 30);
    const can = !own && (S.insightExp || 0) >= cost;
    return '<div class="mrow"><div><div class="t">' + s.name + '（' + s.type + '）· 威力' + s.power + '</div>' +
      '<div class="d">' + s.desc + ' · 需感悟 ' + cost + '</div></div>' +
      (own ? '<span class="d">已习得</span>' : '<button class="mbtn" data-skill="' + s.id + '"' + (can ? '' : ' disabled') + '>领悟</button>') + '</div>';
  }).join('');
  el('skillList').querySelectorAll('[data-skill]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.learnSkill(S, b.dataset.skill); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); } else showMsg(r.msg, 'fail');
    renderLibrary(); hud();
  }));
}

function renderRift() {
  el('dungeonList').innerHTML = DUNGEONS.map(d => {
    const maxF = S.dungeonMax[d.id] || 0;
    const need = Math.floor(d.powerNeed * 30);
    const can = SYS.power(S) >= need;
    return '<div class="mrow"><div><div class="t">' + d.name + ' · 最高 ' + maxF + '/' + d.floors + ' 层</div>' +
      '<div class="d">' + d.desc + ' · 需战力 ' + fmt(need) + '</div></div>' +
      '<button class="mbtn" data-dun="' + d.id + '"' + (can ? '' : ' disabled') + '>踏入</button></div>';
  }).join('');
  el('dungeonList').querySelectorAll('[data-dun]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.enterDungeon(S, b.dataset.dun); if (r.ok) { showMsg(r.msg, 'gold'); addLog(r.msg, 'gold'); S.area = 'rift'; S.ch.action = 'explore'; S.ch.state = 'moving'; markArea(); }
    else showMsg(r.msg, 'fail');
    renderRift(); hud();
  }));
}

function renderBag() {
  const herbs = Object.keys(S.herbs).filter(k => S.herbs[k] > 0);
  el('bagHerbs').innerHTML = herbs.length ? herbs.map(k =>
    '<div class="mrow"><div class="t">' + HERB_MAP[k].name + '</div><div class="d">×' + S.herbs[k] + '</div></div>').join('')
    : '<div class="empty">暂无灵草</div>';
  const pills = Object.keys(S.pills).filter(k => S.pills[k] > 0);
  const pillNames = { juqi: '聚气丹', peiyuan: '培元丹', ningshen: '凝神丹', pojing: '破境丹', cuiti: '淬体丹', shenshi: '神识丹', jiuzhuandan: '九转金丹' };
  el('bagPills').innerHTML = pills.length ? pills.map(k =>
    '<div class="mrow"><div class="t">' + (pillNames[k] || k) + '</div><button class="mbtn" data-pill="' + k + '">服用 ×' + S.pills[k] + '</button></div>').join('')
    : '<div class="empty">暂无丹药</div>';
  el('bagPills').querySelectorAll('[data-pill]').forEach(b => b.addEventListener('click', () => {
    const r = SYS.usePill(S, b.dataset.pill); showMsg(r.msg); renderBag(); hud();
  }));
  el('bagTreasures').innerHTML = S.treasures.length ? S.treasures.map(t =>
    '<div class="mrow"><div class="t">' + TREASURE_MAP[t].name + '</div><div class="d">战力+' + TREASURE_MAP[t].power + '</div></div>').join('')
    : '<div class="empty">暂无法宝</div>';
}

function renderJournal() {
  el('journalDay').textContent = S.day;
  if (!S.journal.length) { el('journalBody').innerHTML = '<div class="empty">尚无修行记录</div>'; return; }
  el('journalBody').innerHTML = S.journal.slice().reverse().map(i =>
    '<div class="journal-item ' + (i.kind || '') + '"><span class="day">第' + i.day + '日</span><span class="text">' + escapeHtml(i.text) + '</span></div>'
  ).join('');
}

// ---------- 对话 ----------
function replyToUser(text) {
  text = (text || '').trim();
  if (!text) return '清玄垂目不语，似在入定。';
  const nd = needCult(S.world, S.major, S.layer);
  if (/你好|在吗|问候|道安/.test(text)) return '道友道安。清玄在此清修，一切安好。';
  if (/进度|修为|境界|到哪|怎么样/.test(text)) return '今在' + worldText(S.world) + ' ' + realmText(S.world, S.major, S.layer) +
    '，法修 ' + Math.round(S.cult / nd * 100) + '%。道途：' + PATH_NAMES[S.path] + '。';
  if (/灵草|灵田|种|收/.test(text)) return '灵田已开 ' + S.plotCount + ' 块，成熟待收 ' + SYS.ripeCount(S) + ' 株。';
  if (/灵宠|宠物|兽/.test(text)) return S.pets.length ? '随行灵宠：' + S.pets.map(p => PET_MAP[p.id].name + p.level + '阶').join('、') + '。' : '尚无灵宠随行，缘法未至。';
  if (/秘境|历练|外出/.test(text)) return '当前' + (DUNGEON_MAP[S.dungeonId] || {}).name + ' 第' + S.dungeonFloor + '层。';
  if (/功法|神通|技能/.test(text)) return '功法：' + Object.keys(S.arts).map(k => ART_MAP[k].name + (S.arts[k]) + '层').join('、') + '。';
  if (/伤|痛/.test(text)) return S.injury === 0 ? '气血充盈，无伤无痛。' : '身受' + INJURY_NAMES[S.injury] + '，正在调息。';
  if (/主线|故事|剧情|归墟|来历|身世/.test(text)) return STORY.storySummary(S);
  if (/加油|努力|坚持/.test(text)) { S.mood = '坚毅'; return '多谢道友勉励，清玄必当精进。'; }
  if (/休息|停下|保重/.test(text)) { S.mood = '平静'; return '一张一弛，稍作休整。'; }
  if (/谢谢|多谢/.test(text)) return '道友客气，清玄愧不敢当。';
  const def = ['静水流深，修行在己。', '天地有常，道法自然。', '一呼一吸，皆是修行。', '道阻且长，行则将至。'];
  return def[Math.floor(Math.random() * def.length)];
}
function pushChat(who, text) {
  const d = document.createElement('div');
  d.className = 'chat-msg' + (who === '我' ? ' user' : '');
  d.innerHTML = '<span class="who">' + who + '</span><span class="text"></span>';
  d.querySelector('.text').textContent = text;
  el('chatBody').appendChild(d);
  el('chatBody').scrollTop = el('chatBody').scrollHeight;
}
function sendChat() {
  const v = el('chatInput').value;
  if (!v.trim()) return;
  pushChat('我', v); el('chatInput').value = '';
  const reply = replyToUser(v);
  setTimeout(() => pushChat('清玄', reply), 260 + Math.random() * 300);
}

// ---------- 按钮 ----------
buildAreaNav();
el('btnBreak').addEventListener('click', () => { tryBreak(); hud(); });
el('btnBag').addEventListener('click', () => { renderBag(); openM('bagModal'); });
el('btnPets').addEventListener('click', () => { renderPets(); openM('petModal'); });
el('btnArts').addEventListener('click', () => { renderLibrary(); openM('libraryModal'); });
el('btnRift').addEventListener('click', () => { renderRift(); openM('riftModal'); });
el('btnJournal').addEventListener('click', () => { renderJournal(); openM('journalModal'); });
el('btnChat').addEventListener('click', () => {
  openM('chatModal');
  if (!el('chatBody').children.length) pushChat('清玄', '道友寻我？清玄正在洞中清修，有话但说无妨。');
  setTimeout(() => el('chatInput').focus(), 50);
});
el('chatSend').addEventListener('click', sendChat);
el('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
// 过场可手动跳过（不点也会自己播完）
el('cineSkip').addEventListener('click', () => { if (STY.active) finishChapter(); });
document.querySelectorAll('.sp').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.sp').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); speed = Number(b.dataset.s) || 1;
}));
el('btnAuto').addEventListener('click', () => {
  auto = !auto; el('btnAuto').textContent = '自动：' + (auto ? '开' : '关');
  if (auto && S.ch.state === 'idle') startAction();
});
el('btnReset').addEventListener('click', () => {
  if (!confirm('重开洞府？全部修为、灵草、灵宠与法宝都会清空。')) return;
  resetting = true;
  try { localStorage.removeItem('qingxin_pixel_save_v2'); } catch (e) {}
  Save.clear();
  location.reload();
});

// ---------- 存档 ----------
function saveGame() { if (!resetting) saveLocal(S); }

// 离线结算
function settleOffline() {
  if (!S.savedAt) return;
  const away = Math.min(8 * 3600, (Date.now() - S.savedAt) / 1000);
  if (away < 30) return;
  const gc = SYS.cultRate(S) * away * 0.55, gb = SYS.bodyRate(S) * away * 0.55;
  S.cult += gc; S.body += gb;
  S.time += away;      // 挂机也推进游戏内时间，好让主线间隔正常累积
  for (let i = 0; i < S.plotCount; i++) { const p = S.plots[i]; if (p && p.herb && p.left > 0) p.left = Math.max(0, p.left - away); }
  addLog('闭关归来 · 修为 +' + fmt(gc), 'gold');
}

// ---------- 启动 ----------
loadSprites();          // 加载像素精灵（未加载完时自动用方块人兜底，不空屏）
settleOffline();
S.ch.state = 'moving'; S.ch.t = 0;
addLog('洞府开张 · 八境自行运转', 'gold');
addLog('灵田可种植 · 秘境可外出历练', 'ice');
addLog('可与清玄问道 · 翻阅修行录', 'ice');
addLog('主线随境界自动展开 · 无需操作', 'ice');
hud(); renderLog(); markArea();

// 云端同步
Save.pull((data, ts) => {
  if (!data) return;
  if ((S.savedAt || 0) >= (ts || 0)) return;
  S = normalize(Object.assign(S, data));
  S.ch.state = 'moving';
  addLog('云端存档已同步', 'ice');
  hud(); renderLog();
});

let last = performance.now(), hudAcc = 0, saveAcc = 0;
function frame(ts) {
  const dt = Math.min(0.25, (ts - last) / 1000); last = ts; now = ts / 1000;
  update(dt * speed);
  render();
  hudAcc += dt; if (hudAcc > 0.12) { hudAcc = 0; hud(); }
  saveAcc += dt; if (saveAcc > 5) { saveAcc = 0; saveGame(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('beforeunload', saveGame);
