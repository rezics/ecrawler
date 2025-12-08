import {Match} from "effect"
import type {WorkerError} from "../errors/index.ts"

export type ErrorHandlingResult = {
	readonly shouldRetry: boolean
	readonly message: string
	readonly delayMs: number
}

export const handleWorkerError = (
	error: WorkerError,
	retryCount: number,
	maxRetries: number
): ErrorHandlingResult =>
	Match.value(error).pipe(
		Match.tag("ProxyError", e => ({
			shouldRetry: retryCount < maxRetries,
			message: `Proxy error: ${e.message}`,
			delayMs: 1000
		})),
		Match.tag("CaptchaError", e => ({
			shouldRetry: retryCount < maxRetries,
			message: `Captcha error: ${e.message}`,
			delayMs: 2000
		})),
		Match.tag("RateLimitError", e => ({
			shouldRetry: retryCount < maxRetries,
			message: `Rate limit: ${e.message}`,
			delayMs: e.retryAfterMs ?? 5000
		})),
		Match.tag("NotFoundError", e => ({
			shouldRetry: false,
			message: `Not found: ${e.message}`,
			delayMs: 0
		})),
		Match.tag("InternalError", e => ({
			shouldRetry: false,
			message: `Internal error: ${e.message}`,
			delayMs: 0
		})),
		Match.exhaustive
	)
