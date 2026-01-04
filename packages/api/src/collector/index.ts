import {HttpApi, OpenApi} from "@effect/platform"
import root from "./groups/root"

export default HttpApi.make("Collector")
	.add(root)
	.annotate(
		OpenApi.Description,
		"The Collector API is responsible for receiving and storing the results of crawl tasks.\n\nCollector API 负责接收和存储抓取任务的结果。"
	)
