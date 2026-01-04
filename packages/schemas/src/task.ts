import {Schema} from "effect"

export const Task = Schema.Struct({
	id: Schema.UUID.annotations({
		description: "Unique identifier for the task\n\n任务的唯一标识符"
	}),
	updated_at: Schema.Date.annotations({
		description:
			"Timestamp when the task was last updated\n\n任务最后更新的时间戳"
	}),
	created_at: Schema.Date.annotations({
		description: "Timestamp when the task was created\n\n任务创建的时间戳"
	}),
	tags: Schema.String.pipe(Schema.Array).annotations({
		description:
			"Tags associated with the task for categorization\n\n与任务关联的分类标签"
	}),
	data: Schema.Any.annotations({
		description:
			"Arbitrary data associated with the task\n\n与任务关联的任意数据"
	})
}).annotations({
	identifier: "Task",
	description: "Schema representing a crawl task\n\n表示抓取任务的模式"
})
