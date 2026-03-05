# 项目结构详解

## 完整目录树

```
ecrawler/
├── apps/                          # 可执行应用程序
│   ├── cli/                       # 命令行工具
│   │   ├── src/
│   │   │   ├── commands/          # CLI 命令定义
│   │   │   ├── services/          # 业务逻辑
│   │   │   └── index.ts          # 入口文件
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                    # 中央服务器
│   │   ├── src/
│   │   │   ├── api/              # API 路由和处理器
│   │   │   ├── database/         # 数据库相关
│   │   │   │   ├── schema.ts     # 数据库 Schema
│   │   │   │   └── migrations/   # 迁移文件
│   │   │   ├── services/         # 服务层（调度、收集等）
│   │   │   ├── middleware/       # 中间件
│   │   │   └── index.ts          # 服务器入口
│   │   ├── .env.development      # 开发环境配置
│   │   ├── .env.production       # 生产环境配置
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── worker/                    # 任务执行工作节点
│       ├── src/
│       │   ├── services/         # Worker 核心服务
│       │   │   └── Extractor.ts  # 抽象 Extractor 接口
│       │   ├── runners/          # 任务执行器
│       │   └── index.ts          # Worker 入口
│       │
│       └── implementations/       # 网站特定实现
│           ├── bqgl.cc/          # 笔趣阁爬虫
│           │   ├── src/
│           │   │   ├── Extractor.ts   # BQGL 实现
│           │   │   └── index.ts
│           │   ├── package.json
│           │   └── tsconfig.json
│           │
│           ├── qidian/           # 起点中文网爬虫
│           │   ├── src/
│           │   │   ├── Extractor.ts   # Qidian 实现
│           │   │   └── index.ts
│           │   ├── package.json
│           │   └── tsconfig.json
│           │
│           └── [new-site]/       # 新网站实现模板
│               ├── src/
│               │   ├── Extractor.ts
│               │   └── index.ts
│               ├── package.json
│               └── tsconfig.json
│
├── libs/                          # 共享库
│   ├── api/                       # API 定义和接口
│   │   ├── src/
│   │   │   ├── schemas/          # API 请求/响应模型
│   │   │   ├── services/         # 业务逻辑接口
│   │   │   │   ├── collector.ts  # 收集器接口
│   │   │   │   └── dispatcher.ts # 调度器接口
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── schemas/                   # 数据模型定义
│   │   ├── src/
│   │   │   ├── Book.ts           # 书籍类型
│   │   │   ├── Chapter.ts        # 章节类型
│   │   │   ├── User.ts           # 用户类型
│   │   │   ├── Task.ts           # 任务类型
│   │   │   ├── Result.ts         # 结果类型
│   │   │   ├── Link.ts           # 链接类型
│   │   │   ├── Record.ts         # 记录类型
│   │   │   └── index.ts          # 导出
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── proxy/                     # 代理管理库
│       ├── src/
│       │   ├── core/             # 核心代理逻辑
│       │   ├── implementations/  # 具体代理实现
│       │   │   ├── local/        # 本地代理
│       │   │   ├── remote/       # 远程代理
│       │   │   └── [provider]/   # 第三方代理商
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── tools/                         # 开发工具和配置
│   ├── database/
│   │   ├── init.sql              # 数据库初始化脚本
│   │   ├── backup.sh             # 数据库备份脚本
│   │   └── README.md
│   │
│   ├── readme/                    # README 自动生成工具
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── update/                    # 项目更新工具
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                          # 项目文档
│   ├── ARCHITECTURE.md            # 系统架构设计
│   ├── GETTING_STARTED.md         # 快速开始
│   ├── EXTRACTOR_IMPLEMENTATION.md # Extractor 实现指南
│   ├── PROJECT_STRUCTURE.md       # 项目结构（本文件）
│   ├── API.md                     # API 文档
│   └── DEPLOYMENT.md              # 部署指南
│
├── openspec/                      # OpenSpec 变更管理
│   └── [changes]/                 # 使用 OpenSpec 的变更记录
│
├── .github/                       # GitHub 配置
│   ├── workflows/                 # CI/CD 工作流
│   └── issue_template/            # Issue 模板
│
├── .husky/                        # Git 钩子配置
├── .vscode/                       # VS Code 设置
├── .cursor/                       # Cursor 特定配置
├── .claude/                       # Claude 相关配置
│   └── skills/                    # 自定义技能
│
├── package.json                   # 根工作区配置
├── tsconfig.base.json            # TypeScript 基础配置
├── tsconfig.json                 # TypeScript 项目配置
├── .yarnrc.yml                   # Yarn 配置
├── .prettierrc.json              # 代码格式化配置
├── .editorconfig                 # 编辑器配置
├── .gitignore                    # Git 忽略文件
├── README.md                     # 项目概述
└── yarn.lock                     # 依赖锁定文件
```

## 关键文件说明

### 根目录配置文件

| 文件                 | 说明                                           |
| -------------------- | ---------------------------------------------- |
| `package.json`       | 工作区根配置，定义脚本和依赖                   |
| `tsconfig.base.json` | TypeScript 基础配置，所有 tsconfig.json 继承它 |
| `tsconfig.json`      | 项目 TypeScript 配置                           |
| `.yarnrc.yml`        | Yarn 包管理器配置                              |
| `.prettierrc.json`   | Prettier 代码格式化规则                        |
| `.editorconfig`      | 编辑器通用配置                                 |
| `.gitignore`         | Git 忽略规则                                   |

### 应用层文件

#### `apps/server/`

```
database/
├── schema.ts          # Drizzle ORM Schema 定义
├── migrations/        # SQL 迁移文件
└── seed.ts           # 数据库种子数据

api/
├── routes.ts         # API 路由定义
├── handlers/         # 请求处理器
├── middleware.ts     # Express 中间件
└── errors.ts         # 错误处理

services/
├── TaskScheduler.ts  # 任务调度服务
├── DataCollector.ts  # 数据收集服务
└── ResultProcessor.ts # 结果处理服务
```

#### `apps/worker/`

```
services/
├── Extractor.ts      # 抽象 Extractor 接口
├── TaskRunner.ts     # 任务运行器
└── ResultUploader.ts # 结果上传器

runners/
├── ChainRunner.ts    # 链式爬取
└── ParallelRunner.ts # 并行爬取
```

#### `apps/cli/`

```
commands/
├── ImportCommand.ts  # import 命令
├── ExportCommand.ts  # export 命令
└── StatusCommand.ts  # status 命令（可选）

services/
├── DataImporter.ts   # 导入逻辑
├── DataExporter.ts   # 导出逻辑
└── APIClient.ts      # API 客户端
```

### 库层文件

#### `libs/schemas/`

核心数据模型定义，所有应用共享：

```typescript
// Book.ts
export namespace Book {
  export interface Edition { ... }
  export interface Info { ... }
  export class Book { ... }
}

// Chapter.ts
export namespace Chapter {
  export interface Chapter { ... }
}

// Task.ts
export namespace Task {
  export interface Task { ... }
}

// Record.ts - 爬取结果记录
export namespace Record {
  export interface Record { ... }
}

// Link.ts - 发现的链接
export namespace Link {
  export interface Link { ... }
}
```

#### `libs/api/`

定义服务间通信接口：

```typescript
// services/Dispatcher.ts
export interface Dispatcher {
  dispatch(task: Task): Effect<string>
  getStatus(taskId: string): Effect<TaskStatus>
}

// services/Collector.ts
export interface Collector {
  collect(records: Record[]): Effect<void>
  getResults(taskId: string): Effect<Result[]>
}
```

#### `libs/proxy/`

代理管理接口和实现：

```typescript
// core/NetworkProxy.ts
export interface NetworkProxy {
  getProxy(): Effect<string>
  testProxy(url: string): Effect<boolean>
}

// implementations/ - 具体实现
```

## 工作区依赖关系

```
@ecrawler/schemas (no deps)
    ↑
    ├─ @ecrawler/api
    │   ├─ @ecrawler/server
    │   └─ @ecrawler/cli
    │
    ├─ @ecrawler/worker
    │   ├─ @ecrawler/worker-bqgl
    │   └─ @ecrawler/worker-qidian
    │
    └─ @ecrawler/proxy
        ├─ @ecrawler/worker
        └─ @ecrawler/server
```

## 数据流向

```
用户 (CLI)
    ↓
@ecrawler/cli (import 命令)
    ↓
@ecrawler/server (任务 API)
    ↓
Task Queue (Redis 或内存)
    ↓
@ecrawler/worker (任务拉取)
    ↓
@ecrawler/worker-[site] (网站爬取)
    ↓
Result Queue
    ↓
@ecrawler/server (结果收集)
    ↓
PostgreSQL (持久化)
    ↓
用户 (CLI export 命令)
```

## 命名约定

### 包名称

- `@ecrawler/[app-name]` - 应用包
- `@ecrawler/[lib-name]` - 库包
- `@ecrawler/worker-[site]` - 网站爬虫实现

### 文件命名

- **Components/Services**: PascalCase (e.g., `DataCollector.ts`)
- **Utils/Helpers**: camelCase (e.g., `parseUrl.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TIMEOUT.ts`)
- **Tests**: `*.test.ts` 或 `*.spec.ts`

### 目录命名

- **功能目录**: camelCase (e.g., `taskScheduler/`)
- **类型目录**: camelCase (e.g., `services/`, `models/`)

## 环境相关文件

### 每个应用的 `.env` 文件

```
apps/server/.env.development
apps/server/.env.production

apps/worker/.env.development
apps/worker/.env.production

apps/cli/.env.development
```

### 示例配置

```bash
# apps/server/.env.development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecrawler
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# apps/worker/.env.development
WORKER_ID=worker-1
SERVER_URL=http://localhost:3000
TIMEOUT=60000
NODE_ENV=development

# apps/cli/.env.development
API_URL=http://localhost:3000
```

## 扩展项目

### 添加新的网站爬虫

1. 在 `apps/worker/implementations/` 创建新目录
2. 复制 `bqgl.cc` 的 `package.json` 和 `tsconfig.json`
3. 实现 `src/Extractor.ts`
4. 更新 `apps/worker/package.json` 中的 dependencies

### 添加新的库

1. 在 `libs/` 创建新目录
2. 创建 `package.json` 和 `tsconfig.json`
3. 实现库代码
4. 更新 root `package.json` 的 workspaces

### 添加新的应用

1. 在 `apps/` 创建新目录
2. 参考现有应用的结构
3. 配置 `package.json` 和 `tsconfig.json`
4. 在 root `package.json` 添加 workspace 引用

## 相关文档

- [快速开始](./GETTING_STARTED.md)
- [系统架构](./ARCHITECTURE.md)
- [Extractor 实现](./EXTRACTOR_IMPLEMENTATION.md)
