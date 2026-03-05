## Why

libs/api and libs/schemas are misaligned with the current server database schema. libs/api depends on @ecrawler/server for Auth and error types, creating tight coupling. The API contract (Task, Result, payloads) still reflects the old schema (e.g. `by` for worker assignment) while the database has evolved (tasks have status/meta, results have task_id, no `by`). Aligning the API to the database as the source of truth and decoupling libs/api from server will restore consistency and improve maintainability.

## What Changes

- **libs/api decoupled from server**: Remove @ecrawler/server dependency. Define Auth as Context.Tag; define UnknownError locally. Server provides Auth.layer when composing.
- **libs/schemas aligned to DB**: Task gains status, meta; Result.Api becomes independent schema (id, tags, link, meta, data, created_at, updated_at, task_id) — no `by`, no extend from Task.
- **Payloads updated**: CreateTask, CreateResult, UpdateTask, UpdateResult add optional `meta` (arbitrary JSON). Remove `by` from CreateResult, UpdateResult, NextPayload, Result QueryParams.
- **nextTask semantics**: Fetch next pending task, set status to `processing`; no worker assignment (no `by` column).
- **MaxBodySize middleware**: Server adds middleware limiting request body to 1 MB; returns 413 Payload Too Large when exceeded.

### BREAKING

- Task schema: added status, meta; API responses change.
- Result schema: removed by; added task_id; API responses change.
- CreateResult, UpdateResult: removed by.
- NextPayload: removed by (empty or optional fields only).
- Result QueryParams: removed by.

## Capabilities

### New Capabilities

- `api-contract`: API contract layer (libs/api, libs/schemas) — schemas aligned to DB, Auth/UnknownError abstractions, payloads with meta, no server dependency
- `server-api`: Server API implementation — Database service integration, Auth.layer, MaxBodySize middleware, handlers aligned to new schema

### Modified Capabilities

- (none — no existing specs)

## Impact

- **Code**: libs/api (schemas, collector/dispatcher groups), libs/schemas (Task, Result), apps/server (api/auth, api/groups/root, main, new MaxBodySize middleware)
- **Dependencies**: libs/api removes @ecrawler/server; server provides Auth.layer
- **Database**: Handlers use current schema (tasks: status, meta; results: task_id); PostgreSQL array operators for tag filtering
- **Workers**: apps/worker must adapt to new Task/Result shapes and removed `by` in CreateResult/NextPayload
