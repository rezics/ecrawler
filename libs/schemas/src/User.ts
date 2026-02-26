import {Schema} from "effect"

export const User = Schema.Struct({
  id: Schema.UUID,
  username: Schema.NonEmptyTrimmedString,
  password: Schema.NonEmptyTrimmedString
})
