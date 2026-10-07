# -*- coding: utf-8 -*-
"""合规改造：1) 去掉 AI咨询导航  2) 全站页脚挂 ICP + 公安备案号"""

import io
import os
import re

SRC = r'F:\ocean-stars-v2'
ICP = '晋ICP备2026013183号'
ICP_URL = 'https://beian.miit.gov.cn/'
GABA = '晋公网安备 14040302000255号'
GABA_URL = 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=14040302000255'

NAV_AI = re.compile(r'^[ \t]*<li><a href="[^"]*ai/index\.html"[^>]*>AI咨询</a></li>\n', re.M)
FOOTER = re.compile(r'([ \t]*)</footer>')

changed = []
for r, ds, fs in os.walk(SRC):
    ds[:] = [d for d in ds if d not in ('.workbuddy', '.git', '__pycache__', 'ai')]
    for f in sorted(fs):
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        rel = os.path.relpath(p, SRC).replace('\\', '/')
        t = io.open(p, encoding='utf-8').read()
        orig = t

        # 1) 去掉 AI 咨询导航项
        t, n = NAV_AI.subn('', t)

        # 2) 页脚加两行备案
        if 'beian.miit.gov.cn' in t:
            print('  已存在备案号，跳过:', rel)
            continue
        m = FOOTER.search(t)
        if not m:
            print('!!! 找不到 </footer>:', rel)
            raise SystemExit(1)
        ind = m.group(1)
        inner = ind + '    '
        img = ('images/gaba.svg' if '/' not in rel else '../images/gaba.svg')
        block = (
            '{i}<p class="footer-beian">\n'
            '{n}<a href="{iu}" target="_blank" rel="noopener noreferrer">{icp}</a>\n'
            '{i}</p>\n'
            '{i}<p class="footer-beian footer-gaba">\n'
            '{n}<img src="{img}" alt="公安备案" class="gaba-icon">\n'
            '{n}<a href="{gu}" target="_blank" rel="noopener noreferrer">{gaba}</a>\n'
            '{i}</p>\n'
        ).format(i=ind, n=inner, iu=ICP_URL, icp=ICP, img=img, gu=GABA_URL, gaba=GABA)
        t = t[:m.start()] + block + t[m.start():]

        io.open(p, 'w', encoding='utf-8', newline='').write(t)
        changed.append((rel, n))

print('已改造 %d 个页面' % len(changed))
print()
print('=== 复查 ===')
bad = []
for r, ds, fs in os.walk(SRC):
    ds[:] = [d for d in ds if d not in ('.workbuddy', '.git', '__pycache__', 'ai')]
    for f in sorted(fs):
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        rel = os.path.relpath(p, SRC).replace('\\', '/')
        t = io.open(p, encoding='utf-8').read()
        ok_ai = 'AI咨询' not in t
        ok_ai_link = 'ai/index.html' not in t
        ok_icp = ICP in t and ICP_URL in t
        ok_gaba = GABA in t and GABA_URL in t
        img = ('images/gaba.svg' if '/' not in rel else '../images/gaba.svg')
        ok_img = img in t
        ok = ok_ai and ok_ai_link and ok_icp and ok_gaba and ok_img
        print('  %-36s %s' % (rel, 'OK' if ok else '异常 %s' % [k for k, v in
              [('AI导航', ok_ai), ('AI链接', ok_ai_link), ('ICP', ok_icp),
               ('公安', ok_gaba), ('徽标', ok_img)] if not v]))
        if not ok:
            bad.append(rel)
if bad:
    raise SystemExit(1)
print('\n全部页面：AI 已清除，两个备案号已挂载')
