# ecrawler 项目架构设计

## 系统整体架构

ecrawler 是一个分布式网页爬虫系统，采用 **Monorepo** 结构，由以下核心组件组成：

```
┌─────────────────────────────────────────────────────────┐
│                    CLI (Command Line)                    │
│           用户界面 - 执行导入/导出任务                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐   ┌──────────▼───────┐
│   Server        │   │   Database       │
│  (Central Hub)  │   │  (PostgreSQL)    │
│  - API          │   │                  │
│  - Scheduler    │   │  - Books         │
│  - Task Queue   │   │  - Chapters      │
└───────┬─────────┘   │  - Tasks         │
        │             │  - Results       │
        │             └──────────────────┘
        │
   ┌────┴──────┬──────────┬──────────┐
   │            │          │          │
┌──▼──┐    ┌───▼───┐  ┌──▼───┐  ┌───▼───┐
│Worker│   │Worker │  │Worker│  │Worker │
│  1   │   │   2   │  │  3   │  │  N    │
└──┬───┘   └───┬───┘  └──┬───┘  └───┬───┘
   │           │         │          │
   ├─bqgl.cc   ├─qidian  └──────────┘
   │           │
   │      ┌────┴───────┐
   │      │            │
   └─────►│ Crawlers   │
          │ & Parsers  │
          └────────────┘
```

## 模块层级

### 1. **Apps 层** - 可执行应用程序

#### `apps/cli`

- **职责**: 命令行接口，提供用户与系统的交互入口
- **功能**:
  - `import`: 导入数据
  - `export`: 导出数据
- **技术栈**: `@effect/cli`

#### `apps/server`

- **职责**: 爬虫系统的中央控制枢纽
- **核心功能**:
  - **API Server**: 提供 REST/RPC API
  - **Task Scheduler**: 调度和管理爬虫任务
  - **Database**: 与 PostgreSQL 交互，存储元数据
  - **Result Aggregator**: 收集 Worker 返回的结果
- **关键模块**:
  - `database/`: Schema 定义和 ORM（Drizzle）
  - `api/`: API 接口定义
- **通信**: 与 Worker 通过 RPC 或消息队列通信

#### `apps/worker`

- **职责**: 实际执行网页爬取的工作节点
- **工作流程**:
  1. 从 Server 获取任务
  2. 执行爬取逻辑
  3. 解析并提取数据
  4. 返回结果给 Server
- **可伸缩性**: 支持多个 Worker 实例并行运行

##### `apps/worker/implementations`

- **职责**: 针对不同网站的具体爬取实现
- **现有实现**:
  - `bqgl.cc/`: 笔趣阁网站爬取器
  - `qidian/`: 起点中文网爬取器
- **架构**: 每个网站实现为独立的包，有自己的 TypeScript 配置

### 2. **Libs 层** - 共享库

#### `libs/schemas`

- **职责**: 定义全局数据模型和类型
- **包含**:
  - `Book`: 书籍信息
  - `Chapter`: 章节信息
  - `Task`: 任务定义
  - `Record`: 结果记录
  - `User`: 用户信息
- **用途**: 确保 Server、Worker、CLI 之间的数据一致性

#### `libs/api`

- **职责**: 定义 API 接口和业务逻辑服务
- **包含**:
  - `collector`: 收集器逻辑
  - `dispatcher`: 调度器逻辑
  - 其他 API 相关接口

#### `libs/proxy`

- **职责**: 网络代理和 IP 管理
- **功能**:
  - 代理池管理
  - 请求路由
  - IP 轮转

### 3. **Tools 层** - 开发工具

#### `tools/database`

- **init.sql**: 数据库初始化脚本（可选）
- **backup.sh**: 数据库备份脚本

#### `tools/readme`

- **功能**: 自动生成项目 README

#### `tools/update`

- **功能**: 自动更新脚本

## 数据流

### 典型爬取流程

```
1. CLI 用户发起请求
   └─► Server 接收并创建任务
       └─► 任务入队（Task Queue）
           └─► Worker 拉取任务
               └─► 执行爬取逻辑
                   ├─► 发送 HTTP 请求
                   ├─► 解析 HTML (Cheerio)
                   ├─► 提取数据
                   └─► 入队结果
                       └─► Server 收集结果
                           └─► 存储到数据库
                               └─► CLI 导出数据
```

## 关键技术决策

### 1. 使用 Effect 生态

- **优势**:
  - 强大的异步控制和错误处理
  - 内置并发管理（Queue, Chunk）
  - 依赖注入（Layer）
  - 重试、超时等机制
- **学习曲线**: 需要理解管道（Pipeline）、Generator 语法

### 2. 采用 Monorepo

- **优势**:
  - 代码共享方便
  - 一致的版本管理
  - 统一的构建配置
- **管理工具**: Yarn Workspaces v4

### 3. 网站实现解耦

- 每个网站爬取器独立包
- 统一实现 `Extractor` 接口
- 易于扩展新网站

## 部署模式

### 开发环境

```bash
# 启动所有服务
yarn workspace @ecrawler/server run dev
yarn workspace @ecrawler/worker run dev
yarn workspace @ecrawler/cli run start
```

### 生产环境

- **Server**: 单实例或多实例（负载均衡）
- **Worker**: 可弹性伸缩的多实例集群
- **Database**: PostgreSQL（云托管 RDS 或本地部署）
- **通信**: 基于 HTTP/RPC（可选）

## 扩展点

### 1. 添加新网站爬器

在 `apps/worker/implementations` 创建新目录，实现 `Extractor` 接口

### 2. 修改数据模型

更新 `libs/schemas`，同时更新 Server 的数据库 Schema 和迁移脚本

### 3. 自定义 API

在 `apps/server/api` 中扩展接口定义

### 4. 添加代理管理

在 `libs/proxy` 中实现新的代理策略
