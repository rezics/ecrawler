import {Array, Chunk, Effect, Option, pipe, Predicate, Queue} from "effect"
import type {LinkExtractor} from "@ecrawler/worker/interfaces.ts"
import {CheerioCrawler} from "crawlee"

/**
 * BQGL (笔趣阁) book link extractor.
 *
 * 从分类列表页提取书籍详情页链接。
 */
export default {
	name: "bqgl.cc",
	tags: ["bqgl.cc"],
	role: "link",
	init: () =>
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<string>()
			const crawler = yield* Effect.acquireRelease(
				Effect.sync(
					() =>
						new CheerioCrawler({
							requestHandler: async ({$, request}) =>
								Effect.gen(function* () {
									const links = pipe(
										$('a[href^="/look/"]').toArray(),
										Array.map(el => $(el).attr("href")),
										Array.filter(Predicate.isNotNullable),
										Array.filter(link =>
											/^\/look\/\d+\/?$/.test(link)
										),
										Array.map(link => {
											try {
												return Option.some(
													new URL(
														link,
														request.url
													).toString()
												)
											} catch (error) {
												return Option.none()
											}
										}),
										Array.getSomes,
										Array.dedupe
									)

									yield* Effect.log(links)

									yield* Queue.offerAll(queue, links)
								}).pipe(Effect.runPromise)
						})
				),
				crawler => Effect.promise(() => crawler.teardown())
			)

			return task =>
				Effect.gen(function* () {
					yield* Effect.promise(() =>
						crawler.run([String(task.link)])
					)
					return Chunk.toArray(yield* Queue.takeAll(queue))
				})
		})
} as const satisfies LinkExtractor
