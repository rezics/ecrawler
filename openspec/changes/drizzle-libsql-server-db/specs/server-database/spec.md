# server-database

## ADDED Requirements

### Requirement: Schema is defined with Drizzle for SQLite

The server SHALL define its database schema using Drizzle ORM with
SQLite-compatible types (e.g. `sqliteTable`). The schema SHALL include tables
for users and links consistent with the domain (e.g. user id, username,
password; link identity and URL). The schema file SHALL live under
`apps/server/src/database/` and SHALL be the single source of truth for table
definitions used by drizzle-kit and the runtime client.

#### Scenario: Schema file exists and is valid

- **WHEN** the schema module is loaded and drizzle-kit introspects it
- **THEN** no schema syntax errors occur and tables are discoverable for
  migration generation

#### Scenario: Tables align with domain entities

- **WHEN** the runtime client queries users or links
- **THEN** the table columns and types match the intended domain (users: id,
  username, password; links: defined structure for link storage)

### Requirement: Migrations are generated and applied via drizzle-kit

The server SHALL use drizzle-kit to generate SQL migrations from the Drizzle
schema. Migrations SHALL be stored under `apps/server/src/database/migrations/`
(or the path configured in drizzle config). The project SHALL provide a way to
apply pending migrations (e.g. script or startup step) so that the database
schema is up to date before the server serves traffic.

#### Scenario: New migration is generated from schema changes

- **WHEN** a developer runs the configured drizzle-kit generate command (e.g.
  `yarn generate` in server)
- **THEN** a new migration file is produced under the migrations directory and
  the schema diff is reflected in SQL

#### Scenario: Pending migrations are applied

- **WHEN** the configured migrate command or startup migration step runs against
  a Libsql database
- **THEN** all pending migrations are applied in order and the database version
  matches the latest migration

### Requirement: Runtime client uses Drizzle and Libsql

The server SHALL provide a runtime database client that uses Drizzle ORM with a
Libsql connection. The client SHALL be obtainable as an Effect service (same
service token as the current database client where applicable) and SHALL expose
access to the users and links tables (or equivalent typed API). The connection
SHALL be created from configuration (e.g. env: database URL or file path).

#### Scenario: Client is provided by the Effect layer

- **WHEN** the server main or API layer requests the database Client service
- **THEN** the Effect runtime provides a client backed by Drizzle and Libsql

#### Scenario: Client reads and writes users and links

- **WHEN** code uses the client to query or mutate users or links
- **THEN** operations are executed against the Libsql database via Drizzle with
  correct types

### Requirement: Configuration is environment-driven

The database connection (Libsql URL or file path) SHALL be read from the
environment (e.g. `DATABASE_URL` or `LIBSQL_URL`). The server SHALL not hardcode
connection strings. Local and production usage SHALL be documentable (e.g. in
README or .env.example).

#### Scenario: Connection uses env config

- **WHEN** the server starts and the database client is created
- **THEN** the Libsql connection uses the URL or path from the configured env
  variable

#### Scenario: Missing config fails fast

- **WHEN** the required database env variable is missing at startup
- **THEN** the server or client layer fails with a clear error rather than
  defaulting to an arbitrary connection
