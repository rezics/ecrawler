## Context

The server database migrated to PostgreSQL (Drizzle + effect-postgres). Current
schema: tasks (id, status, tags, link, meta, created_at, updated_at), results
(id, tags, link, meta, data, created_at, updated_at, task_id), token (data). No
`by` column exists. libs/api imports Auth and UnknownError from @ecrawler/server
and uses libs/schemas Task/Result that don't match the DB. The server API
handlers (root.ts) still reference deleted modules (client.ts, sqlite-tags.ts)
and schema.tasks.by / schema.results.by. Workers use Task and Result types and
CreateResult/NextPayload with `by`.

## Goals / Non-Goals

**Goals:**

- Align libs/schemas and libs/api to the current database schema
- Decouple libs/api from @ecrawler/server (Auth, UnknownError as abstractions)
- Add optional meta to create/update payloads for tasks and results
- Simplify nextTask to status transition (pending → processing) without worker
  assignment
- Add MaxBodySize middleware (1 MB) on the server

**Non-Goals:**

- Changing database schema or migrations
- Adding new API endpoints
- Worker implementation changes beyond adapting to new types

## Decisions

### 1. Auth Abstraction (Context.Tag)

**Decision:** Define Auth as `Context.Tag<"Auth", HttpMiddleware>` in libs/api.
Server provides `Auth.layer` when composing the API. libs/api groups use
`yield* Auth` or middleware composition; server injects the concrete
implementation.

**Rationale:** Effect's dependency-injection pattern. libs/api defines the
contract; server satisfies it. No import from server.

**Alternative:** Define Auth as a generic HttpMiddleware type — rejected because
Tag enables Layer composition and testing with mock implementations.

### 2. UnknownError Location

**Decision:** Define UnknownError in libs/api (e.g. `api/error.ts` or
`api/errors.ts`). It is a tagged error schema used by the dispatcher group.

**Rationale:** Error types are part of the API contract. libs/api owns the
contract; server may reuse or map to it.

### 3. Task and Result Schemas (Separate Definitions)

**Decision:** Task and Result are independent schemas. Task: id, status, tags,
link, meta, created_at, updated_at. Result: id, tags, link, meta, data,
created_at, updated_at, task_id. Result does NOT extend Task.

**Rationale:** Matches database structure. results and tasks are separate tables
with different shapes. Extending Task was a legacy artifact.

### 4. Meta in Payloads

**Decision:** Add `meta: Schema.optional(Schema.Unknown)` to CreateTask,
CreateResult, UpdateTask, UpdateResult payloads. Workers can attach arbitrary
JSON metadata.

**Rationale:** DB already has meta (jsonb). API should allow workers to pass it
through.

### 5. nextTask Semantics

**Decision:** nextTask selects the next row with status = 'pending', updates to
status = 'processing', returns the task. No `by` column; no worker assignment.

**Rationale:** User confirmed status transition is sufficient; no need to record
which worker took the task.

### 6. MaxBodySize Middleware Placement

**Decision:** Implement MaxBodySize middleware in server (e.g.
`api/middleware.ts` or `api/MaxBodySize.ts`). Applied when composing the API
layer, before Auth. Limit: 1 MB. Returns 413 Payload Too Large when exceeded.

**Rationale:** Body size limits are deployment concerns. Server owns middleware
composition. If Content-Length exists, reject early; otherwise enforce during
body parsing.

**Alternative:** Define in libs/api as configurable — rejected to keep libs/api
free of server-specific concerns.

### 7. Tag Filtering

**Decision:** Use PostgreSQL array containment (`@>`) for tags. Create
`pg-tags.ts` (or equivalent) with `tagsContained(column, values)` returning a
Drizzle SQL expression. Replace sqlite-tags usage.

**Rationale:** Current DB is PostgreSQL. Array containment matches "all tags
must match" semantics.

## Risks / Trade-offs

- **[Worker compatibility]** Workers expect `by` in CreateResult and
  NextPayload. Mitigation: Update worker code to remove `by`; ensure worker
  adapts to new Task/Result shapes.
- **[Breaking API]** Clients and workers must adapt. Mitigation: Document
  breaking changes; coordinate deployment.
- **[MaxBodySize without Content-Length]** Chunked requests lack Content-Length.
  Mitigation: Enforce during body parsing; if parser supports limit option, use
  it; otherwise document limitation.

## Migration Plan

1. Update libs/schemas (Task, Result)
2. Update libs/api (remove server dep, Auth tag, UnknownError, payloads, success
   types)
3. Update server (Auth.layer, Database integration, pg-tags, root handlers,
   MaxBodySize, main.ts)
4. Update worker (Client, types)
5. Run tests and manual verification

No rollback — coordinated change; previous state is broken.

## Open Questions

- None.
