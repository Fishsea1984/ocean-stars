#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
星海之境 · Cloudflare 部署助手

用法：
    python scripts/deploy_cloudflare.py            # 只打包干净副本到 F:\\ocean-stars-deploy
    python scripts/deploy_cloudflare.py --push     # 打包 + 调用 wrangler 直接部署

为什么需要它：
  网站根目录里的 .workbuddy（本地工作记录，含管理口令等敏感文件）、.git、server-api
  都不该发布。而 Cloudflare 的 wrangler 只忽略固定的几个目录，不会读 .gitignore，
  网页拖拽上传更是整夹拖——所以先用本脚本复制出一份"干净站点"再部署。
"""

import os
import shutil
import subprocess
import sys

SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGE = r'F:\ocean-stars-deploy'
PROJECT = 'ocean-stars'

# 不发布的目录 / 文件
EXCLUDE_DIRS = {'.workbuddy', '.git', '.wrangler', 'server-api', 'scripts',
                '__pycache__', 'node_modules', '.deploy-staging'}
EXCLUDE_FILES = {'Thumbs.db', '.DS_Store', 'desktop.ini'}


def clean_stage():
    """增量同步：只覆盖写入 + 删除源站已不存在的文件，不做整目录重建"""
    if not os.path.isdir(STAGE):
        os.makedirs(STAGE)


def prune(existing):
    """删除上次打包残留、这次源站已没有的文件（通常为空）"""
    stale = []
    for root, dirs, files in os.walk(STAGE):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, STAGE)
            if rel.replace('\\', '/') not in existing:
                stale.append(full)
    if not stale:
        return 0
    if len(stale) > 50:
        print('  发现 %d 个残留文件未清理，请手动删除目录后重跑：%s' % (len(stale), STAGE))
        return 0
    for f in stale:
        try:
            os.remove(f)
        except OSError:
            pass
    return len(stale)


def stage():
    clean_stage()
    n, total = 0, 0
    seen = set()
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_root = os.path.relpath(root, SRC)
        for f in files:
            if f in EXCLUDE_FILES or f.endswith('.pyc'):
                continue
            src = os.path.join(root, f)
            rel = f if rel_root == '.' else os.path.join(rel_root, f)
            dst = os.path.join(STAGE, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            seen.add(rel.replace('\\', '/'))
            n += 1
            total += os.path.getsize(src)
    removed = prune(seen)
    print('已打包干净站点 -> %s' % STAGE)
    print('  文件 %d 个，共 %.1f MB%s'
          % (n, total / 1048576, ('（清理残留 %d 个）' % removed) if removed else ''))
    print('  （已排除 .workbuddy / .git / server-api / scripts）')
    return n


def find_npx():
    candidates = [
        r'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\npx.cmd',
        r'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\npx',
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return 'npx'


def push():
    npx = find_npx()
    node_dir = os.path.dirname(npx)
    env = dict(os.environ)
    env['PATH'] = node_dir + os.pathsep + env.get('PATH', '')
    cmd = [npx, '-y', 'wrangler@latest', 'pages', 'deploy', STAGE,
           '--project-name=' + PROJECT]
    print()
    print('执行: %s' % ' '.join(cmd))
    print('（首次会自动下载 wrangler 并弹出浏览器让你登录 Cloudflare，按提示授权即可）')
    print()
    try:
        return subprocess.call(cmd, env=env, cwd=SRC)
    except FileNotFoundError:
        print('未找到 npx。请先安装 Node.js（https://nodejs.org），或手动执行：')
        print('  npx wrangler pages deploy %s --project-name=%s' % (STAGE, PROJECT))
        return 1


if __name__ == '__main__':
    stage()
    if '--push' in sys.argv:
        sys.exit(push())
    print()
    print('下一步（二选一）：')
    print('  A. 命令行部署：  python scripts/deploy_cloudflare.py --push')
    print('  B. 网页拖拽：    把 %s 整个文件夹拖到 Cloudflare 上传页' % STAGE)
