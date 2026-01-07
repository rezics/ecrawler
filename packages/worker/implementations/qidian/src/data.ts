import {Chunk, Effect, Option, pipe, Queue, Record, String} from "effect"
import type {DataExtractor} from "@ecrawler/worker/interfaces"
import {PlaywrightCrawler} from "crawlee"
import {isNotUndefined} from "effect/Predicate"
import {Book} from "@ecrawler/schemas/book"

/**
 * Qidian (起点中文网) book metadata crawler.
 *
 * 起点中文网书籍元数据爬虫。
 */
export default {
	name: "qidian",
	tags: ["qidian"],
	init: Effect.scoped(
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<Book>()
			const crawler = yield* Effect.acquireRelease(
				Effect.succeed(
					new PlaywrightCrawler({
						requestHandler: async ({page, request}) =>
							pipe(
								{
									cover: () => page.locator(`[id="book-detail"] [id="bookImg"] img`).first().getAttribute("src"),
									title: () => page.locator("#bookName").first().textContent(),
									author: () => page.locator(".writer-name").first().textContent(),
									subjects: () => page.locator("p.book-attribute").first().textContent(),
									description: () => page.locator("#book-intro-detail").first().textContent(),
									length: () => page.locator(`.book-info em`).first().textContent()
								},
								Record.map(Effect.promise),
								Effect.allWith({concurrency: "unbounded"}),
								Effect.map(
									data =>
										({
											cover: data.cover ? `https:${data.cover}` : undefined,
											title: data.title?.trim(),
											authors: [data.author?.trim()].filter(isNotUndefined),
											subjects: data.subjects?.split("·").map(s => s.trim()) || [],
											description: data.description?.trim(),
											identifiers: {url: request.url},
											languages: "zh-CN",
											length: pipe(data.length, parseChineseNumber, Option.getOrUndefined)
										} as const satisfies Book)
								),
								Effect.tap(book => Queue.offer(queue, book)),
								Effect.asVoid,
								Effect.runPromise
							)
					})
				),
				crawler => Effect.promise(() => crawler.teardown())
			)

			return task =>
				Effect.gen(function* () {
					yield* Effect.promise(() => crawler.addRequests([globalThis.String(task.link)]))
					return Chunk.toArray(yield* Queue.takeAll(queue))
				})
		})
	)
} as const satisfies DataExtractor

/** Chinese unit multipliers */
const multipliers: Record<string, number> = {
	十: 10,
	百: 100,
	千: 1000,
	万: 10000,
	亿: 100000000
}

/**
 * Parse Chinese number string (e.g. "10万") to numeric value.
 *
 * 解析中文数字字符串（如 "10万"）并返回对应数值。
 */
const parseChineseNumber = (input: string | null | undefined): Option.Option<number> =>
	pipe(
		Option.fromNullable(input),
		Option.map(String.trim),
		Option.filter(String.isNonEmpty),
		Option.flatMap(value => {
			const numberPart = parseFloat(value)
			if (Number.isNaN(numberPart)) return Option.none()

			const match = value.match(/[^\d\.\-\+]+$/)
			const suffix = match?.[0].trim() ?? ""

			if (suffix === "") return Option.some(numberPart)

			return pipe(
				Record.get(multipliers, suffix),
				Option.map(multiplier => numberPart * multiplier)
			)
		})
	)
