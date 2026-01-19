import {test} from "../base.ts"

await test(
	[{tags: ["bqgl.cc", "link"], link: "https://www.bqgl.cc/"}],
	["@ecrawler/worker-bqgl-cc/link.ts", "@ecrawler/worker-bqgl-cc/data.ts"]
)
