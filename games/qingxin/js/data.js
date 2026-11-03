// 修仙数据与常量（重做版）

// ---------- 境界体系：21 界 × 8 大境界 × 9 层 ----------
export const WORLD_NAMES = [
  '人界', '灵界', '冥界', '妖界', '魔界', '鬼界', '仙界', '神界', '圣界', '混沌界',
  '太虚界', '洪荒界', '九霄界', '紫微界', '大罗界', '无极界', '鸿蒙界', '太初界', '归墟界', '永恒界', '道界'
];

export const REALM_MAJOR = ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘'];
export const REALM_MINOR = ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层'];
export const LAYERS_PER_MAJOR = 9;
export const MAJOR_COUNT = REALM_MAJOR.length;
export const LAYERS_PER_WORLD = MAJOR_COUNT * LAYERS_PER_MAJOR; // 72

export const BANDS = [
  { upto: 1, name: '凡尘', color: '#93a0b0' },
  { upto: 2, name: '灵境', color: '#79c9a3' },
  { upto: 3, name: '玄境', color: '#7ab6d9' },
  { upto: 4, name: '地境', color: '#c9a961' },
  { upto: 5, name: '天境', color: '#e4833f' },
  { upto: 6, name: '圣境', color: '#d97ab6' },
  { upto: 99, name: '道境', color: '#f0e6c8' }
];

export const PATHS = ['法', '体', '双'];
export const PATH_NAMES = { '法': '法修', '体': '体修', '双': '双修' };

// 突破所需：总层数越高越难，每飞升一界额外倍率
export function totalLayer(world, major, layer) {
  return world * LAYERS_PER_WORLD + major * LAYERS_PER_MAJOR + layer;
}
// 需求曲线：界内按 1.009^k 缓增，飞升一界整体 ×2.0
// 单调性保证：1.009^71 ≈ 1.889 < 2.0 → 飞升时需求只增不减（旧式 1.16^k 会导致飞升时需求塌陷 ×2 万倍）
// 产出侧同步用 1.006^k × 1.62^world（1.006^71 ≈ 1.529 < 1.62），净耗时 = 52秒 → 1.2小时，全程可达
export function needCult(world, major, layer) {
  const k = major * LAYERS_PER_MAJOR + layer;
  return Math.floor(60 * Math.pow(1.009, k) * Math.pow(2.0, world));
}
export function needBody(world, major, layer) {
  const k = major * LAYERS_PER_MAJOR + layer;
  return Math.floor(72 * Math.pow(1.0085, k) * Math.pow(2.0, world));
}

export function realmText(world, major, layer) {
  return REALM_MAJOR[major] + REALM_MINOR[layer];
}
export function worldText(world) { return WORLD_NAMES[world] || '未知界'; }
export function bandFor(world) {
  const w = world + 1;
  for (const b of BANDS) if (w <= b.upto) return b;
  return BANDS[BANDS.length - 1];
}

// ---------- 灵草（重做：7 种，各有像素配色与生长时间）----------
// color: [暗, 中, 亮, 灵光]
export const HERBS = [
  { id: 'ninglu', name: '凝露草', tier: 1, grow: 55, color: ['#1d3d34', '#3a7f6f', '#6fd6c0', '#bff5ea'], desc: '叶尖凝露，最基础的灵草', use: '炼制聚气丹' },
  { id: 'chiyang', name: '赤阳参', tier: 2, grow: 95, color: ['#4a1712', '#a8331f', '#e2703c', '#ffd08a'], desc: '根茎赤红，蕴含火灵之气', use: '炼制培元丹' },
  { id: 'yuehua', name: '月华芝', tier: 2, grow: 110, color: ['#2a2a44', '#5a5a8c', '#9aa8e0', '#dfe6ff'], desc: '夜间生辉的灵芝，吸纳月华', use: '炼制凝神丹' },
  { id: 'qixing', name: '七星莲', tier: 3, grow: 150, color: ['#123021', '#2a6047', '#5aa87c', '#c8ffe4'], desc: '七叶如星，聚灵之效极佳', use: '炼制破境丹' },
  { id: 'longxue', name: '龙血藤', tier: 3, grow: 190, color: ['#3a0f1c', '#7a1d33', '#b83050', '#ff7a9a'], desc: '藤中凝有龙血，淬体圣品', use: '炼制淬体丹' },
  { id: 'youming', name: '幽冥兰', tier: 4, grow: 240, color: ['#231038', '#4a2270', '#8a52c8', '#d9b0ff'], desc: '生于幽冥，花香可通神识', use: '炼制神识丹' },
  { id: 'jiuzhuan', name: '九转金莲', tier: 5, grow: 320, color: ['#4a3208', '#9a6a10', '#e0a828', '#fff0a0'], desc: '金莲九转，服之可助大乘', use: '炼制九转金丹' }
];
export const HERB_MAP = Object.fromEntries(HERBS.map(h => [h.id, h]));

// ---------- 丹方 ----------
export const RECIPES = [
  { id: 'juqi', name: '聚气丹', need: { ninglu: 2 }, out: 'juqi', desc: '服之灵气自生', effect: { cult: 1.25 } },
  { id: 'peiyuan', name: '培元丹', need: { chiyang: 2, ninglu: 1 }, out: 'peiyuan', desc: '温养丹田，增进修为', effect: { cult: 1.5 } },
  { id: 'ningshen', name: '凝神丹', need: { yuehua: 2 }, out: 'ningshen', desc: '安定神识，提升突破成功率', effect: { insight: 1.2 } },
  { id: 'pojing', name: '破境丹', need: { qixing: 2, ninglu: 1 }, out: 'pojing', desc: '破境时服之，大幅提升成功率', effect: { breakthrough: 0.2 } },
  { id: 'cuiti', name: '淬体丹', need: { longxue: 2 }, out: 'cuiti', desc: '淬炼筋骨，增进体魄', effect: { body: 1.6 } },
  { id: 'shenshi', name: '神识丹', need: { youming: 2, yuehua: 1 }, out: 'shenshi', desc: '壮大神识，秘境探索更远', effect: { insight: 1.5 } },
  { id: 'jiuzhuan', name: '九转金丹', need: { jiuzhuan: 1, qixing: 1 }, out: 'jiuzhuandan', desc: '逆天之丹，突破必成', effect: { breakthrough: 0.5 } }
];
export const RECIPE_MAP = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// ---------- 法宝 ----------
export const TREASURES = [
  { id: 'feijian', name: '青霜剑', cost: { stone: 200 }, power: 120, desc: '一柄清冷的飞剑' },
  { id: 'hudun', name: '玄龟盾', cost: { stone: 350 }, power: 90, desc: '厚重坚实，可挡雷霆' },
  { id: 'dingfeng', name: '定风珠', cost: { stone: 600 }, power: 150, desc: '定住风息，身法自若' },
  { id: 'leiyin', name: '雷音铃', cost: { stone: 1200 }, power: 260, desc: '摇之雷音震魂' },
  { id: 'taixu', name: '太虚镜', cost: { stone: 2500 }, power: 480, desc: '照见太虚，万法不侵' }
];
export const TREASURE_MAP = Object.fromEntries(TREASURES.map(t => [t.id, t]));

// ---------- 灵宠 ----------
export const PETS = [
  { id: 'fox', name: '灵狐', color: ['#5a2a12', '#a8541f', '#e08a3c', '#ffd0a0'], rarity: 1, bonus: { cult: 1.12 }, skill: '惑心', desc: '狡黠灵动，助长悟性' },
  { id: 'crane', name: '仙鹤', color: ['#2a3a44', '#5a7a8c', '#a8c8d8', '#f0f8ff'], rarity: 1, bonus: { insight: 1.15 }, skill: '清唳', desc: '高洁清唳，开拓神识' },
  { id: 'turtle', name: '玄龟', color: ['#1a2a22', '#3a5a44', '#6a8a6c', '#b0d0b8'], rarity: 2, bonus: { body: 1.2 }, skill: '玄甲', desc: '负重厚甲，淬体极佳' },
  { id: 'qilin', name: '麒麟', color: ['#5a1208', '#a8281c', '#e0583c', '#ffb08a'], rarity: 3, bonus: { power: 1.25 }, skill: '焚天', desc: '瑞兽踏火，战力大增' },
  { id: 'qingluan', name: '青鸾', color: ['#123a4a', '#2a7a9a', '#5ab8d8', '#c0f0ff'], rarity: 3, bonus: { cult: 1.2 }, skill: '青羽', desc: '青羽振风，灵气盈溢' },
  { id: 'baize', name: '白泽', color: ['#2a2a2a', '#5a5a5a', '#a0a0a0', '#f0f0f0'], rarity: 4, bonus: { insight: 1.3 }, skill: '通灵', desc: '通晓万物，神识如海' }
];
export const PET_MAP = Object.fromEntries(PETS.map(p => [p.id, p]));

// ---------- 功法（品阶：黄/玄/地/天）----------
export const ARTS = [
  { id: 'qingxin', name: '清心诀', tier: '黄', maxLevel: 9, cost: 30, bonus: { cultSpeed: 0.06, bodySpeed: 0.04 }, desc: '入门心法，清心寡欲' },
  { id: 'taixuan', name: '太玄经', tier: '玄', maxLevel: 9, cost: 90, bonus: { cultSpeed: 0.12, power: 0.08 }, desc: '玄门正宗，灵气绵长' },
  { id: 'zifu', name: '紫府真经', tier: '地', maxLevel: 9, cost: 220, bonus: { cultSpeed: 0.2, insight: 0.1 }, desc: '紫府洞开，悟性大进' },
  { id: 'wangqing', name: '太上忘情诀', tier: '天', maxLevel: 9, cost: 600, bonus: { cultSpeed: 0.35, bodySpeed: 0.2, power: 0.15 }, desc: '忘情至道，进境如飞' },
  { id: 'jiuzhuan', name: '九转玄功', tier: '天', maxLevel: 9, cost: 900, bonus: { bodySpeed: 0.4, power: 0.25 }, desc: '淬体圣法，肉身成圣' }
];
export const ART_MAP = Object.fromEntries(ARTS.map(a => [a.id, a]));
export const ART_TIER_ORDER = ['黄', '玄', '地', '天'];

// ---------- 神通（战斗技能）----------
export const SKILLS = [
  { id: 'yujian', name: '御剑诀', type: '法', power: 1.8, cost: 20, cd: 3, desc: '以气御剑，斩出一道剑光' },
  { id: 'zhanglei', name: '掌心雷', type: '法', power: 2.4, cost: 35, cd: 5, desc: '掌心凝雷，轰然炸响' },
  { id: 'jingang', name: '金刚不坏', type: '体', power: 1.5, cost: 15, cd: 4, desc: '运起体修罡气，硬撼敌手' },
  { id: 'bingfeng', name: '冰封千里', type: '法', power: 3.0, cost: 50, cd: 7, desc: '寒气四溢，冻结万物' },
  { id: 'fenrian', name: '烈焰焚天', type: '法', power: 3.6, cost: 65, cd: 9, desc: '真火焚空，万物成灰' },
  { id: 'suiming', name: '碎灭指', type: '体', power: 2.8, cost: 40, cd: 6, desc: '一指碎灭，穿透护体罡气' }
];
export const SKILL_MAP = Object.fromEntries(SKILLS.map(s => [s.id, s]));

// ---------- 秘境（多层探险）----------
export const DUNGEONS = [
  { id: 'yaoshou', name: '妖兽森林', floors: 12, color: ['#12200f', '#1e3a18', '#2d5a26', '#4a8a3c'], powerNeed: 1.0, desc: '妖兽出没，历练之初' },
  { id: 'yiji', name: '上古遗迹', floors: 20, color: ['#1a1a24', '#2a2a3c', '#3a3a58', '#5a5a7c'], powerNeed: 3.0, desc: '远古残垣，藏有秘宝' },
  { id: 'moyuan', name: '魔渊', floors: 30, color: ['#200a14', '#3a1224', '#5a1e3a', '#8a2c58'], powerNeed: 8.0, desc: '魔气森森，九死一生' },
  { id: 'xiangong', name: '仙宫', floors: 50, color: ['#2a2410', '#4a3c18', '#7a6428', '#b8a040'], powerNeed: 20.0, desc: '仙人遗宫，机缘无尽' },
  { id: 'hundun', name: '混沌海', floors: 100, color: ['#14141c', '#24243c', '#3c3c5c', '#5c5c8c'], powerNeed: 60.0, desc: '混沌未开，道之尽头' }
];
export const DUNGEON_MAP = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

// ---------- 区域（8 大场景）----------
export const AREAS = [
  { id: 'cave', name: '清修洞府', act: 'cultivate', desc: '蒲团静坐，运转周天' },
  { id: 'field', name: '灵田', act: 'farm', desc: '种植灵草，静待成熟' },
  { id: 'pets', name: '灵兽园', act: 'pet', desc: '灵宠栖息，喂养培养' },
  { id: 'sword', name: '练剑坪', act: 'sword', desc: '挥剑淬体，砥砺战力' },
  { id: 'alchemy', name: '丹房', act: 'alchemy', desc: '丹炉炼药，火候为要' },
  { id: 'forge', name: '炼器台', act: 'forge', desc: '锤锻法宝，锋芒乃成' },
  { id: 'library', name: '藏经阁', act: 'study', desc: '参悟玉简，习得神通' },
  { id: 'rift', name: '秘境', act: 'dungeon', desc: '外出历练，九死一生' }
];
export const AREA_MAP = Object.fromEntries(AREAS.map(a => [a.id, a]));

// ---------- 心境 ----------
export const MOODS = ['平静', '喜悦', '坚毅', '焦灼', '沮丧', '顿悟', '空明'];
export const INJURY_NAMES = ['无伤', '轻伤', '重伤', '垂危', '走火入魔'];

// ---------- 工具 ----------
export function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return String(n);
  if (n < 1e8) return (n / 1e4).toFixed(2) + '万';
  if (n < 1e12) return (n / 1e8).toFixed(2) + '亿';
  if (n < 1e16) return (n / 1e12).toFixed(2) + '兆';
  return n.toExponential(2);
}

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
