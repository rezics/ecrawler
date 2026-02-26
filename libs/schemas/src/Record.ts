import {Schema} from "effect"
import * as Entity from "./Entity"

export class Record extends Entity.Entity.extend<Record>("Record")({
  data: Schema.Record({key: Schema.Unknown, value: Schema.Unknown})
}) {}
