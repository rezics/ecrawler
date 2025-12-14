import {Effect, flow, Layer, Queue, Stream} from "effect"
import {Worker} from "@ecrawler/worker/interfaces"
import {PlaywrightCrawler} from "crawlee"
import {Book} from "@ecrawler/schemas"

const extractBookId = (url: string): string | undefined => {
	const match = url.match(/look\/(\d+)/)
	return match?.[1]
}

const Crawler = (queue: Queue.Queue<Book>) =>
	Effect.acquireRelease(
		Effect.succeed(
			new PlaywrightCrawler({
				requestHandler: async ({request}) =>
					Effect.gen(function* () {
						const bookId = extractBookId(request.url)
						if (!bookId) {
							return
						}

						const apiUrl = `https://www.46f1e.icu/api/book?id=${bookId}`

						const response: {
							id: string
							title: string
							sortname: string
							author: string
							full: string
							intro: string
							lastchapterid: string
							lastchapter: string
							lastupdate: string
							dirid: string
						} = yield* Effect.promise(() =>
							fetch(apiUrl).then(res => res.json())
						)

						const book: Book = {
							title: response.title,
							authors: [response.author],
							description: response.intro,
							identifiers: {
								url: request.url,
								dirid: response.dirid
							},
							ongoing: response.full === "连载"
						}

						yield* Queue.offer(queue, book)
					}).pipe(Effect.runPromise)
			})
		),
		crawler => Effect.promise(() => crawler.teardown())
	)

export default Layer.scoped(
	Worker,
	Effect.gen(function* () {
		const queue = yield* Queue.unbounded<Book>()
		const crawler = yield* Crawler(queue)

		return Worker.of({
			tag: "bqgl",
			identifier: /.*bqgl\.cc/,
			transformer: flow(
				Stream.map((input: unknown) => String(input)),
				Stream.mapConcatEffect((url: string) =>
					Effect.gen(function* () {
						crawler.addRequests([url])
						return yield* Queue.takeAll(queue)
					})
				)
			)
		})
	})
)
