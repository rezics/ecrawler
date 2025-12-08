// Errors
export {
	ProxyError,
	CaptchaError,
	RateLimitError,
	NotFoundError,
	InternalError,
	type WorkerError
} from "./errors/index.ts"

// Services
export {
	ProxyClient,
	ProxyClientError,
	ProxyClientMock
} from "./services/proxy.ts"

export {
	WorkerIdConfig,
	DispatcherUrlConfig,
	ProxyUrlConfig,
	TagsConfig,
	MaxRetriesConfig,
	PollIntervalMsConfig,
	type BaseWorkerConfig
} from "./services/config.ts"

export {handleWorkerError, type ErrorHandlingResult} from "./services/errors.ts"

export {
	createModuleLoader,
	ModuleLoaderError,
	type ModuleWithId,
	type ModuleLoader
} from "./services/loader.ts"
