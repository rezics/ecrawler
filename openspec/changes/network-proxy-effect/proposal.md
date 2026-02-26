## Why

The `ecrawler` worker needs to route HTTP requests through rotating proxies to
avoid IP bans. Currently there is no proxy management layer; proxy credentials
are either hardcoded or missing entirely. A dedicated `@ecrawler/proxy` package
built on Effect-TS will provide a type-safe, composable proxy client that can be
injected as a service into any worker implementation.

## What Changes

- Implement `libs/proxy/src/` with the following modules:
  - `WebshareConfig` — `Context.Tag` for API key and plan ID, loaded via
    `Config`.
  - `WebshareClient` — `Effect.Tag` wrapping the WebShare REST API
    (`/api/v2/proxy/list/`, `/api/v3/proxy/config`,
    `/api/v3/proxy/list/status`).
  - `ProxyPool` — `Effect.Tag` that holds a rotating in-memory pool of `Proxy`
    objects fetched from WebShare, with round-robin selection and automatic
    refresh.
  - `Proxy` schema — `Schema.Struct` matching the WebShare proxy object shape
    (`id`, `username`, `password`, `proxy_address`, `port`, `valid`,
    `country_code`, `city_name`).
- Export a `ProxyPool.WebshareDefault` layer that wires everything together.
- Workers consume `ProxyPool` to get the next proxy URL for each request.

## Capabilities

### New Capabilities

- `webshare-client`: HTTP client for the WebShare REST API — authentication,
  list proxies (paginated), get proxy config, get proxy status.
- `proxy-pool`: In-memory rotating proxy pool built on top of `WebshareClient` —
  load, refresh on schedule, round-robin `next()`.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- `libs/proxy`: New source files under `src/`.
- `apps/worker`: Future PR will inject `ProxyPool` into `Extractor`
  implementations.
- New peer dependency on `@effect/platform` (already used project-wide).
