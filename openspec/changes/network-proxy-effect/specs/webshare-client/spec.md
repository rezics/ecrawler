## ADDED Requirements

### Requirement: WebshareConfig service

The system SHALL provide a `WebshareConfig` service defined with `Context.Tag`
that holds `apiKey: string` and `planId: Option<string>`. It SHALL be loadable
via a `WebshareConfig.Default` layer using `Config.string("WEBSHARE_API_KEY")`
and `Config.option(Config.string("WEBSHARE_PLAN_ID"))`.

#### Scenario: Loading config from environment

- **WHEN** `WEBSHARE_API_KEY` is set in the environment
- **THEN** `WebshareConfig.Default` layer SHALL resolve successfully with the
  API key

#### Scenario: Missing required config

- **WHEN** `WEBSHARE_API_KEY` is not set
- **THEN** `WebshareConfig.Default` layer SHALL fail with a `ConfigError`

### Requirement: WebshareClient service interface

The system SHALL define a `WebshareClient` service using `Effect.Tag` with the
following methods:

- `listProxies(filter?: { valid?: boolean; country_code?: string }) => Effect.Effect<ReadonlyArray<Proxy>, WebshareApiError>`
- `getConfig() => Effect.Effect<ProxyConfig, WebshareApiError>`
- `getStatus() => Effect.Effect<ProxyStatus, WebshareApiError>`

#### Scenario: Successful proxy list fetch

- **WHEN** `listProxies()` is called and the WebShare API returns a paginated
  list
- **THEN** it SHALL fetch all pages and return a flat `ReadonlyArray<Proxy>`

#### Scenario: Filtered proxy list

- **WHEN** `listProxies({ valid: true })` is called
- **THEN** the request SHALL include `?valid=true` in the query string

#### Scenario: API error response

- **WHEN** the WebShare API returns a non-2xx status
- **THEN** `listProxies` SHALL fail with `WebshareApiError` containing the HTTP
  status code

### Requirement: Authorization header injection

The system SHALL inject `Authorization: Token <apiKey>` into every outgoing HTTP
request to the WebShare API.

#### Scenario: Authenticated request

- **WHEN** any `WebshareClient` method is called
- **THEN** the HTTP request SHALL contain the `Authorization: Token <apiKey>`
  header

### Requirement: 429 retry

The system SHALL automatically retry requests that receive HTTP 429 responses
using an exponential backoff schedule up to 3 retries.

#### Scenario: Rate limited then success

- **WHEN** the API returns 429 followed by a 200
- **THEN** the client SHALL retry and return the successful response

### Requirement: Proxy schema validation

The system SHALL decode WebShare proxy API responses using `Schema.Class` and
fail with a descriptive parse error if the shape does not match.

#### Scenario: Valid proxy object

- **WHEN** the API returns a well-formed proxy JSON object
- **THEN** it SHALL decode into a `Proxy` instance with all fields populated

#### Scenario: Missing required field

- **WHEN** the API returns a proxy object missing `proxy_address`
- **THEN** the decode SHALL fail with a `ParseError`
