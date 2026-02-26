## 1. Dependencies and config

- [x] 1.1 Add `drizzle-orm` and `@libsql/client` to `apps/server` package.json;
      ensure `drizzle-kit` is available for dev/generate/migrate
- [x] 1.2 Add `drizzle.config.ts` under `apps/server/src/database/` pointing to
      Libsql/SQLite driver, schema file, and migrations directory

## 2. Schema

- [x] 2.1 Create `apps/server/src/database/schema.ts` with Drizzle SQLite tables
      for users (id, username, password) and links (id, url or equivalent)
- [x] 2.2 Export schema so drizzle-kit and the runtime client can import the
      same definitions

## 3. Migrations

- [x] 3.1 Run drizzle-kit generate to create initial migration under
      `apps/server/src/database/migrations/`
- [x] 3.2 Add a migrate step (CLI script or programmatic) to apply migrations;
      document in README or package.json script (e.g. `yarn migrate`)

## 4. Runtime client

- [x] 4.1 Implement Libsql connection creation from env (e.g. `DATABASE_URL` or
      `LIBSQL_URL`); fail fast if missing
- [x] 4.2 Replace `Client` in `apps/server/src/database/client.ts` with an
      Effect service that builds `drizzle(libsqlClient)` and exposes users and
      links tables (or typed helpers)
- [x] 4.3 Update `apps/server/src/database/index.ts` exports if needed

## 5. Wire and replace

- [x] 5.1 Update auth and API code that use the database client to use the new
      Drizzle-backed API (same service token, new table/query usage)
- [x] 5.2 Remove or replace KV-based user/link storage usage in the server so
      the single source of truth is the Libsql database
- [x] 5.3 Run migrations on startup or document manual migrate step; ensure
      server starts with up-to-date schema

## 6. Documentation and env

- [x] 6.1 Document required env variable(s) (e.g. `DATABASE_URL` or
      `LIBSQL_URL`) in README or `.env.example`
- [x] 6.2 Add or update `.env.example` with a sample value for local file-based
      Libsql (e.g. `file:./data/server.db`)
