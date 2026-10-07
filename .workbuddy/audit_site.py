import os, re, html

ROOT = r'F:\ocean-stars-v2'
SKIP = {'.workbuddy', 'node_modules', '.git', 'images'}

pages = []
for dp, dn, fns in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fns:
        if f.endswith('.html'):
            pages.append(os.path.join(dp, f))

def rel(p): return os.path.relpath(p, ROOT)

def load(p):
    for enc in ('utf-8-sig', 'utf-8', 'gbk'):
        try:
            return open(p, encoding=enc).read()
        except Exception:
            continue
    return ''

def nav_links(t):
    m = re.search(r'<nav\b.*?</nav>', t, re.S | re.I)
    if not m: return None
    return tuple(re.findall(r'href="([^"]+)"', m.group(0)))

def footer_text(t):
    m = re.search(r'<footer\b.*?</footer>', t, re.S | re.I)
    if not m: return None
    s = re.sub(r'<[^>]+>', ' ', m.group(0))
    return re.sub(r'\s+', ' ', s).strip()

print('总页面数:', len(pages))
print()
print('%-34s %-6s %-6s %-6s %-6s %s' % ('页面', 'CSS', '导航', '备案', '页脚', 'PHP依赖'))
print('-' * 100)
rows = []
for p in sorted(pages):
    t = load(p)
    css = re.findall(r'<link[^>]+href="([^"]*\.css)"', t)
    nav = nav_links(t)
    beian = '有' if '晋ICP备2026013183号' in t else '缺'
    ft = footer_text(t)
    php = re.findall(r'(?:fetch\(|action=)["\']?([^"\']*\.php[^"\']*)', t)
    rows.append(dict(p=p, t=t, css=css, nav=nav, beian=beian, ft=ft, php=php))
    print('%-34s %-6s %-6s %-6s %-6s %s' % (
        rel(p)[:34],
        '1' if len(css) == 1 else str(len(css)),
        '%d链' % len(nav) if nav else '无',
        beian,
        '有' if ft else '无',
        ','.join(sorted(set(php))) or '-'))

print()
print('=== 导航链接组合 ===')
from collections import Counter
c = Counter(r['nav'] for r in rows if r['nav'])
for k, v in c.most_common():
    print('  %d 个页面: %s' % (v, list(k)))

print()
print('=== 页脚文字（去重）===')
fc = Counter((r['ft'] or '（无页脚）')[:110] for r in rows)
for k, v in fc.most_common():
    print('  %2d 个页面 | %s' % (v, k))

print()
print('=== 断链检查（本页指向的 .html 是否存在）===')
bad_total = 0
for r in rows:
    d = os.path.dirname(r['p'])
    for m in re.findall(r'href="([^"]+\.html)"', r['t']):
        if m.startswith(('http', '//', '#')): continue
        tgt = os.path.normpath(os.path.join(d, m))
        if not os.path.exists(tgt):
            bad_total += 1
            print('  %s -> 缺失 %s' % (rel(r['p']), m))
print('  断链总数:', bad_total)

print()
print('=== 缺失图片检查 ===')
miss = 0
for r in rows:
    d = os.path.dirname(r['p'])
    for m in re.findall(r'src="([^"]+)"', r['t']):
        if m.startswith(('http', '//', 'data:')): continue
        tgt = os.path.normpath(os.path.join(d, m))
        if not os.path.exists(tgt):
            miss += 1
            if miss <= 25:
                print('  %s -> 缺失 %s' % (rel(r['p']), m))
print('  缺失图片总数:', miss)
