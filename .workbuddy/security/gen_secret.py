import os, secrets, hashlib, string

ROOT = r'F:\ocean-stars-v2'
SEC = os.path.join(ROOT, '.workbuddy', 'security')
os.makedirs(SEC, exist_ok=True)

# 生成管理口令 + 哈希（不打印任何密钥）
alpha = string.ascii_letters + string.digits
pw = 'yhDiary-' + ''.join(secrets.choice(alpha) for _ in range(10)) + '!'
salt = secrets.token_hex(16)
h = hashlib.sha256((salt + pw).encode()).hexdigest()

sec_dir = os.path.join(ROOT, '_sec')
os.makedirs(sec_dir, exist_ok=True)

cfg = """<?php
/**
 * 星海之境 · 鉴权配置（机密文件，切勿公开、切勿提交到公开仓库）
 * 修改口令：重新运行生成脚本，替换下面两行。
 */
$AUTH_USER = 'admin';
$AUTH_SALT = '%s';
$AUTH_HASH = '%s';
""" % (salt, h)

cfg_path = os.path.join(sec_dir, 'config.php')
with open(cfg_path, 'w', encoding='utf-8') as f:
    f.write(cfg)

# 清理旧的分散配置
old = os.path.join(ROOT, 'diary', 'api', '_config.php')
if os.path.exists(old):
    os.remove(old)

pw_path = os.path.join(SEC, '管理口令.txt')
with open(pw_path, 'w', encoding='utf-8') as f:
    f.write('星海之境 · 日记后台管理口令\n')
    f.write('地址：https://www.yhtaoism.com/diary/\n')
    f.write('用户名：admin\n')
    f.write('口令：' + pw + '\n\n')
    f.write('说明：在日记页新增/编辑/删除日记、上传图片视频时，浏览器会弹出登录框，\n')
    f.write('      输入上面的用户名和口令即可。\n')
    f.write('建议首次使用后立即改成你自己的口令（方法见《安全加固报告.md》）。\n')

print('config_written:', os.path.exists(cfg_path), os.path.getsize(cfg_path))
print('old_config_removed:', not os.path.exists(old))
print('password_file_written:', os.path.exists(pw_path))
