import {test} from "../base.ts"

await test(
  [{tags: ["dummy", "link"], link: "https://example.com"}],
  ["@ecrawler/extractor-dummy/link.ts", "@ecrawler/extractor-dummy/data.ts"]
)
