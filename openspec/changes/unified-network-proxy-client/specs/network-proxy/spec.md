# Spec: network-proxy

## ADDED Requirements

### Requirement: Unified proxy configuration type

The system SHALL define a unified type `Proxy` that represents a single proxy connection configuration. The type SHALL include only fields that all supported provider platforms can supply (intersection of platform capabilities). The type MUST include at least: `host` (string), `port` (number), and optionally `username` (string) and `password` (string) when the provider uses credential-based auth. The type MAY include optional `protocol` (e.g. http / socks5) when all supported platforms expose it.

#### Scenario: Consumer receives a proxy with required fields

- **WHEN** a consumer obtains a `Proxy` from the NetworkProxy service
- **THEN** the value has `host` and `port` suitable for configuring an HTTP client or browser proxy

#### Scenario: Consumer receives a proxy with optional auth

- **WHEN** the provider uses username/password authentication
- **THEN** the `Proxy` value includes `username` and `password` so the consumer can configure authenticated proxy usage

---

### Requirement: Unified proxy request type

The system SHALL define a unified type `ProxyRequest` that describes constraints for requesting a proxy. The type SHALL include only parameters that all supported provider platforms support (intersection). It MAY include optional fields such as `countryCode` (string) or `limit` (number) when such filtering is supported across platforms. Provider-specific parameters SHALL NOT be part of the unified type.

#### Scenario: Consumer requests a proxy with no constraints

- **WHEN** a consumer calls `next` with a minimal or empty `ProxyRequest`
- **THEN** the implementation returns the next available proxy according to provider defaults

#### Scenario: Consumer requests a proxy with optional constraints

- **WHEN** a consumer calls `next` with a `ProxyRequest` that includes optional constraints (e.g. countryCode)
- **THEN** the implementation returns a proxy that satisfies those constraints when the provider supports them, or ignores unsupported fields without failing

---

### Requirement: NetworkProxy service exposes an Iterator

The system SHALL provide a NetworkProxy Effect service whose shape is an Iterator: `next(ProxyRequest)` returns `IteratorResult<Effect<Proxy>, never>`. The caller SHALL use this Iterator to obtain proxies on demand. Pagination and provider-specific listing behavior SHALL be hidden inside each implementation Layer; the caller MUST NOT be required to pass page numbers or page size.

#### Scenario: Consumer gets one proxy at a time

- **WHEN** a consumer calls `next(proxyRequest)` on the NetworkProxy iterator
- **THEN** the result is an `Effect` that when run yields a single `Proxy`, or indicates exhaustion (e.g. `done: true`)

#### Scenario: Pagination is internal to the Layer

- **WHEN** the underlying provider API uses pagination (e.g. page/page_size)
- **THEN** the Layer implementation fetches and traverses pages internally so that repeated `next()` calls continue to return proxies without the caller handling pagination

---

### Requirement: Unified proxy errors

The system SHALL define a small set of unified error types (e.g. Unauthorized, RateLimited, ServerError) for proxy operations. Each NetworkProxy Layer implementation SHALL map provider-specific API errors into these unified errors so that consumers can handle failures without depending on provider details.

#### Scenario: Provider returns 401

- **WHEN** the provider API returns an unauthorized response
- **THEN** the Layer fails with the unified Unauthorized (or equivalent) error type

#### Scenario: Provider returns 429

- **WHEN** the provider API returns a rate-limit response
- **THEN** the Layer fails with the unified RateLimited (or equivalent) error type

---

### Requirement: WebShare Layer implementation

The system SHALL provide a NetworkProxy Layer implementation for WebShare that uses the WebShare proxy list API (e.g. GET list with mode, pagination). The Layer SHALL handle pagination internally and expose the same Iterator contract as the unified NetworkProxy service. The Layer SHALL map WebShare response fields to the unified `Proxy` type and SHALL require WebShare-specific configuration (e.g. API token) via dependency injection, not hardcoding.

#### Scenario: WebShare Layer yields proxies from list API

- **WHEN** the WebShare Layer is used and `next(proxyRequest)` is called
- **THEN** the Layer fetches from the WebShare proxy list API as needed and returns proxies in the unified `Proxy` form (host, port, username, password as applicable)

#### Scenario: WebShare Layer uses injected config

- **WHEN** the WebShare Layer is constructed
- **THEN** it receives WebShare credentials or base URL via a config dependency (e.g. Layer or Config service), and no secrets are hardcoded in the package
