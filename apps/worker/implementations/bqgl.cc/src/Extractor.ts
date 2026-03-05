import {
  Array,
  Effect,
  Layer,
  Option,
  pipe,
  Predicate,
  Queue,
  Runtime
} from "effect"
import {Extractor} from "@ecrawler/worker/services/Extractor.ts"
import {Book, Link, Record} from "@ecrawler/schemas"
import {CheerioCrawler, ProxyConfiguration} from "crawlee"
import {NetworkProxy} from "@ecrawler/proxy"

export const BQGLExtractor = Layer.scoped(
  Extractor,
  Effect.gen(function* () {
    const recordQueue = yield* Queue.unbounded<Record.Record>()
    const linkQueue = yield* Queue.unbounded<Link.Link>()
    const proxy = yield* NetworkProxy.NetworkProxy

    const runtime = yield* Effect.runtime()
    const proxies = proxy()

    const crawler = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new CheerioCrawler({
            proxyConfiguration: new ProxyConfiguration({
              newUrlFunction: () => {
                const next = proxies[Symbol.iterator]().next()

                if (next.done) {
                  return null
                }

                return next.value
                  .pipe(Runtime.runPromise(runtime))
                  .then(NetworkProxy.toProxyUrl)
              }
            }),
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

                yield* Queue.offer(
                  recordQueue,
                  Record.Record.make({data: book})
                )

                const links = pipe(
                  $('a[href^="/look/"]').toArray(),
                  Array.map(el => $(el).attr("href")),
                  Array.filter(Predicate.isNotNullable),
                  Array.filter(link => /^\/look\/\d+\/?$/.test(link)),
                  Array.map(link => {
                    try {
                      return Option.some(new URL(link, request.url))
                    } catch (error) {
                      return Option.none()
                    }
                  }),
                  Array.getSomes,
                  Array.dedupe
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
