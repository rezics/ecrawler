import {Duration, Effect, Random} from "effect"
import type {DataExtractor} from "@ecrawler/worker/interfaces.ts"

/**
 * Dummy data extractor for testing purposes.
 *
 * 用于测试目的的虚拟数据提取器。
 */
export default {
	name: "dummy",
	tags: ["dummy"],
	role: "data",
	init: () =>
		Effect.succeed(task =>
			Effect.gen(function* () {
				yield* Effect.log(`[dummy/data] Processing task: ${task.link}`)
				yield* Effect.sleep(
					Duration.millis(yield* Random.nextIntBetween(200, 500))
				)
				return [
					{
						source: "dummy",
						link: task.link,
						extractedAt: new Date().toISOString()
					}
				]
			})
		)
} as const satisfies DataExtractor
