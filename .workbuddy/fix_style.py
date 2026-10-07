import os, re

ROOT = r'F:\ocean-stars-v2'
SKIP = {'.workbuddy', 'node_modules', '.git', 'images', 'legacy-php'}

FOOT_L1 = '<p class="footer-text">星海之境 | Ocean of Stars</p>'
FOOT_L2 = '<p class="footer-text">在星空与海洋的交汇处，遇见无限可能</p>'

IMG_FIX = {
    '../images/shidayuan.png': '../images/shidayuan.svg',
    '../images/yushi-land.png': '../images/yushi-land.svg',
    '../images/hero_cover.jpg': '../images/hero_cover.svg',
    '../images/feature_analysis.jpg': '../images/feature_analysis.svg',
    '../images/feature_school.jpg': '../images/feature_school.svg',
}

def load(p):
    raw = open(p, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    return raw.decode('utf-8-sig'), bom

def save(p, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    open(p, 'wb').write(data)

pages = []
for dp, dn, fns in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fns:
        if f.endswith('.html'):
            pages.append(os.path.join(dp, f))

log = []
for p in sorted(pages):
    r = os.path.relpath(p, ROOT)
    t, bom = load(p)
    orig = t
    changes = []

    # 1) 导航「文章」统一指向 posts/articles.html
    t2 = re.sub(r'href="((?:\.\./)*)index\.html#articles"', r'href="\1posts/articles.html"', t)
    if t2 != t:
        changes.append('导航文章链接')
        t = t2

    # 2) 页脚统一（去掉备案号，境外 github.io 不适用）
    m = re.search(r'([ \t]*)<footer\b[^>]*>\n(.*?)([ \t]*)</footer>', t, re.S)
    if m:
        body = m.group(2)
        inner = ''
        for line in body.split('\n'):
            if line.strip():
                inner = re.match(r'[ \t]*', line).group(0)
                break
        if inner == '':
            inner = m.group(1) + '    '
        new_footer = '%s<footer>\n%s%s\n%s%s\n%s</footer>' % (
            m.group(1), inner, FOOT_L1, inner, FOOT_L2, m.group(3))
        if new_footer != m.group(0):
            t = t[:m.start()] + new_footer + t[m.end():]
            changes.append('页脚统一')

    # 3) 兜底：若仍有备案号残留，直接删除该行
    t2 = re.sub(r'[ \t]*<p class="footer-beian">.*?</p>\n?', '', t, flags=re.S)
    if t2 != t:
        changes.append('移除备案号')
        t = t2

    # 4) 缺失配图改为 .svg 占位
    for a, b in IMG_FIX.items():
        if a in t:
            t = t.replace(a, b)
            changes.append('配图 %s' % os.path.basename(b))

    # 5) 标题统一为「xxx - 星海之境」
    if r != 'index.html':
        mm = re.search(r'<title>(.*?)</title>', t, re.S)
        if mm:
            old = mm.group(1).strip()
            if not old.endswith(' - 星海之境'):
                base = re.split(r'\s+[-|]\s+', old)[0].strip()
                new = '%s - 星海之境' % base
                t = t[:mm.start(1)] + new + t[mm.end(1):]
                changes.append('标题: %s -> %s' % (old, new))

    if t != orig:
        save(p, t, bom)
        log.append((r, changes))

print('修改页面数:', len(log))
for r, c in log:
    print('  %-38s %s' % (r, '; '.join(c)))

# 复查
print()
print('=== 复查 ===')
bad = 0
for p in sorted(pages):
    t, _ = load(p)
    if 'index.html#articles' in t:
        print('  仍指向锚点:', os.path.relpath(p, ROOT)); bad += 1
    if '晋ICP备' in t:
        print('  仍有备案号:', os.path.relpath(p, ROOT)); bad += 1
    m = re.search(r'<footer\b[^>]*>(.*?)</footer>', t, re.S)
    txt = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else ''
    if txt != '星海之境 | Ocean of Stars 在星空与海洋的交汇处，遇见无限可能':
        print('  页脚不一致:', os.path.relpath(p, ROOT), '|', txt); bad += 1
print('  不一致项:', bad)
