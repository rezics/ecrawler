## 1. libs/schemas

- [x] 1.1 Update Task schema: add status (enum pending|processing|completed),
      meta (optional)
- [x] 1.2 Redefine Result.Api as independent schema: id, tags, link, meta, data,
      created_at, updated_at, task_id; remove by and extend from Task

## 2. libs/api – Decouple and abstractions

- [x] 2.1 Remove @ecrawler/server from libs/api package.json dependencies
- [x] 2.2 Define Auth as Context.Tag in libs/api (e.g. api/auth.ts)
- [x] 2.3 Define UnknownError in libs/api (e.g. api/error.ts)
- [x] 2.4 Update collector and dispatcher groups to use Auth from libs/api
      (remove server imports)
- [x] 2.5 Update dispatcher group to use UnknownError from libs/api

## 3. libs/api – Payloads and success types

- [x] 3.1 Add meta (optional) to CreateTask, CreateResult, UpdateTask,
      UpdateResult payloads
- [x] 3.2 Remove by from CreateResult, UpdateResult, NextPayload, Result
      QueryParams
- [x] 3.3 Update TaskApi success types to use new Task schema (getTasks,
      updateTask, nextTask)
- [x] 3.4 Update ResultApi success types to use new Result schema (getResults,
      createResult)

## 4. Server – Database and infrastructure

- [x] 4.1 Fix Database layer: ensure Database.service provides
      EffectPgDatabase<Schemas>; fix main.ts to use Database.layer
- [x] 4.2 Create pg-tags.ts with tagsContained/tagsContains using PostgreSQL
      array operators
- [x] 4.3 Implement Auth.layer in server that validates token via Database;
      export for main composition
- [x] 4.4 Implement MaxBodySize middleware (1 MB limit, 413 on exceed); add to
      API middleware stack

## 5. Server – Handlers

- [x] 5.1 Update root.ts imports: Database from services, schema from
      database/schemas; remove client, sqlite-tags
- [x] 5.2 Update collector handlers: use schema.results columns (no by); persist
      meta from payload
- [x] 5.3 Update dispatcher handlers: use schema.tasks columns (no by); persist
      meta from payload
- [x] 5.4 Update nextTask: select pending, set status to processing, return
      task; remove by logic
- [x] 5.5 Update main.ts: compose API with Auth.layer, Database.layer,
      MaxBodySize

## 6. Worker

- [x] 6.1 Update worker Client and types to use new Task/Result shapes
- [x] 6.2 Remove by from CreateResult and NextPayload calls in worker
