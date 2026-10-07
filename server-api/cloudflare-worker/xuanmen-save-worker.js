/**
 * 玄门问道 · 云端存档（独立 Cloudflare Worker 版）
 *
 * 适用场景：网站用「网页拖拽上传」方式部署（这种方式带不了 Pages Functions），
 *           云存档单独建一个 Worker 来跑。
 *
 * 部署步骤（全程网页操作，不用命令行）：
 *   1. Cloudflare 后台 → Workers & Pages → Create → Worker → Deploy（先随便部署个 Hello World）
 *   2. 点 Edit code（编辑代码）→ 全选删掉 → 把本文件全部内容粘贴进去 → Deploy
 *   3. Worker 的 Settings → Bindings → Add → R2 bucket
 *        Variable name: SAVES      R2 bucket: xuanmen-saves（没有就现场新建）
 *   4. 验证：浏览器打开 https://你的worker名.fishsea1984.workers.dev/?action=ping
 *      看到 {"ok":true,...} 即成功
 *   5. 回到玄门问道页面 → 云存档面板 → 「修改」→ 填入
 *      https://你的worker名.fishsea1984.workers.dev
 *
 * 接口约定与 Pages Functions 版完全一致：
 *   GET  ?action=ping / ?action=load&key=存档码
 *   POST {"key":"存档码","data":"存档内容"}
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    /* ---- 健康检查 ---- */
    if (url.searchParams.get('action') === 'ping') {
      return json({
        ok: true,
        service: 'xuanmen-save',
        engine: 'cloudflare-worker',
        time: Math.floor(Date.now() / 1000),
      });
    }

    /* ---- 存储绑定检查 ---- */
    if (!env.SAVES) {
      return json({ ok: false, error: '未绑定 R2 存储（变量名应为 SAVES）' }, 500);
    }

    /* ---- 读取 ---- */
    if (request.method === 'GET') {
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

    /* ---- 写入 ---- */
    if (request.method === 'POST') {
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

    return json({ ok: false, error: '不支持的方法' }, 405);
  },
};
