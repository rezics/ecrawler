import {Array, Chunk, Effect, pipe, Predicate, Queue, Schema} from "effect"
import type {LinkExtractor} from "@ecrawler/worker/interfaces.ts"
import {CheerioCrawler} from "crawlee"

/**
 * BQGL (笔趣阁) book link extractor.
 *
 * 从分类列表页提取书籍详情页链接。
 */
export default {
	name: "bqgl.cc",
	tags: ["bqgl"],
	role: "link",
	init: Effect.scoped(
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<string>()
			const crawler = yield* Effect.acquireRelease(
				Effect.succeed(
					new CheerioCrawler({
						requestHandler: async ({$}) =>
							Effect.gen(function* () {
								const links = pipe(
									$('a[href^="/look/"]').toArray(),
									Array.map(el => $(el).attr("href")),
									Array.filter(Predicate.isNotNullable),
									Array.filter(/^\/look\/\d+\/?$/.test),
									Array.map(link => Schema.decodeEither(Schema.URL)(link)),
									Array.getRights,
									Array.map(link => link.toString()),
									Array.dedupe
								)

								yield* Queue.offerAll(queue, links)
							}).pipe(Effect.runPromise)
					})
				),
				crawler => Effect.promise(() => crawler.teardown())
			)

			return task =>
				Effect.gen(function* () {
					yield* Effect.promise(() => crawler.addRequests([String(task.link)]))
					return Chunk.toArray(yield* Queue.takeAll(queue))
				})
		})
	)
} as const satisfies LinkExtractor
