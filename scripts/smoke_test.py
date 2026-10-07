#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""本地起一个静态服务器，遍历全站检查页面与资源是否都能访问。"""

import io
import os
import re
import sys
import threading
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def collect():
    pages, assets = [], set()
    for r, ds, fs in os.walk(ROOT):
        ds[:] = [d for d in ds if d not in ('.workbuddy', '.git', '__pycache__')]
        for f in fs:
            rel = os.path.relpath(os.path.join(r, f), ROOT).replace('\\', '/')
            if f.endswith('.html'):
                pages.append(rel)
            elif f.endswith(('.css', '.js', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4')):
                assets.add(rel)
    return sorted(pages), assets


def main():
    os.chdir(ROOT)
    srv = ThreadingHTTPServer(('127.0.0.1', PORT), QuietHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    pages, assets = collect()
    print('页面 %d 个，资源 %d 个\n' % (len(pages), len(assets)))

    bad_page, bad_asset = [], []
    checked = set()

    def head(rel):
        try:
            req = urllib.request.Request('http://127.0.0.1:%d/%s' % (PORT, rel), method='GET')
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status
        except Exception as e:
            return getattr(e, 'code', str(e))

    for p in pages:
        st = head(p)
        flag = 'OK ' if st == 200 else 'FAIL'
        if st != 200:
            bad_page.append((p, st))
        print('  [%s] %-46s %s' % (flag, p, st))

    # 检查页面里引用的资源
    ref_bad = []
    for p in pages:
        html = io.open(os.path.join(ROOT, p), encoding='utf-8', errors='ignore').read()
        base = os.path.dirname(p)
        refs = re.findall(r'(?:href|src)="([^"]+)"', html)
        for ref in refs:
            if ref.startswith(('http', '#', 'mailto:', 'javascript:', 'data:', '//')):
                continue
            if '${' in ref:          # JS 模板字符串，运行时才生成
                continue
            ref = ref.split('#')[0]  # 去掉锚点
            if not ref:
                continue
            rel = os.path.normpath(os.path.join(base, ref)).replace('\\', '/')
            if rel in checked:
                continue
            checked.add(rel)
            if not os.path.isfile(os.path.join(ROOT, rel)):
                ref_bad.append((p, ref))

    print('\n=== 结果 ===')
    print('  页面访问失败: %d' % len(bad_page))
    for p, s in bad_page:
        print('    %s -> %s' % (p, s))
    print('  资源引用缺失: %d' % len(ref_bad))
    for p, r in ref_bad[:40]:
        print('    %s 引用了不存在的 %s' % (p, r))
    srv.shutdown()
    if bad_page or ref_bad:
        raise SystemExit(1)
    print('  全站通过')


if __name__ == '__main__':
    main()
