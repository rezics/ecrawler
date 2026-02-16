import {Effect, Layer, Option, pipe, Queue, Record} from "effect"
import {Extractor} from "@ecrawler/worker/services/Extractor.ts"
import {Book} from "@ecrawler/schemas"
import {PlaywrightCrawler} from "crawlee"
import {isNotUndefined} from "effect/Predicate"
import type {Task} from "@ecrawler/schemas"

const multipliers: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
  亿: 100000000
}

const parseChineseNumber = (
  input: string | null | undefined
): Option.Option<number> =>
  pipe(
    Option.fromNullable(input),
    Option.map(s => s.trim()),
    Option.filter(s => s.length > 0),
    Option.flatMap(value => {
      const numberPart = parseFloat(value)
      if (Number.isNaN(numberPart)) return Option.none()

      const match = value.match(/[^\d\.\-\+]+$/)
      const suffix = match?.[0].trim() ?? ""

      if (suffix === "") return Option.some(numberPart)

      return pipe(
        Record.get(multipliers, suffix),
        Option.map(m => numberPart * m)
      )
    })
  )

export const QidianExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    const data = yield* Queue.unbounded<Book.Book>()
    const link = yield* Queue.unbounded<string>()

    const crawler = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new PlaywrightCrawler({
            requestHandler: async ({page}) =>
              pipe(
                {
                  cover: () =>
                    page
                      .locator(`[id="book-detail"] [id="bookImg"] img`)
                      .first()
                      .getAttribute("src"),
                  title: () => page.locator("#bookName").first().textContent(),
                  author: () =>
                    page.locator(".writer-name").first().textContent(),
                  tags: () =>
                    page.locator("p.book-attribute").first().textContent(),
                  description: () =>
                    page.locator("#book-intro-detail").first().textContent(),
                  length: () =>
                    page.locator(`.book-info em`).first().textContent()
                },
                Record.map(Effect.promise),
                Effect.allWith({concurrency: "unbounded"}),
                Effect.map(raw => {
                  const book = Book.Book.make({
                    cover: raw.cover ? `https:${raw.cover}` : undefined,
                    title: raw.title?.trim(),
                    authors: [raw.author?.trim()].filter(isNotUndefined),
                    tags:
                      raw.tags
                        ?.split("·")
                        .map(s => s.trim())
                        .filter(isNotUndefined) || [],
                    description: raw.description?.trim(),
                    languages: ["zh-CN"],
                    length: pipe(
                      raw.length,
                      parseChineseNumber,
                      Option.getOrUndefined
                    )
                  })
                  return book
                }),
                Effect.tap(book => Queue.offer(data, book)),
                Effect.asVoid,
                Effect.runPromise
              )
          })
      ),
      crawler => Effect.promise(() => crawler.teardown())
    )

    return Extractor.of({
      extract: (task: typeof Task.Task.Type) =>
        Effect.gen(function* () {
          yield* Effect.promise(() => crawler.run([String(task.link)]))

          return {
            data: yield* Queue.takeAll(data),
            link: yield* Queue.takeAll(link)
          }
        })
    })
  })
)
