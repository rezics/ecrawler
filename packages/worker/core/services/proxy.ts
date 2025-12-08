import {Effect, Context, Layer} from "effect"

export class ProxyClientError extends Error {
	readonly _tag = "ProxyClientError"
	constructor(message: string) {
		super(message)
	}
}

export class ProxyClient extends Context.Tag("ProxyClient")<
	ProxyClient,
	{
		// 获取一个新的代理 URL
		readonly getProxy: () => Effect.Effect<string, ProxyClientError>
		// 报告代理失败，以便后续获取时跳过该代理
		readonly reportFailure: (proxyUrl: string) => Effect.Effect<void>
		// 报告代理成功，可用于统计或优先级调整
		readonly reportSuccess: (proxyUrl: string) => Effect.Effect<void>
	}
>() {}

// Mock 实现，永远返回 http://localhost:7890
export const ProxyClientMock = Layer.succeed(ProxyClient, {
	getProxy: () => Effect.succeed("http://localhost:7890"),
	reportFailure: () => Effect.void,
	reportSuccess: () => Effect.void
})
