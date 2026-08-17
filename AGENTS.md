# AGENTS.md - Summer Blog AI 智能体规范

> 面向 AI Coding Agent 的行为边界与上下文速览。用户文档见 [README.md](./README.md)。

---

## 【必选】行为规范

1. 修改范围**不得超出项目目录**
2. 运行破坏性命令前，先审查命令内容
3. 终端使用 **PowerShell 5** 语法
4. 搜索/修改代码优先使用 codegraph MCP 和 LSP
5. 包管理器固定 `pnpm`，禁止混用 npm/yarn
6. 大变更后同步评估是否需更新本文档
7. 所有引用文件/目录/代码元素的链接**一律使用基于项目根的相对路径**（`./src/xxx.ts`、`./content/`），行号锚点格式 `#L<start>-L<end>`；显示名仅用 basename，不加反引号；**严禁写入本机绝对路径**（含盘符 `D:\`、`/Users/` 等，防止隐私泄露）

---

## 【必选】项目定位

**Vite 8 + React 19 + Tailwind CSS v4** 静态 Markdown 博客。

核心模式：**构建时编译 Markdown → 纯静态 JSON/HTML 产物 → 任意静态托管**。

核心技术栈速查：

- 路由：React Router 7 · 状态：Zustand 5 · 类型：TypeScript ~6
- Markdown 管道：unified + GFM 扩展
- 构建插件：vite-plugin-content（内容管道）、iconify（图标离线）
- 部署：GitHub Actions → 静态托管

---

## 【必选】架构红线（禁止破坏）

1. **布局层级**：[MainGridLayout](./src/layouts/MainGridLayout.tsx) 仅在 [RootLayout](./src/layouts/RootLayout.tsx)
   实例化一次，页面组件直接 return 内容片段，**禁止重复包裹**
2. **页面通信**：通过 `useUIStore.setLayoutHeroMode()` / `setLayoutHeadings()` 与外壳交互，useEffect cleanup 必须复位状态
3. **内容单一事实来源**：`content/posts/**/*.md`，配置入口：[blogConfig](./src/config.ts)
4. **组件型自定义页面**：`src/custom-pages/<id>/index.tsx` 默认导出组件，通过 `blogConfig.navigation.customPages`
   注册（type:"component"），不要手改路由表

---

## 【必选】本文档更新约定（元规范）

> 更新 AGENTS.md 时必须遵守以下自描述规则，保证长期可读性与信息密度。

1. **定位**：本文档 **仅面向 AI Agent**，不承载面向用户的内容（后者放 README.md）
2. **结构**：固定采用模块化分区，**【必选】模块 × N + 【可选】模块 × N**，必选模块在前
3. **行数约束**：全文严格控制在 **300 行以内，目标 60 行左右**；超出即启动精简，删除 AI 可自行探索获取的信息
4. **核心原则**：**简洁、精准、可执行**
    - 简洁：只保留 AI 无法从代码中直接推理出的行为边界 / 红线 / 核心约定
    - 精准：每条规则可立即对照执行，不写模糊描述
    - 可执行：不写教程性内容、不写完整目录树、不展开大段设计说明，让 AI 直接跳源文件获取细节
5. **删减判定**：以下信息一律不在本文档展开，用一行路径指针替代即可
   - 完整目录结构（用 LS 工具即可）
   - 路由表/配置表详情（读对应 ts 文件）
   - Markdown 语法/编译管道多步流程（读源文件）
   - 三步以上操作指南（一句话 Cheatsheet 足矣）
6. **隐私红线**：**禁止写入任何本机绝对路径、盘符、用户名、本地端口号等环境隐私信息**；所有文件路径统一使用项目根相对路径 `./` 开头，跨平台无敏感信息泄露

---

## 【可选】关键入口指针

| 目的                 | 文件                                                                     |
|--------------------|------------------------------------------------------------------------|
| 修改站点信息/个人资料        | [src/config.ts](./src/config.ts)                                       |
| 路由表定义              | [src/router/index.tsx](./src/router/index.tsx)                         |
| Markdown→HTML 编译管道 | [src/lib/markdown/index.ts](./src/lib/markdown/index.ts)               |
| 构建时内容编译调度          | [vite-plugins/content/compiler.ts](./vite-plugins/content/compiler.ts) |
| 自定义页面双轨注册          | `blogConfig.navigation.customPages[]`                                  |

---

## 【可选】常用脚本

```bash
pnpm dev       # 开发服务器 http://localhost:5173
pnpm build     # tsc 类型检查 + vite build → dist/
pnpm lint      # oxlint
pnpm preview   # 预览构建产物
```

---

## 【可选】快速指引 Cheatsheet

**新增文章**：`content/posts/xxx.md` → 复制 [_template.md](./content/template/_template.md) frontmatter → `pnpm dev`

**新增 Markdown 页面**：`content/pages/xxx.md` → `blogConfig.navigation.customPages` 追加 `{ slug, filePath, title }`

**新增组件型页面**：`src/custom-pages/<id>/index.tsx` → config 追加 `{ type:"component", slug, title, ... }`
