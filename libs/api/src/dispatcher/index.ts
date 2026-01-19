import {HttpApi, OpenApi} from "@effect/platform"
import root from "./groups/root"

export default HttpApi.make("Dispatcher")
  .add(root)
  .annotate(
    OpenApi.Description,
    "The Dispatcher API manages the crawl task queue and distributes tasks to workers.\n\nDispatcher API 管理抓取任务队列并将任务分配给工作节点。"
  )
