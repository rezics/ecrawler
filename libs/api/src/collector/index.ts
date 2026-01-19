import {HttpApi, OpenApi} from "@effect/platform"
import root from "./groups/root.ts"
// import util from "@ecrawler/core/api/util.ts"

export const Collector = HttpApi.make("Collector")
  // .add(util)
  .add(root)
  .annotate(
    OpenApi.Description,
    "The Collector API is responsible for receiving and storing the results of crawl tasks.\n\nCollector API 负责接收和存储抓取任务的结果。"
  )

export default Collector
export * from "./groups/root.ts"
