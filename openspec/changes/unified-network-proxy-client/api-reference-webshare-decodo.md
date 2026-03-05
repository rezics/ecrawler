# API Reference: WebShare and Decodo

This document describes the proxy-related APIs of WebShare and Decodo for implementing the unified NetworkProxy client. Unified types (Proxy / ProxyRequest) use only the **intersection** of both platforms.

---

## 1. WebShare Proxy Server API

### 1.1 Overview

- **Architecture**: REST, JSON request/response.
- **Base URL**: `https://proxy.webshare.io` (list examples use `https://proxy.webshare.io/api/v2/...`).
- **Authentication**: Authenticated requests send `Authorization: Token <APIKEY>` in the header. API keys can be created in [Dashboard → API keys](https://proxy.webshare.io/userapi/keys).

### 1.2 Proxy List API (directly relevant to this change)

**Endpoint**: `GET https://proxy.webshare.io/api/v2/proxy/list/`

**Authentication**: Required. `Authorization: Token <APIKEY>`.

**Required parameters**:

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `mode`    | string | Required. `direct` or `backbone`. Must be `backbone` if plan is residential. |

**Pagination parameters**:

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| `page`      | number | Current page, default 1. |
| `page_size` | number | Items per page, default 25. |

**Optional filters/ordering** (some unavailable in backbone mode):

| Parameter             | Description |
|-----------------------|-------------|
| `country_code__in`    | Country codes, comma-separated, e.g. `FR,US`. |
| `search`              | Search phrase (not supported in backbone). |
| `ordering`            | Sort fields, comma-separated; prefix `-` for descending (not in backbone). |
| `valid`               | Filter by validity (not in backbone). |
| `proxy_address`       | Single IP (not in backbone). |
| `proxy_address__in`   | Multiple IPs (not in backbone). |
| `asn_number` / `asn_name` | Filter by ASN (not in backbone). |
| `created_at`          | Filter by creation time (not in backbone). |

**Optional**: `plan_id` to target a specific plan; otherwise the default plan is used.

**Response format** (paginated JSON):

```json
{
  "count": 10,
  "next": "https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=2&page_size=25",
  "previous": null,
  "results": [
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
  ]
}
```

**Proxy object fields**:

| Field                | Type    | Description |
|----------------------|---------|-------------|
| `id`                 | string  | Unique proxy instance ID. |
| `username`           | string  | Proxy username. |
| `password`           | string  | Proxy password. |
| `proxy_address`      | string  | Proxy IP. In Direct mode connect to this IP; in Backbone mode connect to `p.webshare.io` (this field may be null for residential). |
| `port`               | int     | Port. For Backbone + IP auth, use the port returned by the API. |
| `valid`              | boolean | Whether the proxy passes health checks (roughly every 30s). |
| `last_verification`  | string  | Last check time (ISO). |
| `country_code`       | string  | ISO 3166-1 country code. |
| `city_name`          | string  | City name. |
| `created_at`         | string  | Creation time (ISO). |

**Connection modes**:

- **Direct**: Connect to `proxy_address` + `port`; same for username/password auth.
- **Backbone**: Fixed host `p.webshare.io`; username/password can use ports 80, 1080, 3128, 9999–19999; IP auth uses the `port` from the API.

### 1.3 Download proxy list (file)

**Endpoint**: `GET https://proxy.webshare.io/api/v2/proxy/list/download/{token}/{country_codes}/any/{authentication_method}/{endpoint_mode}/{search}/`

**Authentication**: None; path `token` is used. The token comes from the [Proxy Config](https://apidocs.webshare.io/proxy-config) API (`proxy_list_download_token`).

Path segments: `country_codes` (hyphen-separated country codes; use `-` for all), `authentication_method` (`username` or `sourceip`), `endpoint_mode` (`direct` or `backbone`), `search` (URL-encoded; use `-` for none). Optional query: `plan_id`.

**Response**: Plain text, one line per proxy, e.g. `10.1.2.3:9421:username:password`. This change uses the **list JSON API** as the main source; the download endpoint can remain optional.

### 1.4 Error codes (documented)

| HTTP | Meaning |
|------|---------|
| 400  | Bad Request, invalid request. |
| 401  | Unauthorized, invalid or missing token. |
| 403  | Forbidden, insufficient permissions. |
| 404  | Not Found. |
| 405  | Method Not Allowed. |
| 406  | Not Acceptable (e.g. non-JSON). |
| 429  | Rate limited; retry later (e.g. after 60s). |
| 5xx  | Server error. |

**Rate limits** (documented): List API ~60/min; general API ~240/min, etc. Implementation should consider backoff or caching.

---

## 2. Decodo proxy and API

### 2.1 Overview

- **Authentication**: Public API uses an **API Key** created in the dashboard; sent in the request (exact header per official reference, often `Authorization` or `X-Api-Key`).
- **Proxy model**: Unlike WebShare, Decodo relies on **fixed endpoints + port ranges** (e.g. `gate.decodo.com:10001-49999`) rather than a “one IP per machine” list. Residential proxies support **username/password** or **IP whitelist**.

### 2.2 Residential: endpoints and ports (documented tables)

- **Main entry**: `gate.decodo.com`, port range 10001–49999 (sticky), rotating ports 7000, 10000.
- **By country**: `{country-code}.decodo.com` with corresponding port ranges (e.g. `us.decodo.com` 10001–29999, `jp.decodo.com` 30001–39999). Separate tables exist for countries/cities (Endpoints and Ports).
- **Protocols**: HTTP, HTTPS, SOCKS5 (documented for Dedicated DC).
- **Auth**: Username/password or IP whitelist; location can be specified via endpoint or username (e.g. country, city, state).

### 2.3 Generate custom endpoints API (relevant to this change)

**Endpoint**: `GET https://api.decodo.com/v2/endpoints-custom`

Generates custom proxy routes for Residential and Datacenter Pay per GB (latter marked DEPRECATED). Returns **pre-generated proxy connection strings** (multiple), not a list of IPs + credentials.

**Query parameters (summary)**:

| Parameter          | Type   | Default               | Description |
|--------------------|--------|------------------------|-------------|
| `proxy_type`       | string | `residential_proxies`  | Proxy type. |
| `auth_type`        | string | `basic`               | `basic` (username/password) or `whitelist` (residential only). |
| `username`         | string | -                     | **Required** when `auth_type=basic`. |
| `password`         | string | -                     | **Required** when `auth_type=basic`. |
| `session_type`     | string | `sticky`              | `sticky` or `random`. |
| `session_time`     | int    | 10                    | Sticky session time in minutes, 1–1440; relevant for sticky + basic. |
| `location`         | string | `random`              | Country Alpha-2, city or state, lowercase. |
| `output_format`    | string | `protocol:auth@endpoint` | Output format. |
| `count`            | int    | 10                    | Number of routes to return, min 1. |
| `page`             | int    | 1                     | Pagination. |
| `response_format`  | string | `json`                | `json` / `txt` / `html`. |
| `domain`           | string | `decodo.com`          | Domain or `ip`. |
| `line_break`       | string | `\n`                  | Used when `response_format=txt`. |

**Response**: Depends on `response_format`; for JSON, an array of proxy connection strings (format from `output_format`, e.g. `protocol:auth@endpoint`). Each can be parsed to host, port, username, password and mapped to the unified `Proxy`.

**Note**: This endpoint requires API Key authentication (Public API); see [Public API Key Authentication](https://help.decodo.com/reference/public-api-key-authentication) for the header.

### 2.4 Site Unblocker / session

- Site Unblocker uses `unblock.decodo.com:60000`; header `X-SU-Session-Id: <random string>` reuses the same proxy for multiple requests (about 10 minutes). This is a “usage” feature, not a “list proxies” API; the unified layer can support “session” semantics in `ProxyRequest`, with the Decodo Layer adding session headers or parameters when making requests.

### 2.5 Errors and rate limits

- Decodo’s public docs do not list a full HTTP error table like WebShare; implementations should map 401/403/429/5xx to the same **unified errors** (Unauthorized, RateLimited, ServerError, etc.) as for WebShare.

---

## 3. Mapping to unified types (intersection)

| Unified type / behaviour   | WebShare source | Decodo source |
|---------------------------|-----------------|---------------|
| **Proxy.host**            | `proxy_address` (Direct) or fixed `p.webshare.io` (Backbone) | Host from custom endpoints API or fixed table (e.g. `gate.decodo.com`) |
| **Proxy.port**            | `port` | Port from endpoint response or one from the port range |
| **Proxy.username**        | `username` | `username` when `auth_type=basic` |
| **Proxy.password**        | `password` | `password` when `auth_type=basic` |
| **Proxy.protocol**        | Not in list response; can default to http | Supports http/https/socks5; optional in unified type |
| **ProxyRequest.countryCode** | `country_code__in` | `location` (country code, etc.) |
| **ProxyRequest has no page** | Pagination inside Layer via `page`/`page_size` or `next` URL | Pagination inside Layer via `page`/`count` |
| **Errors**                | 401→Unauthorized, 429→RateLimited, 5xx→ServerError | Same mapping |

**Conclusion**: The unified type includes only host, port, optional username/password, optional protocol; the request includes optional countryCode (and optional limit). WebShare Layer uses the list API with internal pagination and mapping; Decodo Layer uses the custom endpoints API or “fixed endpoint table + credentials” to produce a sequence of Proxies, with pagination and parameter differences encapsulated inside the Layer.
