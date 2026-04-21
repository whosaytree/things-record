# 我的物品记录

一个手机优先的个人物品记录网站，用来按类别记录自己的物品、评分、描述、图片和购买链接。适合在下次购买同类物品前快速回看自己的真实使用体验。

## 2.0.0 功能

- 按类别管理物品，默认包含衣物、护肤、食物、其他。
- 新增和编辑物品，支持名称、类别、1-5 分评分、描述、图片和购买链接。
- 首页按类别分组展示物品，并显示每个类别的物品数量。
- 支持关键词检索，可按名称和描述筛选物品。
- 详情页查看完整记录，并支持编辑和删除物品。
- 设置页支持新增、重命名和删除类别。
- 删除类别时，该类别下的物品会自动移动到其他可用类别，不会直接删除物品。
- 支持导出和导入 JSON 备份。
- 支持基础 PWA 能力，可添加到手机主屏幕。
- 1.0.1 优化了整体视觉风格、主题色、底部导航和页面层级。
- 2.0.0 优化静态网站部署支持，可将 `dist/` 发布到 GitHub Pages、Netlify、Vercel 或 Cloudflare Pages，手机无需电脑运行服务即可使用。

## 本地运行

先安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

如果要用手机访问本机开发服务：

```bash
npm run dev -- --host 0.0.0.0
```

然后用手机打开终端中显示的 `Network` 地址，例如：

```txt
http://192.168.x.x:5173
```

手机和电脑需要连接同一个 Wi-Fi。

## 手机端使用

用手机浏览器打开网站后，可以添加到主屏幕：

- iPhone Safari：分享按钮 -> 添加到主屏幕
- Android Chrome：菜单 -> 安装应用或添加到主屏幕

如果是本地开发地址，电脑必须开着并运行开发服务。部署到公网静态网站后，手机主屏入口就可以像普通轻应用一样直接打开。

## 部署到静态网站

构建静态文件：

```bash
npm run build
```

构建完成后，把 `dist/` 目录部署到任意静态网站服务即可，例如 GitHub Pages、Netlify、Vercel 或 Cloudflare Pages。

部署完成后，手机直接打开公网地址就可以使用，不需要电脑开机，也不需要在电脑上运行开发服务。

### GitHub Pages 自动部署

项目已经包含 GitHub Actions 部署配置。推送到 GitHub 后：

- 打开 GitHub 仓库的 `Settings -> Pages`。
- 将 `Build and deployment -> Source` 选择为 `GitHub Actions`。
- 回到 `Actions` 页面，等待 `Deploy static site to GitHub Pages` 工作流完成。
- 发布完成后，用手机打开 Pages 地址。

后续每次推送到 `main` 分支，GitHub 都会自动构建并发布最新版。

### 其他静态网站平台

如果使用 Netlify、Vercel 或 Cloudflare Pages：

- 构建命令填写 `npm run build`。
- 输出目录填写 `dist`。
- 发布成功后，用手机打开平台提供的网址。

本项目使用相对资源路径和 HashRouter，支持部署在根域名或子路径下。

## 数据说明

当前 2.0.0 版本不需要服务器，数据保存在当前浏览器的 IndexedDB 中。

这意味着：

- 不同设备之间的数据不会自动同步。
- 换手机、清理浏览器数据或更换浏览器，可能看不到原来的记录。
- 建议定期在设置页导出 JSON 备份。
- 需要迁移数据时，可以在新设备上导入备份 JSON。

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/`。

## 技术栈

- Vite
- React
- TypeScript
- React Router
- IndexedDB
- PWA manifest + service worker

## 版本

当前版本：2.0.0
