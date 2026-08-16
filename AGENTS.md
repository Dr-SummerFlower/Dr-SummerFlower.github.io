# AGENTS.md - Summer Blog 项目速览

## AI 注意事项

> ⚠️ 以下规则在编辑本项目时必须无条件遵守！

1. 修改范围不得超出项目目录
2. 运行破坏性命令前，请先审查命令内容
3. 当前环境使用 **PowerShell 5** 语法
4. 搜索项目代码和修改代码时优先使用 codegraph MCP 和 LSP 语言服务器，效率更高
5. 完成项目较大变更后，判断是否需要同步更新本文档和 [README.md](./README.md)


> ⚠️ 本文档专为 AI Agent 快速理解项目而设计。用户可读的完整说明请参阅 [README.md](./README.md)。

---

## 项目定位

基于 **Vite 8 + React 19 + Tailwind CSS v4** 的轻量静态 Markdown 个人博客。

核心设计：**构建时编译 Markdown → 纯静态 JSON/HTML 产物 → 任意静态托管部署**。

---

## 技术栈速览

完整依赖清单见 [package.json](./package.json)。

| 分类 | 核心技术 |
|---|---|
| 框架 | React 19 + React Router 7 |
| 构建 | Vite 8 + Rolldown (Babel + React Compiler) → [vite.config.ts](./vite.config.ts) |
| 样式 | Tailwind CSS v4 + PostCSS + CSS 变量主题 → [postcss.config.mjs](./postcss.config.mjs) |
| 状态 | Zustand 5（3 个 store：theme / ui / content）→ [src/store/](./src/store) |
| Markdown | unified 管道 → [src/lib/markdown/index.ts](./src/lib/markdown/index.ts) |
| 搜索 | Fuse.js 懒加载模糊搜索 |
| 图标 | @iconify/react（离线模式 + 自定义插件扫描）→ [vite-plugins/iconify/](./vite-plugins/iconify) |
| 评论 | Giscus（GitHub Discussions）|
| 类型 | TypeScript ~6.0 → [tsconfig.json](./tsconfig.json) |
| Lint | oxlint |
| 包管理 | pnpm |

---

## 核心目录导航

> 详细目录结构与职责：直接探索下列文件/目录即可。

```
summer_blog/
├── content/                          ← 内容单一事实来源（Markdown）
│   ├── posts/                        ← 博客文章 *.md
│   ├── spec/about.md                 ← 关于页内容
│   └── template/_template.md         ← 新文章模板
├── public/                           ← 静态资源（banner、favicon、images）
├── src/
│   ├── config.ts  ⭐                 ← 全局配置入口（见下文）
│   ├── main.tsx                      ← 入口：挂载 RouterProvider
│   ├── router/index.tsx  ⭐          ← 路由表（见下文）
│   ├── layouts/                      ← RootLayout / MainGridLayout
│   ├── pages/                        ← 7 个页面组件
│   ├── components/                   ← Navbar / Footer / TOC / PostCard / Search ...
│   ├── store/                        ← theme / ui / content 三个 store
│   ├── lib/markdown/index.ts  ⭐     ← Markdown→HTML 编译管道
│   ├── types/                        ← config / post / search-index 类型
│   ├── utils/                        ← 日期 / TOC / URL / SEO 工具
│   ├── i18n/                         ← zh-CN / en-US 双语言
│   └── styles/                       ← 分段 CSS（theme / layout / markdown ...）
├── vite-plugins/
│   ├── content/  ⭐                   ← 构建时内容管道（见下文）
│   └── iconify/                      ← 图标按需离线打包
└── .github/workflows/deploy.yml      ← CI 部署
```

---

## 核心配置入口 ⭐

修改 [blogConfig](./src/config.ts#L11-L157) 对象即可定制站点。

关键导出（在 [src/config.ts](./src/config.ts) 中）：
- `blogConfig` — 原始配置（`as const`）
- `siteConfig` / `profileConfig` / `licenseConfig` / `giscusConfig` / `seoConfig` / `contentConfig` — 派生分组
- `withSiteBasePath()` / `getAbsoluteUrl()` / `getNavLinks()` / `getCustomPages()` — URL & 导航辅助

---

## 路由表

路由定义在 [src/router/index.tsx](./src/router/index.tsx#L12-L31)：

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | HomePage | 首页（Hero + 文章列表分页）|
| `/archive` | ArchivePage | 按年份/月份归档 |
| `/about` | AboutPage | 关于页（读取 content/spec/about.md）|
| `/anima-artists` | AnimaArtistsPage | 二次元画师画廊页 |
| `/pages/:slug` | CustomPage | 自定义 Markdown 页面 |
| `/posts/:slug` | PostPage | 文章详情（上/下篇、TOC、评论）|
| `*` | NotFoundPage | 404 |

basename 由 `withSiteBasePath("/")` 注入，支持子路径部署。

---

## 构建时内容管道（vite-plugin-content）⭐

主入口：[vite-plugins/content/index.ts](./vite-plugins/content/index.ts)  
编译调度：[scanAndCompile()](./vite-plugins/content/compiler.ts)

**输入**：`content/posts/**/*.md` + `content/spec/*.md` + `blogConfig`  
**编译流程**（概述）：
1. 提取 frontmatter → `BlogPostMeta`
2. Markdown → HTML（调用 `src/lib/markdown` 管道）
3. 统计 reading-time、字数、提取 TOC 标题树
4. 生成 postsMeta / categories / tags / archiveGroups / searchIndex
5. 写出 sitemap / rss / robots / llms.txt / CNAME（见 [writers/](./vite-plugins/content/writers)）

**dev 模式**：通过 `/generated/*.json` 提供数据，.md 变更触发 full-reload  
**build 模式**：`emitFile` 到 `dist/generated/`，随后 [writeBundleHtmlInline()](./vite-plugins/content/writers/html-inline.ts) 将首屏数据内联到 `index.html`

**内容 store 加载优先级**：HTML 内联 → fetch `/generated/*.json` → localStorage 缓存

---

## 主题系统（CSS 变量 + OKLCH）

- Store 实现：[useThemeStore](./src/store/theme.ts#L58-L119)
- 主题配置项：[blogConfig.theme](./src/config.ts#L51-L77)
- 初始化注入：`useThemeStore.initOnHydrate()` 在 `ConfigCarrier` 组件中调用

要点：
- **模式**：light / dark / auto 三档，跟随系统 `prefers-color-scheme`
- **色调**：HSL hue 值（0~360）作为 CSS 变量 `--hue`，全站主题色基于 OKLCH 计算
- **持久化**：zustand persist → localStorage key `summer-blog-theme-v1`

---

## 文章 Markdown 扩展语法

编译管道与插件实现：[src/lib/markdown/index.ts](./src/lib/markdown/index.ts#L28-L69)

支持的扩展（标准 GFM 基础上）：

| 功能 | 语法示例 | 实现位置 |
|---|---|---|
| Admonition 提示块 | `:::tip 标题 ... :::`（类型：tip/note/warning/danger/info/success）| [MdAdmonition.tsx](./src/lib/markdown/components/MdAdmonition.tsx) |
| GitHub 仓库卡片 | `::github{repo="owner/repo"}` | [MdGithubCard.tsx](./src/lib/markdown/components/MdGithubCard.tsx) |
| 标题自动锚点 | 自动注入 | rehype-slug + rehype-autolink-headings |
| 图片懒加载 | 自动处理 | [rehype-lazy-image.ts](./src/lib/markdown/plugins/rehype-lazy-image.ts) |
| 代码块增强 | 自动处理 | rehype-expressive-code（行号/折叠/语言标题）|

---

## 常用脚本

完整脚本定义：[package.json scripts](./package.json#L23-L28)

```bash
pnpm dev       # 本地开发  http://localhost:5173
pnpm build     # tsc -b 类型检查 + vite build（产物 dist/）
pnpm lint      # oxlint 毫秒级 lint
pnpm preview   # 预览构建产物
```

---

## 新增文章快速步骤

1. 在 `content/posts/` 新建 `your-title.md`
2. 复制 [_template.md](./content/template/_template.md) 的 frontmatter 结构，**必填** `title`、`published`
3. `pnpm dev` 即可热更新预览

修改个人资料/站点信息 → 编辑 [src/config.ts](./src/config.ts)。
