## ADDED Requirements

### Requirement: ProxyPool service interface

The system SHALL define a `ProxyPool` service using `Effect.Tag` with the
following methods:

- `next() => Effect.Effect<Proxy, ProxyPoolEmptyError>` — returns the next proxy
  in round-robin order
- `refresh() => Effect.Effect<void, WebshareApiError>` — re-fetches the full
  proxy list from WebShare and replaces the pool

#### Scenario: Round-robin selection

- **WHEN** `next()` is called multiple times with N proxies in the pool
- **THEN** it SHALL cycle through all N proxies in order before repeating

#### Scenario: Empty pool

- **WHEN** `next()` is called and the pool contains zero proxies
- **THEN** it SHALL fail with `ProxyPoolEmptyError`

### Requirement: Pool initialization on layer startup

The system SHALL populate the proxy pool on `Layer` initialization by calling
`WebshareClient.listProxies({ valid: true })`.

#### Scenario: Successful initialization

- **WHEN** the `ProxyPool.WebshareDefault` layer is provided
- **THEN** the pool SHALL be non-empty if WebShare returns at least one valid
  proxy

#### Scenario: API unavailable at startup

- **WHEN** `WebshareClient.listProxies` fails during layer initialization
- **THEN** the layer SHALL fail, propagating the error to the runtime

### Requirement: Automatic background refresh

The system SHALL fork a background fiber on layer startup that calls `refresh()`
on a `Schedule.fixed("10 minutes")` schedule.

#### Scenario: Refresh replaces stale proxies

- **WHEN** 10 minutes have elapsed since the last refresh
- **THEN** the pool SHALL be replaced with the latest list from WebShare

### Requirement: ProxyPoolEmptyError

The system SHALL define `ProxyPoolEmptyError` as a tagged error class using
`Schema.TaggedError`.

#### Scenario: Error identity

- **WHEN** `ProxyPoolEmptyError` is thrown
- **THEN** its `_tag` field SHALL equal `"ProxyPoolEmptyError"`

### Requirement: Proxy URL formatting

The system SHALL provide a `toUrl(proxy: Proxy): URL` utility that returns a
`URL` in the format `http://username:password@proxy_address:port`.

#### Scenario: URL construction

- **WHEN** `toUrl` is called with a proxy having address `1.2.3.4`, port `8168`,
  username `user`, password `pass`
- **THEN** it SHALL return `http://user:pass@1.2.3.4:8168`
