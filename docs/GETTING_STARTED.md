# 快速开始指南

> 💡 **提示**: 如果你需要了解系统的部署、配置和运行原理，请先阅读
> **[部署与运行指南](./DEPLOYMENT.md)**。

## 前置要求

- **Node.js**: >= 18 (推荐 20+)
- **Yarn**: v4.12.0+
- **PostgreSQL**: 13+ (本地安装或云托管，可选)

检查版本：

```bash
node --version      # v20.x 或更高
yarn --version      # 4.x
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

> 💡 默认使用
> **PGlite**（嵌入式 PostgreSQL），无需额外配置。如需使用外部 PostgreSQL，请参考
> [部署与运行指南](./DEPLOYMENT.md)。

### 使用 PGlite（默认，推荐新手）

无需任何配置，Server 首次运行时会自动初始化本地数据库。

### 使用外部 PostgreSQL

```bash
# 设置数据库连接
export DATABASE_URL="postgresql://user:password@localhost:5432/ecrawler"
```

## 环境配置

> 💡 完整的配置说明请参考 [部署与运行指南](./DEPLOYMENT.md#配置详解)

### Server 配置

```bash
# 创建 apps/server/.env.development
cat > apps/server/.env.development << 'EOF'
HOST=0.0.0.0
PORT=2333
SECRET_KEY=dev-secret-key
EOF
```

### Worker 配置

```bash
# 创建 apps/worker/.env.development
cat > apps/worker/.env.development << 'EOF'
BASE_URL=http://localhost:2333
SECRET_KEY=dev-secret-key
EXTRACTORS=@ecrawler/extractor-dummy/data.ts
EOF
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

### 查看工作区列表

```bash
yarn workspaces list
```

## 启动应用

在两个不同的终端中运行：

#### 终端 1: 启动 Server

```bash
yarn workspace @ecrawler/server run dev
```

#### 终端 2: 启动 Worker

```bash
yarn workspace @ecrawler/worker run dev
```

#### 终端 3: 使用 CLI

```bash
# 查看帮助
yarn workspace @ecrawler/cli run start --help

# 导入任务
yarn workspace @ecrawler/cli run start import \
  http://localhost:2333 \
  --token dev-secret-key \
  --input tasks.json
```

## 验证安装是否成功

```bash
# 1. 依赖安装完整
[ -d node_modules ] && echo "✓ node_modules 存在"

# 2. TypeScript 编译无错误
yarn tsc --noEmit

# 3. Server 可启动
yarn workspace @ecrawler/server run dev &
sleep 3 && curl http://localhost:2333/tasks && kill %1
```

## 下一步

- **[部署与运行指南](./DEPLOYMENT.md)** - 了解系统架构和运行原理
- **[Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md)** - 学习如何添加新网站支持
- **[系统架构设计](./ARCHITECTURE.md)** - 深入理解系统设计

## 获取帮助

如果遇到问题：

1. 查看 [部署与运行指南](./DEPLOYMENT.md) 中的"故障排查"章节
2. 检查项目 Issues: https://github.com/rezics/ecrawler/issues
3. 使用 `LOG_LEVEL=debug` 获取更详细的日志信息
