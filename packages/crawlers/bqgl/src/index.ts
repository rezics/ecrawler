import {Chunk, Effect, Queue} from "effect"
import type {Worker} from "@ecrawler/worker/interfaces"
import {CheerioCrawler} from "crawlee"
import {Book} from "@ecrawler/schemas/book"
import {isNotUndefined} from "effect/Predicate"
import {isNonEmpty} from "effect/String"

/**
 * BQGL (笔趣阁) book metadata crawler.
 *
 * 笔趣阁书籍元数据爬虫。
 */
export default {
	name: "bqgl",
	tags: ["bqgl"],
	parser: Effect.scoped(
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<Book>()
			const crawler = yield* Effect.acquireRelease(
				Effect.succeed(
					new CheerioCrawler({
						requestHandler: async ({$, request}) =>
							Effect.gen(function* () {
								const dirid = request.url.match(/look\/(\d+)/)?.[1]

								const coverHref = $("body > div.book > div.info > div.cover > img").attr()?.["href"]
								const title = $("body > div.book > div.info > h1").text()
								const author = $("body > div.book > div.info > div.small > span:nth-child(1)").text()
								const description = $("body > div.book > div.info > div.intro > dl > dd").text()
								const ongoing = $("body > div.book > div.info > div.small > span:nth-child(2)").text()

								const book: Book = {
									cover: coverHref,
									title: isNonEmpty(title) ? title : undefined,
									authors: isNonEmpty(author) ? [author] : undefined,
									description: isNotUndefined(description) ? description : undefined,
									identifiers: {
										url: request.url,
										...(dirid && {dirid})
									},
									languages: "zh-CN",
									ongoing: isNonEmpty(ongoing) ? ongoing.includes("连载") : undefined
								}

								yield* Queue.offer(queue, book)
							}).pipe(Effect.runPromise)
					})
				),
				crawler => Effect.promise(() => crawler.teardown())
			)

			return task =>
				Effect.gen(function* () {
					yield* Effect.promise(() => crawler.addRequests([String(task.data)]))
					return Chunk.toArray(yield* Queue.takeAll(queue))
				})
		})
	)
} as const satisfies Worker
