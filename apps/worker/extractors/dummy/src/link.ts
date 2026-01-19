import {Array, Duration, Effect, Random} from "effect"
import type {LinkExtractor} from "@ecrawler/worker/interfaces.ts"
import {faker} from "@faker-js/faker"

/**
 * Dummy link extractor for testing purposes.
 *
 * 用于测试目的的虚拟链接提取器。
 */
export default {
	name: "dummy",
	tags: ["dummy"],
	role: "link",
	init: () =>
		Effect.succeed(task =>
			Effect.gen(function* () {
				yield* Effect.log(`[dummy/link] Processing task: ${task.link}`)
				yield* Effect.sleep(
					Duration.millis(yield* Random.nextIntBetween(100, 1000))
				)
				return Array.makeBy(
					yield* Random.nextIntBetween(1, 30),
					() => `https://www.dummy.com/book/${faker.book.title()}`
				)
			})
		)
} as const satisfies LinkExtractor
