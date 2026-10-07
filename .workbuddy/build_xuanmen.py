# -*- coding: utf-8 -*-
"""把「玄门问道」单文件 React 应用融入星海之境站点，生成 xuanmen/index.html"""

import io
import os
import re
import sys

ROOT = r'F:\ocean-stars-v2'
APP = r'F:\ocean-stars-v2\.workbuddy\tmp\xuanmen\deploy\html\index.html'
OUT_DIR = os.path.join(ROOT, 'xuanmen')
OUT = os.path.join(OUT_DIR, 'index.html')

SCOPE = '#xuanmen-root'

src = io.open(APP, encoding='utf-8').read()
i = src.find('<script type="module" crossorigin>')
tag_end = src.find('>', i) + 1
style_pos = src.find('<style')
bundle_end = src.rfind('</script>', 0, style_pos)
bundle = src[tag_end:bundle_end]

raw_css_start = src.find('>', style_pos) + 1
raw_css_end = src.find('</style>')
raw_css = src[raw_css_start:raw_css_end]

print('bundle: %d 字符, css: %d 字符' % (len(bundle), len(raw_css)))


def split_top(s, sep=','):
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == sep and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]


def scope_css(css, scope):
    """把每条规则限定在 scope 容器内，避免污染站点全局样式"""
    out, i, n = [], 0, len(css)
    while i < n:
        j_open = css.find('{', i)
        j_semi = css.find(';', i)
        if j_open == -1:
            break
        if j_semi != -1 and j_semi < j_open:          # @import / @charset 之类
            stmt = css[i:j_semi].strip()
            if not stmt.lower().startswith('@import'):  # 去掉 Google Fonts，国内会拖慢首屏
                out.append(stmt + ';')
            i = j_semi + 1
            continue
        prelude = css[i:j_open].strip()
        depth, k = 1, j_open + 1
        while k < n and depth > 0:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        inner = css[j_open + 1:k - 1]
        i = k

        low = prelude.lower()
        if low.startswith('@media') or low.startswith('@supports'):
            out.append(prelude + '{' + scope_css(inner, scope) + '}')
            continue
        if low.startswith('@keyframes') or low.startswith('@font-face') or low.startswith('@-webkit'):
            out.append(prelude + '{' + inner + '}')
            continue

        parts, newparts = split_top(prelude), []
        for p in parts:
            if p in ('html', 'html,body'):
                continue                       # 不要 html/body 满屏，交给站点
            if p == 'body':
                newparts.append(scope)         # body 的字体/背景/颜色挪到容器上
                continue
            if p == '*':
                newparts.append(scope)
                newparts.append(scope + ' *')
                continue
            if p.startswith(':root'):
                newparts.append(scope)         # CSS 变量只作用于容器内
                continue
            newparts.append(scope + ' ' + p)
        if newparts:
            out.append(','.join(newparts) + '{' + inner + '}')
    return '\n'.join(out)


scoped = scope_css(raw_css, SCOPE)
print('作用域化后 CSS: %d 字符' % len(scoped))

HEAD_EXTRA = """
        /* ===== 玄门问道 · 融入星海之境的外框 ===== */
        .xm-frame {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            overflow: hidden;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
        }
        .xm-frame-inner { border-radius: 20px; overflow: hidden; }
        .xm-note {
            color: var(--text-secondary);
            font-size: 0.85rem;
            text-align: center;
            margin-top: 1.4rem;
            line-height: 1.9;
        }
        .xm-note b { color: var(--bioluminescent); font-weight: 600; }

        /* ===== 云存档面板 ===== */
        .xm-cloud { max-width: 780px; margin: 0 auto 1.6rem; padding: 1.4rem 1.6rem; }
        .xm-cloud-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .xm-cloud-title { font-size: 1rem; color: var(--text-primary); letter-spacing: 0.05em; }
        .xm-cloud-status { font-size: 0.78rem; color: var(--text-secondary); border: 1px solid var(--glass-border-strong); border-radius: 20px; padding: 2px 12px; }
        .xm-cloud-row { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.75rem; }
        .xm-input { flex: 1 1 220px; min-width: 150px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border-strong); border-radius: 10px; color: var(--text-primary); padding: 0.45rem 0.75rem; font-family: inherit; font-size: 0.85rem; }
        .xm-input::placeholder { color: rgba(232, 244, 255, 0.35); }
        .xm-btn { background: transparent; border: 1px solid var(--bioluminescent); color: var(--bioluminescent); border-radius: 10px; padding: 0.45rem 0.95rem; font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: all 0.3s; white-space: nowrap; }
        .xm-btn:hover { background: var(--bioluminescent-soft); }
        .xm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .xm-switch { font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.35rem; cursor: pointer; user-select: none; }
        .xm-cloud-tip { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.9; margin-top: 0.4rem; }
        .xm-cloud-tip b { color: var(--bioluminescent); font-weight: 600; }
        .xm-cloud-api { font-size: 0.75rem; color: rgba(232, 244, 255, 0.45); margin-top: 0.6rem; word-break: break-all; }
"""

PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>玄门问道 - 星海之境</title>
    <meta name="description" content="玄门问道 —— 正统道教文化科普 × 轻量放置修仙，星海之境站内应用。">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600;700;900&family=Cinzel:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
    <style>
        * { box-sizing: border-box; }
__HEAD_EXTRA__
        /* ===== 以下为「玄门问道」自带样式，已限定在 #xuanmen-root 内生效 ===== */
__CSS__
    </style>
</head>
<body>
    <canvas id="universe"></canvas>
    <div class="ocean-gradient"></div>
    <div class="water-ripple"></div>

    <div class="content">
        <nav>
            <a href="../index.html" class="logo">星海之境</a>
            <ul class="nav-links">
                <li><a href="../index.html">首页</a></li>
                <li><a href="index.html" class="active">玄门问道</a></li>
                <li><a href="../diary/index.html">日记</a></li>
                <li><a href="../records/index.html">记录</a></li>
                <li><a href="../posts/articles.html">文章</a></li>
                <li><a href="../ai/index.html">AI咨询</a></li>
                <li><a href="../index.html#about">关于</a></li>
            </ul>
        </nav>

        <div class="breadcrumb">
            <a href="../index.html">首页</a>
            <span class="sep">/</span>
            <span class="current">玄门问道</span>
        </div>

        <div class="page-top-spacer"></div>

        <div class="page-hero">
            <span class="page-hero-label">Xuanmen Wendao</span>
            <h1 class="page-hero-title">☯ 玄门问道</h1>
            <p class="page-hero-desc">正统道教文化科普 × 轻量放置修仙。体系依《道藏》《神仙传》《真灵位业图》搭建，挂机修行，渐入佳境。</p>
        </div>

        <div class="page-body">
            <div class="glass-card xm-cloud">
                <div class="xm-cloud-head">
                    <span class="xm-cloud-title">☁️ 云存档（跨设备续修）</span>
                    <span class="xm-cloud-status" id="xmStatus">未绑定</span>
                </div>
                <div class="xm-cloud-row">
                    <input id="xmKey" class="xm-input" placeholder="存档码（16 位以上字母数字）" maxlength="64" autocomplete="off">
                    <button class="xm-btn" id="xmBind">绑定 / 读取</button>
                    <button class="xm-btn" id="xmGen">生成新码</button>
                </div>
                <div class="xm-cloud-row">
                    <button class="xm-btn" id="xmPush">↑ 上传到服务器</button>
                    <button class="xm-btn" id="xmPull">↓ 从服务器恢复</button>
                    <label class="xm-switch"><input type="checkbox" id="xmAuto" checked> 自动同步</label>
                </div>
                <p class="xm-cloud-tip" id="xmTip">存档码相当于你的云存档钥匙，<b>请自己抄下来</b>：换手机、换电脑时输入同一个码就能接着修。</p>
                <div class="xm-cloud-api">存档服务器：<span id="xmApiShow">—</span> <button class="xm-btn" id="xmApiEdit" style="padding:2px 8px;font-size:0.72rem;">修改</button></div>
            </div>

            <div class="xm-frame">
                <div id="xuanmen-root" class="xm-frame-inner">
                    <div id="root"></div>
                </div>
            </div>
            <p class="xm-note">修行进度保存在<b>你自己的浏览器</b>里，换浏览器、换设备或清除站点数据会丢失，请勿随意清理缓存。</p>
        </div>

        <footer>
            <p class="footer-text">星海之境 | Ocean of Stars</p>
            <p class="footer-text">在星空与海洋的交汇处，遇见无限可能</p>
        </footer>
    </div>

    <script src="../js/main.js"></script>
    <script type="module">
__BUNDLE__
    </script>
    <script>
__CLOUD_JS__
    </script>
</body>
</html>
"""

CLOUD_JS = r"""
// ===== 玄门问道 · 云存档（把游戏自己的 localStorage 存档同步到服务器）=====
(function () {
    var GAME_SAVE   = 'xuanmen-wendao-save-v1';   // 游戏自身的存档键
    var LS_API      = 'xm_save_api';
    var LS_KEY      = 'xm_sync_key';
    var LS_LAST     = 'xm_last_sync';
    var DEFAULT_API = 'https://www.yhtaoism.com/xuanmen-save/save.php';

    var resolvedApi = null;   // 自动探测到的同域接口（Cloudflare Pages 用）

    function $(id) { return document.getElementById(id); }

    function apiUrl() {
        var v = localStorage.getItem(LS_API);
        if (v && v.trim()) { return v.trim(); }
        return resolvedApi || DEFAULT_API;
    }

    // 优先用本站同域的 /xuanmen-save（Cloudflare Pages Functions），探测不到再回退
    function detectApi() {
        if (localStorage.getItem(LS_API)) { return Promise.resolve(apiUrl()); }
        return fetch(location.origin + '/xuanmen-save?action=ping', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) {
                resolvedApi = (j && j.ok && j.service === 'xuanmen-save')
                    ? '/xuanmen-save' : DEFAULT_API;
                return apiUrl();
            })
            .catch(function () { resolvedApi = DEFAULT_API; return apiUrl(); });
    }
    function syncKey() { return (localStorage.getItem(LS_KEY) || '').trim(); }
    function setStatus(t) { var e = $('xmStatus'); if (e) e.textContent = t; }
    function tip(t) { var e = $('xmTip'); if (e) e.innerHTML = t; }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function fmt(ts) {
        if (!ts) return '—';
        var d = new Date(Number(ts) * 1000);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function loadUrl(k) {
        return apiUrl() + '?action=load&key=' + encodeURIComponent(k) + '&_=' + Date.now();
    }
    function genKey() {
        var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '';
        for (var i = 0; i < 20; i++) { r += s.charAt(Math.floor(Math.random() * s.length)); }
        return r;
    }

    // ---- 从服务器读取 ----
    function pull() {
        var k = syncKey();
        if (!k) { setStatus('未绑定'); return; }
        setStatus('读取中…');
        fetch(loadUrl(k), { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (j) {
                if (!j.ok) { throw new Error(j.error || '读取失败'); }
                if (!j.exists) { setStatus('已绑定 · 服务器暂无存档'); return; }
                var local = localStorage.getItem(GAME_SAVE);
                var last  = parseInt(localStorage.getItem(LS_LAST) || '0', 10);
                if (!local || j.updated > last) {
                    localStorage.setItem(GAME_SAVE, j.data);
                    localStorage.setItem(LS_LAST, String(j.updated));
                    setStatus('已同步 · ' + fmt(j.updated));
                    tip('已从服务器恢复存档（' + fmt(j.updated) + '），正在重新载入…');
                    if (!sessionStorage.getItem('xm_pulled')) {
                        sessionStorage.setItem('xm_pulled', '1');
                        setTimeout(function () { location.reload(); }, 900);
                    }
                } else {
                    setStatus('已同步 · ' + fmt(last));
                }
            })
            .catch(function (e) {
                setStatus('读取失败');
                tip('服务器读取失败：<b>' + (e && e.message ? e.message : e) + '</b><br>' +
                    '请确认存档地址是否正确、且是 <b>https</b>（本站是 https 页面，http 接口会被浏览器按「混合内容」拦截）。');
            });
    }

    // ---- 上传到服务器 ----
    var lastPushed = '', pushing = false, lastPushAt = 0;
    function push(force, quiet) {
        var k = syncKey();
        if (!k) { if (!quiet) { tip('请先生成或输入存档码，再上传。'); } return; }
        var data = localStorage.getItem(GAME_SAVE);
        if (!data) { if (!quiet) { tip('本机还没有存档，先在游戏里立个仙籍吧。'); } return; }
        if (!force && data === lastPushed) { return; }
        if (pushing) { return; }
        pushing = true;
        if (!quiet) { setStatus('上传中…'); }
        fetch(apiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: k, data: data })
        }).then(function (r) { return r.json(); })
          .then(function (j) {
              pushing = false;
              lastPushAt = Date.now();
              if (!j.ok) { throw new Error(j.error || '上传失败'); }
              lastPushed = data;
              localStorage.setItem(LS_LAST, String(j.updated));
              setStatus('已同步 · ' + fmt(j.updated));
              if (!quiet) { tip('已上传到服务器。<b>记好存档码</b>，换设备时输入它就能接着修。'); }
          })
          .catch(function (e) {
              pushing = false;
              if (!quiet) {
                  setStatus('上传失败');
                  tip('上传失败：<b>' + (e && e.message ? e.message : e) + '</b>');
              }
          });
    }

    // ---- 事件 ----
    var elKey = $('xmKey'), elAuto = $('xmAuto');
    if ($('xmGen')) {
        $('xmGen').addEventListener('click', function () {
            var k = genKey();
            localStorage.setItem(LS_KEY, k);
            if (elKey) { elKey.value = k; }
            tip('新的存档码已生成：<b>' + k + '</b><br>请抄下来保存好，换设备时输入它即可继续修行。');
            setStatus('已绑定');
            push(true);
        });
    }
    if ($('xmBind')) {
        $('xmBind').addEventListener('click', function () {
            var k = (elKey && elKey.value || '').trim();
            if (k.length < 16) { tip('存档码至少 16 位。'); return; }
            localStorage.setItem(LS_KEY, k);
            setStatus('已绑定');
            pull();
        });
    }
    if ($('xmPush')) { $('xmPush').addEventListener('click', function () { push(true); }); }
    if ($('xmPull')) { $('xmPull').addEventListener('click', function () { pull(); }); }
    if ($('xmApiEdit')) {
        $('xmApiEdit').addEventListener('click', function () {
            var v = prompt('存档服务器地址（必须以 https 开头）：', apiUrl());
            if (v === null) { return; }
            localStorage.setItem(LS_API, v.trim());
            resolvedApi = null;
            showApi();
            tip('已更新存档服务器地址，点「绑定 / 读取」重新连接。');
        });
    }

    // ---- 初始化 ----
    function showApi() { $('xmApiShow').textContent = apiUrl(); }
    if (elKey) { elKey.value = syncKey(); }
    detectApi().then(function () {
        showApi();
        if (syncKey()) {
            setStatus('已绑定');
            pull();
        }
    });

    // ---- 自动同步：每 15 秒检查一次本机存档，有变化且距上次上传超过 20 秒就推一次 ----
    setInterval(function () {
        if (!syncKey()) { return; }
        if (elAuto && !elAuto.checked) { return; }
        var data = localStorage.getItem(GAME_SAVE);
        if (!data || data === lastPushed) { return; }
        if (Date.now() - lastPushAt < 20000) { return; }
        push(false, true);
    }, 15000);
})();
"""

html = PAGE.replace('__HEAD_EXTRA__', HEAD_EXTRA).replace('__CSS__', scoped).replace('__BUNDLE__', bundle).replace('__CLOUD_JS__', CLOUD_JS)

os.makedirs(OUT_DIR, exist_ok=True)
io.open(OUT, 'w', encoding='utf-8', newline='').write(html)
print('已生成 %s  (%.1f KB)' % (OUT, os.path.getsize(OUT) / 1024))

# ---- 复查 ----
t = io.open(OUT, encoding='utf-8').read()
checks = {
    '含站点样式表': '../css/style.css' in t,
    '含站点脚本': '../js/main.js' in t,
    '含导航 7 项': t.count('<li><a href=') == 7,
    '玄门问道高亮': 'index.html" class="active">玄门问道' in t,
    '应用挂载点': '<div id="root"></div>' in t,
    'CSS 已作用域化': t.count(SCOPE + ' ') > 100,
    '无全局 body 污染': not re.search(r'(^|\n)\s*body\s*\{', t),
    '无 html,body 满屏': 'html,body{height:100%}' not in t.replace(' ', ''),
    '已去掉 Google 字体 @import': '@import' not in t,
    '页脚两行': t.count('class="footer-text"') == 2,
    '含云存档面板': 'xmStatus' in t and 'xm-cloud' in t,
    '云存档脚本已注入': "GAME_SAVE   = 'xuanmen-wendao-save-v1'" in t,
}
bad = [k for k, v in checks.items() if not v]
for k, v in checks.items():
    print('  %-24s %s' % (k, 'OK' if v else '*** 异常 ***'))
if bad:
    raise SystemExit(1)
