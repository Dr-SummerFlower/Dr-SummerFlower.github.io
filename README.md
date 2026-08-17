# Summer Flower 个人博客

<p align="center">
  <a href="https://blog.summerflower.top">
    <img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fblog.summerflower.top&label=Blog&style=flat-square" />
  </a>
  <a href="https://vite.dev/">
    <img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://react.dev/">
    <img alt="React 19" src="https://img.shields.io/badge/React-19-CA4245?logo=react&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://tailwindcss.com/">
    <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript ~6" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://pnpm.io/">
    <img alt="pnpm" src="https://img.shields.io/badge/pnpm-latest-F69220?logo=pnpm&logoColor=fff&style=flat-square" />
  </a>
  <a href="./LICENSE.md">
    <img alt="License" src="https://img.shields.io/github/license/Dr-SummerFlower/Dr-SummerFlower.github.io?style=flat-square" />
  </a>
  <a href="https://github.com/Dr-SummerFlower/Dr-SummerFlower.github.io/commits/main">
    <img alt="Last commit" src="https://img.shields.io/github/last-commit/Dr-SummerFlower/Dr-SummerFlower.github.io?style=flat-square" />
  </a>
</p>

基于 **Vite 8 + React 19 + Tailwind CSS v4** 的轻量静态 Markdown
个人博客，视觉灵感来自 [Fuwari](https://github.com/saicaca/fuwari)。

核心设计：**构建时编译 Markdown → 纯静态 JSON/HTML 产物 → 任意静态托管一键部署**，无运行时服务端依赖。

---

## ✨ 特性亮点

| 特性               | 说明                                                    |
|------------------|-------------------------------------------------------|
| ⚡ 极速首屏           | 构建时将文章元数据内联到 `index.html`，跳过异步请求，首屏零加载感               |
| 📝 纯 Markdown 写作 | 文章、关于页、自定义页面全部走 Markdown，frontmatter 驱动               |
| 🎨 主题系统          | light / dark / auto 三档 + OKLCH 自定义色调滑块 + 5 个预设色       |
| 🧩 响应式布局         | 三栏（左导航+中内容+右目录）→ 两栏 → 单栏自适应，移动端浮动 TOC 按钮              |
| 🔍 模糊搜索          | Fuse.js 懒加载，搜索索引构建时生成，支持标题/标签/正文                      |
| 🏷️ 分类 & 标签      | frontmatter 自动归档，Archive 页按年份/月份分组                    |
| 💬 Giscus 评论     | GitHub Discussions 驱动，无需自建评论服务                        |
| 🌐 i18n 双语       | zh-CN / en-US 内置，类型安全的命名空间字典系统                        |
| 🧩 组件型自定义页面      | 支持 React 组件作为自定义页面（例：内置「画师精选」画廊），独立 chunk 懒加载         |
| 🏗️ Markdown 扩展  | Admonition 提示块、GitHub 仓库卡片、标题锚点、代码块行号+折叠、图片懒加载        |
| 🔧 构建优化          | Rolldown + React Compiler + @iconify 图标按需离线打包，产物极致精简  |
| 🤖 SEO 全自动化      | sitemap / rss / robots / llms.txt / OpenGraph 构建时一键输出 |

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) ≥ 18（推荐 22 LTS）
- [pnpm](https://pnpm.io/) ≥ 9（**本项目固定使用 pnpm，禁止混用 npm/yarn**）

### 1. Fork & 安装

```bash
git clone https://github.com/Dr-SummerFlower/Dr-SummerFlower.github.io.git my-blog
cd my-blog
pnpm install
```

### 2. 修改站点配置

打开 [src/config.ts](./src/config.ts)，编辑 `blogConfig` 对象即可全站定制：

| 分组           | 关键字段                                                  | 说明                         |
|--------------|-------------------------------------------------------|----------------------------|
| `site`       | `title` / `subtitle` / `url` / `lang` / `description` | 站点基础信息 & SEO               |
| `profile`    | `name` / `avatar` / `bio` / `links[]`                 | 侧边栏个人资料 + 社交链接             |
| `theme`      | `banner` / `color.hue` / `toc.enable`                 | 横幅开关、主题色、TOC 开关            |
| `navigation` | `links[]` / `customPages[]`                           | 导航栏链接 + 自定义页面注册            |
| `comment`    | `giscus.enable` / `repo` / ...                        | 评论区配置，不需要设 `enable: false` |
| `license`    | `enable` / `name` / `url`                             | 文章末尾版权协议                   |

> 💡 详细字段类型定义见 [src/types/config.ts](./src/types/config.ts)。

### 3. 启动开发

```bash
pnpm dev
# 浏览器打开 http://localhost:5173
```

支持 HMR 热更新：修改 `content/**/*.md` 或 `src/` 下文件均自动刷新。

---

## ✍️ 写作指南

### 新增文章

1. 在 `content/posts/` 目录下新建 `your-title.md`
2. 复制 [content/template/_template.md](./content/template/_template.md) 的 frontmatter：

```yaml
---
title: 你的文章标题
published: 2026-08-17
description: 一句话摘要，用于列表页和 SEO
category: 日常杂谈
tags: [ 博客, 教程 ]
cover: /images/20260817/cover.jpg   # 可选：列表封面图
draft: false                        # 可选：true = 草稿（不发布）
---

正文开始，支持标准 GFM + 以下扩展语法。
```

### Markdown 扩展语法

| 功能             | 语法示例                                                             |
|----------------|------------------------------------------------------------------|
| Admonition 提示块 | `:::tip 标题`<br>内容<br>`:::`（tip/note/warning/danger/info/success） |
| GitHub 仓库卡片    | `::github{repo="owner/repo"}`                                    |
| 代码块折叠          | `\`\`\`ts title="example.ts" collapse="<summary>"`               |
| 图片             | 自动懒加载 + lightbox 放大                                              |

> ⭐ 必填字段只有 `title` 和 `published`，其他可选。

---

## 🧩 自定义页面（两种类型）

### A 类 · Markdown 自定义页面（简单内容）

适合「友链」「留言板」这类纯内容页面：

1. 在 `content/spec/` 或 `content/pages/` 新建 `xxx.md`
2. 在 `blogConfig.navigation.customPages` 追加：

```ts
{
    slug: "links",
        filePath
:
    "spec/links.md",
        title
:
    "友情链接",
        description
:
    "朋友们的博客列表",
        showInNavbar
:
    true,
        showInSitemap
:
    true,
}
```

3. 保存后自动生成路由 `/pages/links`，并出现在导航栏。

### B 类 · 组件型自定义页面（复杂交互）

适合「画廊」「工具集」这类需要 React 状态/交互的页面，本项目内置「画师精选」即此类。

1. 在 `src/custom-pages/` 新建 `<component-id>/index.tsx`，默认导出 React 组件：

```tsx
export default function MyToolPage() {
    return <section>你的组件内容</section>
}
```

2. 在 `blogConfig.navigation.customPages` 追加：

```ts
{
    type: "component",
        slug
:
    "my-tool",
        path
:
    "/my-tool",            // 可选：自定义路由，默认 /pages/my-tool
        componentId
:
    "my-tool",      // 可选：缺省 = slug
        title
:
    "我的工具箱",
        description
:
    "在线小工具集合",
        showInNavbar
:
    true,
        showInSitemap
:
    true,
}
```

3. 保存后自动：① 路由注册 ② 导航栏出现 ③ Sitemap/SEO 注入 ④ 独立 chunk 代码分割 + 错误边界保护。

---

## 📁 项目结构

```
summer_blog/
├── content/                      ← 内容单一事实来源
│   ├── posts/                    ← 博客文章 *.md
│   ├── spec/about.md             ← 关于页 Markdown
│   └── template/_template.md     ← 新文章 frontmatter 模板
├── public/                       ← 静态资源（banner、favicon、images）
├── src/
│   ├── config.ts  ⭐             ← 全站配置入口
│   ├── main.tsx                  ← 应用入口
│   ├── router/index.tsx          ← 路由表 + 自定义页面自动生成
│   ├── layouts/                  ← RootLayout / MainGridLayout（三栏壳）
│   ├── pages/                    ← 6 个基础页面（Home/Archive/About/Post/Custom/404）
│   ├── custom-pages/             ← 组件型自定义页面（子目录即组件 ID）
│   ├── components/               ← Navbar/Footer/TOC/PostCard/Search 等 UI 组件
│   ├── store/                    ← Zustand × 3（theme / ui / content）
│   ├── lib/
│   │   ├── markdown/index.ts  ⭐ ← Markdown→HTML 编译管道 + 扩展插件
│   │   └── config/               ← 派生配置 + URL/导航辅助函数
│   ├── i18n/                     ← zh-CN / en-US 双语字典
│   ├── types/                    ← config / post / search-index 类型定义
│   ├── utils/                    ← 日期 / TOC / URL / SEO 工具函数
│   └── styles/                   ← 分段 CSS（theme / layout / markdown ...）
├── vite-plugins/
│   ├── content/  ⭐               ← 构建时内容管道（扫描→编译→产物）
│   │   ├── compiler.ts           ←   调度：frontmatter / MD→HTML / 搜索索引
│   │   └── writers/              ←   输出：sitemap/rss/robots/llms.txt/内联
│   └── iconify/                  ← @iconify 图标按需离线扫描打包
├── .github/workflows/deploy.yml  ← GitHub Actions 自动部署
├── vite.config.ts                ← Vite + Rolldown + React Compiler
└── package.json
```

---

## 🌐 部署

本项目为纯静态产物（`dist/`），**任何静态托管平台均支持**。

### 方式一：GitHub Actions（推荐，本项目已内置）

推送 `main` 分支即自动构建并部署到 GitHub Pages，见 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)。

需配置：

1. 仓库 Settings → Pages → Source 选「GitHub Actions」
2. 如需自定义域名，在 `blogConfig.site.url` 填入域名，并在 `public/` 放 `CNAME` 文件

### 方式二：手动部署

```bash
pnpm build          # 产物输出到 dist/
# 将 dist/ 目录上传到任意静态托管
```

### 常见托管平台

| 平台               | 说明                                               |
|------------------|--------------------------------------------------|
| GitHub Pages     | Actions 自动部署，免费                                  |
| Vercel           | 直接 Import 仓库，零配置自动识别 Vite                        |
| Cloudflare Pages | 国内访问快，Build Command: `pnpm build`，Output: `dist` |
| 自建 Nginx         | 把 `dist/` 拷到 `/usr/share/nginx/html`             |

---

## 🛠️ 脚本速查

完整定义见 [package.json scripts](./package.json#L23-L28)。

| 命令             | 说明                                        |
|----------------|-------------------------------------------|
| `pnpm dev`     | 启动开发服务器 → http://localhost:5173           |
| `pnpm build`   | `tsc -b` 类型检查 + `vite build`，产物输出 `dist/` |
| `pnpm lint`    | oxlint 毫秒级 lint 检查                        |
| `pnpm preview` | 预览 `dist/` 构建产物                           |

---

## 📄 许可证

- 代码：[MIT](./LICENSE.md)
- 文章：默认 CC BY-NC-SA 4.0（可在 `blogConfig.license` 修改）

---

<p align="center">
  <a href="https://blog.summerflower.top">在线预览</a>
  ·
  <a href="https://github.com/saicaca/fuwari">灵感来源 · Fuwari</a>
  ·
  <a href="./AGENTS.md">AI Agent 开发规范</a>
</p>
