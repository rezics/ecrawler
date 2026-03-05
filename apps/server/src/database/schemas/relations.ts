import {defineRelations} from "drizzle-orm"

import * as schemas from "./index"

export const relations = defineRelations(schemas, r => ({
  results: {task: r.one.tasks({from: r.results.task_id, to: r.tasks.id})},
  tasks: {results: r.many.results()}
}))
