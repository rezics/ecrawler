# 部署指南

本文档介绍如何将 ecrawler 项目部署到生产环境，包括本地部署、Docker 容器化部署和云平台部署。

## 目录

- [部署前置条件](#部署前置条件)
- [本地生产部署](#本地生产部署)
- [Docker 容器化部署](#docker-容器化部署)
- [云平台部署](#云平台部署)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)
- [故障排查](#故障排查)

## 部署前置条件

### 系统要求

- **操作系统**: Linux（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- **Node.js**: >= 18（推荐 20+）
- **Yarn**: v4.12.0+
- **PostgreSQL**: 13+（可选，云托管、自建或使用内置 PGlite）
- **内存**: 最低 2GB（推荐 4GB+）
- **磁盘空间**: 最低 5GB

### 依赖检查

```bash
# 检查版本
node --version        # v20.x 或更高
yarn --version        # 4.x
psql --version        # PostgreSQL 13+
```

## 本地生产部署

### 1. 准备代码

```bash
# 克隆最新代码
git clone https://github.com/rezics/ecrawler.git
cd ecrawler

# 切换到生产分支（如果有）
git checkout main

# 安装依赖
yarn install

# 验证依赖
yarn workspace @ecrawler/server run build:bundle
yarn workspace @ecrawler/worker run build:bundle
```

### 2. 配置数据库

#### 使用云数据库（推荐用于生产）

```bash
# 在云提供商创建 PostgreSQL 实例（AWS RDS、阿里云 RDS 等）
# 获取连接字符串示例：
# postgresql://username:password@db.example.com:5432/ecrawler
```

#### 或本地自建 PostgreSQL

```bash
# 安装 PostgreSQL（如未安装）
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# 启动服务
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS

# 创建数据库和用户
sudo -u postgres createdb ecrawler
sudo -u postgres createuser -P ecrawler_user
# 设置密码并记录

# 配置权限
sudo -u postgres psql -c "ALTER ROLE ecrawler_user WITH CREATEDB;"
```

### 3. 环境配置

#### Server 应用配置

```bash
# 创建 apps/server/.env.production 文件
cat > apps/server/.env.production << EOF
# Server 服务配置
HOST=0.0.0.0
PORT=2333

# 数据库配置（PostgreSQL）
DATABASE_URL=postgresql://username:password@db.example.com:5432/ecrawler
EOF
```

#### Worker 应用配置

```bash
# 创建 apps/worker/.env.production 文件
cat > apps/worker/.env.production << EOF
# Worker ID（可选）
# ID=worker-1

# Dispatcher 服务配置（指向 Server）
DISPATCHER_BASE_URL=http://localhost:2333
DISPATCHER_TOKEN=your-dispatcher-token

# Collector 服务配置（指向 Server）
COLLECTOR_BASE_URL=http://localhost:2334
COLLECTOR_TOKEN=your-collector-token

# 执行器列表（指定使用哪些 extractor）
EXTRACTORS=@ecrawler/extractor-dummy/data.ts,@ecrawler/extractor-dummy/link.ts

# 存储配置
CRAWLEE_PERSIST_STORAGE=false
EOF
```

#### 初始化数据库

```bash
# 对于 PostgreSQL，确保数据库已创建
# 本地 PostgreSQL
psql -U postgres -c "CREATE DATABASE ecrawler;"

# 如果使用 PGlite（开发环境），无需额外配置，首次运行会自动初始化
```

### 4. 使用 PM2 管理进程

PM2 是 Node.js 进程管理器，推荐用于生产环境。

```bash
# 全局安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ecrawler-server',
      script: 'yarn',
      args: 'workspace @ecrawler/server run start',
      cwd: '/path/to/ecrawler',
      env_file: 'apps/server/.env.production',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'dist', 'data'],
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'ecrawler-worker',
      script: 'yarn',
      args: 'workspace @ecrawler/worker run start',
      cwd: '/path/to/ecrawler',
      env_file: 'apps/worker/.env.production',
      instances: 2,  // 可根据 CPU 核心数调整
      exec_mode: 'fork',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置，系统重启后自动启动
pm2 startup
pm2 save

# 查看日志
pm2 logs
pm2 logs ecrawler-server
pm2 logs ecrawler-worker

# 监控
pm2 monit
```

### 5. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt-get install nginx

# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/ecrawler > /dev/null << 'EOF'
upstream ecrawler_server {
    server localhost:2333;
}

server {
    listen 80;
    server_name api.ecrawler.com;  # 修改为你的域名

    # 重定向到 HTTPS（建议）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.ecrawler.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/api.ecrawler.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ecrawler.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志配置
    access_log /var/log/nginx/ecrawler_access.log;
    error_log /var/log/nginx/ecrawler_error.log;

    # 反向代理
    location / {
        proxy_pass http://ecrawler_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持（如果需要）
    location /ws {
        proxy_pass http://ecrawler_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/ecrawler /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. 配置 SSL 证书（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot certonly --nginx -d api.ecrawler.com

# 自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Docker 容器化部署

### 1. 创建 Server Dockerfile

```dockerfile
# apps/server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package.json yarn.lock ./
COPY apps/server/package.json apps/server/
COPY libs/api libs/api/
COPY libs/schemas libs/schemas/

# 安装依赖
RUN yarn install --frozen-lockfile --production=false

# 复制源代码
COPY apps/server/src apps/server/src
COPY tsconfig.base.json tsconfig.json ./

# 构建应用
RUN yarn workspace @ecrawler/server run build:bundle

# 最终镜像
FROM node:20-alpine
WORKDIR /app

COPY --from=0 /app/apps/server/dist ./dist
COPY --from=0 /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "./dist/main.mjs"]
```

### 2. 创建 Worker Dockerfile

```dockerfile
# apps/worker/Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++ curl

# 复制 package 文件
COPY package.json yarn.lock ./
COPY apps/worker/package.json apps/worker/
COPY apps/worker/implementations apps/worker/implementations
COPY libs/api libs/api/
COPY libs/schemas libs/schemas/

# 安装依赖
RUN yarn install --frozen-lockfile --production=false

# 复制源代码
COPY apps/worker/src apps/worker/src
COPY tsconfig.base.json tsconfig.json ./

# 构建应用
RUN yarn workspace @ecrawler/worker run build:bundle

# 最终镜像
FROM node:20-alpine
WORKDIR /app

COPY --from=0 /app/apps/worker/dist ./dist
COPY --from=0 /app/node_modules ./node_modules

EXPOSE 3001

ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "./dist/main.mjs"]
```

### 3. Docker Compose 配置

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: ecrawler-postgres
    environment:
      POSTGRES_USER: ecrawler_user
      POSTGRES_PASSWORD: change_me_in_production
      POSTGRES_DB: ecrawler
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecrawler_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: ecrawler-server
    environment:
      NODE_ENV: production
      DATABASE_URL: "postgresql://ecrawler_user:change_me_in_production@postgres:5432/ecrawler"
      SERVER_PORT: 3000
      SERVER_HOST: 0.0.0.0
      LOG_LEVEL: info
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    container_name: ecrawler-worker
    environment:
      NODE_ENV: production
      SERVER_URL: "http://server:3000"
      LOG_LEVEL: info
    depends_on:
      server:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      replicas: 2 # 根据需要调整副本数

volumes:
  postgres_data:
```

### 4. 构建和运行容器

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f server
docker-compose logs -f worker

# 执行数据库迁移
docker-compose exec server npm run migrate

# 停止容器
docker-compose down

# 清理资源
docker-compose down -v  # 包括数据卷
```

## 云平台部署

### 阿里云 ECS + RDS 部署

```bash
# 1. 购买 ECS 实例
# - 系统：Ubuntu 20.04 LTS
# - 实例类型：ecs.t6.medium（2vCPU, 4GB 内存）
# - 存储：40GB SSD

# 2. 购买 RDS PostgreSQL
# - 引擎版本：PostgreSQL 13
# - 实例规格：db.t3.small

# 3. SSH 连接到 ECS
ssh -i your_key.pem ubuntu@your_instance_ip

# 4. 在 ECS 上部署
# 参考上面的"本地生产部署"部分

# 配置数据库连接
cat > .env.production << EOF
DATABASE_URL="postgresql://ecrawler_user:password@your_rds_endpoint:5432/ecrawler"
SERVER_PORT=3000
NODE_ENV=production
EOF

# 使用 PM2 启动应用
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### AWS EC2 + RDS 部署

```bash
# 1. 启动 EC2 实例
# - AMI：Amazon Linux 2 或 Ubuntu Server 20.04 LTS
# - 实例类型：t3.medium
# - 存储：30GB gp3

# 2. 创建 RDS PostgreSQL 数据库
# - 引擎：PostgreSQL 13
# - 实例类：db.t3.small
# - 存储：20GB gp3

# 3. 连接到 EC2
ssh -i your_key.pem ubuntu@your_instance_ip

# 4. 安装必要的工具
sudo apt-get update
sudo apt-get install -y curl git nodejs npm

# 5. 安装 Yarn
npm install -g yarn

# 6. 部署应用
git clone https://github.com/rezics/ecrawler.git
cd ecrawler
yarn install

# 7. 配置环境变量
export DATABASE_URL="postgresql://ecrawler_user:password@your_rds_endpoint:5432/ecrawler"
export NODE_ENV=production

# 8. 运行迁移
yarn workspace @ecrawler/server run migrate

# 9. 启动应用（使用 PM2）
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Kubernetes 部署（advanced）

```bash
# 1. 创建 Namespace
kubectl create namespace ecrawler

# 2. 创建 ConfigMap 和 Secret
kubectl create configmap ecrawler-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  -n ecrawler

kubectl create secret generic ecrawler-secrets \
  --from-literal=DATABASE_URL="postgresql://ecrawler_user:password@postgres:5432/ecrawler" \
  -n ecrawler

# 3. 部署 PostgreSQL（使用 Helm）
helm install postgres bitnami/postgresql \
  -n ecrawler \
  --set auth.username=ecrawler_user \
  --set auth.password=your_password \
  --set auth.database=ecrawler

# 4. 创建 Kubernetes Deployment
# 参考以下 YAML 文件：
```

**k8s-deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecrawler-server
  namespace: ecrawler
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ecrawler-server
  template:
    metadata:
      labels:
        app: ecrawler-server
    spec:
      containers:
        - name: server
          image: ecrawler:server
          ports:
            - containerPort: 2333
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: ecrawler-config
                  key: NODE_ENV
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: ecrawler-secrets
                  key: DATABASE_URL
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 2333
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecrawler-worker
  namespace: ecrawler
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecrawler-worker
  template:
    metadata:
      labels:
        app: ecrawler-worker
    spec:
      containers:
        - name: worker
          image: ecrawler:worker
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: ecrawler-config
                  key: NODE_ENV
            - name: SERVER_URL
              value: "http://ecrawler-server:2333"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - curl -f http://localhost:2334/health || exit 1
            initialDelaySeconds: 30
            periodSeconds: 10
```

## 性能优化

### 数据库优化

```sql
-- 创建索引以提高查询性能
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_results_task_id ON results(task_id);

-- 定期运行 VACUUM 和 ANALYZE
VACUUM ANALYZE;

-- 配置连接池（使用 pgBouncer）
# 安装 pgBouncer
sudo apt-get install pgbouncer

# 配置 /etc/pgbouncer/pgbouncer.ini
[databases]
ecrawler = host=localhost port=5432 user=ecrawler_user password=password dbname=ecrawler

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Node.js 优化

```bash
# 增加事件监听器上限
export NODE_OPTIONS="--max-old-space-size=2048"

# 启用 UV_THREADPOOL_SIZE 提高异步 I/O 性能
export UV_THREADPOOL_SIZE=128

# 更新 ecosystem.config.js
env: {
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=2048',
  UV_THREADPOOL_SIZE: '128'
}
```

### Worker 集群扩展

```bash
# ecosystem.config.js
{
  instances: 'max',  // 自动使用 CPU 核心数
  exec_mode: 'cluster',
  merge_logs: true
}
```

## 监控和日志

### 日志管理

```bash
# 使用 Logrotate 管理日志
sudo tee /etc/logrotate.d/ecrawler > /dev/null << 'EOF'
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nobody nobody
    sharedscripts
    postrotate
        pm2 reload all
    endscript
}
EOF
```

### 监控工具

```bash
# 1. PM2 + PM2 Plus（云监控）
pm2 plus

# 2. 使用 Prometheus + Grafana
# 在应用中添加 metrics endpoint
yarn add prom-client

# 3. 使用 ELK Stack（Elasticsearch, Logstash, Kibana）
# 或使用 Loki + Promtail

# 4. 使用 Sentry 进行错误跟踪
# 在应用中集成 Sentry
```

## 故障排查

### 常见问题

#### 1. 连接池耗尽

```bash
# 症状：频繁出现连接超时错误
# 解决：
# - 增加数据库连接池大小
# - 减少应用实例的连接数
# - 使用 PgBouncer 连接池
```

#### 2. 内存泄漏

```bash
# 使用 Node.js 调试工具
node --inspect=0.0.0.0:9229 apps/server/dist/main.mjs

# 从另一个终端连接 Chrome DevTools
# chrome://inspect

# 生成 heap snapshot
node --max-old-space-size=4096 --expose-gc apps/server/dist/main.mjs
```

#### 3. Worker 频繁崩溃

```bash
# 检查日志
pm2 logs ecrawler-worker

# 增加内存限制
# 在 ecosystem.config.js 中修改 max_memory_restart

# 检查超时配置
export WORKER_TIMEOUT=120000
```

### 健康检查

```bash
# 检查 Server 状态
curl -s http://localhost:2333/health | jq .

# 检查 Worker 连接
curl -s http://localhost:2334/health | jq .

# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1;"

# 检查进程状态
pm2 status
```

## 相关链接

- [Node.js 生产环境最佳实践](https://nodejs.org/en/docs/guides/nodejs-web-app-in-the-cloud/)
- [PostgreSQL 性能调优](https://www.postgresql.org/docs/current/performance-tips.html)
- [Nginx 文档](https://nginx.org/en/docs/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [PM2 文档](https://pm2.keymetrics.io/docs)

---

**注意**: 在部署到生产环境前，请务必：

- 更改所有默认密码
- 配置 SSL/TLS 证书
- 设置防火墙规则
- 启用日志和监控
- 准备备份和恢复策略
- 测试故障恢复流程
