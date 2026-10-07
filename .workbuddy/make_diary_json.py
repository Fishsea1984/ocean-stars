import os, json

ROOT = r'F:\ocean-stars-v2'
SRC = os.path.join(ROOT, 'diary', 'data')
OUT = os.path.join(ROOT, 'diary', 'diaries.json')

files = sorted(os.listdir(SRC))
files = [f for f in files if f.endswith('.json')]
files.sort(reverse=True)          # 文件名即 YYYYMMDD_HHMMSS，倒序 = 最新在前

items = []
for f in files:
    d = json.load(open(os.path.join(SRC, f), encoding='utf-8-sig'))
    items.append({
        'id': d.get('id') or os.path.splitext(f)[0],
        'title': d.get('title', ''),
        'content': d.get('content', ''),
        'images': d.get('images', []),
        'videos': d.get('videos', []),
        'summary': d.get('summary', ''),
        'date': d.get('date', ''),
    })

json.dump(items, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print('源文件数:', len(files))
print('写出:', OUT, os.path.getsize(OUT), '字节')
print()
back = json.load(open(OUT, encoding='utf-8'))
print('校验条目数:', len(back))
for x in back:
    print('  %-18s | %-22s | 正文 %5d 字 | 图 %d | 视频 %d'
          % (x['id'], (x['title'] or '')[:22], len(x.get('content') or ''),
             len(x.get('images') or []), len(x.get('videos') or [])))
