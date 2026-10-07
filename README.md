# 星海之境（Ocean of Stars）

一个纯静态的个人网站：文章、日记、旅途记录、玄门问道、工具集合。

已备案，部署在国内服务器（天翼云）：
- ICP 备案：晋ICP备2026013183号
- 公安备案：晋公网安备 14040302000255号

> 合规说明：原「AI 政策咨询」（生成式 AI 对话）已于 2026-09-27 下架，
> 该页面已移出站点，保存在 `F:\ocean-stars-v2-backups\removed-ai-20260927\`。

## 目录结构

```
.
├── index.html            首页
├── posts/                文章（10 篇）
├── diary/                星海日记本（数据来自 diary/diaries.json）
│   ├── diaries.json      ★ 日记数据，直接编辑这个文件即可增删日记
│   └── uploads/          日记配图 / 视频
├── news/                 每日资讯
│   └── news.json         ★ 由 GitHub Actions 每 8 小时自动更新
├── records/              旅途记录（含 256 张照片）
├── xuanmen/              玄门问道（放置修仙小游戏）
├── tools/                实用小工具
├── images/               站点公共图片
├── css/ js/              样式与脚本
├── scripts/              本地维护脚本
└── .github/workflows/    自动更新资讯的定时任务
```

## 本地预览

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

> 必须通过 http:// 访问。直接双击 index.html（file:// 协议）会因为浏览器安全限制读不到 JSON 数据。

## 日常维护

| 想做什么 | 怎么做 |
| --- | --- |
| 新增 / 修改日记 | 编辑 `diary/diaries.json`，提交后自动生效 |
| 上传日记配图 | 把图片拖进 `diary/uploads/`，在 diaries.json 里写 `uploads/文件名.jpg` |
| 上传旅途照片 | 把照片拖进 `records/images/trip-01-jinmengshan/dayN/` |
| 新增文章 | 复制 `posts/post-001.html` 改内容，并在 `posts/articles.html` 里加一条 |
| 改全站样式 | 只改 `css/style.css`，21 个页面共用 |

## 部署

见 `部署指南.md`。
