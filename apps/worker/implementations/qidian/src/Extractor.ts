import {
  Array,
  Effect,
  Layer,
  Option,
  pipe,
  Predicate,
  Queue,
  Record,
  Runtime
} from "effect"
import {Extractor} from "@ecrawler/worker/services/Extractor.ts"
import {Book, Link, Record as RecordSchema} from "@ecrawler/schemas"
import {PlaywrightCrawler} from "crawlee"

const multipliers: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1_000,
  万: 10_000,
  亿: 100_000_000
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

const isNotUndefined = Predicate.isNotUndefined

export const QidianExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    const recordQueue = yield* Queue.unbounded<RecordSchema.Record>()
    const linkQueue = yield* Queue.unbounded<Link.Link>()

    const runtime = yield* Effect.runtime()

    const crawler = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new PlaywrightCrawler({
            requestHandler: async ({page, request}) =>
              Effect.gen(function* () {
                const raw = yield* pipe(
                  {
                    cover: () =>
                      page
                        .locator(`[id="book-detail"] [id="bookImg"] img`)
                        .first()
                        .getAttribute("src"),
                    title: () =>
                      page.locator("#bookName").first().textContent(),
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
                  Effect.allWith({concurrency: "unbounded"})
                )

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

                yield* Queue.offer(
                  recordQueue,
                  RecordSchema.Record.make({data: book})
                )

                const links = pipe(
                  Array.of(request.url),
                  Array.map(link => {
                    try {
                      return Option.some(new URL(link))
                    } catch (error) {
                      return Option.none()
                    }
                  }),
                  Array.getSomes
                )

                yield* Queue.offerAll(linkQueue, links)
              }).pipe(Runtime.runPromise(runtime))
          })
      ),
      crawler => Effect.promise(() => crawler.teardown())
    )

    return Extractor.of({
      extract: task =>
        Effect.gen(function* () {
          yield* Effect.promise(() => crawler.run([String(task.link)]))

          return {
            records: yield* Queue.takeAll(recordQueue),
            links: yield* Queue.takeAll(linkQueue)
          }
        })
    })
  })
)
