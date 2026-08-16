# Summer Flower 个人博客

<p align="center">
  <a href="https://Dr-SummerFlower.github.io">
    <img alt="Blog" src="https://img.shields.io/website?url=https%3A%2F%2FDr-SummerFlower.github.io&label=Blog&style=flat-square" />
  </a>
  <a href="https://vite.dev/">
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://react.dev/">
    <img alt="React" src="https://img.shields.io/badge/React-19-CA4245?logo=react&logoColor=fff&style=flat-square" />
  </a>
  <a href="https://tailwindcss.com/">
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff&style=flat-square" />
  </a>
  <a href="LICENSE.md">
    <img alt="License" src="https://img.shields.io/github/license/Dr-SummerFlower/Dr-SummerFlower.github.io?style=flat-square" />
  </a>
  <a href="https://github.com/Dr-SummerFlower/Dr-SummerFlower.github.io/commits/main">
    <img alt="Last commit" src="https://img.shields.io/github/last-commit/Dr-SummerFlower/Dr-SummerFlower.github.io?style=flat-square" />
  </a>
</p>

基于 Vite + React 19 + Tailwind CSS v4 的轻量 Markdown 静态博客，视觉灵感来自 [Fuwari](https://github.com/saicaca/fuwari)，使用「构建时编译 Markdown → 纯静态产物 → 任意静态托管直接部署」的最小闭环。

## 有什么特性

⚡ 首屏数据构建时内联，跳过异步请求
📝 文章/关于/自定义页面全部是 `.md`
🎨 亮暗自动三档 + 自定义色调滑块
🧩 三栏响应式 + 可选右侧文章目录
🔍 Fuse.js 懒加载模糊搜索

## 5 分钟搭一个同款

### 1. Fork & 安装

```bash
git clone https://github.com/Dr-SummerFlower/Dr-SummerFlower.github.io.git my-blog
cd my-blog
npm install
```

### 2. 改好你的配置

打开 [`src/config.ts`](./src/config.ts)，修改 `blogConfig` 里这些：

- `site.title / subtitle / url / lang` — 站点基础信息
- `profile.name / avatar / bio / links[]` — 侧边栏资料 & 社交链接
- `theme.banner` — 首页横幅开关与图片
- `comment.giscus` — 不需要就 `enable: false`

### 3. 写文章

在 `content/posts/` 新建 `.md`：

```yaml
---
title: 标题
published: 2026-08-08
description: 一句话摘要
category: 日常杂谈
tags: [博客, 开工]
---

正文开始。支持 :::tip 提示块 和 ::github{repo="xxx/yyy"} 卡片。
```

### 4. 发布

```bash
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 产物在 dist/，丢到 GitHub Pages / Vercel / Cloudflare Pages 都行
```

## 仓库一览

```
summer_blog/
├── content/               ← 文章 / 页面全放这（content 单一事实来源）
│   ├── posts/
│   ├── pages/
│   └── spec/about.md
├── public/                ← banner / favicon / 头像 / 封面图
├── src/
│   ├── components/        ← Navbar、Footer、BackToTop、搜索、TOC 等
│   ├── config.ts          ← ⭐ 配置入口
│   ├── layouts/           ← MainGridLayout（统一三栏壳）
│   ├── lib/markdown.ts    ← unified 编译管道
│   ├── pages/             ← Home / Post / Archive / About / NotFound
│   ├── store/             ← Zustand × 3（theme / ui / content）
│   ├── utils/             ← 日期 / TOC / URL / SEO 工具
│   └── index.css          ← Tailwind + CSS 变量主题
├── vite-plugin-content.ts ← ⭐ 构建时内容管道
└── vite.config.ts
```

**脚本速查**：
  - `npm run dev` 开发
  - `npm run build` 构建 + 类型检查
  - `npm run lint` oxlint 毫秒级检查
  - `npm run preview` 预览产物。

<p align="center">
  <a href="https://Dr-SummerFlower.github.io">在线预览</a> ·
  <a href="https://github.com/saicaca/fuwari">灵感来自 Fuwari</a> ·
  <a href="https://github.com/Dr-SummerFlower/Dr-SummerFlower.github.io/blob/main/LICENSE.md">MIT</a>
</p>
