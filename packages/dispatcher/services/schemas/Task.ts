import {Schema} from "effect"

export default Schema.Struct({
	id: Schema.UUID,
	tags: Schema.String.pipe(Schema.Array),
	assignment: Schema.UUID,
	payload: Schema.Object
})
