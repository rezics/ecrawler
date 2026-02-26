## 1. Package Setup

- [x] 1.1 Add `effect` and `@effect/platform` to `libs/proxy/package.json`
      dependencies (they are already workspace-level, just declare them)
- [x] 1.2 Create `libs/proxy/src/` directory structure: `schema/`, `webshare/`,
      `pool/`

## 2. Proxy Schema

- [x] 2.1 Create `libs/proxy/src/schema/Proxy.ts` — define `Proxy` as
      `Schema.Class` with fields: `id`, `username`, `password`, `proxy_address`,
      `port`, `valid`, `country_code`, `city_name` (optional)
- [x] 2.2 Create `libs/proxy/src/schema/index.ts` — re-export `Proxy`

## 3. Error Types

- [x] 3.1 Create `libs/proxy/src/errors.ts` — define `WebshareApiError`
      (`Schema.TaggedError` with `status: number` and `body: string`) and
      `ProxyPoolEmptyError` (`Schema.TaggedError` with no fields)

## 4. WebshareConfig

- [x] 4.1 Create `libs/proxy/src/webshare/Config.ts` —
      `Context.Tag("WebshareConfig")` with `apiKey: string` and
      `planId: Option<string>`
- [x] 4.2 Add `WebshareConfig.Default` layer using
      `Config.all({ apiKey: Config.string("WEBSHARE_API_KEY"), planId: Config.option(Config.string("WEBSHARE_PLAN_ID")) })`

## 5. WebshareClient

- [x] 5.1 Create `libs/proxy/src/webshare/Client.ts` —
      `Effect.Tag("WebshareClient")` with methods `listProxies`, `getConfig`,
      `getStatus`
- [x] 5.2 Implement `WebshareClient.Default` layer:
  - Yield `WebshareConfig` to get `apiKey`
  - Yield `HttpClient.HttpClient` and apply
    `HttpClient.mapRequest(HttpClientRequest.setHeader("Authorization", \`Token
    \${apiKey}\`))`
  - Implement `listProxies`: loop pages (`page_size=100`) until `next === null`,
    decode each item with `Schema.decodeUnknown(Proxy)`, collect into array; add
    `?valid=true` / `?country_code__in=...` filters from the optional `filter`
    argument
  - Implement `getConfig`: `GET /api/v3/proxy/config` (append `?plan_id=...` if
    `planId` is `Some`), decode with a `ProxyConfig` schema
  - Implement `getStatus`: `GET /api/v3/proxy/list/status`, decode with a
    `ProxyStatus` schema
  - Wrap all HTTP calls with
    `Effect.retry(Schedule.exponential("1 second").pipe(Schedule.recurWhile(e => e.status === 429), Schedule.upTo("30 seconds")))`

## 6. ProxyPool

- [x] 6.1 Create `libs/proxy/src/pool/Pool.ts` — `Effect.Tag("ProxyPool")` with
      `next()` and `refresh()` methods
- [x] 6.2 Implement `ProxyPool.WebshareDefault` layer as `Layer.scoped`:
  - Yield `WebshareClient`
  - Fetch initial proxy list via `listProxies({ valid: true })`
  - Create `Ref<{ proxies: ReadonlyArray<Proxy.Type>; cursor: number }>`
    initialized with the fetched list
  - Implement `next()`: atomically increment cursor mod length, return proxy at
    that index; fail with `ProxyPoolEmptyError` if length is 0
  - Implement `refresh()`: call `listProxies({ valid: true })`, update `Ref`
    with new list and reset cursor to 0
  - Fork background fiber:
    `Effect.repeat(refresh(), Schedule.fixed("10 minutes")).pipe(Effect.forkScoped)`
- [x] 6.3 Create `libs/proxy/src/pool/util.ts` — implement
      `toUrl(proxy: Proxy.Type): URL` returning
      `new URL(\`http://\${proxy.username}:\${proxy.password}@\${proxy.proxy_address}:\${proxy.port}\`)`

## 7. Public API

- [x] 7.1 Create `libs/proxy/src/index.ts` — export `Proxy`, `WebshareConfig`,
      `WebshareClient`, `ProxyPool`, `toUrl`, `WebshareApiError`,
      `ProxyPoolEmptyError`
- [x] 7.2 Verify `libs/proxy/package.json` `exports` field maps
      `"./*": "./src/*"` (already set)
