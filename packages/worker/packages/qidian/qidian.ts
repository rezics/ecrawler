import {Effect, flow, Layer, pipe, Queue, Stream} from "effect"
import {Worker} from "../../interfaces"
import {PlaywrightCrawler} from "crawlee"
import {isNotUndefined} from "effect/Predicate"
import {Book} from "@ecrawler/schema/Book.ts"

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

const Crawler = (queue: Queue.Queue<Book>) =>
	Effect.acquireRelease(
		Effect.succeed(
			new PlaywrightCrawler({
				requestHandler: async ({page, request}) =>
					Effect.gen(function* () {
						const coverSrc = yield* Effect.promise(() =>
							page
								.locator(
									`[id="book-detail"] [id="bookImg"] img`
								)
								.first()
								.getAttribute("src")
						)

						const book: Book = {
							cover: coverSrc ? `https:${coverSrc}` : undefined,
							title: (yield* Effect.promise(() =>
								page.locator("#bookName").first().textContent()
							))?.trim(),
							authors: [
								(yield* Effect.promise(() =>
									page
										.locator(".writer-name")
										.first()
										.textContent()
								))?.trim()
							].filter(isNotUndefined),
							subjects:
								(yield* Effect.promise(() =>
									page
										.locator("p.book-attribute")
										.first()
										.textContent()
								))
									?.split("·")
									.map(s => s.trim()) || [],
							description: (yield* Effect.promise(() =>
								page
									.locator("#book-intro-detail")
									.first()
									.textContent()
							))?.trim(),
							identifiers: {
								url: request.url
							},
							languages: "zh-cn",
							length: pipe(
								(yield* Effect.promise(() =>
									page
										.locator(`.book-info em`)
										.first()
										.textContent()
								))?.trim(),
								parseChineseNumber
							)
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
			tag: "qidian",
			identifier: /.*\.qidian\.com/,
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
