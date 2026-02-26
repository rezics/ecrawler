import {Record, Schema} from "effect"
import {Chapter} from "./Chapter.ts"
import * as Entity from "./Entity.ts"

export const IdentifierKey = Schema.Union(
  Schema.Literal("isbn10"),
  Schema.Literal("isbn13"),
  Schema.Literal("url"),
  Schema.Literal("oclc"),
  Schema.Literal("iccn"),
  Schema.Literal("olid"),
  Schema.String
)

export class Edition extends Schema.Class<Edition>("Edition")(
  Schema.Struct({
    date: Schema.Date.pipe(Schema.optional),
    identifiers: Schema.Record({key: IdentifierKey, value: Schema.String}),
    publisher: Schema.NonEmptyTrimmedString.pipe(Schema.optional)
  })
) {}

export class Book extends Entity.Entity.extend<Book>("Book")(
  Schema.Struct(
    Record.map(
      {
        cover: Schema.String,
        title: Schema.NonEmptyTrimmedString,
        authors: Schema.Array(Schema.NonEmptyTrimmedString),
        languages: Schema.Array(Schema.String),

        tags: Schema.Array(Schema.NonEmptyTrimmedString),
        description: Schema.NonEmptyTrimmedString,

        length: Schema.Number,
        ongoing: Schema.Boolean,

        editions: Schema.Array(Edition),

        chapters: Schema.Array(Chapter)
      },
      Schema.optional
    )
  ).annotations({
    identifier: "Book",
    description: "Schema representing a book\n\n表示书籍的模式"
  })
) {}
