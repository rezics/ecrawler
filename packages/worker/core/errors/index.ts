import {Data} from "effect"

// 代理连接失败，需要更换代理重试
export class ProxyError extends Data.TaggedError("ProxyError")<{
	readonly message: string
}> {}

// 遇到验证码无法解决，需要更换代理重试
export class CaptchaError extends Data.TaggedError("CaptchaError")<{
	readonly message: string
}> {}

// 请求被限流，需要等待后重试
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
	readonly message: string
	readonly retryAfterMs?: number
}> {}

// 目标页面不存在或无效
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly message: string
}> {}

// 内部错误，不应重试
export class InternalError extends Data.TaggedError("InternalError")<{
	readonly message: string
}> {}

export type WorkerError =
	| ProxyError
	| CaptchaError
	| RateLimitError
	| NotFoundError
	| InternalError
