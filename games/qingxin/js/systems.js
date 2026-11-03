// 修仙系统逻辑（加强版）：境界突破/天劫、灵田、炼丹炼器、功法神通、灵宠、秘境

import {
  needCult, needBody, totalLayer, realmText, worldText, fmt, pick, clamp,
  HERB_MAP, HERBS, RECIPE_MAP, TREASURE_MAP, TREASURES,
  PET_MAP, PETS, ART_MAP, ARTS, SKILL_MAP, SKILLS, DUNGEON_MAP, DUNGEONS,
  LAYERS_PER_WORLD, MAJOR_COUNT, LAYERS_PER_MAJOR
} from './data.js';

// ---------- 派生属性 ----------
// 产出随境界指数增长，与需求的 1.009^k × 2^world 对冲 → 净耗时仅 ×1.003/层、×1.23/界
// 单调性：1.006^71 ≈ 1.529 < 1.62（飞升时产出同样只增不减，不会"越飞升越慢"）
const RATE_K_CULT = 1.006, RATE_K_BODY = 1.0065, RATE_W = 1.62;
function kOf(S) { return S.major * LAYERS_PER_MAJOR + S.layer; }

export function power(S) {
  const k = kOf(S);
  // 战力：界内 ×1.008/层（1.008^71≈1.76 < 3.0），飞升一界 ×3.0，全程单调
  let p = 40 * Math.pow(1.008, k) * Math.pow(3.0, S.world);
  // 法宝/神通/灵宠一律按倍率加成，避免后期固定值被指数曲线淹没
  for (const tid of S.treasures) { const t = TREASURE_MAP[tid]; if (t) p *= (1 + t.power / 400); }
  for (const aid in S.arts) {
    const a = ART_MAP[aid]; if (a && a.bonus.power) p *= (1 + a.bonus.power * ((S.arts[aid] || 1) - 1));
  }
  for (const sid of S.skills) { const s = SKILL_MAP[sid]; if (s) p *= (1 + s.power * 0.06); }
  for (const pet of S.pets) {
    const pd = PET_MAP[pet.id]; if (pd && pd.bonus.power) p *= (1 + (pd.bonus.power - 1) * pet.level);
  }
  const nbd = needBody(S.world, S.major, S.layer) || 1;
  p *= (1 + Math.min(0.5, (S.body / nbd) * 0.2));
  return Math.floor(p);
}

export function cultRate(S) {
  const k = kOf(S);
  let r = 1.15 * Math.pow(RATE_K_CULT, k) * Math.pow(RATE_W, S.world);
  if (S.path === '体') r *= 0.7; else if (S.path === '双') r *= 0.85;
  for (const aid in S.arts) {
    const a = ART_MAP[aid]; if (a && a.bonus.cultSpeed) r *= (1 + a.bonus.cultSpeed * ((S.arts[aid] || 1) - 1));
  }
  for (const pet of S.pets) { const pd = PET_MAP[pet.id]; if (pd && pd.bonus.cult) r *= (1 + (pd.bonus.cult - 1) * pet.level); }
  const moodK = { '顿悟': 1.35, '空明': 1.2, '喜悦': 1.12, '平静': 1, '坚毅': 1.06, '焦灼': 0.92, '沮丧': 0.85 };
  r *= (moodK[S.mood] || 1);
  if (S.injury > 0) r *= (1 - 0.05 * S.injury);
  return r;
}

export function bodyRate(S) {
  const k = kOf(S);
  let r = 0.95 * Math.pow(RATE_K_BODY, k) * Math.pow(RATE_W, S.world);
  if (S.path === '法') r *= 0.7; else if (S.path === '双') r *= 0.85;
  for (const aid in S.arts) {
    const a = ART_MAP[aid]; if (a && a.bonus.bodySpeed) r *= (1 + a.bonus.bodySpeed * ((S.arts[aid] || 1) - 1));
  }
  for (const pet of S.pets) { const pd = PET_MAP[pet.id]; if (pd && pd.bonus.body) r *= (1 + (pd.bonus.body - 1) * pet.level); }
  const moodK = { '顿悟': 1.3, '空明': 1.15, '喜悦': 1.1, '平静': 1, '坚毅': 1.1, '焦灼': 0.92, '沮丧': 0.85 };
  r *= (moodK[S.mood] || 1);
  if (S.injury > 0) r *= (1 - 0.06 * S.injury);
  return r;
}

export function insightRate(S) {
  let r = 0.35;
  for (const aid in S.arts) {
    const a = ART_MAP[aid]; if (a && a.bonus.insight) r *= (1 + a.bonus.insight * ((S.arts[aid] || 1) - 1));
  }
  for (const pet of S.pets) { const pd = PET_MAP[pet.id]; if (pd && pd.bonus.insight) r *= (1 + (pd.bonus.insight - 1) * pet.level); }
  return r;
}

export function maxedOut(S) {
  return S.world >= 20 && S.major >= 7 && S.layer >= 8;
}

export function addLog(S, text, kind) {
  S.journal.push({ day: S.day, text: text, kind: kind || '' });
  if (S.journal.length > 120) S.journal.shift();
}

// ---------- 境界突破（含天劫）----------
export function readyToBreak(S) {
  const nc = needCult(S.world, S.major, S.layer);
  const nb = needBody(S.world, S.major, S.layer);
  if (S.path === '法') return S.cult >= nc;
  if (S.path === '体') return S.body >= nb;
  return S.cult >= nc && S.body >= nb;
}

export function breakChance(S) {
  const L = totalLayer(S.world, S.major, S.layer);
  let rate = 0.74;
  const moodK = { '顿悟': 0.16, '空明': 0.11, '喜悦': 0.07, '平静': 0, '坚毅': 0.04, '焦灼': -0.10, '沮丧': -0.16 };
  rate += (moodK[S.mood] || 0);
  rate += Math.min(0.15, S.insight * 0.012);
  // 天劫随层数变难，但设上限：否则后期必然陷入"失败→伤势→更易失败"的死亡螺旋
  rate -= Math.min(0.24, L * 0.0011);
  if (S.injury > 0) rate -= 0.05 * S.injury;
  return clamp(rate, 0.12, 0.98);
}

export function doBreakthrough(S, fxHooks) {
  if (maxedOut(S)) return { ok: false, msg: '已至道境圆满' };
  if (!readyToBreak(S)) return { ok: false, msg: '火候未到' };
  // 服丹提升
  let rate = breakChance(S);
  if ((S.pills.jiuzhuandan || 0) > 0) { rate += 0.5; S.pills.jiuzhuandan--; addLog(S, '服下九转金丹 · 突破必成', 'gold'); }
  else if ((S.pills.pojing || 0) > 0) { rate += 0.2; S.pills.pojing--; addLog(S, '服下破境丹 · 成功率大增', 'gold'); }
  rate = clamp(rate, 0.05, 0.99);

  const nc = needCult(S.world, S.major, S.layer);
  const success = Math.random() < rate;
  if (fxHooks && fxHooks.onTrial) fxHooks.onTrial(success);

  if (success) {
    S.cult = 0; S.body = 0;
    S.layer++;
    if (S.layer > 8) { S.layer = 0; S.major++; }
    if (S.major > 7) { S.major = 0; S.world++; addLog(S, '飞升 ' + worldText(S.world) + ' · 重历八境', 'gold'); }
    S.insight += 1 + Math.floor(Math.random() * 3);
    S.mood = '喜悦';
    // 渡劫成功则疗伤两层，伤势不再无限累积
    S.injury = Math.max(0, S.injury - 2);
    if (fxHooks && fxHooks.onSuccess) fxHooks.onSuccess();
    const txt = (S.layer === 0 && S.major === 0)
      ? '飞升 · ' + worldText(S.world) + ' ' + realmText(S.world, S.major, S.layer)
      : '破境 · ' + realmText(S.world, S.major, S.layer);
    addLog(S, txt, 'gold');
    return { ok: true, msg: txt, rate: rate };
  } else {
    const loss = Math.floor(nc * 0.12);
    S.cult = Math.max(0, S.cult - loss);
    // 只有半数天劫会留下伤势，且最多累积到 3（垂危），避免螺旋式越打越弱
    if (Math.random() < 0.55 && S.injury < 3) S.injury++;
    S.mood = '沮丧';
    // 掉境界：概率下调，且至少练气三层以上才会掉，避免开局挫败
    if (Math.random() < 0.15 && (S.layer >= 2 || S.major > 0 || S.world > 0)) {
      S.layer--;
      if (S.layer < 0) { S.layer = 8; S.major--; }
      if (S.major < 0) { S.major = 7; S.world = Math.max(0, S.world - 1); }
      addLog(S, '走火入魔 · 境界跌落至 ' + realmText(S.world, S.major, S.layer), 'fail');
    } else {
      addLog(S, '天劫未渡 · 修为散去 ' + fmt(loss), 'fail');
    }
    return { ok: false, msg: '天劫未渡 · 修为受损', rate: rate };
  }
}

// ---------- 灵田 ----------
export function plant(S, i, herbId) {
  const p = S.plots[i];
  if (!p || i >= S.plotCount) return { ok: false, msg: '地块未开垦' };
  if (p.herb) return { ok: false, msg: '此地块已有灵草' };
  const h = HERB_MAP[herbId]; if (!h) return { ok: false, msg: '未知灵草' };
  p.herb = herbId; p.left = h.grow; p.total = h.grow;
  return { ok: true, msg: '播下' + h.name };
}

export function harvest(S, i, quiet) {
  const p = S.plots[i];
  if (!p || !p.herb) return { ok: false, msg: '空地' };
  if (p.left > 0) return { ok: false, msg: '尚未成熟' };
  const h = HERB_MAP[p.herb];
  const hid = p.herb;
  const got = 1 + Math.floor(Math.random() * 2) + (S.insight > 30 ? 1 : 0);
  S.herbs[hid] = (S.herbs[hid] || 0) + got;
  p.herb = null; p.left = 0; p.total = 0;
  if (!quiet) addLog(S, '收获' + h.name + ' ×' + got, '');
  return { ok: true, msg: '收获' + h.name + ' ×' + got, herb: hid, count: got };
}

// 批量收获：一次收走全部成熟地块（旧版一株一跑，来回空跑占了六成回合）
export function harvestAll(S) {
  const bag = {};
  let n = 0;
  for (let i = 0; i < S.plotCount; i++) {
    const r = harvest(S, i, true);
    if (r.ok) { n += r.count; bag[r.herb] = (bag[r.herb] || 0) + r.count; }
  }
  if (!n) return { ok: false, msg: '尚无灵草成熟' };
  const txt = Object.keys(bag).map(k => (HERB_MAP[k] ? HERB_MAP[k].name : k) + '×' + bag[k]).join('、');
  addLog(S, '收获 ' + txt, '');
  return { ok: true, msg: '收获 ' + txt, count: n };
}

// 批量播种：一次播满全部空地（seedFn 返回灵草 id）
export function plantAll(S, seedFn) {
  let n = 0;
  for (let i = 0; i < S.plotCount; i++) {
    if (S.plots[i] && !S.plots[i].herb) {
      const r = plant(S, i, seedFn ? seedFn() : 'ninglu');
      if (r.ok) n++;
    }
  }
  if (!n) return { ok: false, msg: '灵田已播满' };
  addLog(S, '播下灵草 ×' + n, '');
  return { ok: true, msg: '播下灵草 ×' + n, count: n };
}

export function ripeCount(S) {
  let n = 0;
  for (let i = 0; i < S.plotCount; i++) { const p = S.plots[i]; if (p && p.herb && p.left <= 0) n++; }
  return n;
}
export function emptyPlots(S) {
  let n = 0;
  for (let i = 0; i < S.plotCount; i++) { const p = S.plots[i]; if (p && !p.herb) n++; }
  return n;
}

// ---------- 炼丹 ----------
export function brew(S, recipeId) {
  const r = RECIPE_MAP[recipeId]; if (!r) return { ok: false, msg: '无此丹方' };
  for (const k in r.need) { if ((S.herbs[k] || 0) < r.need[k]) return { ok: false, msg: '药材不足' }; }
  for (const k in r.need) S.herbs[k] -= r.need[k];
  const out = 1 + (Math.random() < 0.25 ? 1 : 0);
  S.pills[r.out] = (S.pills[r.out] || 0) + out;
  addLog(S, '炼成' + r.name + ' ×' + out, 'gold');
  return { ok: true, msg: '炼成' + r.name + ' ×' + out, pill: r.out };
}

// ---------- 炼器 ----------
export function craft(S, treasureId) {
  const t = TREASURE_MAP[treasureId]; if (!t) return { ok: false, msg: '无此法宝' };
  if (S.treasures.includes(treasureId)) return { ok: false, msg: '已有此法宝' };
  if ((S.stone || 0) < t.cost.stone) return { ok: false, msg: '灵石不足' };
  S.stone -= t.cost.stone;
  S.treasures.push(treasureId);
  addLog(S, '锻成法宝 · ' + t.name, 'gold');
  return { ok: true, msg: '锻成' + t.name };
}

// ---------- 功法 / 神通 ----------
export function trainArt(S, artId) {
  const a = ART_MAP[artId]; if (!a) return { ok: false, msg: '无此功法' };
  const lv = S.arts[artId] || 0;
  if (lv === 0) {
    if ((S.insightExp || 0) < a.cost) return { ok: false, msg: '感悟不足' };
    S.insightExp -= a.cost; S.arts[artId] = 1;
    addLog(S, '修成' + a.name + '（' + a.tier + '阶）', 'gold');
    return { ok: true, msg: '修成' + a.name };
  }
  if (lv >= a.maxLevel) return { ok: false, msg: '已至圆满' };
  const cost = Math.floor(a.cost * Math.pow(1.6, lv));
  if ((S.insightExp || 0) < cost) return { ok: false, msg: '感悟不足（需' + cost + '）' };
  S.insightExp -= cost; S.arts[artId] = lv + 1;
  addLog(S, a.name + ' 精进至 ' + (lv + 1) + ' 层', 'gold');
  return { ok: true, msg: a.name + ' → ' + (lv + 1) + ' 层' };
}

export function learnSkill(S, skillId) {
  const sk = SKILL_MAP[skillId]; if (!sk) return { ok: false, msg: '无此神通' };
  if (S.skills.includes(skillId)) return { ok: false, msg: '已习得' };
  const cost = Math.floor(sk.power * 30);
  if ((S.insightExp || 0) < cost) return { ok: false, msg: '感悟不足（需' + cost + '）' };
  S.insightExp -= cost; S.skills.push(skillId);
  addLog(S, '领悟神通 · ' + sk.name, 'gold');
  return { ok: true, msg: '领悟' + sk.name };
}

// ---------- 灵宠 ----------
export function feedPet(S, i) {
  const pet = S.pets[i]; if (!pet) return { ok: false, msg: '无此灵宠' };
  const cost = 20 + pet.level * 15;
  if ((S.stone || 0) < cost) return { ok: false, msg: '灵石不足（需' + cost + '）' };
  S.stone -= cost;
  pet.exp += 10; pet.intimacy = Math.min(100, (pet.intimacy || 0) + 6);
  const need = 30 + pet.level * 22;
  if (pet.exp >= need) { pet.exp -= need; pet.level++; addLog(S, PET_MAP[pet.id].name + ' 晋至 ' + pet.level + ' 阶', 'gold'); }
  return { ok: true, msg: '喂养' + PET_MAP[pet.id].name + ' · 亲密+' };
}

export function bondPet(S) {
  const owned = new Set(S.pets.map(p => p.id));
  const avail = PETS.filter(p => !owned.has(p.id));
  if (!avail.length) return { ok: false, msg: '已结契全部灵宠' };
  if (S.pets.length >= 4) return { ok: false, msg: '灵宠栏已满' };
  const cost = 300 + S.pets.length * 250;
  if ((S.stone || 0) < cost) return { ok: false, msg: '灵石不足（需' + cost + '）' };
  const p = pick(avail);
  S.stone -= cost;
  S.pets.push({ id: p.id, level: 1, exp: 0, intimacy: 10 });
  addLog(S, '结契灵宠 · ' + p.name + '（' + p.skill + '）', 'gold');
  return { ok: true, msg: '结契' + p.name };
}

// ---------- 秘境探险 ----------
export function enemyPower(S) {
  const d = DUNGEON_MAP[S.dungeonId] || DUNGEON_MAP.yaoshou;
  const fl = S.dungeonFloor || 1;
  return Math.floor(d.powerNeed * 40 * Math.pow(1.22, fl - 1));
}

export function explore(S, fxHooks) {
  const d = DUNGEON_MAP[S.dungeonId] || DUNGEON_MAP.yaoshou;
  const fl = S.dungeonFloor || 1;
  const ep = enemyPower(S);
  const pp = power(S);
  // 神通已在 power() 内计为倍率，此处只保留临场发挥的随机浮动
  const fight = pp * (0.85 + Math.random() * 0.4);
  if (fxHooks && fxHooks.onBattle) fxHooks.onBattle();

  if (fight >= ep) {
    // 胜
    const gainStone = Math.floor(ep * 0.06 + Math.random() * 20);
    const gainInsightExp = Math.floor(2 + fl * 0.6 + Math.random() * 4);
    S.stone += gainStone;
    S.insightExp = (S.insightExp || 0) + gainInsightExp;
    S.contribution = (S.contribution || 0) + Math.floor(fl * 0.5 + 1);
    // 掉落灵草
    if (Math.random() < 0.5) {
      const h = pick(HERBS.slice(0, Math.min(HERBS.length, 2 + Math.floor(fl / 4))));
      S.herbs[h.id] = (S.herbs[h.id] || 0) + 1;
    }
    // 灵宠机缘
    let petGot = null;
    if (Math.random() < 0.06 && S.pets.length < 4) {
      const owned = new Set(S.pets.map(p => p.id));
      const avail = PETS.filter(p => !owned.has(p.id));
      if (avail.length) { const np = pick(avail); S.pets.push({ id: np.id, level: 1, exp: 0, intimacy: 5 }); petGot = np.name; }
    }
    S.dungeonFloor = fl + 1;
    const maxF = S.dungeonMax[S.dungeonId] || 0;
    if (fl + 1 > maxF) S.dungeonMax[S.dungeonId] = fl + 1;
    S.mood = Math.random() < 0.3 ? '顿悟' : '平静';
    addLog(S, d.name + ' 第' + fl + '层 · 历练得手（灵石+' + gainStone + '）', 'gold');
    // 通关本秘境：自动踏入更高一阶，否则层数会无限膨胀、敌人无限变强
    if (S.dungeonFloor > d.floors) {
      const nx = DUNGEONS.find(x => x.powerNeed > d.powerNeed);
      if (nx && power(S) >= nx.powerNeed * 30) {
        S.dungeonId = nx.id; S.dungeonFloor = 1;
        addLog(S, '通关' + d.name + ' · 踏入' + nx.name, 'gold');
      } else {
        S.dungeonFloor = d.floors;
        addLog(S, d.name + ' 已至尽头 · 待战力再进', 'gold');
      }
    }
    return { ok: true, msg: '第' + fl + '层 · 得手', stone: gainStone, pet: petGot, floor: fl + 1 };
  } else {
    S.injury = Math.min(4, S.injury + 1);
    S.mood = '沮丧';
    // 重伤时自动退回较浅层数，避免"打不过还一直撞墙"的死循环
    if (S.injury >= 3 && fl > 1) {
      S.dungeonFloor = Math.max(1, fl - 3);
      addLog(S, '伤重难支 · 退回第' + S.dungeonFloor + '层', 'fail');
    }
    const loss = Math.floor(S.stone * 0.05);
    S.stone = Math.max(0, S.stone - loss);
    addLog(S, d.name + ' 第' + fl + '层 · 力有不逮，负伤而退', 'fail');
    return { ok: false, msg: '负伤而退', loss: loss };
  }
}

export function enterDungeon(S, dungeonId) {
  const d = DUNGEON_MAP[dungeonId]; if (!d) return { ok: false, msg: '无此秘境' };
  if (power(S) < d.powerNeed * 30) return { ok: false, msg: '战力不足（需' + fmt(d.powerNeed * 30) + '）' };
  S.dungeonId = dungeonId; S.dungeonFloor = 1;
  addLog(S, '踏入' + d.name, 'gold');
  return { ok: true, msg: '踏入' + d.name };
}

// ---------- 服丹 ----------
export function usePill(S, pillId) {
  if ((S.pills[pillId] || 0) <= 0) return { ok: false, msg: '无此丹药' };
  const nc = needCult(S.world, S.major, S.layer);
  const nb = needBody(S.world, S.major, S.layer);
  let msg = '';
  if (pillId === 'juqi') { S.cult += Math.floor(nc * 0.08); msg = '聚气丹 · 修为增进'; }
  else if (pillId === 'peiyuan') { S.cult += Math.floor(nc * 0.15); msg = '培元丹 · 修为大进'; }
  else if (pillId === 'cuiti') { S.body += Math.floor(nb * 0.18); msg = '淬体丹 · 体魄淬炼'; }
  else if (pillId === 'ningshen') { S.insight += 3; S.insightExp = (S.insightExp || 0) + 20; msg = '凝神丹 · 神识清明'; }
  else if (pillId === 'shenshi') { S.insight += 8; S.insightExp = (S.insightExp || 0) + 60; msg = '神识丹 · 神识大进'; }
  else if (pillId === 'pojing') { msg = '破境丹 · 留待突破时服用'; }
  else if (pillId === 'jiuzhuandan') { msg = '九转金丹 · 留待突破时服用'; }
  else { msg = '服下丹药'; }
  S.pills[pillId]--;
  if (S.pills[pillId] <= 0) delete S.pills[pillId];
  addLog(S, msg, '');
  return { ok: true, msg: msg };
}

// ---------- 自动行程：按需求选区 ----------
// 设计原则（系统设计师视角）：打坐是主业，农事/炼丹/参悟都是"补给"，不能挤占主循环。
// 旧版 plant→brew 无条件优先，导致打坐占比只有 12%，进度停滞。
export function pickAutoAction(S) {
  // 1) 火候已到 → 立刻渡劫（最高优先，避免修为溢出后还在干杂事）
  if (!maxedOut(S) && readyToBreak(S)) return { area: 'cave', action: 'breakthrough' };
  // 2) 灵草成熟 → 收（成熟即收，不浪费地块）
  if (ripeCount(S) > 0) return { area: 'field', action: 'harvest' };
  // 3) 空地播种（概率化：留一半回合给主业，避免农事吃满循环）
  if (emptyPlots(S) > 0 && Math.random() < 0.55) return { area: 'field', action: 'plant' };
  // 4) 丹药储备不足才开炉（旧版无条件炼丹 → 药材一有就炼，打坐被挤掉）
  const pillTotal = Object.values(S.pills || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  if (pillTotal < 8) {
    for (const r of Object.values(RECIPE_MAP)) {
      let okr = true;
      for (const k in r.need) if ((S.herbs[k] || 0) < r.need[k]) okr = false;
      if (okr) return { area: 'alchemy', action: 'brew', recipe: r.id };
    }
  }
  // 5) 喂养灵宠
  const canFeed = S.pets.some(p => (S.stone || 0) >= 20 + p.level * 15);
  if (canFeed && Math.random() < 0.1) return { area: 'pets', action: 'feed' };
  // 6) 感悟富余才参悟功法（留出余量给神通）
  for (const a of ARTS) {
    const lv = S.arts[a.id] || 0;
    const cost = lv === 0 ? a.cost : Math.floor(a.cost * Math.pow(1.6, lv));
    if (lv < a.maxLevel && (S.insightExp || 0) >= cost * 2.5 && Math.random() < 0.35) {
      return { area: 'library', action: 'trainArt', art: a.id };
    }
  }
  // 7) 秘境历练（冷却到、战力够）
  const d = DUNGEON_MAP[S.dungeonId] || DUNGEON_MAP.yaoshou;
  if (S.dungeonCd <= 0 && power(S) >= d.powerNeed * 30 && Math.random() < 0.12) {
    return { area: 'rift', action: 'explore' };
  }
  // 8) 打熬体魄：体修为主、双修均衡、法修偶一为之（三条路线都能走到练剑坪）
  const trainP = S.path === '体' ? 0.7 : (S.path === '双' ? 0.45 : 0.15);
  if (Math.random() < trainP) return { area: 'sword', action: 'train' };
  // 9) 主业：蒲团打坐
  return { area: 'cave', action: 'cultivate' };
}
