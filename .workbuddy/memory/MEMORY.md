# 星海之境（ocean-stars-v2）项目长期记忆

## 站点与服务器
- 原服务器域名：**https://www.yhtaoism.com**（阿里云 IP 39.107.192.11）仍在，旧站为 PHP 版。
- **2026-09-18 起主推 GitHub Pages 纯静态托管**（用户决定用免费 github.io）。旧域名 blog.zgrecruit.com 已失效。
- 本机没有 PHP 环境。本地预览必须起 http 服务：`python -m http.server 8000`，不能直接双击 HTML。

## 关键数据位置（覆盖部署时务必保留）
- **日记数据（现为静态）：`diary/diaries.json`** ← 要改日记就编辑这个文件；`diary/data/*.json` 是旧 PHP 版残留备份。
- 日记图片/视频：`diary/uploads/`
- 旅行照片：`records/images/trip-01-jinmengshan/day1~day8/`（共 256 张，约 67 MB）
- 「八日自驾」= `records/trip-01-jinmengshan.html`（标题：晋蒙陕八日温柔自驾）
- 注意：打包/覆盖站点时极易丢掉以上目录；本地备份 zip 历史上都不含 `diary/data`。

## 页面约定
- 全站 21 个 HTML 页面共享 `css/style.css`，页脚样式统一在此维护。
- 导航顺序（2026-09-27 起，AI 咨询已下架）：首页 / 玄门问道 / 日记 / 记录 / 文章 / 关于。
- **备案（2026-09-27 恢复）**：国内服务器（天翼云），页脚全站挂
  晋ICP备2026013183号（beian.miit.gov.cn）+ 晋公网安备 14040302000255号（beian.gov.cn，
  徽标 images/gaba.svg）。AI 咨询页面已移除（备份 F:\ocean-stars-v2-backups\removed-ai-20260927）。
- 页脚统一为两行：星海之境 | Ocean of Stars / 在星空与海洋的交汇处，遇见无限可能。
  **ICP 备案号已于 2026-09-18 移除**（站点迁 GitHub，境外不适用备案）。
- 全站只用相对路径，无 `/` 开头绝对路径 → 项目级 Pages（`用户名.github.io/仓库名/`）可直接跑。
- 缩进差异：diary/news 页面用 2 空格，其余页面用 8 空格，批量改 HTML 时注意。
- 写精确替换脚本前必须用 `repr()` dump 真实字节，Read 工具显示的缩进有偏移。

## 静态化后的架构（2026-09-18）
- 无任何 PHP/数据库。三个数据源：
  - `diary/diaries.json` —— 手工维护
  - `news/news.json` —— GitHub Actions（`.github/workflows/update-news.yml`，cron `17 1,7,13 * * *`）+ `scripts/update_news.py`
  - AI：`ai/index.html` 浏览器直连 DeepSeek，密钥存 localStorage `xinghai_deepseek_key`
- PHP 后端已移出仓库到 `F:\ocean-stars-v2-backups\legacy-php\`（含 `_sec/`，**里面有口令哈希，禁止进公开仓库**）。
- 维护脚本：`scripts/smoke_test.py`（全站跑通检查）、`scripts/switch_cdn.py`（图片本地↔jsDelivr 切换）、`scripts/update_news.py`。
- 部署文档：`部署指南.md`（GitHub Pages）、`Cloudflare部署指南.md`（**推荐**）；仓库说明：`README.md`；
  `.gitignore` 已排除 `.workbuddy/` 与 `*.php`。
- 体积：309 文件 / 88.4 MB，最大单文件 10.9 MB（mp4），未超 GitHub 100MB、jsDelivr 20MB 限制。
- **玄门问道**（`xuanmen/index.html`）：NAS 部署包里的单文件 React 修仙游戏，已内联融入站点（CSS 作用域化到 `#xuanmen-root`）。
  升级版本：重跑 `.workbuddy/build_xuanmen.py`（先改脚本里的 APP 路径指向新包）。存档在 localStorage `xuanmen-wendao-save-v1`。
- **玄门问道云存档**（2026-09-25）：`server-api/xuanmen/save.php`（PHP 单文件，用户自己的服务器），客户端面板自动同步
  localStorage 存档。存档码存 `xm_sync_key`、接口地址存 `xm_save_api`（默认 `https://www.yhtaoism.com/xuanmen-save/save.php`）。
  客户端 `detectApi()` 先探测同域 `/xuanmen-save`（Pages Functions 或国内服务器同域部署）再回退。
  2026-09-27 起国内服务器（天翼云）为首选：save.php 放站点 `xuanmen-save/` 目录即自动识别。
  Cloudflare Pages 方案备选：`functions/xuanmen-save.js`（R2 绑定 `SAVES`）；网页拖拽上传不支持 Functions。

## 安全架构（2026-09-22 加固）
- **写操作统一鉴权**：`_sec/auth.php` 提供 `require_admin()`（HTTP Basic Auth）与 `require_post()`；口令哈希存于 `_sec/config.php`（盐+SHA256，无明文）。所有写接口必须 `require_once __DIR__ . '/../../_sec/auth.php'; require_post(); require_admin();`。
- 已保护接口：`diary/api/save.php`、`delete.php`、`upload.php`（写）；`ai/api/test.php`（诊断）。`diary/api/list.php` 读取仍公开（文件内有"改私有"的开关注释）。
- `upload.php` 铁律：后缀**只能**由服务端 `finfo` 识别出的 MIME 决定，禁止再用客户端文件名后缀。
- `news/api/fetch.php`：RSS 内容必须经 `scrub_text()` 清洗后才进 JSON，链接只允许 http(s)——因为 `news/index.html` 用 `innerHTML` 渲染。
- 密钥约定：`DEEPSEEK_API_KEY` 优先读环境变量，勿写死在 `chat.php`。
- 服务器还需一条 Nginx 规则才能堵住 `/diary/data/*.json` 直下等问题 → 规则在 `.workbuddy/security/nginx-security.conf`（**是否已部署待确认**）。
- 后台口令文件：`.workbuddy/security/管理口令.txt`（用户名 admin）；重新生成用同目录 `gen_secret.py`。
- 交付报告：`.workbuddy/security/安全加固报告.html`。
- 待办：`tools/auth.js` 为客户端认证（可被绕过），若这些计算器需保护，要把校验挪到服务端——等用户确认。
- 铁律：站点没有版本控制、无本地 PHP，改动后**必须**提醒用户「覆盖上传，不要删目录重传」。
