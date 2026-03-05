## ADDED Requirements

### Requirement: libs/api has no dependency on server

libs/api SHALL NOT import from @ecrawler/server. It SHALL NOT list
@ecrawler/server in its package.json dependencies.

#### Scenario: No server imports

- **WHEN** libs/api is built or type-checked
- **THEN** no file in libs/api imports from @ecrawler/server

#### Scenario: Package dependencies

- **WHEN** libs/api package.json is inspected
- **THEN** @ecrawler/server is not listed in dependencies

### Requirement: Auth is a Context.Tag

libs/api SHALL define Auth as a Context.Tag that expects HttpMiddleware. The API
groups SHALL use Auth as middleware. The server SHALL provide Auth.layer when
composing the API.

#### Scenario: Auth tag defined in libs/api

- **WHEN** libs/api is loaded
- **THEN** Auth is exported as a Context.Tag compatible with HttpMiddleware

#### Scenario: API groups use Auth

- **WHEN** collector or dispatcher groups are defined
- **THEN** they apply Auth as middleware (e.g. .middleware(Auth))

### Requirement: UnknownError defined in libs/api

libs/api SHALL define UnknownError as a tagged error schema. The dispatcher
group SHALL use UnknownError for error handling.

#### Scenario: UnknownError exported

- **WHEN** libs/api is loaded
- **THEN** UnknownError is exported and usable as an error type in Effect

### Requirement: Task schema matches database tasks table

libs/schemas Task SHALL have fields: id, status, tags, link, meta, created_at,
updated_at. status SHALL be an enum with values pending, processing, completed.
meta SHALL be optional (Schema.optional).

#### Scenario: Task has all DB fields

- **WHEN** Task schema is decoded from a value matching the tasks table
- **THEN** decoding succeeds and all fields are present (meta optional)

#### Scenario: Task used in API success types

- **WHEN** getTasks or nextTask returns success
- **THEN** the response body conforms to Task schema

### Requirement: Result schema matches database results table

libs/schemas Result (Api) SHALL have fields: id, tags, link, meta, data,
created_at, updated_at, task_id. Result SHALL NOT extend Task. Result SHALL NOT
have a by field.

#### Scenario: Result has all DB fields

- **WHEN** Result schema is decoded from a value matching the results table
- **THEN** decoding succeeds and task_id is present; by is absent

#### Scenario: Result used in API success types

- **WHEN** getResults or createResult returns success
- **THEN** the response body conforms to Result schema (with optional data
  omission for list)

### Requirement: Create and update payloads include optional meta

CreateTask, CreateResult, UpdateTask, UpdateResult payloads SHALL include meta
as an optional field. meta SHALL accept arbitrary JSON
(Schema.optional(Schema.Unknown) or equivalent).

#### Scenario: CreateResult with meta

- **WHEN** a client sends CreateResult payload with meta set to an object
- **THEN** the API accepts the payload and the server persists meta to the
  results table

#### Scenario: CreateTask with meta

- **WHEN** a client sends CreateTask payload with meta set
- **THEN** the API accepts the payload and the server persists meta to the tasks
  table

### Requirement: No by in result or nextTask payloads

CreateResult, UpdateResult, and NextPayload SHALL NOT include a by field. Result
QueryParams SHALL NOT include by.

#### Scenario: CreateResult payload has no by

- **WHEN** CreateResult payload schema is inspected
- **THEN** by is not a field

#### Scenario: NextPayload has no by

- **WHEN** NextPayload schema is inspected
- **THEN** by is not a field
