import io, re, sys

P = r'F:\ocean-stars-v2\diary\index.html'
src = io.open(P, encoding='utf-8').read()
lines = src.split('\n')


def cut_block(lines, name):
    """删除顶层 function name() { ... } 整块，返回新列表"""
    start = None
    for i, l in enumerate(lines):
        if re.match(r'^(async\s+)?function\s+%s\s*\(' % re.escape(name), l.strip()) and l.rstrip().endswith('{'):
            start = i
            break
    if start is None:
        print('!!! 未找到函数: %s' % name)
        raise SystemExit(1)
    # 向前吃掉紧邻的注释行
    b = start
    while b > 0 and lines[b - 1].strip().startswith('//'):
        b -= 1
    end = None
    for j in range(start, len(lines)):
        if lines[j] == '}':
            end = j
            break
    if end is None:
        print('!!! 未找到结束大括号: %s' % name)
        raise SystemExit(1)
    del lines[b:end + 1]
    print('  已删除函数 %-12s (行 %d-%d)' % (name, b + 1, end + 1))
    return lines


for fn in ['newDiary', 'editDiary', 'deleteDiary', 'saveDiary', 'handleFiles',
           'removeFile', 'getValidFiles', 'generateId']:
    lines = cut_block(lines, fn)

t = '\n'.join(lines)

REPS = [
    # 管理员模式整块移除（含页面内硬编码口令）
    ("// 管理员密码验证\nlet isAdmin = false;\nconst ADMIN_PASSWORD = '",
     None),  # 占位，下面用正则处理
]

# 删除管理员块：从 "// 管理员密码验证" 到其后第一个 "});" 行
m = re.search(r'// 管理员密码验证\n.*?\n\}\);\n', t, re.S)
if not m:
    print('!!! 未找到管理员块')
    raise SystemExit(1)
t = t[:m.start()] + t[m.end():]
print('  已删除页面内管理员密码块')

# 阅读器里的编辑/删除按钮显示逻辑（元素已不存在）
old_btn = ("  // 根据管理员状态显示/隐藏编辑删除按钮\n"
           "  document.getElementById('btnEdit').style.display = isAdmin ? 'inline-flex' : 'none';\n"
           "  document.getElementById('btnDelete').style.display = isAdmin ? 'inline-flex' : 'none';\n")
if t.count(old_btn) != 1:
    print('!!! 编辑/删除按钮逻辑匹配失败(%d)' % t.count(old_btn))
    raise SystemExit(1)
t = t.replace(old_btn, '')
print('  已移除阅读器编辑/删除逻辑')

# 移除不再使用的 API_BASE
if t.count("const API_BASE = 'api/';\n") == 1:
    t = t.replace("const API_BASE = 'api/';\n", '')
    print('  已移除 API_BASE')
else:
    print('  (API_BASE 未找到，跳过)')

# 事件绑定块缩进对齐
t = t.replace("// 事件绑定\n  // 纯静态站点", "// 事件绑定\n// 纯静态站点")

open(P, 'w', encoding='utf-8', newline='').write(t)

print()
print('=== 复查 ===')
bad = []
for k in ['save.php', 'delete.php', 'upload.php', 'list.php', 'API_BASE', 'isAdmin', 'ADMIN_PASSWORD']:
    ok = k not in t
    print('  %-16s %s' % (k, 'OK(已清除)' if ok else '*** 仍残留 ***'))
    if not ok:
        bad.append(k)
print('  %-16s %s' % ('diaries.json', 'OK' if "fetch('diaries.json')" in t else '*** 缺失 ***'))
print('  %-16s %s' % ('只读提示', 'OK' if 'staticReadOnlyTip' in t else '*** 缺失 ***'))
if bad:
    raise SystemExit(1)
print('\n日记页纯静态化完成')
