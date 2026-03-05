## 1. Unified types and errors

- [x] 1.1 Define `Proxy` type in libs/proxy (host, port, optional username,
      password, optional protocol) per spec intersection
- [x] 1.2 Define `ProxyRequest` type (optional countryCode, limit or similar
      intersection fields)
- [x] 1.3 Define unified error types (e.g. Unauthorized, RateLimited,
      ServerError) and export from libs/proxy

## 2. NetworkProxy Iterator contract

- [x] 2.1 Ensure NetworkProxy service shape is Iterator<Effect<Proxy>, never,
      ProxyRequest> and document contract
- [x] 2.2 Export NetworkProxy tag and type so Worker can depend on the interface
      only

## 3. WebShare Layer

- [x] 3.1 Add WebShare config type / Context (e.g. API token or base URL) for
      dependency injection
- [x] 3.2 Implement WebShare proxy list HTTP client (GET list with mode, handle
      pagination in memory)
- [x] 3.3 Map WebShare list response to unified `Proxy` (proxy_address→host,
      port, username, password)
- [x] 3.4 Map WebShare API errors (401, 429, 5xx) to unified error types
- [x] 3.5 Implement NetworkProxy Layer for WebShare that exposes Iterator, using
      internal pagination and config dependency

## 4. Packaging and exports

- [x] 4.1 Export Proxy, ProxyRequest, errors, and NetworkProxy (and WebShare
      layer) from libs/proxy entry points
- [x] 4.2 Ensure libs/proxy has no dependency on Task, Server, or database;
      document Worker-only usage if needed
