# Cloudflare Pages 部署指南（星海之境）

## 结论：能部署，而且对你比 GitHub Pages 更合适

| 对比项 | GitHub Pages | Cloudflare Pages |
| --- | --- | --- |
| 静态托管 | ✅ | ✅ |
| 免费流量 | 软限额 100GB/月 | ✅ **不限流量** |
| 单文件上限 | 100 MB | 25 MiB |
| 文件数上限 | 无明确限制（仓库建议 <1GB） | 20,000 |
| 服务端函数（云存档） | ❌ 没有 | ✅ **Pages Functions** |
| 自定义域名 | ✅ | ✅（自动 HTTPS） |
| 国内访问 | 时快时慢 | 时快时慢（半斤八两） |

**决定性优势**：Cloudflare Pages 能跑服务端函数。玄门问道的云端存档可以直接放在
同一个域名下（`/xuanmen-save`），**不需要你那台已经 502 的阿里云服务器**，也不存在
跨域和混合内容的问题。

### 你的站 vs Cloudflare 免费额度（已核对官方限制）

| 限制项 | Cloudflare 免费版 | 你的站 | 结果 |
| --- | --- | --- | --- |
| 单文件上限 | 25 MiB | 最大 10.9 MB（一段 mp4） | ✅ |
| 文件总数 | 20,000 | 320 | ✅ 绰绰有余 |
| 站点总体积 | 无硬性上限 | 88.4 MB | ✅ |
| 构建次数 | 500 次/月 | 远用不到 | ✅ |
| 自定义域名 | 100 个/项目 | 1 个 | ✅ |
| 静态流量 | **不限** | — | ✅ |
| Functions 请求 | 10 万次/天（Workers 免费版） | 个人存档几十次/天 | ✅ |
| R2 存储（存档用） | 10 GB + 100 万次写/月 | 一份存档约 10 KB | ✅ 白送级别 |

---

## 一、部署

> ### ⚠️ 先看两个坑（都实测踩过）
>
> **坑 1：网页拖拽上传不支持 Pages Functions。**
> 在 Cloudflare 后台用「上传并部署」拖静态文件时，会提示
> 「⚠ 不支持 Pages Functions」——这是 Cloudflare 的硬限制：**拖拽上传的站点带不了云存档接口**。
> 想用云存档，必须走下面的 **Wrangler 命令行方式**（或见第三节"独立 Worker"方案）。
>
> **坑 2：不要直接拖 `F:\ocean-stars-v2` 整个文件夹！**
> 里面有 `.workbuddy` 本地工作目录（含管理口令等敏感文件），拖整夹会把它们一起发布到公网。
>
> **正确姿势：先跑打包脚本，再用打包出来的干净文件夹。**

### 0）打包干净副本（一条命令）

```bash
python scripts/deploy_cloudflare.py
```

会在 `F:\ocean-stars-deploy` 生成一份干净站点（315 个文件 / 88.3 MB），
已排除 `.workbuddy`、`.git`、`server-api`、`scripts`。以后每次改完站点都要重新跑一次再部署。

### 1）准备

- 注册 Cloudflare 账号：<https://dash.cloudflare.com/sign-up>
- 本机需要 Node.js（已装的话跳过）：<https://nodejs.org> 装 LTS 版

### 2）方式 A：Wrangler 命令行（**推荐，云存档能用**）

```bash
python scripts/deploy_cloudflare.py --push
```

脚本会自动打包干净副本并调用 wrangler 部署。首次会自动下载 wrangler，
并弹出浏览器让你登录 Cloudflare，点授权即可。完成后地址是：

```
https://ocean-stars.pages.dev
```

手动等价命令（如果不想用脚本）：

```bash
npx wrangler pages deploy F:\ocean-stars-deploy --project-name=ocean-stars
```

> 注意：wrangler 只忽略固定的几个目录（`functions`、`node_modules`、`.git` 等），
> **不读 .gitignore、也没有排除任意目录的参数**，所以必须用打包脚本先出干净副本。

### 3）方式 B：网页拖拽（不用装 Node，但云存档带不上）

1. 先跑 `python scripts/deploy_cloudflare.py` 生成 `F:\ocean-stars-deploy`
2. Cloudflare 后台 → **Workers & Pages** → **Create** → 上传并部署
3. 把 **`F:\ocean-stars-deploy` 这个文件夹**拖进去（不是 `F:\ocean-stars-v2`！）
4. 部署即可，站点完全正常，只是云存档面板会提示接口不可用

想补上云存档：看第三节"独立 Worker"方案，5 分钟搞定。

### 备选：连 GitHub（以后自动同步）

创建 Pages 项目时选 **Connect to Git**，授权 GitHub、选中 `ocean-stars` 仓库，
构建命令留空、输出目录填 `/`。之后每次 push 就自动重新部署（免费版每月 500 次构建）。

---

## 二、把云存档也搬过来（Pages Functions + R2）

> 只有**方式 A（Wrangler 命令行）部署**的站点才支持本节；网页拖拽上传的请直接看第三节。

项目里已经准备好了函数文件：`functions/xuanmen-save.js`。
部署后接口地址就是 `https://ocean-stars.pages.dev/xuanmen-save`。

### 需要做一个绑定（R2 存储桶）

1. Cloudflare 后台 → **Workers & Pages** → 你的 `ocean-stars` 项目
2. **Settings** → **Functions** → **R2 bucket bindings** → **Add binding**
3. Variable name 填 **`SAVES`**（必须一字不差），R2 bucket 选 **Create new**，名字填 `xuanmen-saves`
4. 保存后，**重新部署一次**才会生效：
   ```bash
   npx wrangler pages deploy . --project-name=ocean-stars
   ```

### 验证

浏览器打开：

```
https://ocean-stars.pages.dev/xuanmen-save?action=ping
```

看到 `{"ok":true,"service":"xuanmen-save","engine":"cloudflare-pages",...}` 就成了。

如果显示 `服务端未绑定 R2 存储（变量名应为 SAVES）`，说明第 3 步没绑好或没重新部署。

---

## 二·B、独立 Worker 方案（网页拖拽部署的站点用这个）

站点是拖拽上传的、不想装 Node？把云存档做成一个**独立的 Worker**，全程网页操作：

1. 准备好代码：`server-api/cloudflare-worker/xuanmen-save-worker.js`（已写好，直接复制全文）
2. Cloudflare 后台 → **Workers & Pages** → **Create** → **Worker** → 名字随便（如 `xuanmen-save`）→ Deploy
3. 点 **Edit code（编辑代码）** → 全选删掉 → 粘贴 `xuanmen-save-worker.js` 全文 → **Deploy**
4. Worker 的 **Settings → Bindings → Add → R2 bucket**：
   - Variable name：`SAVES`
   - R2 bucket：选 `xuanmen-saves`（没有就现场 Create）
5. 验证：浏览器打开 `https://你的worker名.fishsea1984.workers.dev/?action=ping`
   看到 `{"ok":true,...}` 即成功
6. 回到玄门问道页面 → 云存档面板最下面「修改」→ 填入
   `https://你的worker名.fishsea1984.workers.dev`（只填一次，浏览器会记住）

页面上的云存档面板本来就会自动探测同域 `/xuanmen-save`（Pages Functions 用），
探测不到时回退到你手动填的地址，所以两种方案互不冲突。

### 页面这边不用改任何东西

玄门问道页面的云存档面板会**自动探测**同域的 `/xuanmen-save`：
探测得到就用它（Cloudflare），探测不到就回退到你原来的服务器地址。
面板最下面会显示当前实际用的地址，也可以点「修改」手动指定。

---

## 三、绑定自己的域名（可选）

1. Cloudflare 后台 → 你的 Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 填 `www.yhtaoism.com`
3. 如果域名还没托管在 Cloudflare，按提示把域名的 NS 服务器改成 Cloudflare 给的两个地址
   （去你的域名注册商/阿里云域名控制台改，生效要几分钟到几小时）
4. Cloudflare 会自动签发 HTTPS 证书，不用自己申请

⚠️ 提醒：改用国内域名后，理论上又回到需要备案的范畴；而且 Cloudflare 在大陆没有官方节点，
国内访问速度靠运气。建议先用 `*.pages.dev` 地址跑一段时间，确认稳定了再考虑绑域名。

---

## 四、日常维护

| 事情 | 怎么做 |
| --- | --- |
| 改了页面/加了照片 | `python scripts/deploy_cloudflare.py --push`（方式 B 就重新打包后拖一次） |
| 回滚到上一版 | 后台 → 项目 → Deployments → 选一个 → **Rollback** |
| 看访问量 | 后台 → 项目 → **Web Analytics**（免费开启） |
| 删掉重来 | `npx wrangler pages project delete ocean-stars` |

## 五、几个注意点

1. **GitHub Pages 和 Cloudflare Pages 可以同时存在**，互不冲突。你可以两边都部署，
   哪个快用哪个（地址不同，存档不互通，各自用各自的存档码就行）。
2. **照片仍然是拖进仓库上传**，和之前一样，部署后自动生效。
3. 最大的那个 10.9 MB 视频已经接近 Cloudflare 25 MiB 上限的三分之一，
   以后单个文件别超过 25 MB，超了就先压缩或者放 R2。
4. 云端存档免费额度完全够用：一份存档约 10 KB，就算每分钟自动同步一次，
   一个月也就 4 万次写入，占 R2 免费额度（100 万次/月）的 4%。
