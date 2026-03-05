# 快速开始指南

## 前置要求

- **Node.js**: >= 18 (推荐 20+)
- **Yarn**: v4.12.0+
- **Docker** 和 **Docker Compose** (用于数据库)
- **PostgreSQL**: 13+ (本地或容器)

检查版本：

```bash
node --version      # v20.x 或更高
yarn --version      # 4.x
docker --version    # 20+
```

## 项目初始化

### 1. 克隆仓库

```bash
git clone https://github.com/rezics/ecrawler.git
cd ecrawler
```

### 2. 安装依赖

```bash
yarn install
```

该命令会安装项目和所有工作区（apps、libs、tools）的依赖。

### 3. 验证安装

```bash
yarn workspace @ecrawler/server --version
# 或
ls -la apps/server/dist/  # 检查是否有构建输出
```

## 数据库设置

### 方式 1: 使用 Docker Compose（推荐）

```bash
# 进入数据库工具目录
cd tools/database

# 启动 PostgreSQL 容器
docker-compose up -d

# 检查容器状态
docker-compose ps
```

**默认配置**:

- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `postgres`
- Database: `ecrawler`

### 方式 2: 使用本地 PostgreSQL

```bash
# 创建数据库和用户（仅首次）
createdb ecrawler
createuser -P postgres  # 输入密码

# 配置连接字符串
export DATABASE_URL="postgresql://postgres:password@localhost:5432/ecrawler"
```

### 方式 3: 云数据库

更新 `.env.development` 或 `.env.production` 中的 `DATABASE_URL`。

## 环境配置

### 1. 创建 `.env` 文件

在项目根目录创建 `.env` 文件（参考 `.env.example` 如果存在）：

```bash
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecrawler"

# 服务器
SERVER_PORT=3000
SERVER_HOST=0.0.0.0

# Worker
WORKER_PORT=3001
WORKER_TIMEOUT=60000

# 日志
LOG_LEVEL=debug

# 代理（可选）
PROXY_ENABLED=false
PROXY_LIST="http://proxy1.com:8080,http://proxy2.com:8080"
```

### 2. 针对每个应用的 `.env.development`

```bash
# apps/server/.env.development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecrawler"
PORT=3000
NODE_ENV=development

# apps/worker/.env.development
WORKER_ID="worker-1"
SERVER_URL="http://localhost:3000"
NODE_ENV=development
```

## 数据库迁移

### 初始化数据库架构

```bash
# 生成迁移文件
yarn workspace @ecrawler/server run generate

# 应用迁移到数据库
yarn workspace @ecrawler/server run migrate
```

检查迁移是否成功：

```bash
# 连接到数据库查看表
psql -h localhost -U postgres -d ecrawler -c "\dt"
```

## 启动应用

### 开发模式

在三个不同的终端中运行：

#### 终端 1: 启动 Server

```bash
yarn workspace @ecrawler/server run dev
```

输出示例：

```
[Server] 服务器已启动: http://localhost:3000
[Server] API 文档: http://localhost:3000/api/docs
```

#### 终端 2: 启动 Worker

```bash
yarn workspace @ecrawler/worker run dev
```

输出示例：

```
[Worker] Worker 已连接到服务器
[Worker] 等待任务...
```

#### 终端 3: 运行 CLI

```bash
# 查看可用命令
yarn workspace @ecrawler/cli run start --help

# 创建爬取任务
yarn workspace @ecrawler/cli run start import --url "https://example.com/book"

# 导出结果
yarn workspace @ecrawler/cli run start export --format json > books.json
```

## 常用开发命令

### 代码格式化

```bash
# 格式化所有文件
yarn format

# 只格式化特定目录
yarn prettier --write apps/worker/
```

### 编译 TypeScript

```bash
# 编译所有工作区
yarn build

# 编译特定工作区
yarn workspace @ecrawler/server run build
```

### 运行测试（如果有）

```bash
# 运行所有测试
yarn test

# 运行特定工作区的测试
yarn workspace @ecrawler/worker run test
```

### 查看工作区列表

```bash
yarn workspaces list
```

## 验证安装是否成功

### 检查清单

```bash
# 1. 依赖安装完整
[ -d node_modules ] && echo "✓ node_modules 存在"

# 2. TypeScript 编译无错误
yarn tsc --noEmit

# 3. 数据库连接正常
psql $DATABASE_URL -c "SELECT version();"

# 4. Server 可启动
timeout 5 yarn workspace @ecrawler/server run dev || echo "✓ Server 启动成功"

# 5. CLI 可运行
yarn workspace @ecrawler/cli run start --help
```

## 常见问题排查

### 问题 1: `Module not found`

**症状**: 启动时报错 `Cannot find module '@ecrawler/xxx'`

**解决**:

```bash
# 重新安装依赖
rm -rf node_modules
yarn install

# 如果问题持续，清除 Yarn 缓存
yarn cache clean
yarn install
```

### 问题 2: 数据库连接失败

**症状**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**解决**:

```bash
# 检查 PostgreSQL 是否运行
docker-compose -f tools/database/compose.yaml ps

# 如果未运行，启动它
docker-compose -f tools/database/compose.yaml up -d

# 检查连接字符串
echo $DATABASE_URL
```

### 问题 3: TypeScript 编译错误

**症状**: `Type error TS2307: Cannot find module`

**解决**:

```bash
# 重建类型定义
yarn tsc --noEmit

# 检查 tsconfig.json 中的路径映射
cat tsconfig.base.json | grep -A 10 "paths"
```

### 问题 4: Worker 连接失败

**症状**: `Error: Failed to connect to server at http://localhost:3000`

**解决**:

1. 确保 Server 正在运行（终端 1）
2. 检查端口是否被占用: `lsof -i :3000`
3. 更新 `SERVER_URL` 环境变量

### 问题 5: 代理或网络错误

**症状**: 爬虫任务失败，超时

**解决**:

```bash
# 禁用代理
PROXY_ENABLED=false yarn workspace @ecrawler/worker run dev

# 增加超时时间
WORKER_TIMEOUT=120000 yarn workspace @ecrawler/worker run dev
```

## 下一步

- [架构设计](./ARCHITECTURE.md) - 理解系统整体设计
- [Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md) - 学习如何添加新网站支持
- [API 文档](./API.md) - 查看可用的 API
- [Effect 入门](https://effect.website/docs/getting-started) - 学习 Effect 框架

## 有用的链接

- [项目仓库](https://github.com/rezics/ecrawler)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Yarn 工作区](https://yarnpkg.com/features/workspaces)
- [Crawlee 文档](https://crawlee.dev/)
- [Effect 官方文档](https://effect.website/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

## 获取帮助

如果遇到问题：

1. 查看 [常见问题](#常见问题排查) 部分
2. 检查项目 Issues: https://github.com/rezics/ecrawler/issues
3. 查看日志输出，使用 `LOG_LEVEL=debug` 获取更详细的信息
4. 在项目讨论区提问

---

**快速链接**:

- `yarn install` - 安装依赖
- `docker-compose up -d` - 启动数据库
- `yarn workspace @ecrawler/server run dev` - 启动服务器
- `yarn format` - 格式化代码
