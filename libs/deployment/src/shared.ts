import {spawnSync} from "node:child_process"
import {mkdirSync, writeFileSync} from "node:fs"
import {dirname} from "node:path"

export type ParsedArgs = {
  readonly flags: ReadonlySet<string>
  readonly values: ReadonlyMap<string, string>
  readonly positionals: readonly string[]
}

export type CommandOptions = {
  readonly cwd?: string
  readonly captureOutput?: boolean
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flags = new Set<string>()
  const values = new Map<string, string>()
  const positionals: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current) continue
    if (!current.startsWith("--")) {
      positionals.push(current)
      continue
    }

    const withoutPrefix = current.slice(2)
    const separatorIndex = withoutPrefix.indexOf("=")
    if (separatorIndex >= 0) {
      const key = withoutPrefix.slice(0, separatorIndex)
      const value = withoutPrefix.slice(separatorIndex + 1)
      values.set(key, value)
      continue
    }

    const next = argv[index + 1]
    if (next && !next.startsWith("--")) {
      values.set(withoutPrefix, next)
      index += 1
      continue
    }

    flags.add(withoutPrefix)
  }

  return {flags, values, positionals}
}

export function getStringArg(parsed: ParsedArgs, key: string, fallback: string): string {
  return parsed.values.get(key) ?? fallback
}

export function hasFlag(parsed: ParsedArgs, key: string): boolean {
  return parsed.flags.has(key)
}

export function writeTextFile(path: string, content: string): void {
  mkdirSync(dirname(path), {recursive: true})
  writeFileSync(path, content, "utf8")
}

export function runCommand(command: string, args: readonly string[], options: CommandOptions = {}): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.captureOutput ? "pipe" : "inherit"
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = typeof result.stderr === "string" ? result.stderr.trim() : ""
    throw new Error(`Command failed: ${command} ${args.join(" ")}${stderr ? `\n${stderr}` : ""}`)
  }

  return typeof result.stdout === "string" ? result.stdout.trim() : ""
}

export function requireLinux(): void {
  if (process.platform !== "linux") {
    throw new Error("These scripts are intended to run on a Linux host.")
  }
}

export function requireRoot(): void {
  if (typeof process.getuid === "function" && process.getuid() !== 0) {
    throw new Error("Run this command as root or with sudo.")
  }
}

export function toSystemdPath(path: string): string {
  return path.replace(/\\/g, "/")
}

export function serviceName(prefix: string, kind: "server" | "worker"): string {
  return `${prefix}-${kind}.service`
}