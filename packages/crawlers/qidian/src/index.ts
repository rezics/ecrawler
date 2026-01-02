import {Effect, pipe, Queue, Stream} from "effect"
import type {Worker} from "@ecrawler/worker/interfaces"
import {PlaywrightCrawler} from "crawlee"
import {isNotUndefined} from "effect/Predicate"
import {Book} from "@ecrawler/schemas"
import {endsWith} from "effect/String"

export default {
	tag: "qidian",
	identifier: endsWith("qidian.com"),
	transformer: url =>
		Stream.unwrapScoped(
			Effect.gen(function* () {
				const queue = yield* Queue.unbounded<Book>()
				const crawler = yield* Effect.acquireRelease(
					Effect.sync(
						() =>
							new PlaywrightCrawler({
								requestHandler: async ({page, request}) =>
									Effect.gen(function* () {
										const coverSrc = yield* Effect.promise(() => page.locator(`[id="book-detail"] [id="bookImg"] img`).first().getAttribute("src"))

										const book: Book = {
											cover: coverSrc ? `https:${coverSrc}` : undefined,
											title: (yield* Effect.promise(() => page.locator("#bookName").first().textContent()))?.trim(),
											authors: [(yield* Effect.promise(() => page.locator(".writer-name").first().textContent()))?.trim()].filter(isNotUndefined),
											subjects: (yield* Effect.promise(() => page.locator("p.book-attribute").first().textContent()))?.split("·").map(s => s.trim()) || [],
											description: (yield* Effect.promise(() => page.locator("#book-intro-detail").first().textContent()))?.trim(),
											identifiers: {url: request.url},
											languages: "zh-CN",
											length: pipe((yield* Effect.promise(() => page.locator(`.book-info em`).first().textContent()))?.trim(), parseChineseNumber)
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

const parseChineseNumber = (input?: string): number => {
	const multipliers: Record<string, number> = {
		十: 10,
		百: 100,
		千: 1000,
		万: 10000,
		亿: 100000000
	}

	return pipe(input, value => {
		if (!value) {
			return NaN
		}

		const cleanInput = value.trim()
		const numberPart = parseFloat(cleanInput)

		if (isNaN(numberPart)) {
			return NaN
		}

		const match = cleanInput.match(/[^\d\.\-\+]+$/)
		const suffix = match ? match[0].trim() : ""

		if (!suffix) {
			return numberPart
		}

		const multiplier = multipliers[suffix]

		if (multiplier !== undefined) {
			return numberPart * multiplier
		}

		return NaN
	})
}
