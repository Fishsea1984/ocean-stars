import os

OUT = r'F:\ocean-stars-v2\images'
os.makedirs(OUT, exist_ok=True)

CY = '#00f0ff'
BG = '#0b1424'
PANEL = '#12203a'
DIM = '#8399b8'
TXT = '#dce8f7'


def head(w, h):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">\n'
        '  <rect width="%d" height="%d" fill="%s"/>\n'
        '  <rect x="1" y="1" width="%d" height="%d" fill="none" stroke="%s" stroke-opacity="0.35" stroke-width="2"/>\n'
        % (w, h, w, h, w, h, BG, w - 2, h - 2, CY)
    )


def title(text, sub, w, y):
    return (
        '  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
        'font-size="30" font-weight="600" fill="%s">%s</text>\n'
        '  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
        'font-size="16" fill="%s">%s</text>\n'
        % (w // 2, y, TXT, text, w // 2, y + 30, DIM, sub)
    )


def lots_svg(w, h, cols, rows, title_text, sub_text, labels):
    """宗地分户示意图"""
    s = [head(w, h)]
    s.append(title(title_text, sub_text, w, 62))
    mx, my = 90, 120
    pw, ph = w - 180, h - 210
    s.append('  <rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="%s" stroke-width="2" '
             'stroke-opacity="0.8"/>\n' % (mx, my, pw, ph, PANEL, CY))
    cw, ch = pw / cols, ph / rows
    i = 0
    for r in range(rows):
        for c in range(cols):
            x = mx + c * cw
            y = my + r * ch
            s.append('  <rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" stroke="%s" '
                     'stroke-opacity="0.28" stroke-width="1"/>\n' % (x + 4, y + 4, cw - 8, ch - 8, CY))
            lab = labels[i] if i < len(labels) else ''
            s.append('  <text x="%.1f" y="%.1f" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,'
                     'sans-serif" font-size="15" fill="%s">%s</text>\n'
                     % (x + cw / 2, y + ch / 2 + 5, CY if i % 2 == 0 else TXT, lab))
            i += 1
    s.append('  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
             'font-size="14" fill="%s">示意图 · 待替换为实测图纸</text>\n' % (w // 2, h - 40, DIM))
    s.append('</svg>\n')
    return ''.join(s)


def banner_svg(w, h, big, small, sub_text):
    s = [head(w, h)]
    s.append('  <circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-opacity="0.16" stroke-width="2"/>\n'
             % (w // 2, h // 2, int(min(w, h) * 0.36), CY))
    s.append('  <circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-opacity="0.10" stroke-width="2"/>\n'
             % (w // 2, h // 2, int(min(w, h) * 0.24), CY))
    s.append('  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
             'font-size="46" font-weight="700" fill="%s">%s</text>\n'
             % (w // 2, h // 2 - 6, TXT, big))
    s.append('  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
             'font-size="20" fill="%s">%s</text>\n' % (w // 2, h // 2 + 34, CY, small))
    s.append('  <text x="%d" y="%d" text-anchor="middle" font-family="Noto Sans SC,Microsoft YaHei,sans-serif" '
             'font-size="14" fill="%s">%s</text>\n' % (w // 2, h - 36, DIM, sub_text))
    s.append('</svg>\n')
    return ''.join(s)


files = {
    'shidayuan.svg': lots_svg(1000, 620, 4, 4,
                              '史家大院 · 原始登记及现状示意',
                              '16 户建筑占地与公摊示意',
                              ['%02d' % i for i in range(1, 17)]),
    'yushi-land.svg': lots_svg(1000, 560, 3, 2,
                               '鱼氏家族 · 宗地布局示意',
                               '6 户土地分摊示意',
                               ['1 户', '2 户', '3 户', '4 户', '5 户', '6 户']),
    'hero_cover.svg': banner_svg(1200, 600, 'AI 成绩管理分析系统',
                                 '智能分析 · 学校推荐', '封面示意图 · 待替换为实际截图'),
    'feature_analysis.svg': banner_svg(900, 480, 'AI 分析功能',
                                       '个性化诊断与提分建议', '功能示意图 · 待替换为实际截图'),
    'feature_school.svg': banner_svg(900, 480, '学校匹配功能',
                                     '基于真实录取数据的推荐', '功能示意图 · 待替换为实际截图'),
}

for name, content in files.items():
    p = os.path.join(OUT, name)
    open(p, 'w', encoding='utf-8').write(content)
    print('生成 %-22s %d 字节' % (name, os.path.getsize(p)))
