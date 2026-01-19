// @ts-nocheck TODO

import type {LinkExtractor} from "@ecrawler/worker/interfaces.ts"
import {Effect} from "effect"

export default {
	name: "qidian.com",
	tags: ["qidian.com"],
	role: "link",
	init: () => Effect.succeed(_task => Effect.succeed([]))
} as const satisfies LinkExtractor
