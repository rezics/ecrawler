import {Schema} from "effect"

export const IdentifierKey = Schema.Union(
	Schema.Literal("isbn10"),
	Schema.Literal("isbn13"),
	Schema.Literal("url"),
	Schema.Literal("oclc"),
	Schema.Literal("iccn"),
	Schema.Literal("olid"),
	Schema.String
)

export const Book = Schema.Struct({
	cover: Schema.optional(Schema.String),
	title: Schema.optional(Schema.String),
	authors: Schema.optional(Schema.Array(Schema.String)),
	description: Schema.optional(Schema.String),
	languages: Schema.optional(Schema.String),
	publisher: Schema.optional(Schema.String),
	publishDate: Schema.optional(Schema.String),
	length: Schema.optional(Schema.Number),
	ongoing: Schema.optional(Schema.Boolean),
	identifiers: Schema.optional(
		Schema.Record({key: IdentifierKey, value: Schema.String})
	),
	subjects: Schema.optional(Schema.Array(Schema.String))
})

export type Book = typeof Book.Type
