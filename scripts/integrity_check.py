#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网站防篡改 · 文件完整性校验

原理：给全站文件算一遍指纹存成基线，之后每天比对一次。
      只要有文件被新增/删除/修改（被挂马、被篡改），立刻能发现并列出。

用法：
    python scripts/integrity_check.py init      # 生成基线（服务器刚部署干净时执行一次）
    python scripts/integrity_check.py check     # 比对（可放到计划任务每天跑）
    python scripts/integrity_check.py update    # 我主动改过网站后，更新基线

计划任务（宝塔 → 计划任务 → Shell脚本，每天 03:00）：
    cd /www/wwwroot/你的站点 && python3 scripts/integrity_check.py check >> /www/wwwroot/你的站点/../../integrity.log 2>&1

发现异常时脚本返回退出码 2，可以在计划任务里配邮件/钉钉告警。
"""

import hashlib
import json
import os
import sys

# 站点根目录（脚本在 scripts/ 下，上一层就是站点根）
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'integrity_baseline.json')

# 不纳入校验的目录（本地工作区、脚本目录、缓存）
SKIP_DIRS = {'.workbuddy', '.git', '__pycache__', 'scripts', 'server-api',
             'functions', '.github', 'node_modules', '.well-known'}
# 频繁变化的数据文件不参与比对（日记/资讯本来就会更新）
SKIP_FILES = {'news/news.json', 'diary/diaries.json'}

LOG_NAME = 'integrity_report.txt'


def walk():
    """遍历站点文件，返回 {相对路径: sha256}"""
    result = {}
    for r, ds, fs in os.walk(ROOT):
        ds[:] = [d for d in ds if d not in SKIP_DIRS]
        for f in fs:
            full = os.path.join(r, f)
            rel = os.path.relpath(full, ROOT).replace('\\', '/')
            if rel in SKIP_FILES or f == LOG_NAME or f == os.path.basename(BASELINE):
                continue
            try:
                h = hashlib.sha256()
                with open(full, 'rb') as fp:
                    for chunk in iter(lambda: fp.read(65536), b''):
                        h.update(chunk)
                result[rel] = h.hexdigest()
            except (OSError, IOError):
                pass
    return result


def cmd_init():
    data = walk()
    with open(BASELINE, 'w', encoding='utf-8') as f:
        json.dump({'root': ROOT, 'files': data}, f, ensure_ascii=False, indent=1)
    print('基线已生成：%d 个文件 -> %s' % (len(data), BASELINE))
    print('提示：只在确认网站处于干净状态时执行 init。')


def cmd_check():
    if not os.path.isfile(BASELINE):
        print('还没有基线，请先执行: python scripts/integrity_check.py init')
        return 1
    old = json.load(open(BASELINE, encoding='utf-8'))['files']
    new = walk()

    added = sorted(set(new) - set(old))
    removed = sorted(set(old) - set(new))
    modified = sorted(k for k in set(old) & set(new) if old[k] != new[k])

    lines = []
    lines.append('=== 网站完整性检查 ===')
    lines.append('基线文件数: %d    当前文件数: %d' % (len(old), len(new)))
    lines.append('新增: %d   删除: %d   被修改: %d' % (len(added), len(removed), len(modified)))
    if added:
        lines.append('')
        lines.append('[新增文件] 重点核查：')
        lines += ['  + ' + p for p in added[:50]]
    if removed:
        lines.append('')
        lines.append('[丢失文件]：')
        lines += ['  - ' + p for p in removed[:50]]
    if modified:
        lines.append('')
        lines.append('[被修改] 可能被挂马/篡改：')
        lines += ['  * ' + p for p in modified[:50]]

    ok = not (added or removed or modified)
    lines.append('')
    lines.append('结论: ' + ('✅ 无变化' if ok else '⚠ 发现异常，请立即核查'))
    text = '\n'.join(lines)
    print(text)

    # 同时写一份报告，方便计划任务留存
    try:
        with open(os.path.join(ROOT, LOG_NAME), 'w', encoding='utf-8') as f:
            f.write(text + '\n')
    except OSError:
        pass
    return 0 if ok else 2


def cmd_update():
    os.remove(BASELINE) if os.path.isfile(BASELINE) else None
    cmd_init()


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'init':
        cmd_init()
    elif cmd == 'check':
        sys.exit(cmd_check())
    elif cmd == 'update':
        cmd_update()
    else:
        print(__doc__)
