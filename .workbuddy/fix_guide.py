# -*- coding: utf-8 -*-
"""修复部署指南第六节（此前被 bash 反引号命令替换污染）"""

import io

P = r'F:\ocean-stars-v2\部署指南.md'
t = io.open(P, encoding='utf-8').read()

i = t.find('## 六、部署到国内服务器')
if i < 0:
    raise SystemExit('未找到第六节')

clean = '''## 六、部署到国内服务器（天翼云 · 当前方案）

站点已是纯静态，直接把文件传上去即可；云存档是唯一需要 PHP 的部分。

### 1）上传静态站

用宝塔面板（或 FTP）把干净副本目录（F:\\ocean-stars-deploy）里的**全部内容**
（index.html、css、js、diary、records、xuanmen 等目录）传到网站根目录，例如：

    /www/wwwroot/你的站点/

> 先在项目目录执行 `python scripts/deploy_cloudflare.py` 生成干净副本再传，
> 避免把本地工作目录（.workbuddy，含管理口令等敏感文件）传上去。

### 2）开启 PHP + 部署云存档

1. 宝塔 → 软件商店 → 安装 PHP（8.0+）和 Nginx
2. 把 `server-api/xuanmen/save.php` 传到网站根目录下的 `xuanmen-save/` 文件夹
3. 验证：浏览器打开 `https://你的域名/xuanmen-save/save.php?action=ping`，
   看到 `{"ok":true,...}` 即成功
4. 玄门问道页面的云存档面板会自动探测同域接口，**无需任何配置**

### 3）域名与 HTTPS

1. 域名解析 A 记录指向天翼云服务器公网 IP
   （域名必须与备案信息一致，且在天翼云完成接入备案）
2. 宝塔 → 网站 → SSL → Let's Encrypt 免费证书 → 申请 → 开启「强制 HTTPS」
3. 日记/资讯页的 JSON 数据会自动走 https

### 4）合规清单（已做 / 待你确认）

- [x] 页脚悬挂 ICP 备案号 + 公安备案号（全部 21 个页面）
- [x] 下架「AI 政策咨询」（生成式 AI 服务需单独备案/安全评估）
- [x] 备案号均可点击跳转（工信部 beian.miit.gov.cn / 公安部 beian.gov.cn）
- [ ] 若日后开放评论/用户发布，需实名认证 + 先审后发（当前日记为只读静态，不涉及）
- [ ] 资讯页为外部 RSS 聚合展示：个人站建议只展示自己撰写的内容，
      或确认转载来源允许，避免触碰互联网新闻信息服务资质红线
'''

t = t[:i] + clean
io.open(P, 'w', encoding='utf-8', newline='').write(t)
print('第六节已重写，文件现长 %d 字符' % len(t))
print('校验：', 'F:\\\\ocean-stars-deploy' in t.replace('\\\\', '\\\\') or 'ocean-stars-deploy' in t,
      '| save.php' in t, '| {"ok":true' in t)
