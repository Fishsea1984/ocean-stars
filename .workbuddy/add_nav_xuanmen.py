# -*- coding: utf-8 -*-
"""在 21 个页面的导航里，「首页」之后插入「玄门问道」"""

import io
import os
import re

ROOT = r'F:\ocean-stars-v2'
PAT = re.compile(r'^([ \t]*)<li><a href="([^"]*?)index\.html"([^>]*)>首页</a></li>', re.M)

changed, skipped = [], []

for r, ds, fs in os.walk(ROOT):
    ds[:] = [d for d in ds if d not in ('.workbuddy', '.git', '__pycache__')]
    for f in sorted(fs):
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        rel = os.path.relpath(p, ROOT).replace('\\', '/')
        t = io.open(p, encoding='utf-8').read()

        if '>玄门问道<' in t:
            skipped.append(rel)
            continue

        m = PAT.search(t)
        if not m:
            print('!!! 未找到导航首页项: %s' % rel)
            raise SystemExit(1)

        indent, prefix, attrs = m.group(1), m.group(2), m.group(3)
        # 深度 0 的页面 prefix 为空，深度 1 的页面 prefix 为 '../'
        href = prefix + 'xuanmen/index.html'
        new_line = '%s<li><a href="%s"%s>玄门问道</a></li>' % (indent, href, attrs)

        t = t[:m.end()] + '\n' + new_line + t[m.end():]
        io.open(p, 'w', encoding='utf-8', newline='').write(t)
        changed.append(rel)

print('已更新 %d 个页面，跳过（已有）%d 个' % (len(changed), len(skipped)))
for c in changed:
    print('   ', c)

print()
print('=== 复查：每个页面的导航顺序 ===')
bad = []
for r, ds, fs in os.walk(ROOT):
    ds[:] = [d for d in ds if d not in ('.workbuddy', '.git', '__pycache__')]
    for f in sorted(fs):
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        rel = os.path.relpath(p, ROOT).replace('\\', '/')
        t = io.open(p, encoding='utf-8').read()
        items = re.findall(r'<li><a href="[^"]*"[^>]*>([^<]+)</a></li>', t)
        order = [x for x in items if x in ('首页', '玄门问道', '日记', '记录', '文章', 'AI咨询', '资讯', '关于')]
        ok = order[:2] == ['首页', '玄门问道'] and order[-1] == '关于'
        print('  %-38s %s' % (rel, ' / '.join(order)))
        if not ok:
            bad.append(rel)
if bad:
    print('\n!!! 顺序不对:', bad)
    raise SystemExit(1)
print('\n全部页面：首页 → 玄门问道 → …… → 关于')
