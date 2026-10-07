#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片来源一键切换：本地相对路径  <->  jsDelivr CDN

用法：
    # 切成 CDN 加速
    python scripts/switch_cdn.py --owner 你的GitHub用户名 --repo 仓库名 --mode cdn

    # 切回本地相对路径
    python scripts/switch_cdn.py --mode local

说明：
  jsDelivr 免费把 GitHub 仓库里的文件当 CDN 用，地址格式：
      https://cdn.jsdelivr.net/gh/<用户名>/<仓库名>@<分支>/<文件路径>
  单个文件上限 20MB。本仓库最大的文件是 10.9MB 的视频，可以正常加速。
"""

import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (文件相对路径, 该文件中图片路径相对哪个目录, 需要匹配的开头)
TARGETS = [
    (os.path.join('records', 'trip-01-jinmengshan.html'), 'records/', 'images/trip-01-jinmengshan/'),
    (os.path.join('diary', 'diaries.json'),              'diary/',   'uploads/'),
]

PREFIX = 'https://cdn.jsdelivr.net/gh/'


def to_cdn(text, subdir, head, base):
    return text.replace('"%s' % head, '"%s%s%s' % (base, subdir, head))


def to_local(text, subdir, head, base):
    return text.replace('"%s%s%s' % (base, subdir, head), '"%s' % head)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--owner', default='', help='GitHub 用户名')
    ap.add_argument('--repo', default='', help='仓库名')
    ap.add_argument('--branch', default='main', help='分支，默认 main')
    ap.add_argument('--mode', choices=['cdn', 'local'], required=True)
    args = ap.parse_args()

    if args.mode == 'cdn' and not (args.owner and args.repo):
        print('切换到 CDN 模式需要 --owner 和 --repo')
        raise SystemExit(1)

    base = '%s%s/%s@%s/' % (PREFIX, args.owner, args.repo, args.branch)

    for rel, subdir, head in TARGETS:
        p = os.path.join(ROOT, rel)
        if not os.path.isfile(p):
            print('  跳过（不存在）: %s' % rel)
            continue
        t = io.open(p, encoding='utf-8').read()
        before = t.count('"%s' % head)
        t = to_cdn(t, subdir, head, base) if args.mode == 'cdn' else to_local(t, subdir, head, base)
        io.open(p, 'w', encoding='utf-8', newline='').write(t)
        after = t.count('"%s%s%s' % (base, subdir, head))
        print('  %-38s %s：本地路径 %d 条 → CDN 路径 %d 条'
              % (rel, args.mode, before, after))

    print('\n完成。%s' % ('图片现在走 jsDelivr CDN。' if args.mode == 'cdn' else '图片已改回仓库内相对路径。'))


if __name__ == '__main__':
    main()
