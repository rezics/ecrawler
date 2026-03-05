## ADDED Requirements

### Requirement: Server uses Database service

The server API SHALL use the Database service from database/services/Database.ts
for all database access. It SHALL NOT import from database/client.ts or any
deleted module.

#### Scenario: Handlers use Database

- **WHEN** any collector or dispatcher endpoint is invoked
- **THEN** the handler uses the Database service (yield\* Database) for inserts,
  updates, deletes, and selects

#### Scenario: Auth uses Database

- **WHEN** Auth middleware validates a Bearer token
- **THEN** it queries the token table via the Database service

### Requirement: Tag filtering uses PostgreSQL array operators

The server SHALL filter by tags using PostgreSQL array containment. A
tagsContained (or equivalent) filter SHALL match rows whose tags array contains
all specified query tags.

#### Scenario: getResults with tags filter

- **WHEN** getResults is called with urlParams.tags set
- **THEN** the query uses a PostgreSQL array containment expression so only
  results whose tags include all specified tags are returned

#### Scenario: getTasks and nextTask with tags filter

- **WHEN** getTasks or nextTask is called with urlParams.tags set
- **THEN** the query uses a PostgreSQL array containment expression so only
  tasks whose tags include all specified tags are returned

### Requirement: nextTask updates status to processing

nextTask SHALL select the next task with status = 'pending', update its status
to 'processing', and return the task. It SHALL NOT set or use a by column.

#### Scenario: nextTask returns pending task

- **WHEN** nextTask is called and a pending task exists
- **THEN** the task is returned and its status in the database is updated to
  'processing'

#### Scenario: nextTask does not use by

- **WHEN** nextTask handler executes
- **THEN** no by column is read or written

### Requirement: MaxBodySize middleware limits request body to 1 MB

The server SHALL apply a MaxBodySize middleware that limits request body to 1
MB. Requests exceeding 1 MB SHALL receive 413 Payload Too Large.

#### Scenario: Small body accepted

- **WHEN** a request has a body smaller than 1 MB
- **THEN** the request is processed normally

#### Scenario: Large body rejected

- **WHEN** a request has a body larger than 1 MB (or Content-Length > 1 MB)
- **THEN** the server responds with 413 Payload Too Large

### Requirement: Server provides Auth.layer

The server SHALL provide Auth.layer that implements the Auth Context.Tag
expected by libs/api. main.ts SHALL compose the API layer with Auth.layer and
Database.layer.

#### Scenario: API layer receives Auth

- **WHEN** the server starts
- **THEN** the API layer has access to Auth (via Layer.provide) and the server
  starts without errors

#### Scenario: Auth validates token via Database

- **WHEN** a request includes a Bearer token
- **THEN** the Auth middleware queries the token table using the Database
  service and succeeds only if a row exists with matching data

### Requirement: Handlers align with database schema

Collector and dispatcher handlers SHALL use schema columns that exist in the
current database: tasks (id, status, tags, link, meta, created_at, updated_at),
results (id, tags, link, meta, data, created_at, updated_at, task_id). Handlers
SHALL NOT reference by, schema.tasks.by, or schema.results.by.

#### Scenario: createResult uses correct columns

- **WHEN** createResult is invoked with payload
- **THEN** the insert uses tags, link, meta, data (and task_id if applicable);
  not by

#### Scenario: createTask uses correct columns

- **WHEN** createTask is invoked
- **THEN** the insert uses tags, link, meta; status defaults to pending
