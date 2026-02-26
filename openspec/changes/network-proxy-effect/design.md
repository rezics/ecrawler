## Context

The WebShare API (base URL `https://proxy.webshare.io/api/v2`) uses token-based
auth (`Authorization: Token <APIKEY>`). The key endpoints we need are:

| Endpoint                        | Method        | Notes                                                               |
| ------------------------------- | ------------- | ------------------------------------------------------------------- |
| `GET /proxy/list/`              | paginated     | `?mode=direct&page=1&page_size=100` returns up to 100 proxy objects |
| `GET /api/v3/proxy/config`      | single object | returns `username`, `password`, `proxy_list_download_token`         |
| `GET /api/v3/proxy/list/status` | single object | returns `state` (`pending`/`processing`/`completed`)                |

Rate limits: 60 req/min for proxy list endpoints. Responses are JSON; errors
follow standard HTTP codes (401, 429, 5xx).

Proxy object shape (direct mode):

```json
{
  "id": "d-10513",
  "username": "username",
  "password": "password",
  "proxy_address": "1.2.3.4",
  "port": 8168,
  "valid": true,
  "last_verification": "2019-06-09T23:34:00.095501-07:00",
  "country_code": "US",
  "city_name": "New York",
  "created_at": "2022-06-14T11:58:10.246406-07:00"
}
```

The project follows the `Context.Tag` / `Effect.Tag` service pattern (see
`WorkerConfig`, `Client`). Config is loaded with `Config.string()` /
`Config.all()`. HTTP is done via `HttpClient` from `@effect/platform`.

## Goals / Non-Goals

**Goals:**

- `WebshareConfig` — typed config service for API key and optional `plan_id`.
- `WebshareClient` — thin Effect wrapper over the three WebShare endpoints
  above.
- `Proxy` schema — `Schema.Struct` for the proxy object; derive `Proxy.Type`
  from it.
- `ProxyPool` — rotating pool service with `next(): Effect<Proxy.Type>` and
  `refresh(): Effect<void>`.
- `ProxyPool.WebshareDefault` layer — composes all of the above; auto-refreshes
  pool on a schedule.

**Non-Goals:**

- Backbone mode (only direct mode in this change).
- Persistent proxy state (pool is in-memory only).
- Multiple providers in one layer.
- Proxy health re-checking beyond the `valid` field returned by WebShare.

## Decisions

### 1. Service Hierarchy

```
WebshareConfig (Config.all)
    └── WebshareClient (HttpClient + WebshareConfig)
            └── ProxyPool (WebshareClient + Ref + Schedule)
```

`WebshareConfig` is a `Context.Tag` loaded via `Config.all` (same pattern as
`WorkerConfig`). `WebshareClient` is a `Effect.Tag` that depends on
`HttpClient.HttpClient` and `WebshareConfig`. `ProxyPool` depends only on
`WebshareClient`.

### 2. Proxy Schema

Use `Schema.Struct` from `effect/Schema`. Only decode the fields we use; use
`Schema.optionalWith` for nullable fields like `city_name`.

```ts
export class Proxy extends Schema.Class<Proxy>("Proxy")({
  id: Schema.String,
  username: Schema.String,
  password: Schema.String,
  proxy_address: Schema.String,
  port: Schema.Number,
  valid: Schema.Boolean,
  country_code: Schema.String,
  city_name: Schema.optionalWith(Schema.String, {default: () => ""})
}) {}
```

**Rationale**: `Schema.Class` gives us a nominal type and free `Schema.decode`
for HTTP response validation.

### 3. Paginated Fetch

WebShare paginates with `page` / `page_size`. `WebshareClient.listProxies` will
recursively fetch all pages until `next === null`, collecting into a single
array. Page size is fixed at 100 (WebShare max).

```ts
listProxies: (filter?: ListProxiesFilter) =>
  Effect.Effect<ReadonlyArray<Proxy.Type>, HttpClientError>
```

**Rationale**: Callers (ProxyPool) want the full list; hiding pagination keeps
the interface simple.

### 4. ProxyPool as Ref + Fiber

`ProxyPool` stores
`Ref<{ proxies: ReadonlyArray<Proxy.Type>; cursor: number }>`. On `Layer.scoped`
init:

1. Fetch all valid proxies from `WebshareClient.listProxies({ valid: true })`.
2. Fork a background fiber that calls `refresh()` every 10 minutes via
   `Schedule.fixed("10 minutes")`.

`next()` increments cursor mod length and returns the proxy at that index. If
the pool is empty, it returns `Effect.fail(new ProxyPoolEmptyError())`.

**Rationale**: `Ref` is the idiomatic Effect way to hold mutable shared state.
The background fiber keeps the pool fresh without blocking callers.

### 5. Error Types

Define tagged errors with `Schema.TaggedError`:

- `WebshareApiError` — wraps non-2xx responses (status, body).
- `ProxyPoolEmptyError` — pool has zero valid proxies.

**Rationale**: Typed errors allow callers to pattern-match and recover (e.g.,
retry with `Effect.retry`).

### 6. HTTP Client Setup

`WebshareClient.Default` layer will:

1. Yield `WebshareConfig` to get the API key.
2. Yield `HttpClient.HttpClient` and pipe
   `HttpClient.mapRequest(HttpClientRequest.setHeader("Authorization", \`Token
   \${config.apiKey}\`))`.
3. Use `HttpClientRequest.get(url)` + `HttpClient.execute` +
   `HttpClientResponse.schemaBodyJson(Schema)` for typed decoding.

**Rationale**: Mirrors the `Client.ts` pattern already in the codebase.

## Risks / Trade-offs

- **[Risk] Rate limit (60 req/min for proxy list)** → **Mitigation**: Pool
  refresh is every 10 minutes; a single full-page fetch is at most a handful of
  requests. Add `Schedule.exponential` retry on 429.
- **[Risk] Pool goes stale if WebShare removes proxies** → **Mitigation**:
  Background refresh every 10 minutes; `valid: true` filter on fetch.
- **[Risk] Pool empty on startup if API is down** → **Mitigation**:
  `ProxyPool.WebshareDefault` layer fails fast on startup error, propagating to
  `NodeRuntime.runMain`.

## Migration Plan

1. Implement `libs/proxy` in this change (no breaking changes to other
   packages).
2. In a follow-up PR, inject `ProxyPool` into `Extractor` implementations via
   `Layer.provide`.
