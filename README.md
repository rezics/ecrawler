# ecrawler 项目文档

欢迎来到 ecrawler 项目！这是一个使用 TypeScript 和
[Effect](https://effect.website/)
构建的分布式网页爬虫应用。如果你刚刚接触 TypeScript 或相关的生态系统，不要担心，这份文档将帮助你理解项目的基本结构、使用方法以及如何开始开发。

## 项目结构 (Monorepo)

本项目采用
**Monorepo**（单体仓库）结构，这意味着多个相关的包和应用都存放在这一个代码仓库中。我们使用 Yarn 的 Workspaces 功能来管理它们。

整个项目分为三大类：`apps`（主要可执行应用）、`libs`（共享库）和
`tools`（开发工具）。

### 1. 核心应用 (`apps/`)

这些是项目实际运行的主程序：

- **`apps/cli`**: 命令行工具 (Command Line
  Interface)。用于通过命令行执行特定任务，如导入和导出数据（`import` 和 `export`
  命令）。它使用 `@effect/cli` 构建。
- **`apps/server`**: 服务端程序 (Server)。它是爬虫的中央控制系统，负责接收请求、管理数据库 (`drizzle-orm` +
  PostgreSQL)、提供 API（内部包 `@ecrawler/api`），以及调度爬虫任务。
- **`apps/worker`**: 任务工作节点 (Worker)。它是实际执行网页抓取的程序。它从服务端获取任务，执行抓取逻辑提取数据，然后再把结果交回给服务端。
  - **`apps/worker/implementations`**: 存放针对*不同网站*的特定抓取实现逻辑（例如
    `bqgl.cc`, `qidian` 等）。

### 2. 共享库 (`libs/`)

这些是可以被不同的 `apps` 复用的代码，避免重复编写：

- **`libs/api`**: 定义了服务端 API 的相关代码（如收集器 `collector`、调度器
  `dispatcher` 等逻辑或接口约定）。
- **`libs/schemas`**: 定义了项目中流通的统一**数据结构模型**（如 `User`, `Book`,
  `Chapter`, `Task`, `Result`
  等）。不论是 Server 还是 Worker，都共用这些类型定义来保证数据的一致性。
- **`libs/proxy`**: （如果需要）处理网络代理的相关逻辑代码。

### 3. 工具与配置 (`tools/` )

开发和构建时的辅助工具和配置：

- **`tools/database`**: 包含与数据库相关的配置，例如提供本地测试环境的
  `compose.yaml` (Docker Compose 配置)。
- **`tools/readme`**: 用于自动生成 README 文件的脚本。
- **`tools/update`**: 自动更新脚本。
- 项目根目录下的一系列配置文件：
  - `package.json`: 声明了所有依赖和可用脚本。
  - `tsconfig.base.json`: TypeScript 的核心配置文件，其他包的 `tsconfig.json`
    会继承它。

---

## 技术栈简介

作为新手，你可能会在代码中看到下面这些重要库：

1.  **TypeScript & Node.js 24/tsx**: 项目的主要编程语言和运行环境。开发环境使用
    `tsx` 快速执行 `.ts` 文件。
2.  **Yarn (v4)**: 用作包管理器和执行脚本。
3.  **Effect (`effect`,
    `@effect/*`)**: 这是一个非常强大的 TypeScript 函数式编程生态系统。它被广泛用于整个项目的异步操作、依赖注入、重试、并发控制等核心逻辑。（如果你不熟悉 Effect，可以将其简单类比为增强版的 Promise/async-await 以及错误处理系统，建议查阅 Effect 官方文档）。
4.  **Drizzle ORM
    (`drizzle-orm`)**: 用于服务端与数据库 (PostgreSQL) 的交互。允许你用 TypeScript 代码编写类型安全的 SQL 查询。

---

## 如何使用与运行

在开始之前，确保你已经安装了 **Node.js** 和 **Yarn v4**。

### 1. 初始化项目

克隆项目后，在根目录下运行：

```bash
# 安装所有依赖
yarn install
```

### 2. 启动服务与节点

各个主应用都提供了启动脚本：

- **启动 Server**: 需要配置好数据库并初始化，通常可以先运行
  `yarn workspace @ecrawler/server run dev` 进行开发模式启动。
- **启动 Worker**: 运行 `yarn workspace @ecrawler/worker run dev`
  启动一个工作节点，它会向服务端请求任务进行执行。
- **运行 CLI**: 运行 `yarn workspace @ecrawler/cli run start --help`
  查看可用的命令行指令。

_注：Server 可能需要连接数据库，请检查 `apps/server/.env.development` 及
`tools/database/compose.yaml` 确认如何启动本地数据库容器。_

---

## 开发流程指南

### 如何新增一个站点的爬虫逻辑？

假设你需要抓取一个新网站 `example.com`：

1.  进入 `apps/worker/implementations/` 目录。
2.  创建一个新的文件夹，比如 `example`。
3.  在新文件夹中初始化你的 TypeScript 项目配置（参考已有的 `bqgl.cc` 或
    `qidian`），并实现针对该网站特定的抓取和解析逻辑。
4.  应用所使用的数据结构（如书籍信息、章节列表）应当从 `libs/schemas`
    中导入，以保证向后传递给 Server 的数据格式规范。

### 如何修改数据库结构？

如果需要增加新的数据表或者字段：

1.  在 `apps/server/src/database/` 中的 schema 文件里定义新的结构。
2.  同时更新 `libs/schemas/` 中的 TypeScript 模型定义（如果适用）。
3.  在项目根目录运行 `yarn workspace @ecrawler/server run generate`
    来生成 SQL 迁移文件。
4.  运行 `yarn workspace @ecrawler/server run migrate`
    将新的修改应用到本地数据库。

### 常用的全局命令

根目录的 `package.json` 内提供了一些快捷指令：

- **格式化代码**: 运行 `yarn format`
  会利用 Prettier 自动格式化项目下的所有文件。

### 开发建议

由于项目重度使用了
**Effect 生态**，这与传统的 TypeScript 编写方式有很大不同（通常以
`Effect.gen(function* () { ... })` 或者管道操作符 `pipe`
为特征）。如果你对其感到有些陌生，建议先阅读 Effect 的入门教程，理解基础的"管道(Pipeline)"操作，以及如何在其中进行并发 (`Queue`,
`Chunk`) 处理和上下文 (`Layer`) 注入。
