import {test} from "../base.ts"

await test(
	[{tags: ["dummy", "link"], link: "https://example.com"}],
	["@ecrawler/worker-dummy/link.ts", "@ecrawler/worker-dummy/data.ts"]
)
