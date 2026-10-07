# -*- coding: utf-8 -*-
"""模拟 save.php 的行为，用来在本地验证客户端同步逻辑（不用于生产）"""
import hashlib
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = r'F:\ocean-stars-v2'
SAVE_DIR = r'F:\ocean-stars-v2\.workbuddy\tmp\mock_saves'
os.makedirs(SAVE_DIR, exist_ok=True)


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.endswith('save.php'):
            q = parse_qs(u.query)
            if q.get('action', [''])[0] == 'ping':
                return self._json({'ok': True, 'service': 'xuanmen-save', 'time': int(time.time())})
            key = q.get('key', [''])[0]
            if not (16 <= len(key) <= 64) or not key.replace('-', '').replace('_', '').isalnum():
                return self._json({'ok': False, 'error': '存档码格式不正确'}, 400)
            f = os.path.join(SAVE_DIR, hashlib.sha256(key.encode()).hexdigest() + '.json')
            if not os.path.isfile(f):
                return self._json({'ok': True, 'exists': False})
            j = json.load(open(f, encoding='utf-8'))
            return self._json({'ok': True, 'exists': True, 'updated': j['updated'],
                               'size': j['size'], 'data': j['data']})
        # 静态文件
        rel = u.path.lstrip('/')
        path = os.path.join(ROOT, rel) if rel else ROOT
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if not os.path.isfile(path):
            self.send_error(404)
            return
        ext = os.path.splitext(path)[1].lower()
        ctype = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
                 '.js': 'application/javascript; charset=utf-8',
                 '.json': 'application/json; charset=utf-8',
                 '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'}.get(ext, 'application/octet-stream')
        data = open(path, 'rb').read()
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        u = urlparse(self.path)
        if not u.path.endswith('save.php'):
            self.send_error(404)
            return
        n = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(n)
        try:
            req = json.loads(raw.decode('utf-8'))
        except Exception:
            return self._json({'ok': False, 'error': '请求体不是合法 JSON'}, 400)
        key = str(req.get('key', ''))
        data = req.get('data')
        if not (16 <= len(key) <= 64) or not key.replace('-', '').replace('_', '').isalnum():
            return self._json({'ok': False, 'error': '存档码格式不正确'}, 400)
        if not isinstance(data, str):
            return self._json({'ok': False, 'error': '缺少存档内容'}, 400)
        if len(data.encode('utf-8')) > 524288:
            return self._json({'ok': False, 'error': '存档过大'}, 413)
        f = os.path.join(SAVE_DIR, hashlib.sha256(key.encode()).hexdigest() + '.json')
        payload = {'updated': int(time.time()), 'size': len(data), 'data': data}
        tmp = f + '.tmp'
        open(tmp, 'w', encoding='utf-8').write(json.dumps(payload, ensure_ascii=False))
        os.replace(tmp, f)
        print('[写入] %s -> %d bytes' % (key, len(data)))
        return self._json({'ok': True, 'updated': payload['updated'], 'size': payload['size']})


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 8124), H).serve_forever()
