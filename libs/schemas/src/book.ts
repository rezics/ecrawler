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
  cover: Schema.String,
  title: Schema.String,
  authors: Schema.Array(Schema.String),
  description: Schema.String,
  languages: Schema.String,
  publisher: Schema.String,
  publishDate: Schema.String,
  length: Schema.Number,
  ongoing: Schema.Boolean,
  identifiers: Schema.Record({key: IdentifierKey, value: Schema.String}),
  subjects: Schema.Array(Schema.String)
}).pipe(Schema.partial)

export type Book = typeof Book.Type
