## Context

The server (`apps/server`) currently uses `@ecrawler/kv` (LMDB-backed key-value
store) with prefixed namespaces for `user` and `link` entities. The database
client is an Effect service in `src/database/client.ts` exposing `users` and
`links` key-value views. Drizzle and Postgres were partially present (e.g.
`libs/core` had a small pg schema); the server has since moved to KV. The goal
is to introduce a single, typed SQL database using Drizzle ORM with Libsql
(SQLite-compatible), managed by drizzle-kit for schema and migrations.

## Goals / Non-Goals

**Goals:**

- Provide a Drizzle + Libsql database solution for the server with a single
  schema file, versioned migrations, and a runtime client usable as an Effect
  service.
- Replace the current KV-based database client with a Drizzle-backed client that
  preserves the logical interface (users, links) where possible, or clearly
  define the new interface.
- Support local development (e.g. file-based Libsql) and production (file or
  remote Libsql/Turso) via configuration.

**Non-Goals:**

- Migrating data from existing LMDB/KV stores into the new database (can be a
  follow-up); this change focuses on the new stack and client.
- Changing the public HTTP API contracts of the server.
- Introducing Drizzle/Libsql in other apps (worker, etc.) unless required for
  shared schema.

## Decisions

1. **ORM and driver: Drizzle ORM + Libsql**
   - **Why**: Drizzle gives type-safe schema and migrations; Libsql is
     SQLite-compatible and supports embedded (file) and remote (e.g. Turso)
     modes. Fits a single-server app and aligns with existing drizzle-kit usage
     in the repo.
   - **Alternatives**: Keep KV only (rejected—need SQL and migrations); use
     Postgres (rejected for this change—prefer SQLite/Libsql for simplicity and
     portability).

2. **Schema and migrations location**
   - **Decision**: Schema and drizzle-kit config live under
     `apps/server/src/database/` (e.g. `schema.ts`, `drizzle.config.ts`);
     migrations in `apps/server/src/database/migrations/`.
   - **Why**: Keeps server DB concerns in the server app; other packages depend
     on schemas via `@ecrawler/schemas` for types/validation, not the Drizzle
     schema file.
   - **Alternative**: Shared schema in a lib—deferred to avoid cross-app
     coupling for this change.

3. **Runtime client**
   - **Decision**: Implement a new Effect service that creates a Drizzle
     `drizzle(libsqlClient)` instance and exposes tables (or typed query
     helpers) for users and links. Replace the current `Client` in `client.ts`
     so existing layers (auth, API) get the new client via the same service
     token.
   - **Why**: Minimal change to call sites; Effect’s dependency injection keeps
     the client testable and swappable.
   - **Alternative**: Keep KV client and add a separate “SQL client”
     service—rejected to avoid two sources of truth for the same entities.

4. **Migration execution**
   - **Decision**: Run migrations via drizzle-kit (or programmatic migrate API)
     at server startup or via a small CLI script (e.g. `yarn migrate`). Prefer
     startup so one command brings the app up with an up-to-date DB.
   - **Alternative**: Only manual migrate before deploy—acceptable if the team
     prefers explicit steps; document in README or ops.

5. **Configuration**
   - **Decision**: Database URL or path (e.g. `DATABASE_URL` or `LIBSQL_URL` /
     file path) read from env; no Drizzle/Libsql config in code beyond
     connection creation.
   - **Why**: Matches 12-factor and existing `.env` usage in the server.

## Risks / Trade-offs

- **Risk**: Existing in-memory or LMDB data is not migrated automatically.  
  **Mitigation**: Document that this is a fresh DB or add a separate migration
  task/script later.

- **Risk**: Libsql client API or driver changes over time.  
  **Mitigation**: Pin `@libsql/client` and `drizzle-orm` versions; follow
  upgrade notes for breaking changes.

- **Trade-off**: SQLite/Libsql has fewer concurrency and feature guarantees than
  Postgres.  
  **Mitigation**: Acceptable for current server scale; revisit if we need
  advanced SQL or high write concurrency.

## Migration Plan

1. Add dependencies: `drizzle-orm`, `@libsql/client`, ensure `drizzle-kit` is
   available for generate/migrate.
2. Add `schema.ts` and `drizzle.config.ts` under `apps/server/src/database/`,
   and a migrations folder.
3. Generate initial migration from schema; run migrate once to create tables.
4. Implement new `Client` in `client.ts` using Drizzle + Libsql; wire connection
   from env.
5. Update all consumers of the old client (auth, API routes) to use the new
   client’s API (table access or helpers).
6. Remove or deprecate KV-based storage for users/links in the server; document
   env vars (e.g. `DATABASE_URL` or `LIBSQL_URL`).
7. **Rollback**: Revert to previous commit and redeploy; DB file or remote DB
   can be backed up separately if needed.

## Open Questions

- Whether to run migrations automatically on startup or only via a separate
  `yarn migrate` (or similar) step.
- Exact env variable name: `DATABASE_URL` vs `LIBSQL_URL` vs file path—decide
  and document in implementation.
