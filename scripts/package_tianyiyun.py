#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打包「天翼云/宝塔」上传包（zip，解压即用）

产出：F:\\ocean-stars-upload.zip
  · 只包含网站运行需要的文件
  · 不含 .workbuddy（本地工作记录）、脚本、server-api、functions、.github
  · 不含任何 .md 文档（部署指南、安全方案、README 都不应该出现在公网）
  · 已内置云存档接口：xuanmen-save/save.php（解压后自动可用）

用法：
    python scripts/package_tianyiyun.py
"""

import os
import zipfile

SRC = r'F:\ocean-stars-v2'
OUT = r'F:\ocean-stars-upload.zip'

EXCLUDE_DIRS = {'.workbuddy', '.git', '__pycache__', 'scripts',
                'server-api', 'functions', '.github', '.well-known', 'security'}
EXCLUDE_EXT = {'.md', '.py', '.pyc'}
EXCLUDE_FILES = {'.gitignore', '.nojekyll', 'integrity_report.txt',
                 'integrity_baseline.json', 'desktop.ini', 'Thumbs.db'}

n = 0
total = 0

# 先删掉旧包
if os.path.isfile(OUT):
    os.remove(OUT)

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    # 1) 站点文件（全部放在 zip 根目录，解压后直接就是网站根目录）
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES:
                continue
            if os.path.splitext(f)[1].lower() in EXCLUDE_EXT:
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, SRC).replace('\\', '/')
            z.write(full, rel)
            n += 1
            total += os.path.getsize(full)

    # 2) 云存档接口
    php = os.path.join(SRC, 'server-api', 'xuanmen', 'save.php')
    if os.path.isfile(php):
        z.write(php, 'xuanmen-save/save.php')
        n += 1
        total += os.path.getsize(php)
        # 存档目录（空目录占位，PHP 会自动创建，这里只是保证目录存在）
        z.writestr(zipfile.ZipInfo('xuanmen-save/saves/'), b'')
        # 防止该目录被直接下载（Apache 生效；Nginx 用 security/nginx-安全配置.conf）
        z.writestr('xuanmen-save/saves/.htaccess', '# 禁止直接访问存档文件\nRequire all denied\nDeny from all\n')
        n += 1

print('上传包已生成: %s' % OUT)
print('  文件 %d 个，原始体积 %.1f MB，压缩包 %.1f MB'
      % (n, total / 1048576, os.path.getsize(OUT) / 1048576))
print()
print('已排除（安全原因，不发布到公网）：')
for d in sorted(EXCLUDE_DIRS):
    print('  目录 %s' % d)
print('  文件 *.md（部署指南/安全方案/README）、.gitignore、.nojekyll')
print()
print('已内置：xuanmen-save/save.php（玄门问道云存档接口）')
print()
print('=' * 58)
print('上传步骤（宝塔）')
print('=' * 58)
print('1. 宝塔 → 文件 → 进入你的站点根目录（如 /www/wwwroot/你的域名）')
print('2. 点「上传」→ 选择 %s → 上传' % OUT)
print('3. 上传完成后右键该 zip →「解压」→ 解压到当前目录')
print('4. 解压后删除这个 zip 文件（别留在网站根目录）')
print('5. 浏览器打开 http://你的域名 检查；')
print('   再打开 /xuanmen-save/save.php?action=ping 看到 {"ok":true,...} 即云存档就绪')
