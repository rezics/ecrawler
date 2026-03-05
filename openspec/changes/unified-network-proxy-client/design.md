# Design: Unified Network Proxy Client

## Context

- **libs/proxy** already has a skeleton: `NetworkProxy` is an Effect Tag with shape `Iterator<Effect<Proxy>, never, ProxyRequest>`; `Proxy` and `ProxyRequest` are currently empty interfaces; there is a placeholder `layerWebshare`.
- The intended consumer is the **Worker** (needs proxy config when crawling); no dependency on Task, Server, or database.
- Provider APIs differ: WebShare uses a REST paginated list (Token auth); Decodo has a public API (endpoints, users, etc.). This design implements only the **intersection of platform capabilities**; pagination is handled inside each Layer and exposed uniformly as an Iterator.

## Goals / Non-Goals

**Goals:**

- Define unified `Proxy` and `ProxyRequest` types (intersection fields only) for the Worker and implementation layers.
- Keep the NetworkProxy **Iterator** contract: caller uses `next(ProxyRequest)` to get `IteratorResult<Effect<Proxy>>`; no exposure of page numbers or page size.
- Implement a WebShare Layer inside **libs/proxy**: call WebShare list API, handle pagination, map results to unified `Proxy`, and yield via the Iterator on demand.
- Unify error types (e.g. Unauthorized, RateLimited, ServerError) so callers and layers handle failures consistently.

**Non-Goals:**

- Do not implement Decodo or other provider Layers in this change (only keep the same interface as the extension point).
- Do not wire proxies into the Worker’s extractor/Playwright in this change (deliver a usable NetworkProxy package only).
- Do not unify “management” APIs (create/delete users, usage reports, etc.); only unify “obtain proxy config”.

## Decisions

### 1. Iterator hides pagination

- **Choice**: NetworkProxy service shape is `Iterator<Effect<Proxy>, never, ProxyRequest>`; caller only calls `next(request)` and gets `{ done, value: Effect<Proxy> }`.
- **Rationale**: The Worker only needs “give me the next available proxy” and does not need page/page_size; provider pagination differs, and encapsulating it in the Layer avoids leaking it.
- **Alternative**: An explicit `list(req): Effect<Proxy[]>` would expose “a page” and does not match “one at a time” usage; rejected.

### 2. Proxy / ProxyRequest use platform intersection only

- **Choice**: `Proxy` has the essential connection and auth fields: `host`, `port`, optional `username`, `password`, and optional `protocol` (e.g. http/socks5) if all providers support it. `ProxyRequest` has only constraints supported by all providers (e.g. optional `countryCode`, `limit`), no provider-specific parameters.
- **Rationale**: Any implementation Layer can fill these fields; avoids fields that only one provider has in the unified type.
- **Alternative**: Adding provider-specific fields to the unified type would increase type and semantic complexity; not done for now.

### 3. WebShare Layer fetches list internally and implements Iterator

- **Choice**: The Layer fetches the proxy list via the WebShare list API on first or on-demand use (looping over pages until done or request satisfied), keeps a cursor in memory, and `next(ProxyRequest)` returns the next `Effect<Proxy>` from that cursor, fetching the next page when needed.
- **Rationale**: Pagination stays inside the Layer; only the Iterator is exposed; implementation is straightforward and consistent with “intersection only”.
- **Alternative**: Calling the API on every `next` would increase latency and rate-limit risk; hence “maintain list + page on demand” is used.

### 4. Errors and configuration

- **Choice**: Define a small set of unified errors in libs/proxy (e.g. `NetworkProxyError` or Unauthorized / RateLimited / ServerError); each Layer maps provider API errors to these. Provider credentials and config are injected via Layer dependencies (e.g. WebShareConfig), not hardcoded in the package.
- **Rationale**: Callers can catch uniformly for retry or fallback; config is separate from code and matches existing Effect style.

## Risks / Trade-offs

- **Memory**: If the WebShare Layer fetches all pages at once, memory use increases; acceptable then do it, otherwise use “buffer one page, fetch next when exhausted” inside the Layer to bound memory.
- **Rate limits**: Providers rate-limit the list API (e.g. WebShare 60/min); the Layer must respect limits and may use simple backoff or caching so 429 is not surfaced to callers.
- **Type evolution**: If a provider needs new fields later, balance “intersection” vs “extension”; prefer adding optional fields to Proxy or provider-branded types so existing callers are not broken.
