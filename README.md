# AINPE · AI 实战情报站

React / Vite 网站，提供 AI 实战文章、默认折叠的 FDE 推荐、专题、按城市浏览的线下活动、项目库、收藏和体验营入口。

## 本地运行

```sh
npm ci
npm run dev -- --port 4175
```

预览地址：<http://127.0.0.1:4175/>。

## 构建与验证

```sh
npm run build
node --test tests/*.test.mjs
```

构建生成 `dist/client/`、`dist/server/index.js` 和 `dist/.openai/hosting.json`。仓库不包含 GitHub Actions 工作流。

## 目录

- `src/`：页面、样式、配置和已确认公开上传的页面数据快照。
- `public/assets/`：页面使用的海报与二维码原图。
- `server/`：本机 Vite 的只读 `/api/feed` 与 `/api/feed/status` 接口。
- `scripts/`、`sync/`：数据清洗、发布缓存、归档及本机同步说明。
- `worker/`、`.openai/`：静态站点交付配置。
- `tests/`：分类、活动、出口、数据安全与静态站点测试。

## 数据与同步

七份页面数据快照随源码保留：`knowledge.json`、`discovery.json`、`projects.json`、`event-reviews.json`、`verified-offline-events.json`、`offline-stories.json`、`fde-editorial.json`，均位于 `src/`。来源链接与署名按原数据保留。

实时缓存 `data/live-feed.json`、MCP 临时输入和本地资料归档不提交。没有实时缓存时，本机接口从 `src/` 快照初始化，页面也可使用内置内容。

每日同步依赖原电脑、Codex 桌面端和已授权的生财 MCP，不会因上传本仓库而自动迁移或启用。执行同步前请阅读 `sync/RUNBOOK.md`，使用当前环境的项目路径与 Node 路径；不要提交授权凭据。静态 Worker 不提供会员 MCP 或实时数据服务。

站长微信二维码与体验营二维码保持独立；推广配置见 `src/site-config.json`。
