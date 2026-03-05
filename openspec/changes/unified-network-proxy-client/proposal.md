# Unified Network Proxy Client

## Why

Workers need proxies to reach target sites during crawling. Different providers (e.g. WebShare, Decodo) expose different API shapes. If each provider is called directly from the Worker, the Worker becomes coupled to each vendor and switching or adding providers is costly. A **unified client interface** is needed so the Worker depends only on the abstraction of “obtain proxy config on demand”; pagination and provider differences are handled inside each implementation layer.

## What Changes

- Define unified **Proxy** (connection config) and **ProxyRequest** (request constraints) types in `libs/proxy`, including only fields that all target platforms support (intersection).
- Keep **NetworkProxy** as an **Iterator**: callers obtain proxies on demand via the iterator; pagination is handled inside each Layer and is not exposed.
- Implement a NetworkProxy Layer for WebShare (using the documented list API), mapping responses to the unified types and handling pagination internally.
- Leave the extension point for other providers (e.g. Decodo) with the same interface; no other provider implementation in this change.
- Treat `libs/proxy` as a standalone package **used only by the Worker**, with no dependency on Task, Server, or database.

## Capabilities

### New Capabilities

- `network-proxy`: Unified proxy client—Worker obtains proxy config on demand via the NetworkProxy service (`Iterator<Effect<Proxy>, never, ProxyRequest>`); types and behaviour are the intersection of provider capabilities; pagination is internal to implementation layers.

### Modified Capabilities

- None.

## Impact

- **libs/proxy**: Flesh out `Proxy`, `ProxyRequest`, and error types; implement/document the NetworkProxy Iterator contract; add WebShare Layer with internal pagination.
- **apps/worker**: Can depend on `@ecrawler/proxy` NetworkProxy to obtain proxies (wiring into extractors/Playwright can follow in a later change).
- No changes to Task, Server, or database schema.
