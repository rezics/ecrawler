import {Schema} from "effect"

export class Chapter extends Schema.Class<Chapter>("Chapter")({
  id: Schema.UUID,
  title: Schema.NonEmptyTrimmedString,
  children: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<readonly Chapter[]> => Schema.Array(Chapter)
    )
  )
}) {}

if (import.meta.main) {
  const chapter: Chapter = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Chapter 1",
    children: [
      {id: "123e4567-e89b-12d3-a456-426614174001", title: "Section 1.1"}
    ]
  }
  console.log(chapter)
}
