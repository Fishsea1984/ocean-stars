# -*- coding: utf-8 -*-
"""全站安全扫描：外链、可疑代码、隐藏脚本、敏感信息泄露"""

import io
import os
import re
from collections import Counter

SRC = r'F:\ocean-stars-v2'
SKIP_DIRS = {'.workbuddy', '.git', '__pycache__'}

# 可疑模式
PATTERNS = {
    'eval 调用':        r'\beval\s*\(',
    'atob/base64 解码': r'\batob\s*\(|Buffer\.from\([^)]*base64',
    'fromCharCode 混淆': r'String\.fromCharCode',
    'document.write':   r'document\.write\s*\(',
    '挖矿关键字':        r'coinhive|webminer|cryptonight|monero|stratum\+tcp',
    '可疑跳转':          r'(?:window\.)?location(?:\.href)?\s*=\s*[\'"](?![\'"]?#)',
    '隐藏 iframe':      r'<iframe[^>]*(?:hidden|display\s*:\s*none|width\s*=\s*[\'"]?0)',
    '明文口令/密钥':      r'(?:password|passwd|api[_-]?key|secret|token)\s*[:=]\s*[\'"][^\'"]{6,}',
    '外链 JS':          r'<script[^>]+src\s*=\s*[\'"]https?://',
    '可疑 TLD':         r'https?://[^\s\'"]+\.(?:tk|ml|ga|cf|xyz|top|ru)(?:/|\b)',
}

IP_URL = re.compile(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
EXT_URL = re.compile(r'https?://([A-Za-z0-9.\-]+)')

files = []
for r, ds, fs in os.walk(SRC):
    ds[:] = [d for d in ds if d not in SKIP_DIRS]
    for f in fs:
        if f.endswith(('.html', '.js', '.json', '.php', '.py', '.css', '.md', '.yml')):
            files.append(os.path.join(r, f))

print('扫描文件 %d 个\n' % len(files))
print('=' * 62)
print('一、可疑代码模式')
print('=' * 62)
hits = 0
for name, pat in PATTERNS.items():
    found = []
    for p in files:
        rel = os.path.relpath(p, SRC).replace('\\', '/')
        if rel.startswith('xuanmen/') and name in ('fromCharCode 混淆', 'eval 调用', 'atob/base64 解码'):
            continue  # 第三方 React 打包体积大，正常会命中，单独排除
        try:
            t = io.open(p, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        for m in re.finditer(pat, t):
            line = t[:m.start()].count('\n') + 1
            found.append('%s:%d' % (rel, line))
            break
    if found:
        hits += len(found)
        print('\n[%s]  %d 处' % (name, len(found)))
        for f in found[:12]:
            print('   ', f)
if hits == 0:
    print('\n✅ 未命中任何可疑模式')

print()
print('=' * 62)
print('二、外部域名清单（确认都是可信来源）')
print('=' * 62)
doms = Counter()
ip_hits = []
for p in files:
    rel = os.path.relpath(p, SRC).replace('\\', '/')
    t = io.open(p, encoding='utf-8', errors='ignore').read()
    for m in IP_URL.finditer(t):
        ip_hits.append((rel, m.group(0)))
    for m in EXT_URL.finditer(t):
        doms[m.group(1)] += 1
for d, c in doms.most_common(40):
    print('  %-38s x%d' % (d, c))
if ip_hits:
    print('\n[!] 直接写死 IP 的地址:')
    for rel, u in ip_hits[:20]:
        print('   ', rel, u)

print()
print('=' * 62)
print('三、新闻数据是否夹带 HTML（存储型 XSS 风险）')
print('=' * 62)
nj = os.path.join(SRC, 'news', 'news.json')
if os.path.isfile(nj):
    t = io.open(nj, encoding='utf-8').read()
    tags = re.findall(r'<\s*/?\s*[a-zA-Z!][^>]{0,40}>', t)
    print('  HTML 标签残留:', len(tags), ('示例: ' + str(tags[:5])) if tags else '')
    print('  script/on* 事件:', len(re.findall(r'(?i)<script|on(?:load|click|error)\s*=', t)))
    print('  结论:', '✅ 已清洗' if not tags else '⚠ 需清洗')

print()
print('=' * 62)
print('四、可写接口与敏感目录')
print('=' * 62)
for p in files:
    rel = os.path.relpath(p, SRC).replace('\\', '/')
    if rel.endswith('.php'):
        print('  [PHP] ', rel)
print('  站点内 PHP 文件数:', sum(1 for f in files if f.endswith('.php')))
for d in ['.git', '.workbuddy', 'server-api', 'scripts', 'functions']:
    full = os.path.join(SRC, d)
    print('  目录 %-12s %s' % (d, '存在（发布前必须排除）' if os.path.isdir(full) else '不存在'))
