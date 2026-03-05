# Extractor 实现指南

## 概述

Extractor 是 Worker 中的核心组件，负责从指定的网站提取结构化数据。每个网站的爬取实现都需要实现
`Extractor` 接口。

## 架构模式

### Extractor 接口（来自 `libs/worker/services`）

```typescript
interface Extractor {
  extract(task: Task): Effect<{
    records: Record[] // 提取的数据记录
    links: Link[] // 发现的新链接
  }>
}
```

## 实现示例：BQGL.cc（笔趣阁）

### 文件结构

```
apps/worker/implementations/bqgl.cc/
├── package.json
├── tsconfig.json
└── src/
    ├── Extractor.ts    # 核心实现
    └── index.ts        # 导出
```

### 核心代码分析

#### 1. **Layer 定义** (`Extractor.ts` 第 16-122 行)

```typescript
export const BQGLExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    // ... 初始化代码
    return Extractor.of({ extract: ... })
  })
)
```

**说明**:

- `Layer.scoped()`: 定义一个有生命周期的依赖
- `Extractor.of()`: 返回实现了 `Extractor` 接口的对象
- Generator 语法 (`yield*`): Effect 的标准操作方式

#### 2. **关键资源初始化** (第 18-24 行)

```typescript
const recordQueue = yield * Queue.unbounded<Record.Record>()
const linkQueue = yield * Queue.unbounded<Link.Link>()
const proxy = yield * NetworkProxy.NetworkProxy
const runtime = yield * Effect.runtime()
const proxies = proxy()
```

**职责**:

- `recordQueue`: 存储提取的记录
- `linkQueue`: 存储发现的链接
- `proxy`: 代理管理服务
- `runtime`: Effect 运行时环境（关键！用于在异步回调中运行 Effect）

**关于 `runtime` 的详细说明**:

在 Effect 的 `Layer.scoped` 中获取 `runtime`，以便在异步回调（如爬虫的
`requestHandler`）中运行 Effect。由于回调函数是异步的，无法直接使用 `yield*`
语法，因此需要用 `Runtime.runPromise(runtime)` 来执行 Effect。

```typescript
// Layer 初始化中获取 runtime
const runtime = yield * Effect.runtime()

// 在异步回调中使用 runtime 运行 Effect
const proxies = proxy() // 获取代理迭代器
const next = proxies[Symbol.iterator]().next()

// 使用 runtime 运行 Effect
return next.value
  .pipe(Runtime.runPromise(runtime)) // ← 关键：将 Effect 转换为 Promise
  .then(NetworkProxy.toProxyUrl)
```

这种模式确保了：

1. **生命周期管理**: 代理、队列等资源在 Layer 初始化时创建，在 Layer 销毁时释放
2. **跨越异步边界**: 可以在异步回调中安全地执行 Effect
3. **上下文传递**: 回调中运行的 Effect 能访问到 Layer 中的依赖注入上下文

#### 3. **爬虫初始化** (第 26-108 行)

```typescript
const crawler = yield* Effect.acquireRelease(
  Effect.sync(() => new CheerioCrawler({
    proxyConfiguration: new ProxyConfiguration({
      newUrlFunction: () => { ... }
    }),
    requestHandler: async ({ $, request }) => {
      // 处理单个请求
    }
  })),
  crawler => Effect.promise(() => crawler.teardown())
)
```

**关键点**:

- `Effect.acquireRelease()`: 确保资源的正确释放
- `CheerioCrawler`: 来自 Crawlee 库，支持代理轮转
- `requestHandler`: 处理每个网页的回调函数

#### 4. **请求处理逻辑** (第 43-104 行)

```typescript
requestHandler: async ({$, request}) =>
  Effect.gen(function* () {
    // 1. 提取 ID
    const dirid = yield* Option.fromNullable(
      request.url.match(/look\/(\d+)/)?.[1]
    )

    // 2. DOM 解析和数据提取
    const cover = $("body > div.book > div.info > div.cover > img").attr()?.[
      "href"
    ]!
    const title = $("body > div.book > div.info > h1").text()
    // ... 更多字段

    // 3. 数据对象创建
    const edition = Book.Edition.make({identifiers: {url, dirid}})
    const book = Book.Book.make({
      cover,
      title,
      authors,
      description,
      editions,
      languages,
      ongoing // ...
    })

    // 4. 入队结果
    yield* Queue.offer(recordQueue, Record.Record.make({data: book}))

    // 5. 链接提取
    const links = pipe(
      $('a[href^="/look/"]').toArray(),
      Array.map(el => $(el).attr("href")),
      Array.filter(Predicate.isNotNullable),
      // ... 链接清理和去重
      Array.dedupe
    )
    yield* Queue.offerAll(linkQueue, links)
  }).pipe(Effect.runPromise)
```

**工作流程**:

1. **提取 ID**: 从 URL 正则匹配获取书籍 ID
2. **CSS 选择器解析**: 使用 Cheerio 的 `$` 对象
3. **数据映射**: 提取的字符串映射到 `Book` 对象
4. **队列操作**: 将结果添加到队列
5. **链接发现**: 提取页面中的所有可爬取链接

#### 5. **主入口方法** (第 110-120 行)

```typescript
return Extractor.of({
  extract: task =>
    Effect.gen(function* () {
      yield* Effect.promise(() => crawler.run([String(task.link)]))
      return {
        records: yield* Queue.takeAll(recordQueue),
        links: yield* Queue.takeAll(linkQueue)
      }
    })
})
```

**职责**:

- 接收一个 `Task`（包含要爬取的链接）
- 运行爬虫
- 返回所有收集的记录和链接

## 实现新网站爬器的步骤

### 1. 创建包结构

```bash
mkdir -p apps/worker/implementations/mysite/src
cd apps/worker/implementations/mysite
```

### 2. 创建 `package.json`

```json
{
  "name": "@ecrawler/worker-mysite",
  "version": "0.1.0",
  "type": "module",
  "exports": {".": "./dist/index.js"},
  "files": ["dist"],
  "dependencies": {
    "@ecrawler/schemas": "workspace:*",
    "@ecrawler/worker": "workspace:*",
    "@ecrawler/proxy": "workspace:*",
    "effect": "*",
    "crawlee": "*"
  }
}
```

### 3. 创建 `tsconfig.json`

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {"outDir": "./dist", "rootDir": "./src"},
  "include": ["src"],
  "references": []
}
```

### 4. 实现 `src/Extractor.ts`

```typescript
import {Effect, Layer, Queue, pipe, Array, Predicate, Option} from "effect"
import {Extractor} from "@ecrawler/worker/services/Extractor.ts"
import {Book, Link, Record} from "@ecrawler/schemas"
import {CheerioCrawler, ProxyConfiguration} from "crawlee"
import {NetworkProxy} from "@ecrawler/proxy"

export const MysiteExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    const recordQueue = yield* Queue.unbounded<Record.Record>()
    const linkQueue = yield* Queue.unbounded<Link.Link>()
    const proxy = yield* NetworkProxy.NetworkProxy

    const runtime = yield* Effect.runtime()
    const proxies = proxy()

    const crawler = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new CheerioCrawler({
            proxyConfiguration: new ProxyConfiguration({
              newUrlFunction: () => {
                // 代理轮转逻辑
                const next = proxies[Symbol.iterator]().next()
                if (next.done) return null
                return next.value
                  .pipe(Runtime.runPromise(runtime))
                  .then(NetworkProxy.toProxyUrl)
              }
            }),
            requestHandler: async ({$, request}) =>
              Effect.gen(function* () {
                // TODO: 实现你的爬取逻辑
                // 1. 提取数据
                // 2. 创建 Book 对象
                // 3. 入队结果
                // 4. 提取链接
                // 5. 入队链接
              }).pipe(Effect.runPromise)
          })
      ),
      crawler => Effect.promise(() => crawler.teardown())
    )

    return Extractor.of({
      extract: task =>
        Effect.gen(function* () {
          yield* Effect.promise(() => crawler.run([String(task.link)]))
          return {
            records: yield* Queue.takeAll(recordQueue),
            links: yield* Queue.takeAll(linkQueue)
          }
        })
    })
  })
)
```

### 5. 创建 `src/index.ts`

```typescript
export {MysiteExtractor} from "./Extractor"
```

## 常见模式

### 在异步回调中运行 Effect

**场景**: 需要在 Crawlee 的异步回调函数中执行 Effect 操作。

```typescript
// 在 Layer 初始化时获取 runtime
const runtime = yield* Effect.runtime()
const proxy = yield* NetworkProxy.NetworkProxy
const proxies = proxy()

// 在爬虫配置中使用 runtime
const crawler = yield* Effect.acquireRelease(
  Effect.sync(() =>
    new CheerioCrawler({
      proxyConfiguration: new ProxyConfiguration({
        newUrlFunction: () => {
          // 这是异步回调，不能直接使用 yield*
          const next = proxies[Symbol.iterator]().next()

          if (next.done) {
            return null
          }

          // 使用 Runtime.runPromise(runtime) 在回调中运行 Effect
          return next.value
            .pipe(Runtime.runPromise(runtime))  // ← 关键步骤
            .then(NetworkProxy.toProxyUrl)
        }
      }),
      requestHandler: async ({ $, request }) => {
        // 返回 Effect 并用 Effect.runPromise 执行
        return Effect.gen(function* () {
          // 在这里可以正常使用 yield*
          yield* Queue.offer(recordQueue, ...)
        }).pipe(Effect.runPromise)
      }
    })
  ),
  crawler => Effect.promise(() => crawler.teardown())
)
```

**要点**:

1. 在 Layer 中获取 `runtime`: `const runtime = yield* Effect.runtime()`
2. 在同步回调中，使用 `effect.pipe(Runtime.runPromise(runtime))` 转换为 Promise
3. 在异步回调中，直接 return `Effect.gen(...).pipe(Effect.runPromise)` 或使用
   `Runtime.runPromise(runtime)`
4. `Runtime` 需要从 `effect` 包导入

### 处理可选值

```typescript
// 使用 Option 处理可能不存在的值
const title = yield * Option.fromNullable($("h1.title").text() || null)
```

### 数组处理管道

```typescript
const links = pipe(
  $('a[href*="/book"]').toArray(),
  Array.map(el => $(el).attr("href")),
  Array.filter(Predicate.isNotNullable),
  Array.filter(link => /^\/book\/\d+/.test(link)),
  Array.map(link => new URL(link, request.url)),
  Array.dedupe
)
```

### 错误处理

```typescript
yield * Effect.logError("Failed to extract book data")
// 或使用 try-catch
try {
  // 爬取逻辑
} catch (error) {
  yield * Effect.logError(`Error: ${error}`)
}
```

## 数据类型

### Book 对象结构

```typescript
interface Book {
  cover?: string // 封面 URL
  title: string // 书名
  authors: string[] // 作者列表
  description?: string // 书籍描述
  editions: Edition[] // 版本信息（通常包含 URL 和 ID）
  languages: string[] // 语言（如 "zh-CN"）
  ongoing?: boolean // 是否连载
  length?: number // 章节数
  tags?: string[] // 标签
  chapters?: Chapter[] // 章节列表
}

interface Edition {
  identifiers: {
    url: string // 书籍详情页 URL
    dirid?: string // 网站特定 ID
  }
}
```

### Record 对象结构

```typescript
interface Record {
  data: Book // 提取的书籍数据
  timestamp?: number // 提取时间戳
  source?: string // 数据来源
}
```

## 测试建议

### 单元测试

```typescript
// 测试 DOM 解析
const html = `<h1>书名</h1>`
const $ = cheerio.load(html)
const title = $("h1").text()
expect(title).toBe("书名")
```

### 集成测试

```typescript
// 测试完整的 Extractor
const effect = pipe(
  Effect.env<HasExtractor>(),
  Effect.flatMap(env => env.extract(testTask))
)
const result = await Runtime.runPromise(effect)
expect(result.records).toHaveLength(1)
```

## 性能优化

### 1. 代理轮转

- 避免 IP 被封禁
- 提高稳定性

### 2. 队列使用

- 非阻塞数据传输
- 支持并发处理

### 3. 链接去重

```typescript
Array.dedupe // 自动去重
```

### 4. 错误恢复

- 使用 Effect 的重试机制
- 配置超时和重试次数

## 调试技巧

### 1. 打印 HTML

```typescript
yield * Effect.log($("html").html().slice(0, 500))
```

### 2. 打印提取的值

```typescript
const title = $("h1").text()
yield * Effect.log(`Title: ${title}`)
```

### 3. 验证 CSS 选择器

在浏览器开发者工具中测试选择器，然后复制到代码中。

## 相关文件

- [Architecture.md](./ARCHITECTURE.md) - 系统整体架构
- [libs/schemas](../libs/schemas/) - 数据模型定义
- [BQGL 实现](../apps/worker/implementations/bqgl.cc/src/Extractor.ts) - 参考实现
- [Crawlee 文档](https://crawlee.dev/) - 爬虫库文档
- [Effect 文档](https://effect.website/) - Effect 生态文档
