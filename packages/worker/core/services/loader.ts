import {Effect} from "effect"
import * as fs from "node:fs"
import * as path from "node:path"

export class ModuleLoaderError extends Error {
	readonly _tag = "ModuleLoaderError"
	constructor(message: string) {
		super(message)
	}
}

export type ModuleWithId = {
	readonly id: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly fn: (...args: any[]) => Effect.Effect<any, any, any>
}

/**
 * 创建一个通用的模块加载器工厂
 * @param name 加载器名称，用于日志
 * @param dirname 当前模块的 dirname (import.meta.dirname)
 * @param implementsPath 相对于 dirname 的 implements 目录路径
 */
export const createModuleLoader = <T extends ModuleWithId>(
	name: string,
	dirname: string,
	implementsPath: string = "../implements"
) =>
	Effect.gen(function* () {
		const modules = new Map<string, T>()

		const loadModules = Effect.gen(function* () {
			const implementsDir = path.resolve(dirname, implementsPath)

			if (!fs.existsSync(implementsDir)) {
				yield* Effect.logWarning(
					`[${name}] Implements directory not found: ${implementsDir}`
				)
				return
			}

			const files = fs
				.readdirSync(implementsDir)
				.filter(f => f.endsWith(".ts") || f.endsWith(".js"))

			for (const file of files) {
				const filePath = path.join(implementsDir, file)
				try {
					const module = yield* Effect.tryPromise({
						try: () => import(filePath),
						catch: e =>
							new ModuleLoaderError(
								`[${name}] Failed to load module from ${file}: ${e}`
							)
					})

					if (
						module.default &&
						typeof module.default === "object" &&
						"id" in module.default &&
						"fn" in module.default
					) {
						const loadedModule = module.default as T
						modules.set(loadedModule.id, loadedModule)
						yield* Effect.logInfo(
							`[${name}] Loaded module: ${loadedModule.id}`
						)
					} else {
						yield* Effect.logWarning(
							`[${name}] Invalid module: ${file}`
						)
					}
				} catch (e) {
					yield* Effect.logError(
						`[${name}] Error loading module ${file}: ${e}`
					)
				}
			}

			yield* Effect.logInfo(`[${name}] Loaded ${modules.size} modules`)
		})

		yield* loadModules

		return {
			get: (id: string): T | undefined => modules.get(id),
			getAll: (): readonly T[] => Array.from(modules.values()),
			getIds: (): readonly string[] => Array.from(modules.keys()),
			has: (id: string): boolean => modules.has(id)
		}
	})

export type ModuleLoader<T extends ModuleWithId> = Effect.Effect.Success<
	ReturnType<typeof createModuleLoader<T>>
>
