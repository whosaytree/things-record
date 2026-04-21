# 我的物品记录

一个手机优先的个人物品记录应用，用来按类别记录自己的物品、评分、描述、图片和购买链接。适合在下次购买同类物品前，快速回看自己的真实使用体验。

当前线上版本：

[https://whosaytree.github.io/things-record/](https://whosaytree.github.io/things-record/)

## 使用方式

手机浏览器打开线上地址即可使用，不需要电脑开机，也不需要运行本地开发服务。

可以把它添加到手机主屏幕：

- iPhone Safari：分享按钮 -> 添加到主屏幕
- Android Chrome：菜单 -> 安装应用或添加到主屏幕

这个网站是公开可访问的，但数据不会互通。每个人看到和保存的内容都来自自己当前设备、当前浏览器的本地数据。

## 功能

- 按类别管理物品，默认包含衣物、护肤、食物、其他。
- 新增、编辑和删除物品记录。
- 支持物品名称、类别、1-5 分评分、描述、图片和购买链接。
- 首页按类别分组展示物品，并显示每个类别的物品数量。
- 支持关键词检索，可按名称和描述筛选物品。
- 详情页查看完整记录。
- 设置页支持新增、重命名和删除类别。
- 删除类别时，该类别下的物品会自动移动到其他可用类别，不会直接删除物品。
- 支持导出和导入 JSON 备份。
- 支持基础 PWA 能力，可添加到手机主屏幕。
- 支持部署到 GitHub Pages、Netlify、Vercel、Cloudflare Pages 等静态网站平台。

## 数据说明

当前版本不需要服务器，数据保存在当前浏览器的 IndexedDB 中。

这意味着：

- 不同用户之间的数据不会互通。
- 不同设备之间的数据不会自动同步。
- 换手机、换浏览器或清理浏览器数据后，可能看不到原来的记录。
- 建议定期在设置页导出 JSON 备份。
- 需要迁移数据时，可以在新设备或新浏览器里导入备份 JSON。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

浏览器打开终端显示的本地地址，例如：

```txt
http://localhost:5173
```

如果需要用手机访问本机开发服务：

```bash
npm run dev -- --host 0.0.0.0
```

然后用手机打开终端中显示的 `Network` 地址。手机和电脑需要连接同一个 Wi-Fi。

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/`。

本项目使用相对资源路径和 HashRouter，构建产物支持部署在根域名或子路径下。

## 部署

### GitHub Pages

项目已经包含 GitHub Actions 部署配置：

[.github/workflows/deploy.yml](.github/workflows/deploy.yml)

推送到 `main` 分支后，GitHub Actions 会自动执行：

```bash
npm ci
npm run build
```

然后把 `dist/` 发布到 GitHub Pages。

仓库需要在 `Settings -> Pages` 中启用 GitHub Pages，并将 `Build and deployment -> Source` 设置为 `GitHub Actions`。

### 其他静态网站平台

Netlify、Vercel、Cloudflare Pages 等平台可以使用相同配置：

- 构建命令：`npm run build`
- 输出目录：`dist`

## 技术栈

- Vite
- React
- TypeScript
- React Router
- IndexedDB
- PWA manifest + service worker

## 版本

当前版本：2.0.0
