# 部署与运行指南

本文档面向**完全没有接触过项目代码**的用户，详细介绍 ecrawler 系统的部署、配置和运行方法。

## 目录

- [系统概述](#系统概述)
- [核心概念](#核心概念)
- [部署方式](#部署方式)
- [配置详解](#配置详解)
- [运行与使用](#运行与使用)
- [故障排查](#故障排查)

---

## 系统概述

### ecrawler 是什么？

ecrawler 是一个**分布式网页爬虫系统**，用于从多个网站批量抓取结构化数据（如小说网站的书目信息）。系统采用
**Server-Worker 架构**，支持多节点并行爬取。

### 三大核心组件

| 组件       | 作用                                   | 端口                                |
| ---------- | -------------------------------------- | ----------------------------------- |
| **Server** | 中央控制节点，管理任务队列和结果存储   | 2333 (Dispatcher), 2334 (Collector) |
| **Worker** | 爬取执行节点，从 Server 领取任务并执行 | 无固定端口                          |
| **CLI**    | 命令行工具，用于导入任务和导出结果     | -                                   |

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户操作                                    │
│                     (CLI 命令行工具)                                     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              │ 1. 导入任务 (import)
                              │ 4. 导出结果 (export)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Server (服务端)                               │
│  ┌─────────────────────────┐    ┌─────────────────────────┐            │
│  │     Dispatcher API      │    │     Collector API       │            │
│  │     (端口: 2333)        │    │     (端口: 2334)        │            │
│  │                         │    │                         │            │
│  │  • 创建/删除任务        │    │  • 接收爬取结果         │            │
│  │  • 分发任务给 Worker    │    │  • 存储到数据库         │            │
│  │  • 查询任务状态         │    │  • 查询历史结果         │            │
│  └───────────┬─────────────┘    └───────────┬─────────────┘            │
│              │                              │                          │
│              └──────────────┬───────────────┘                          │
│                             ▼                                          │
│              ┌────────────────────────────┐                            │
│              │      PostgreSQL 数据库      │                           │
│              │                            │                            │
│              │  • tasks 表 (任务队列)      │                           │
│              │  • results 表 (爬取结果)    │                           │
│              │  • token 表 (认证令牌)      │                           │
│              └────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Worker 请求任务
                              │ 3. Worker 提交结果
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Worker (工作节点)                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        主循环 (Main Loop)                         │  │
│  │                                                                  │  │
│  │   ┌─────────┐    ┌─────────────┐    ┌─────────────┐             │  │
│  │   │ 从队列  │ -> │ 执行爬取    │ -> │ 提交结果    │             │  │
│  │   │ 取任务  │    │ (Extractor) │    │ 到 Server   │             │  │
│  │   └─────────┘    └─────────────┘    └─────────────┘             │  │
│  │        ▲                                   │                     │  │
│  │        │        发现新链接                 │                     │  │
│  │        └───────────────────────────────────┘                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Extractor (爬虫实现)                          │  │
│  │                                                                  │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │   │ bqgl.cc    │  │ qidian      │  │ new-site    │  ...        │  │
│  │   │ (笔趣阁)   │  │ (起点中文网)│  │ (自定义网站)│             │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 核心概念

### 1. 任务 (Task)

任务是爬虫系统的基本工作单元，包含：

```json
{
  "id": "uuid-v7-format",
  "link": "https://example.com/book/123",
  "tags": ["novel", "bqgl"],
  "status": "pending",
  "created_at": "2026-03-06T10:00:00Z"
}
```

- **link**: 要爬取的网页 URL
- **tags**: 任务标签，用于 Worker 筛选可处理的任务
- **status**: `pending` → `processing` → `completed`

### 2. 结果 (Result)

Worker 爬取完成后提交的数据：

```json
{
  "id": "uuid",
  "link": "https://example.com/book/123",
  "tags": ["novel", "bqgl"],
  "data": {
    "title": "书名",
    "authors": ["作者"],
    "chapters": [...]
  }
}
```

### 3. Dispatcher API vs Collector API

| API            | 端口 | 职责           | 使用者                        |
| -------------- | ---- | -------------- | ----------------------------- |
| **Dispatcher** | 2333 | 任务分发和管理 | Worker 领取任务、CLI 导入任务 |
| **Collector**  | 2334 | 结果收集和存储 | Worker 提交结果、CLI 导出结果 |

**为什么分开？**

- 可独立扩展：可以部署多个 Dispatcher 和多个 Collector
- 安全隔离：不同服务使用不同的认证令牌
- 负载均衡：高并发时可以分别优化

### 4. Extractor (提取器)

每个网站的爬取逻辑封装为一个 Extractor：

```
apps/worker/implementations/
├── bqgl.cc/     # 笔趣阁网站爬虫
├── qidian/      # 起点中文网爬虫
└── [new-site]/  # 新网站爬虫
```

Worker 启动时会加载配置的 Extractor 列表，根据任务标签决定使用哪个提取器。

### 5. 动态并发控制 (Scaler)

Worker 内置 **EMA (指数移动平均) 并发控制算法**：

```
任务执行时间监控
       ↓
  计算 EMA 平均值
       ↓
  ┌─────────────────┐
  │ 执行时间短？    │ → 增加并发数
  │ 执行时间长？    │ → 减少并发数
  └─────────────────┘
```

**目的**：自动调整并发数，避免：

- 并发过高：触发目标网站反爬
- 并发过低：爬取效率低下

---

## 部署方式

### 方式一：本地开发部署（推荐新手）

适合：开发测试、学习系统架构

#### 前置要求

```bash
# 检查版本
node --version      # 需要 >= 18 (推荐 20+)
yarn --version      # 需要 v4.x
```

#### 步骤 1: 安装依赖

```bash
git clone https://github.com/rezics/ecrawler.git
cd ecrawler
yarn install
```

#### 步骤 2: 配置数据库

**选项 A: 使用 PGlite（内置，无需安装）**

Server 默认使用 PGlite（嵌入式 PostgreSQL），无需额外配置，数据存储在本地文件。

**选项 B: 使用外部 PostgreSQL**

```bash
# 设置数据库连接
export DATABASE_URL="postgresql://user:password@localhost:5432/ecrawler"
```

#### 步骤 3: 配置 Server

```bash
# 创建配置文件
cat > apps/server/.env.development << 'EOF'
# 服务配置
HOST=0.0.0.0
PORT=2333

# 数据库 (使用 PGlite 可省略)
# DATABASE_URL=postgresql://...

# 认证令牌（生产环境必须修改！）
SECRET_KEY=dev-secret-key-change-in-production
EOF
```

#### 步骤 4: 配置 Worker

```bash
cat > apps/worker/.env.development << 'EOF'
# Server 地址
BASE_URL=http://localhost:2333

# 认证令牌（与 Server 配置一致）
SECRET_KEY=dev-secret-key-change-in-production

# Worker 标识
ID=worker-1
NAME=local-worker

# 任务标签（决定处理哪些任务）
TAGS=[]

# 启用的 Extractor
EXTRACTORS=@ecrawler/extractor-dummy/data.ts
EOF
```

#### 步骤 5: 启动服务

**终端 1 - 启动 Server:**

```bash
yarn workspace @ecrawler/server run dev
```

成功输出：

```
[Server] Starting Server...
[Server] Listening on http://0.0.0.0:2333
```

**终端 2 - 启动 Worker:**

```bash
yarn workspace @ecrawler/worker run dev
```

成功输出：

```
[Worker] Connected to Dispatcher at http://localhost:2333
[Worker] Waiting for tasks...
```

**终端 3 - 使用 CLI:**

```bash
# 查看帮助
yarn workspace @ecrawler/cli run start --help

# 导入任务
yarn workspace @ecrawler/cli run start import \
  http://localhost:2333 \
  --token dev-secret-key-change-in-production \
  --input tasks.json

# 导出结果
yarn workspace @ecrawler/cli run start export \
  http://localhost:2334 \
  --token dev-secret-key-change-in-production \
  --output results.json
```

---

### 方式二：PM2 生产部署

适合：单机生产环境

#### 步骤 1: 构建应用

```bash
# 安装依赖
yarn install

# 构建 Server
yarn workspace @ecrawler/server run build:bundle

# 构建 Worker
yarn workspace @ecrawler/worker run build:bundle
```

#### 步骤 2: 创建生产配置

```bash
# Server 生产配置
cat > apps/server/.env.production << 'EOF'
HOST=0.0.0.0
PORT=2333
SECRET_KEY=your-secure-production-key-here
DATABASE_URL=postgresql://user:password@db-host:5432/ecrawler
EOF

# Worker 生产配置
cat > apps/worker/.env.production << 'EOF'
BASE_URL=http://localhost:2333
SECRET_KEY=your-secure-production-key-here
ID=worker-prod-1
NAME=production-worker
TAGS=[]
EXTRACTORS=@ecrawler/extractor-dummy/data.ts
EOF
```

#### 步骤 3: 配置 PM2

```bash
npm install -g pm2

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ecrawler-server',
      script: 'node',
      args: 'apps/server/dist/main.mjs',
      cwd: '/path/to/ecrawler',
      env_file: 'apps/server/.env.production',
      instances: 1,
      max_memory_restart: '500M',
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'ecrawler-worker',
      script: 'node',
      args: 'apps/worker/dist/main.mjs',
      cwd: '/path/to/ecrawler',
      env_file: 'apps/worker/.env.production',
      instances: 2,  // 可根据 CPU 核心数调整
      max_memory_restart: '500M',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
EOF

mkdir -p logs
```

#### 步骤 4: 启动服务

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

常用命令：

```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 logs server     # 只看 Server 日志
pm2 restart all     # 重启所有
pm2 monit           # 实时监控
```

---

### 方式三：Docker 容器部署

适合：云环境、Kubernetes

#### 步骤 1: 构建镜像

```bash
# 构建 Server 镜像
cd apps/server
podman build . -t ecrawler:server --network=host

# 构建 Worker 镜像
cd ../worker
podman build . -t ecrawler:worker --network=host
```

#### 步骤 2: 运行容器

**启动 Server:**

```bash
podman run -d \
  --name ecrawler-server \
  -p 2333:2333 \
  -p 2334:2334 \
  -e HOST=0.0.0.0 \
  -e PORT=2333 \
  -e SECRET_KEY=your-secure-key \
  -e DATABASE_URL=postgresql://... \
  ecrawler:server
```

**启动 Worker:**

```bash
podman run -d \
  --name ecrawler-worker-1 \
  -e BASE_URL=http://server-host:2333 \
  -e SECRET_KEY=your-secure-key \
  -e EXTRACTORS=@ecrawler/extractor-dummy/data.ts \
  ecrawler:worker
```

---

## 配置详解

### Server 配置项

| 环境变量       | 必需   | 默认值    | 说明                                    |
| -------------- | ------ | --------- | --------------------------------------- |
| `HOST`         | 否     | `0.0.0.0` | 监听地址                                |
| `PORT`         | 否     | `2333`    | Dispatcher API 端口 (Collector 自动 +1) |
| `SECRET_KEY`   | **是** | -         | API 认证令牌                            |
| `DATABASE_URL` | 否     | -         | PostgreSQL 连接串 (省略则使用 PGlite)   |

### Worker 配置项

| 环境变量     | 必需   | 默认值   | 说明                   |
| ------------ | ------ | -------- | ---------------------- |
| `BASE_URL`   | **是** | -        | Server 地址            |
| `SECRET_KEY` | **是** | -        | API 认证令牌           |
| `ID`         | 否     | 自动生成 | Worker 唯一标识        |
| `NAME`       | 否     | `worker` | Worker 名称            |
| `TAGS`       | 否     | `[]`     | 只处理带这些标签的任务 |
| `EXTRACTORS` | **是** | -        | 启用的 Extractor 列表  |

#### EXTRACTORS 配置示例

```bash
# 单个 Extractor
EXTRACTORS=@ecrawler/extractor-dummy/data.ts

# 多个 Extractor (逗号分隔)
EXTRACTORS=@ecrawler/extractor-bqgl/data.ts,@ecrawler/extractor-qidian/data.ts
```

#### TAGS 配置说明

标签用于任务路由：

```bash
# Worker 只处理带 "bqgl" 标签的任务
TAGS=["bqgl"]

# Worker 处理带 "bqgl" 或 "qidian" 标签的任务
TAGS=["bqgl","qidian"]

# 空数组表示处理所有任务
TAGS=[]
```

---

## 运行与使用

### 完整工作流程

```
1. 启动 Server
       ↓
2. 启动 Worker (可以启动多个)
       ↓
3. 使用 CLI 导入任务
       ↓
4. Worker 自动领取并执行任务
       ↓
5. Worker 提交结果到 Server
       ↓
6. 使用 CLI 导出结果
```

### CLI 命令详解

#### 1. 导入任务 (import)

```bash
yarn workspace @ecrawler/cli run start import \
  <dispatcher-url> \           # Dispatcher API 地址
  --token <your-token> \       # 认证令牌
  --input tasks.json \         # 任务文件
  --tags novel,bqgl            # 可选：为所有任务添加标签
```

**任务文件格式 (tasks.json):**

```json
[
  {
    "link": "https://example.com/book/1",
    "tags": ["novel", "bqgl"],
    "meta": {"priority": "high"}
  },
  {"link": "https://example.com/book/2", "tags": ["novel", "bqgl"]}
]
```

**简化格式:**

```json
[
  {"url": "https://example.com/book/1"},
  {"href": "https://example.com/book/2"},
  {"link": "https://example.com/book/3"}
]
```

#### 2. 导出结果 (export)

```bash
yarn workspace @ecrawler/cli run start export \
  <collector-url> \            # Collector API 地址
  --token <your-token> \       # 认证令牌
  --output results.json \      # 输出文件
  --limit 100 \                # 可选：限制数量
  --offset 0 \                 # 可选：跳过数量
  --since 2026-01-01 \         # 可选：开始时间
  --before 2026-12-31          # 可选：结束时间
```

#### 3. 查看任务列表 (tasks)

```bash
yarn workspace @ecrawler/cli run start tasks \
  --token <your-token> \
  --dispatcher http://localhost:2333 \
  --list                      # 列出任务
```

#### 4. 查看结果列表 (list)

```bash
yarn workspace @ecrawler/cli run start list \
  --token <your-token>
```

### Worker 运行原理

Worker 的核心是一个无限循环：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Worker 主循环                            │
│                                                                 │
│   while (true) {                                               │
│       1. 从 Server 获取任务                                     │
│           POST /tasks/next { tags, timeout: 30s }              │
│                                                                 │
│       2. 执行爬取 (Extractor.extract)                           │
│           - 发送 HTTP 请求                                      │
│           - 解析 HTML                                           │
│           - 提取数据                                            │
│           - 发现新链接                                          │
│                                                                 │
│       3. 提交结果到 Server                                      │
│           - 爬取的数据 → POST /results                          │
│           - 发现的链接 → POST /tasks (创建新任务)               │
│                                                                 │
│       4. 动态调整并发数                                         │
│           - 根据执行时间自动调整                                │
│   }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**关键特性：**

1. **长轮询获取任务**: Worker 会等待最多 30 秒，直到有新任务可用
2. **自动发现链接**: 爬取过程中发现的新链接会自动创建为新任务
3. **动态并发**: 根据任务执行时间自动调整并发数

### Server 运行原理

Server 同时运行两个 API 服务：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Server                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ Dispatcher API (Port 2333)                              │  │
│   │                                                         │  │
│   │ POST /tasks         → 创建任务                          │  │
│   │ GET  /tasks         → 查询任务列表                      │  │
│   │ POST /tasks/next    → Worker 获取下一个任务             │  │
│   │ PATCH /tasks/:id    → 更新任务状态                      │  │
│   │ DELETE /tasks/:id   → 删除任务                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ Collector API (Port 2334)                               │  │
│   │                                                         │  │
│   │ POST /results       → Worker 提交结果                   │  │
│   │ GET  /results       → 查询结果列表                      │  │
│   │ PATCH /results/:id  → 更新结果                          │  │
│   │ DELETE /results/:id → 删除结果                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 数据库 (PostgreSQL / PGlite)                            │  │
│   │                                                         │  │
│   │ tasks 表: 任务队列                                       │  │
│   │ results 表: 爬取结果                                     │  │
│   │ token 表: 认证令牌                                       │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 故障排查

### 常见问题

#### 1. Server 启动失败：端口被占用

```bash
# 检查端口占用
lsof -i :2333
lsof -i :2334

# 结束占用进程
kill -9 <PID>

# 或更改端口
PORT=3000 yarn workspace @ecrawler/server run dev
```

#### 2. Worker 连接 Server 失败

**症状**: `Error: connect ECONNREFUSED`

**检查步骤**:

```bash
# 1. 确认 Server 正在运行
curl http://localhost:2333/health

# 2. 检查 BASE_URL 配置
echo $BASE_URL

# 3. 检查网络连通性
ping localhost
```

#### 3. 认证失败：401 Unauthorized

**原因**: Token 不匹配

**解决**:

```bash
# 确认 Server 和 Worker 使用相同的 SECRET_KEY
# Server 配置
grep SECRET_KEY apps/server/.env.development

# Worker 配置
grep SECRET_KEY apps/worker/.env.development

# CLI 调用时使用正确的 token
--token your-correct-token
```

#### 4. Worker 无法获取任务

**症状**: Worker 空闲，没有执行任何任务

**可能原因**:

1. **任务队列为空**: 使用 CLI 导入任务
2. **标签不匹配**: Worker 的 `TAGS` 与任务的 `tags` 不匹配

```bash
# 检查 Worker 配置的标签
cat apps/worker/.env.development | grep TAGS

# 导入任务时添加匹配的标签
yarn workspace @ecrawler/cli run start import \
  http://localhost:2333 \
  --token your-token \
  --input tasks.json \
  --tags bqgl
```

#### 5. 数据库连接失败

**症状**: `Error: connect ECONNREFUSED` 或数据库错误

**PGlite (默认)**:

```bash
# 清除本地数据库重新初始化
rm -rf .pglite
yarn workspace @ecrawler/server run dev
```

**PostgreSQL**:

```bash
# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1;"

# 检查数据库是否存在
psql -h localhost -U postgres -c "\l" | grep ecrawler

# 创建数据库
createdb ecrawler
```

#### 6. 内存不足

**症状**: Worker 或 Server 频繁崩溃

**解决**:

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 或在 PM2 配置中调整
max_memory_restart: '1G'
```

### 日志查看

```bash
# PM2 日志
pm2 logs ecrawler-server
pm2 logs ecrawler-worker

# 实时日志
pm2 logs --lines 100

# 直接运行时的输出
# 日志会直接打印到终端
```

### 健康检查

```bash
# 检查 Dispatcher API
curl -H "Authorization: Bearer your-token" \
  http://localhost:2333/tasks?limit=1

# 检查 Collector API
curl -H "Authorization: Bearer your-token" \
  http://localhost:2334/results?limit=1

# 检查数据库 (PostgreSQL)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tasks;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM results;"
```

---

## 下一步

- [Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md) - 学习如何添加新网站支持
- [API 文档](./API.md) - 查看完整的 API 接口说明
- [系统架构](./ARCHITECTURE.md) - 深入了解系统设计

## 获取帮助

- [GitHub Issues](https://github.com/rezics/ecrawler/issues)
- [项目讨论](https://github.com/rezics/ecrawler/discussions)

---

**最后更新**: 2026-03-06
