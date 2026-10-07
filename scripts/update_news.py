#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取 RSS 新闻并生成 news/news.json（供静态页面读取）
- 本地可直接运行：python scripts/update_news.py
- 也可由 GitHub Actions 定时运行，自动提交更新
无任何第三方依赖。
"""
import os, re, ssl, json, time, urllib.request
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'news', 'news.json')

SOURCES = [
    ('https://rsshub.rssforever.com/people', '人民网', 1),
    ('https://www.people.com.cn/rss/politics.xml', '人民网时政', 2),
    ('https://www.people.com.cn/rss/society.xml', '人民网社会', 2),
    ('https://www.people.com.cn/rss/finance.xml', '人民网财经', 2),
    ('https://www.people.com.cn/rss/opinion.xml', '人民网观点', 2),
]

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')


def scrub(s):
    """清洗文本：去标签/CDATA/危险字符，防止前端 innerHTML 注入"""
    s = re.sub(r'<[^>]*>', '', s or '')
    s = re.sub(r'^<!\[CDATA\[(.*)\]\]>$', r'\1', s, flags=re.S)
    for ch in ['<', '>', '"', "'", '`', '\\']:
        s = s.replace(ch, '')
    return s.strip()


def fetch(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    op = urllib.request.build_opener(
        urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=ctx))
    op.addheaders = [('User-Agent', UA), ('Accept', 'application/xml,text/xml,*/*')]
    try:
        with op.open(url, timeout=15) as r:
            return r.read()
    except Exception:
        return None


def parse(xml_bytes, source):
    try:
        text = xml_bytes.decode('utf-8', errors='ignore').lstrip('\ufeff')
        root = ET.fromstring(text)
    except Exception:
        return []
    items = root.findall('.//item')
    out = []
    for it in items:
        def g(tag):
            el = it.find(tag)
            return (el.text or '') if el is not None else ''
        title = scrub(g('title'))
        link = g('link').strip()
        desc = scrub(g('description'))
        desc = desc[:200] if desc else title
        pub = g('pubDate')
        try:
            ts = int(time.mktime(time.strptime(pub, '%a, %d %b %Y %H:%M:%S %z'))) if pub else int(time.time())
        except Exception:
            ts = int(time.time())
        if not title or not link:
            continue
        if len(title) < 6:
            continue
        if not re.match(r'^https?://', link, re.I):
            continue
        out.append({
            'title': title, 'url': link, 'summary': desc,
            'source': source, 'timestamp': ts,
            'date': time.strftime('%m-%d %H:%M', time.localtime(ts)),
        })
    return out


def fallback():
    now = int(time.time())
    return [
        {'title': '长治市潞州区持续推进城市更新改造工作', 'url': 'https://www.changzhi.gov.cn/',
         'summary': '长治市潞州区持续推进城市更新改造工作，英雄路、上党门片区等项目稳步推进中。',
         'source': '长治政务', 'timestamp': now, 'date': time.strftime('%m-%d %H:%M', time.localtime(now))},
        {'title': '山西省房屋征收与补偿政策最新解读', 'url': 'https://www.shanxi.gov.cn/',
         'summary': '山西省住建厅发布房屋征收与补偿政策最新解读，规范征收程序，保障群众合法权益。',
         'source': '山西政务', 'timestamp': now - 3600, 'date': time.strftime('%m-%d %H:%M', time.localtime(now - 3600))},
        {'title': '2026年新型城镇化建设重点任务发布', 'url': 'https://www.gov.cn/',
         'summary': '国务院印发2026年新型城镇化建设重点任务，涉及城市更新、老旧小区改造等内容。',
         'source': '中国政府网', 'timestamp': now - 7200, 'date': time.strftime('%m-%d %H:%M', time.localtime(now - 7200))},
    ]


def main():
    all_news, errs = [], []
    for url, source, prio in SOURCES:
        data = fetch(url)
        if not data:
            errs.append('%s: 无法获取' % source)
            continue
        got = parse(data, source)
        if got:
            all_news.extend(got)
            if prio == 1 and len(got) >= 20:
                break

    if not all_news:
        all_news = fallback()
        print('[warn] 所有源失败，使用备用新闻:', errs)
    else:
        all_news.sort(key=lambda x: x['timestamp'], reverse=True)
        seen, uniq = set(), []
        for n in all_news:
            k = n['title'][:30]
            if k in seen:
                continue
            seen.add(k)
            uniq.append(n)
        all_news = uniq[:50]

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(all_news, f, ensure_ascii=False, indent=1)
    print('已写入 %s，共 %d 条' % (OUT, len(all_news)))


if __name__ == '__main__':
    main()
