import {Effect, Queue, Stream} from "effect"
import type {Worker} from "@ecrawler/worker/interfaces"
import {CheerioCrawler} from "crawlee"
import {Book} from "@ecrawler/schemas"
import {isNotUndefined} from "effect/Predicate"
import {endsWith, includes, isNonEmpty} from "effect/String"

export default {
	tag: "bqgl",
	identifier: endsWith("bqgl.cc"),
	transformer: url =>
		Stream.unwrapScoped(
			Effect.gen(function* () {
				const queue = yield* Queue.unbounded<Book>()
				const crawler = yield* Effect.acquireRelease(
					Effect.sync(
						() =>
							new CheerioCrawler({
								requestHandler: async ({$, request}) =>
									Effect.gen(function* () {
										const dirid = yield* Effect.sync(() => request.url.match(/look\/(\d+)/)?.[1]).pipe(Effect.filterOrFail(isNotUndefined, () => "No book id found"))

										const book: Book = {
											cover: yield* Effect.sync(() => $("body > div.book > div.info > div.cover > img").attr()?.["href"]).pipe(
												Effect.filterOrFail(isNotUndefined, () => "No cover found")
											),
											title: yield* Effect.sync(() => $("body > div.book > div.info > h1").text()).pipe(Effect.filterOrFail(isNonEmpty, () => "No title found")),
											authors: yield* Effect.sync(() => $("body > div.book > div.info > div.small > span:nth-child(1)").text()).pipe(
												Effect.map(author => (isNonEmpty(author) ? [author] : undefined))
											),
											description: yield* Effect.sync(() => $("body > div.book > div.info > div.intro > dl > dd").text()).pipe(
												Effect.filterOrFail(isNotUndefined, () => "No description found")
											),
											identifiers: {
												url: request.url,
												dirid
											},
											languages: "zh-CN",
											ongoing: yield* Effect.sync(() => $("body > div.book > div.info > div.small > span:nth-child(2)").text()).pipe(
												Effect.filterOrFail(isNonEmpty, () => "No ongoing status found"),
												Effect.map(includes("连载"))
											)
										}

										yield* Queue.offer(queue, book)
									}).pipe(Effect.runPromise)
							})
					),
					crawler => Effect.promise(() => crawler.teardown())
				)

				return Stream.mapConcatEffect(url, url =>
					Effect.gen(function* () {
						yield* Effect.promise(() => crawler.addRequests([String(url)]))
						return yield* Queue.takeAll(queue)
					})
				)
			})
		)
} as const satisfies Worker
