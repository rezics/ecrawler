# Effective Crawlers

URL -> f(URL) -> Structured Data

## Project Structure

```
packages/
├── core/                    # 共享基础设施 (auth, config, database, errors)
├── schemas/                 # 所有共享的 Schema 定义
├── api/                     # API 定义 (HttpApi endpoints)
│   ├── collector/           # Collector API 定义
│   └── dispatcher/          # Dispatcher API 定义
├── collector/               # Collector 服务实现
├── dispatcher/              # Dispatcher 服务实现
├── worker/                  # Worker 核心
└── crawlers/                # 爬虫实现
    ├── qidian/
    └── bqgl/
```

## Packages

| Package                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `@ecrawler/core`       | 共享基础设施：认证、配置、数据库、错误处理   |
| `@ecrawler/schemas`    | 共享 Schema 定义：Book, Task, Result, Worker |
| `@ecrawler/api`        | HTTP API 定义，供服务端实现和客户端使用      |
| `@ecrawler/collector`  | 结果收集服务                                 |
| `@ecrawler/dispatcher` | 任务调度服务                                 |
| `@ecrawler/worker`     | Worker 核心，加载和执行爬虫                  |
| `@ecrawler/crawler-*`  | 具体网站的爬虫实现                           |

## Development

```bash
# 安装依赖
yarn install

# 运行 Dispatcher
cd packages/dispatcher && yarn dev

# 运行 Collector
cd packages/collector && yarn dev

# 运行 Worker
cd packages/worker && yarn dev
```
