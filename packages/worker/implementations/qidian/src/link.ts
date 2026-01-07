// @ts-nocheck TODO

import type {LinkExtractor} from "@ecrawler/worker/interfaces"
import {Effect} from "effect"

export default {
	name: "qidian.com",
	tags: ["qidian.com"],
	role: "link",
	init: Effect.scoped(
		Effect.gen(function* () {
			return task => Effect.gen(function* () {})
		})
	)
} as const satisfies LinkExtractor
