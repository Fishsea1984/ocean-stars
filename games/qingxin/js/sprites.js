// 像素精灵加载器
// 素材来源：pixel-asset-forge 流程（文生图直出 → 去白底/硬边/缩到精确像素尺寸 → quality_check 质检 SHIP）
// 全部为透明 RGBA、硬边、无抗锯齿。主角 32×56，道童 32×44。

const HERO_WALK = ['hero_walk1.png', 'hero_walk2.png'];

export const SPR = {
  heroIdle: null,
  heroSit: null,
  heroWalk: [null, null],
  attIdle: null,
  attWalk: null,
  loaded: 0,
  total: 6
};

function url(f) { return new URL('../assets/' + f, import.meta.url).href; }

function mk(f, onReady) {
  const im = new Image();
  im.decoding = 'sync';
  im.onload = () => { SPR.loaded++; if (onReady) onReady(im); };
  im.onerror = () => { SPR.total--; };
  im.src = url(f);
  return im;
}

export function loadSprites() {
  SPR.heroIdle = mk('hero_idle.png');
  SPR.heroSit = mk('hero_sit.png');
  HERO_WALK.forEach((f, i) => { SPR.heroWalk[i] = mk(f); });
  SPR.attIdle = mk('att_idle.png');
  SPR.attWalk = mk('att_walk.png');
}

export function spritesOk() { return SPR.loaded >= 5; }
export function ready(im) { return !!im && im.complete && im.naturalWidth > 0; }

// 以「脚底中心」为锚点绘制：x=中心，y=脚底所在地面线
// s = 缩放（1 精灵像素 = s 场景像素）。主角用 2（缓冲里正好 1:1，最锐利）
export function blit(ctx, im, x, y, s, facing, bob) {
  if (!ready(im)) return false;
  const w = im.naturalWidth, h = im.naturalHeight;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + (bob || 0)));
  ctx.scale(facing < 0 ? -s : s, s);
  ctx.drawImage(im, Math.round(-w / 2), Math.round(-h));
  ctx.restore();
  return true;
}

// 脚下的软阴影（像素化，不用抗锯齿椭圆）
export function shadow(ctx, x, y, w) {
  ctx.save();
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), Math.round(w), 3);
  ctx.globalAlpha = 0.10;
  ctx.fillRect(Math.round(x - w / 2 - 3), Math.round(y - 1), Math.round(w + 6), 2);
  ctx.restore();
}
