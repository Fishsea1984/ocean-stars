// 主线剧情（全自动）：按境界自动触发、自动播放、自动发奖励、自动进入下一章
// 玩家不需要点任何按钮——只要修为到了，故事自己往前走。

import { totalLayer } from './data.js';

// fx: shake 震屏 / flash 闪白 / bolt 天雷 / ember 火星 / heal 治愈 / portal 空间门
export const CHAPTERS = [
  {
    id: 'ch01', no: 1, title: '剑冢·第一声', sub: '人界 · 练气', at: 0, area: 'sword',
    beats: [
      { who: '旁白', dim: true, text: '剑冢立了七千年。七千年来，没有一个人从这万剑之间站起来。' },
      { who: '旁白', dim: true, text: '直到这一日的破晓。' },
      { who: '清玄', text: '（泥水里，一只手撑起身体）……我还活着？' },
      { who: '旁白', dim: true, text: '身后，一柄没有剑格的黑剑，颤了一下。' },
      { who: '？？？', text: '你终于醒了。归墟的孩子。', fx: 'bolt' },
      { who: '清玄', text: '谁？' },
      { who: '旁白', dim: true, text: '四下无人。只有风穿过万剑，像谁在很低地叹气。' }
    ],
    reward: { stone: 260, insightExp: 12 }
  },
  {
    id: 'ch02', no: 2, title: '铁牌', sub: '人界 · 练气', at: 3, area: 'cave',
    beats: [
      { who: '旁白', dim: true, text: '黑剑化作一块铁牌，贴进他掌心。牌上刻着两个古字——' },
      { who: '清玄', text: '「归 墟」。' },
      { who: '旁白', dim: true, text: '他不认得这两个字，却读得出它们的意思：万物终末之处。' },
      { who: '旁白', dim: true, text: '铁牌很凉。凉得像有人隔着很远的年代，把手贴在了他的手上。' }
    ],
    reward: { stone: 400, treasure: 'feijian', insightExp: 18 }
  },
  {
    id: 'ch03', no: 3, title: '拜入清心', sub: '人界 · 筑基', at: 9, area: 'library',
    beats: [
      { who: '旁白', dim: true, text: '清心宗的山门，比剑冢里所有的剑加起来还高。' },
      { who: '执事', text: '你叫什么？' },
      { who: '清玄', text: '没有名字。' },
      { who: '执事', text: '那便叫清玄。清心者，忘情而后见性。' },
      { who: '旁白', dim: true, text: '他跨过山门。身后，铁牌在袖中轻轻震了一下，像在笑。' }
    ],
    reward: { plot: 1, insightExp: 40, stone: 800 }
  },
  {
    id: 'ch04', no: 4, title: '丹房火', sub: '人界 · 金丹', at: 18, area: 'alchemy',
    beats: [
      { who: '旁白', dim: true, text: '炼丹第七日，炉子炸了。' },
      { who: '旁白', dim: true, text: '火舌蹿上房梁，所有人都在往外跑。' },
      { who: '清玄', text: '（回身）里面还有三个人。' },
      { who: '旁白', dim: true, text: '他冲进去的时候，铁牌烫得像烧红的铁。', fx: 'ember' },
      { who: '旁白', dim: true, text: '三日后，他从焦炭里走出来，衣袍无伤。宗门长老第一次正眼看他。', fx: 'heal' }
    ],
    reward: { pill: { pojing: 2 }, stone: 1500, insightExp: 60 }
  },
  {
    id: 'ch05', no: 5, title: '太玄令', sub: '人界 · 元婴', at: 36, area: 'rift',
    beats: [
      { who: '旁白', dim: true, text: '上古遗迹第九层。石门前坐着一个人形的东西，已经坐了很久。' },
      { who: '？？？', text: '持归墟令者，止步。' },
      { who: '清玄', text: '我不是来抢东西的。' },
      { who: '？？？', text: '每一个来的人，都这么说。' },
      { who: '旁白', dim: true, text: '剑光起时，遗迹里的尘埃，一夜都没有落下。', fx: 'shake' }
    ],
    reward: { treasure: 'hudun', insightExp: 150, stone: 2600 }
  },
  {
    id: 'ch06', no: 6, title: '血月', sub: '灵界 · 化神', at: 72, area: 'field',
    beats: [
      { who: '旁白', dim: true, text: '飞升雷劫落下的那一刻，天是红的。', fx: 'flash' },
      { who: '旁白', dim: true, text: '灵界没有接引。只有三艘仙盟的楼船，悬在云上。' },
      { who: '仙盟执令', text: '归墟血脉，按律当诛。' },
      { who: '清玄', text: '我什么都没做。' },
      { who: '仙盟执令', text: '你存在，就是罪。' }
    ],
    reward: { stone: 4000, insight: 2 }
  },
  {
    id: 'ch07', no: 7, title: '万剑归心', sub: '灵界 · 炼虚', at: 108, area: 'sword',
    beats: [
      { who: '旁白', dim: true, text: '他逃了整整一百年。' },
      { who: '旁白', dim: true, text: '第一百年，他回到了剑冢。' },
      { who: '旁白', dim: true, text: '万剑齐齐出鞘一尺，悬在半空，等他走过。', fx: 'bolt' },
      { who: '清玄', text: '原来你们一直在等我回来。' },
      { who: '旁白', dim: true, text: '那一夜，剑冢的剑少了一半。它们跟着他走了。' }
    ],
    reward: { treasure: 'leiyin', stone: 9000, insightExp: 300 }
  },
  {
    id: 'ch08', no: 8, title: '幽冥问骨', sub: '冥界 · 合体', at: 180, area: 'rift',
    beats: [
      { who: '旁白', dim: true, text: '冥界的河没有水，流的都是名字。' },
      { who: '旁白', dim: true, text: '他在河底捞起一具骸骨。骨上刻着两个字，与铁牌一模一样。' },
      { who: '清玄', text: '……上一世的我？' },
      { who: '旁白', dim: true, text: '骸骨没有回答。它只是散成一捧灰，落在他的掌心里。' },
      { who: '旁白', dim: true, text: '灰是温的。' }
    ],
    reward: { insight: 2, pill: { shenshi: 3 }, stone: 16000 }
  },
  {
    id: 'ch09', no: 9, title: '魔渊之约', sub: '魔界 · 大乘', at: 288, area: 'forge',
    beats: [
      { who: '旁白', dim: true, text: '魔界最深的地方，坐着一个本不该存在的人。' },
      { who: '魔主', text: '你终于来了。上一个我，已经等了九千年。' },
      { who: '清玄', text: '你在等我杀你？' },
      { who: '魔主', text: '不。我在等你问我一个问题。' },
      { who: '清玄', text: '……天劫，到底是什么？' },
      { who: '魔主', text: '是补丁。', fx: 'shake' }
    ],
    reward: { treasure: 'taixu', stone: 30000, insight: 3 }
  },
  {
    id: 'ch10', no: 10, title: '九霄审判', sub: '仙界 · 渡劫', at: 432, area: 'library',
    beats: [
      { who: '旁白', dim: true, text: '九霄之上，三十六位仙帝，同日开殿。' },
      { who: '仙帝', text: '汝承归墟之力，乱天道之序，可知罪？' },
      { who: '清玄', text: '我只知道，你们的天道，每隔一个纪元就要吃掉一个孩子。' },
      { who: '旁白', dim: true, text: '殿上寂静了一瞬。随后三千道雷霆落下。', fx: 'bolt' }
    ],
    reward: { stone: 90000, insight: 3 }
  },
  {
    id: 'ch11', no: 11, title: '混沌归零', sub: '混沌界 · 道之尽头', at: 720, area: 'rift',
    beats: [
      { who: '旁白', dim: true, text: '混沌海没有上，也没有下。' },
      { who: '旁白', dim: true, text: '他在这里看见了天的本体——一张写满补丁、正在腐烂的纸。' },
      { who: '清玄', text: '所以你每次修不好，就把整块撕掉，重新写一遍。' },
      { who: '？？？', text: '这是最省事的写法。' },
      { who: '清玄', text: '那换我来写。', fx: 'flash' }
    ],
    reward: { pill: { jiuzhuandan: 1 }, insight: 5, stone: 300000 }
  },
  {
    id: 'ch12', no: 12, title: '清心', sub: '终章', at: 1080, area: 'cave',
    beats: [
      { who: '旁白', dim: true, text: '那一年，天道重写。' },
      { who: '旁白', dim: true, text: '没有雷劫，没有仙盟，没有补丁。' },
      { who: '旁白', dim: true, text: '只有一个人在剑冢里坐了很久，然后把一块铁牌埋进了土里。' },
      { who: '清玄', text: '名字还你。我叫清玄。' },
      { who: '旁白', dim: true, text: '—— 主线完 · 此后仍可继续修行 ——', fx: 'heal' }
    ],
    reward: { stone: 600000, insight: 10 }
  }
];

export const STORY_TOTAL = CHAPTERS.length;

// 两章之间的最小间隔（游戏内秒；1 日 = 150 秒，故约 1.5 个修行日）
// 没有这个，前 5 章会在开局 5 分钟内被一次性播完，之后几周都没有剧情
export const MIN_GAP = 220;

// 应播放的下一章：已到境界且未看过，且与上一章拉开间隔
export function nextChapter(S) {
  const done = (S.story && S.story.done) || [];
  const L = totalLayer(S.world, S.major, S.layer);
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (done.indexOf(c.id) === -1 && L >= c.at) {
      if (done.length === 0) return c;                       // 第一章立即播
      const last = (S.story && S.story.at) || 0;
      if ((S.time || 0) - last >= MIN_GAP) return c;          // 距上一章够久才播
      return null;
    }
  }
  return null;
}

// 距下一章还差多少游戏秒（用于 HUD 提示）
export function gapLeft(S) {
  const done = (S.story && S.story.done) || [];
  if (!done.length) return 0;
  const last = (S.story && S.story.at) || 0;
  return Math.max(0, MIN_GAP - ((S.time || 0) - last));
}

export function chapterProgress(S) {
  const done = (S.story && S.story.done) || [];
  return Math.min(STORY_TOTAL, done.length);
}

export function chapterById(id) {
  for (let i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === id) return CHAPTERS[i];
  return null;
}

// 单条台词自动推进时长（按字数，慢一点更有戏）
export function beatDuration(beat) {
  const n = (beat.text || '').length;
  const d = 1.1 + n * 0.085;
  return Math.max(2.0, Math.min(6.4, d));
}

// 发奖励，返回可读的描述数组
export function applyReward(S, r) {
  const out = [];
  if (!r) return out;
  if (r.stone) { S.stone = (S.stone || 0) + r.stone; out.push('灵石 +' + r.stone); }
  if (r.insightExp) { S.insightExp = (S.insightExp || 0) + r.insightExp; out.push('感悟 +' + r.insightExp); }
  if (r.insight) { S.insight = (S.insight || 0) + r.insight; out.push('神识 +' + r.insight); }
  if (r.plot) { S.plotCount = Math.min(8, (S.plotCount || 3) + r.plot); out.push('灵田 +' + r.plot + ' 块'); }
  if (r.pill) {
    S.pills = S.pills || {};
    for (const k in r.pill) { S.pills[k] = (S.pills[k] || 0) + r.pill[k]; out.push(PILL_NAME[k] + ' ×' + r.pill[k]); }
  }
  if (r.treasure) {
    S.treasures = S.treasures || [];
    if (S.treasures.indexOf(r.treasure) === -1) { S.treasures.push(r.treasure); out.push('法宝「' + (TREASURE_NAME[r.treasure] || r.treasure) + '」'); }
  }
  if (r.pet) {
    S.pets = S.pets || [];
    if (!S.pets.some(p => p.id === r.pet)) { S.pets.push({ id: r.pet, level: 1, exp: 0, intimacy: 30 }); out.push('灵宠「' + (PET_NAME[r.pet] || r.pet) + '」'); }
  }
  return out;
}

const PILL_NAME = {
  juqi: '聚气丹', peiyuan: '培元丹', ningshen: '凝神丹', pojing: '破境丹',
  cuiti: '淬体丹', shenshi: '神识丹', jiuzhuandan: '九转金丹'
};
const TREASURE_NAME = {
  feijian: '青霜剑', hudun: '玄龟盾', dingfeng: '定风珠', leiyin: '雷音铃', taixu: '太虚镜'
};
const PET_NAME = {
  fox: '灵狐', crane: '仙鹤', turtle: '玄龟', qilin: '麒麟', qingluan: '青鸾', baize: '白泽'
};

// 给"问道"用的当前剧情摘要
export function storySummary(S) {
  const done = (S.story && S.story.done) || [];
  if (!done.length) return '故事还没开始。剑冢里有一柄黑剑，在等人。';
  const last = chapterById(done[done.length - 1]);
  if (!last) return '';
  const next = CHAPTERS[done.length];
  return '已历「' + last.title + '」。' + (next ? '下一章「' + next.title + '」尚未到时。' : '主线已尽，此后皆是余韵。');
}
