import {Schema} from "effect"
import * as UUID from "uuid"

export class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.UUID.pipe(
    Schema.optionalWith({exact: true, default: () => UUID.v7()})
  )
}) {}
