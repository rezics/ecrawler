## Why

The server app currently uses a key-value store (LMDB via @ecrawler/kv) for
users and links. Introducing Drizzle-kit with Libsql provides a typed SQL
schema, versioned migrations, and a single embedded or remote SQLite-compatible
database—improving query flexibility, schema evolution, and alignment with
standard tooling (Drizzle ORM, drizzle-kit).

## What Changes

- Add **Drizzle ORM** and **Libsql** driver to `apps/server` for the primary
  database.
- Define a **Drizzle schema** (tables for users, links, and any existing domain
  entities) and expose it via **drizzle-kit** for generation and introspection.
- Add **drizzle-kit**-driven **migrations** (e.g. under
  `apps/server/src/database/migrations/`) and a migration run step (CLI or
  startup).
- Provide a **runtime database client** (Effect service or equivalent) that uses
  the Drizzle + Libsql connection, replacing or complementing the current
  KV-based `Client` for structured data.
- **BREAKING**: Replace the existing KV-based `Client` in
  `apps/server/src/database/client.ts` with a Drizzle/Libsql-backed
  implementation; update all consumers (API, auth) to use the new client.
- Document or script **local and deployment** usage (e.g. file path for embedded
  Libsql, or Libsql/Turso URL for remote).

## Capabilities

### New Capabilities

- `server-database`: Schema definition (Drizzle), migrations (drizzle-kit), and
  runtime client (Drizzle + Libsql) for the server app; migration workflow and
  env configuration.

### Modified Capabilities

- None (no existing specs in `openspec/specs/`).

## Impact

- **Code**: `apps/server` (database client, schema, migrations, main/bootstrap),
  and any modules that depend on the current database client (e.g.
  `api/auth.ts`, `api/groups/root.ts`).
- **APIs**: Internal server APIs that read/write users and links will use the
  new client; no intentional change to external HTTP API contracts unless we
  choose to expose new query capabilities.
- **Dependencies**: Add `drizzle-orm`, `@libsql/client` (or chosen Libsql
  client), keep or adjust `drizzle-kit`; possibly remove or reduce direct
  LMDB/KV usage in the server for this data.
- **Systems**: Local and CI need Node and drizzle-kit for generate/migrate;
  deployment must provide a Libsql-compatible endpoint or path for the database
  file.
