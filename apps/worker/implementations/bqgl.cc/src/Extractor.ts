import {Array, Effect, Layer, Option, pipe, Predicate, Queue} from "effect"
import {Extractor} from "@ecrawler/worker/services/Extractor.ts"
import {Book} from "@ecrawler/schemas"
import {CheerioCrawler} from "crawlee"

export const BQGLExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    const data = yield* Queue.unbounded<Book.Book>()
    const link = yield* Queue.unbounded<string>()

    const crawler = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new CheerioCrawler({
            requestHandler: async ({$, request}) =>
              Effect.gen(function* () {
                const dirid = yield* Option.fromNullable(
                  request.url.match(/look\/(\d+)/)?.[1]
                )

                const cover = $(
                  "body > div.book > div.info > div.cover > img"
                ).attr()?.["href"]!
                const title = $("body > div.book > div.info > h1").text()
                const author = $(
                  "body > div.book > div.info > div.small > span:nth-child(1)"
                ).text()
                const description = $(
                  "body > div.book > div.info > div.intro > dl > dd"
                ).text()
                const ongoing = $(
                  "body > div.book > div.info > div.small > span:nth-child(2)"
                )
                  .text()
                  .includes("连载")

                const edition = Book.Edition.make({
                  identifiers: {url: request.url, dirid}
                })

                const book = Book.Book.make({
                  cover: cover,
                  title: title,
                  authors: [author],
                  description,
                  editions: [edition],
                  languages: ["zh-CN"],
                  ongoing,
                  length: 0,
                  tags: [],
                  chapters: []
                })

                yield* Queue.offer(data, book)

                const links = pipe(
                  $('a[href^="/look/"]').toArray(),
                  Array.map(el => $(el).attr("href")),
                  Array.filter(Predicate.isNotNullable),
                  Array.filter(link => /^\/look\/\d+\/?$/.test(link)),
                  Array.map(link => {
                    try {
                      return Option.some(new URL(link, request.url).toString())
                    } catch (error) {
                      return Option.none()
                    }
                  }),
                  Array.getSomes,
                  Array.dedupe
                )

                yield* Effect.log(links)

                yield* Queue.offerAll(link, links)
              }).pipe(Effect.runPromise)
          })
      ),
      crawler => Effect.promise(() => crawler.teardown())
    )

    return Extractor.of({
      extract: task =>
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
