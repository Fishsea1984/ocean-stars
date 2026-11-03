// 状态管理与存档（本地 + 服务器双写）

import {
  HERBS, HERB_MAP, PETS, PET_MAP, ARTS, ART_MAP, SKILLS, SKILL_MAP,
  TREASURE_MAP, RECIPES, DUNGEONS, DUNGEON_MAP, AREAS, AREA_MAP, PATHS, MOODS
} from './data.js';

export const SAVE_KEY = 'qingxin_pixel_save_v2';
export const PX_W = 480, PX_H = 310, PX_S = PX_W / 960;

export const SAVE_API = window.QINGXIN_SAVE_API || 'https://fishsea.tbit.xin/qingxin-pixel/save.php';

export const SAVE_TOKEN = (function () {
  try {
    var t = localStorage.getItem('qx_token');
    if (!t) { t = 'u' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('qx_token', t); }
    return t;
  } catch (e) { return 'anon'; }
})();

// ---------- 默认状态 ----------
export function freshState() {
  return {
    // 境界
    world: 0, major: 0, layer: 0,
    cult: 0, body: 0,
    path: '法',
    // 属性
    qi: 100, maxQi: 100,
    insight: 1,
    mood: '平静',
    injury: 0,
    // 资源
    stone: 50,
    herbs: {},          // { herbId: count }
    pills: {},          // { pillId: count }
    treasures: [],      // 法宝 id 列表
    // 灵田
    plotCount: 3,
    plots: Array.from({ length: 8 }, () => ({ herb: null, left: 0, total: 0 })),
    // 灵宠
    pets: [],           // [{ id, level, exp, intimacy }]
    // 功法 / 神通
    arts: { qingxin: 1 },
    skills: ['yujian'],
    insightExp: 0,      // 感悟（升级功法/学神通用）
    // 秘境
    dungeonId: 'yaoshou',
    dungeonFloor: 1,
    dungeonMax: {},     // { dungeonId: 最高层 }
    dungeonCd: 0,
    // 宗门
    sectJoined: false, sectLevel: 1, contribution: 0,
    // 统计
    day: 1, time: 0, total: 0,
    // 主线剧情（自动推进）：done = 已播完的章节 id，at = 上一章播完时的游戏内秒
    story: { done: [], last: '', at: 0 },
    journal: [],
    savedAt: 0,
    // 当前区域与角色
    area: 'cave',
    ch: { x: 466, y: 412, facing: 1, state: 'idle', action: null, t: 0, dur: 0, phase: 0 }
  };
}

// 补齐缺失字段（跨版本存档兼容）
export function normalize(src) {
  const d = freshState();
  const S = Object.assign({}, d, src || {});
  // 深拷贝可变结构
  S.herbs = Object.assign({}, src && src.herbs);
  S.pills = Object.assign({}, src && src.pills);
  S.arts = Object.assign({}, d.arts, src && src.arts);
  S.dungeonMax = Object.assign({}, src && src.dungeonMax);
  S.treasures = Array.isArray(src && src.treasures) ? src.treasures.slice() : [];
  S.skills = Array.isArray(src && src.skills) ? src.skills.slice() : d.skills;
  S.pets = Array.isArray(src && src.pets) ? src.pets.slice() : [];
  S.journal = Array.isArray(src && src.journal) ? src.journal.slice(0, 200) : [];
  // 主线进度
  const st = (src && src.story) || {};
  S.story = {
    done: Array.isArray(st.done) ? st.done.filter(x => typeof x === 'string').slice(0, 64) : [],
    last: typeof st.last === 'string' ? st.last : '',
    at: Math.max(0, Number.isFinite(st.at) ? Math.floor(st.at) : 0)
  };
  // 灵田地块补齐
  const plots = [];
  for (let i = 0; i < 8; i++) {
    const p = (src && src.plots && src.plots[i]) || {};
    const herb = (p && HERB_MAP[p.herb]) ? p.herb : null;
    const left = Number.isFinite(p.left) ? Math.max(0, Math.floor(p.left)) : 0;
    plots.push({ herb: herb, left: herb ? left : 0, total: herb ? Math.max(1, Number.isFinite(p.total) ? Math.floor(p.total) : left || 1) : 0 });
  }
  S.plots = plots;
  // 角色
  S.ch = Object.assign({}, d.ch, src && src.ch);
  if (!Number.isFinite(S.ch.x)) S.ch.x = d.ch.x;
  if (!Number.isFinite(S.ch.y)) S.ch.y = d.ch.y;
  // 灵宠集合清洗
  S.pets = (Array.isArray(S.pets) ? S.pets : [])
    .filter(p => p && PET_MAP[p.id])
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      level: num(p.level, 1, 1, 999),
      exp: num(p.exp, 0, 0, 1e9),
      intimacy: num(p.intimacy, 5, 0, 100)
    }));
  S.skills = (Array.isArray(S.skills) ? S.skills : []).filter(x => SKILL_MAP[x]).slice(0, 16);
  S.treasures = (Array.isArray(S.treasures) ? S.treasures : []).filter(x => TREASURE_MAP[x]).slice(0, 16);
  for (const k in S.arts) if (!ART_MAP[k] || !Number.isFinite(S.arts[k])) delete S.arts[k];
  for (const k in S.arts) S.arts[k] = num(S.arts[k], 1, 1, 99);
  // 资源字典清洗：只保留合法 id，且计数为非负有限数
  S.herbs = cleanBag(S.herbs, HERBS);
  S.pills = cleanBag(S.pills, [...RECIPES, { id: 'jiuzhuandan' }]);
  // 数值范围校正（畸形输入一律夹回合法区间，绝不产生脏数据）
  S.world = num(S.world, 0, 0, 20);
  S.major = num(S.major, 0, 0, 7);
  S.layer = num(S.layer, 0, 0, 8);
  S.injury = num(S.injury, 0, 0, 4);
  S.stone = num(S.stone, 50, 0, 1e15);
  S.cult = num(S.cult, 0, 0, 1e18);
  S.body = num(S.body, 0, 0, 1e18);
  S.insight = num(S.insight, 1, 0, 1e12);
  S.insightExp = num(S.insightExp, 0, 0, 1e15);
  S.contribution = num(S.contribution, 0, 0, 1e15);
  S.qi = num(S.qi, 100, 0, 1e9);
  S.maxQi = num(S.maxQi, 100, 1, 1e9);
  S.day = num(S.day, 1, 1, 1e9);
  S.time = num(S.time, 0, 0, 1e12);
  S.total = num(S.total, 0, 0, 1e12);
  S.plotCount = num(S.plotCount, 3, 3, 8);
  S.dungeonFloor = num(S.dungeonFloor, 1, 1, 999);
  S.dungeonCd = num(S.dungeonCd, 0, 0, 1e6);
  S.sectLevel = num(S.sectLevel, 1, 1, 99);
  S.sectJoined = !!S.sectJoined;
  if (!DUNGEON_MAP[S.dungeonId]) S.dungeonId = 'yaoshou';
  if (!AREA_MAP[S.area]) S.area = 'cave';
  if (!PATHS.includes(S.path)) S.path = '法';
  if (!MOODS.includes(S.mood)) S.mood = '平静';
  return S;
}

// 数值夹取：非有限值回退默认，越界夹紧
function num(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
// 资源字典：只保留合法 id + 非负计数
function cleanBag(bag, defs) {
  const ids = new Set((defs || []).map(x => x.id));
  const out = {};
  if (bag && typeof bag === 'object' && !Array.isArray(bag)) {
    for (const k in bag) {
      const n = Number(bag[k]);
      if (ids.has(k) && Number.isFinite(n) && n > 0) out[k] = Math.floor(n);
    }
  }
  return out;
}

// ---------- 存档：本地 + 服务器（免登录，token 隔离）----------
export const Save = {
  push(state) {
    if (SAVE_API.indexOf('REPLACE') === 0) return;
    try {
      fetch(SAVE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: SAVE_TOKEN, data: state, ts: Date.now() }), keepalive: true
      }).catch(function () {});
    } catch (e) {}
  },
  pull(cb) {
    if (SAVE_API.indexOf('REPLACE') === 0) return;
    fetch(SAVE_API + '?t=' + encodeURIComponent(SAVE_TOKEN), { method: 'GET', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.ok && j.data) cb(j.data, j.ts || 0); })
      .catch(function () {});
  },
  clear() {
    if (SAVE_API.indexOf('REPLACE') === 0) return;
    try {
      fetch(SAVE_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: SAVE_TOKEN, clear: true }), keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }
};

export function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch (e) { return null; }
}

export function saveLocal(S) {
  S.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  Save.push(S);
}
