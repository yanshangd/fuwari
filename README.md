# edgeone-blog

Fuwari 配色风格的个人博客，跑在腾讯 EdgeOne Makers 上：文章存 KV，图片存 Blob，页面由 Next.js 15 App Router SSR 渲染。

```
src/          Next.js 页面与组件（fuwari 主题移植）
functions/    EdgeOne 边缘函数：/api/* 数据接口、/images/* 图片读取
site.config.ts 站点标题、导航、每页篇数、主题色
scripts/smoke.mjs 接口回归（对着本地 mock 跑）
fuwari-src/   原 Astro 主题，仅作参照，不参与构建
```

## 数据模型

KV 里只有三个逻辑键族，key 只允许字母数字下划线（slug 里的 `-` 写入时转 `_`）：

| key | 内容 |
| --- | --- |
| `posts_index` | 全部文章元信息数组，含写时算好的 `excerpt` / `words` / `minutes` |
| `post_<slug>` | 单篇全文（Markdown 正文） |
| `about_body` / `auth_config` | 关于页正文 / 管理员口令哈希与签名密钥 |

图片走 `@edgeone/pages-blob` 的 `blog-assets` 命名空间，对象键 `images/<随机hex>.<ext>`，由 `/images/*` 边缘函数代理输出（一年 immutable 缓存）。

Next 侧运行时尚拿不到 KV，所以所有读写都打到同源 `/api/*`，由边缘函数完成。

## 本地开发

```bash
pnpm install
pnpm dev:api     # :8788 用文件 mock 的 KV/Blob 跑同一套边缘函数
pnpm dev         # :3000 Next SSR，API_BASE 指向 :8788
node scripts/smoke.mjs   # 接口回归：鉴权、增删查、搜索、上传下载、草稿隔离
```

首次 `pnpm dev` 后打开 <http://localhost:3000/admin>，设管理员密码（一次性，之后只能登录）。

## 部署

边缘函数按绑定名取 KV（`env.blog_ugc`，取不到再回退全局 `blog_ugc`），部署前确认：

1. KV 命名空间已建好并以 **`blog_ugc`** 绑定到本项目。
2. Blob 命名空间名为 **`blog-assets`**。

线上项目是 **one-blog**，由 GitHub 仓库 `yanshangd/fuwari` 的 `main` 分支驱动（Provider=Github 的项目不能 CLI 直传），推 `main` 即触发构建：

```bash
git push origin main
```

对外地址是自定义域名 `https://blog.coosspadger.cn`，`site.config.ts` 的 `url` 要与它一致——RSS / sitemap / robots / OG 的绝对地址都取它；留空则退回按请求头 `x-forwarded-proto` + `host` 推断。

新项目 preview 环境要求已存在一次 production 部署，首次上线只能走 production。
上线后先访问 `/api/health`，返回 `{kv:true, kvSource:"env"|"global", hasAuth:false, ...}` 说明 KV 通了；再进 `/admin` 设密码（setup 只能执行一次）。
