import {test} from "../base.ts"

await test(
	[{tags: ["bqgl.cc", "link"], link: "https://www.bqgl.cc/"}],
	[
		"@ecrawler/extractor-bqgl-cc/link.ts",
		"@ecrawler/extractor-bqgl-cc/data.ts"
	]
)
