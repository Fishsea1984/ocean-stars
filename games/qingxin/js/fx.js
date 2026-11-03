// pixelfx 实时特效管理器（统一在一个低分辨率 frame 里 composite 后叠加到主画布）

import { createFrame, clearFrame, createFx, composite } from '../pixelfx/core/index.js';
import * as fxCampfire from '../pixelfx/fx/fire/campfire.js';
import * as fxFireball from '../pixelfx/fx/fire/fireball.js';
import * as fxLightning from '../pixelfx/fx/lightning/lightning-strike.js';
import * as fxZap from '../pixelfx/fx/lightning/zap-hit.js';
import * as fxRune from '../pixelfx/fx/arcane/rune-circle.js';
import * as fxPortal from '../pixelfx/fx/arcane/portal.js';
import * as fxMana from '../pixelfx/fx/arcane/mana-burst.js';
import * as fxMissiles from '../pixelfx/fx/arcane/arcane-missiles.js';
import * as fxCollect from '../pixelfx/fx/pickups/collect-burst.js';
import * as fxXp from '../pixelfx/fx/pickups/xp-orb.js';
import * as fxHit from '../pixelfx/fx/impacts/hit-flash.js';
import * as fxSpark from '../pixelfx/fx/impacts/hit-spark.js';
import * as fxCrit from '../pixelfx/fx/impacts/crit-hit.js';
import * as fxHeal from '../pixelfx/fx/holy/heal.js';
import * as fxHalo from '../pixelfx/fx/holy/halo.js';
import * as fxSmite from '../pixelfx/fx/holy/smite.js';
import * as fxFrost from '../pixelfx/fx/ice/frost-nova.js';
import * as fxBoom from '../pixelfx/fx/explosions/small-explosion.js';
import * as fxWisp from '../pixelfx/fx/critters/wisp.js';
import * as fxBurning from '../pixelfx/fx/status/burning.js';

import { PX_W, PX_H, PX_S } from './state.js';

export const FXMOD = {
  campfire: fxCampfire, fireball: fxFireball, lightning: fxLightning, zap: fxZap,
  rune: fxRune, portal: fxPortal, mana: fxMana, missiles: fxMissiles,
  collect: fxCollect, xp: fxXp, hit: fxHit, spark: fxSpark, crit: fxCrit,
  heal: fxHeal, halo: fxHalo, smite: fxSmite, frost: fxFrost, boom: fxBoom,
  wisp: fxWisp, burning: fxBurning
};

export const FX = {
  frame: null, img: null, cv: null, c2: null, list: [], amb: {},
  init() {
    this.frame = createFrame(PX_W, PX_H);
    this.img = new ImageData(PX_W, PX_H);
    this.cv = document.createElement('canvas'); this.cv.width = PX_W; this.cv.height = PX_H;
    this.c2 = this.cv.getContext('2d');
  },
  spawn(mod, x, y, opts) {
    if (!mod) return null;
    const o = Object.assign({ x: x * PX_S, y: y * PX_S, seed: (Math.random() * 99) | 0 }, opts || {});
    const f = createFx(mod, o);
    this.list.push(f); return f;
  },
  ambSet(key, mod, x, y, opts) {
    let a = this.amb[key];
    const o = Object.assign({ x: x * PX_S, y: y * PX_S, seed: (Math.random() * 99) | 0 }, opts || {});
    if (!a || a.mod !== mod) { a = this.amb[key] = { mod: mod, inst: createFx(mod, o) }; }
    else {
      a.inst.options.x = x * PX_S; a.inst.options.y = y * PX_S;
      if (opts) Object.assign(a.inst.options, opts);
    }
    return a.inst;
  },
  ambClear(key) { delete this.amb[key]; },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i]; f.update(dt);
      if (f.done && f.done()) this.list.splice(i, 1);
    }
    for (const k in this.amb) { if (this.amb[k].inst) this.amb[k].inst.update(dt); }
  },
  draw(mainCtx) {
    if (!this.frame) return;
    clearFrame(this.frame);
    for (let i = 0; i < this.list.length; i++) { if (this.list[i].draw) this.list[i].draw(this.frame, 'front'); }
    for (const k in this.amb) { const a = this.amb[k]; if (a.inst && a.inst.draw) a.inst.draw(this.frame, 'front'); }
    composite(this.frame, this.img.data, null);
    this.c2.putImageData(this.img, 0, 0);
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'lighter';
    mainCtx.imageSmoothingEnabled = false;
    mainCtx.drawImage(this.cv, 0, 0, PX_W, PX_H, 0, 0, PX_W, PX_H);
    mainCtx.restore();
  }
};
