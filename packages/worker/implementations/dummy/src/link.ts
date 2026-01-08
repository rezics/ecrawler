import {Effect} from "effect"
import type {LinkExtractor} from "@ecrawler/worker/interfaces"

/**
 * Dummy link extractor for testing purposes.
 *
 * 用于测试目的的虚拟链接提取器。
 */
export default {
	name: "dummy",
	tags: ["dummy"],
	role: "link",
	init: Effect.succeed(task =>
		Effect.gen(function* () {
			yield* Effect.log(`[dummy/link] Processing task: ${task.link}`)
			yield* Effect.sleep("100 millis")
			return [`${task.link}/page/1`, `${task.link}/page/2`]
		})
	)
} as const satisfies LinkExtractor
