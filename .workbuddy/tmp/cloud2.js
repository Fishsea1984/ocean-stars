

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

    