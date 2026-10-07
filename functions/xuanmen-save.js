/**
 * 玄门问道 · 云端存档（Cloudflare Pages Functions 版）
 *
 * 部署后接口地址就是：https://你的项目.pages.dev/xuanmen-save
 *   GET  ?action=ping             健康检查
 *   GET  ?action=load&key=存档码   读取
 *   POST {"key":"存档码","data":"存档内容"}   写入
 *
 * 需要在 Pages 项目里绑定一个 R2 存储桶，变量名必须是 SAVES：
 *   Workers & Pages → 你的项目 → Settings → Functions → R2 bucket bindings → 添加
 *   Variable name: SAVES      R2 bucket: xuanmen-saves（新建即可）
 */

const MAX_BYTES = 512 * 1024; // 单份存档 512KB

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

function validKey(k) {
  return typeof k === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(k);
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function bucket(env) {
  if (!env.SAVES) {
    return json({ ok: false, error: '服务端未绑定 R2 存储（变量名应为 SAVES）' }, 500);
  }
  return null;
}

/* ---------- 预检 ---------- */
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

/* ---------- 读取 ---------- */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  if (url.searchParams.get('action') === 'ping') {
    return json({
      ok: true,
      service: 'xuanmen-save',
      engine: 'cloudflare-pages',
      time: Math.floor(Date.now() / 1000),
    });
  }

  const err = await bucket(env);
  if (err) return err;

  const key = url.searchParams.get('key') || '';
  if (!validKey(key)) {
    return json({ ok: false, error: '存档码格式不正确（16-64 位字母数字）' }, 400);
  }

  const name = 'saves/' + (await sha256Hex(key)) + '.json';
  const obj = await env.SAVES.get(name);
  if (!obj) return json({ ok: true, exists: false });

  try {
    const j = await obj.json();
    if (!j || typeof j.data !== 'string') throw new Error('bad');
    return json({
      ok: true,
      exists: true,
      updated: j.updated || 0,
      size: j.size || j.data.length,
      data: j.data,
    });
  } catch (e) {
    return json({ ok: false, error: '存档文件已损坏' }, 500);
  }
}

/* ---------- 写入 ---------- */
export async function onRequestPost({ request, env }) {
  const err = await bucket(env);
  if (err) return err;

  let req;
  try {
    req = await request.json();
  } catch (e) {
    return json({ ok: false, error: '请求体不是合法 JSON' }, 400);
  }

  const key = typeof req.key === 'string' ? req.key : '';
  if (!validKey(key)) {
    return json({ ok: false, error: '存档码格式不正确（16-64 位字母数字）' }, 400);
  }
  if (typeof req.data !== 'string') {
    return json({ ok: false, error: '缺少存档内容' }, 400);
  }

  const bytes = new TextEncoder().encode(req.data).length;
  if (bytes > MAX_BYTES) {
    return json({ ok: false, error: '存档超过 512KB 上限' }, 413);
  }

  const updated = Math.floor(Date.now() / 1000);
  const name = 'saves/' + (await sha256Hex(key)) + '.json';
  await env.SAVES.put(name, JSON.stringify({ updated, size: bytes, data: req.data }));

  return json({ ok: true, updated, size: bytes });
}
