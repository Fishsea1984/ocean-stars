import re, os

P = r'F:\ocean-stars-v2\diary\index.html'
raw = open(P, 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
orig = t

REPS = [
    # 1) 数据源改为仓库内的静态 JSON
    ("    const res = await fetch(API_BASE + 'list.php');",
     "    const res = await fetch('diaries.json');"),

    # 2) 去掉「新建日记」按钮
    ('    <p class="page-hero-desc">记录灵感、保存回忆，文字、图片、视频皆可珍藏</p>\n'
     '    <button class="btn-new" id="btnNew">✨ 新建日记</button>\n',
     '    <p class="page-hero-desc">记录灵感、保存回忆，文字、图片、视频皆可珍藏</p>\n'),

    # 3) 空状态文案
    ('<div class="empty-state-text">还没有日记，点击上方按钮写下第一篇吧</div>',
     '<div class="empty-state-text">还没有日记</div>'),

    # 4) 编辑器整体隐藏（保留元素，避免 JS 绑定报错）
    ('  <div class="editor-container" id="editorContainer">',
     '  <div class="editor-container" id="editorContainer" style="display:none;">'),

    # 5) 卡片上的编辑/删除按钮移除
    ('        <div class="diary-card-actions" style="display:${isAdmin?\'flex\':\'none\'};">\n'
     '          <button onclick="event.stopPropagation(); editDiary(\'${d.id}\')">编辑</button>\n'
     '          <button onclick="event.stopPropagation(); deleteDiary(\'${d.id}\')">删除</button>\n'
     '        </div>\n', ''),

    # 6) 阅读器里的编辑/删除按钮移除
    ('      <button class="btn btn-primary" id="btnEdit" style="display:none;">✏️ 编辑</button>\n'
     '      <button class="btn btn-secondary" id="btnDelete" style="display:none;color:#ff6b6b;'
     'border-color:#ff6b6b;">🗑️ 删除</button>\n', ''),

    # 7) 事件绑定改为空值安全（元素没了也不报错）
    ("document.getElementById('btnNew').addEventListener('click', newDiary);\n"
     "document.getElementById('btnSave').addEventListener('click', saveDiary);\n"
     "document.getElementById('btnCancel').addEventListener('click', backToList);\n"
     "document.getElementById('btnBack').addEventListener('click', backToList);\n"
     "document.getElementById('btnEdit').addEventListener('click', () => editDiary(currentId));\n"
     "document.getElementById('btnDelete').addEventListener('click', () => deleteDiary(currentId));",
     "  // 纯静态站点：写操作入口已移除，绑定做空值保护\n"
     "  const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };\n"
     "  bind('btnSave', staticReadOnlyTip);\n"
     "  bind('btnCancel', backToList);\n"
     "  bind('btnBack', backToList);\n"
     "  bind('btnEdit', staticReadOnlyTip);\n"
     "  bind('btnDelete', staticReadOnlyTip);"),

    # 8) 新增只读提示函数
    ('let uploadedFiles = [];',
     'let uploadedFiles = [];\n\n'
     '// 纯静态站点：没有服务端写入接口\n'
     'function staticReadOnlyTip() {\n'
     '  alert(\'本站已切换为纯静态托管（GitHub Pages）。\\n\\n\'\n'
     '      + \'新增或修改日记：请在 GitHub 仓库里编辑 diary/diaries.json 并提交，网站会自动更新。\');\n'
     '}'),
]

for old, new in REPS:
    cnt = t.count(old)
    if cnt != 1:
        print('!!! 匹配失败(%d): %s' % (cnt, old[:70].replace('\n', '\\n')))
        raise SystemExit(1)
    t = t.replace(old, new)

data = t.encode('utf-8')
if bom:
    data = b'\xef\xbb\xbf' + data
open(P, 'wb').write(data)

print('日记页改造完成，字节变化: %d -> %d' % (len(orig), len(t)))
print()
print('=== 复查 ===')
checks = {
    '仍引用 list.php': 'list.php' in t,
    '仍引用 save.php': 'save.php' in t,
    '仍引用 delete.php': 'delete.php' in t,
    '仍引用 upload.php': 'upload.php' in t,
    '仍新建按钮': 'btnNew">✨' in t,
    '已读取 diaries.json': "fetch('diaries.json')" in t,
    '编辑器已隐藏': 'id="editorContainer" style="display:none;"' in t,
}
for k, v in checks.items():
    print('  %-22s %s' % (k, 'OK' if (v if k.startswith('已') else not v) else '*** 异常 ***'))
