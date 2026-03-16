import {resolve} from "node:path"
import {
  getStringArg,
  hasFlag,
  parseArgs,
  requireLinux,
  requireRoot,
  runCommand,
  serviceName
} from "./shared.ts"

type DeployOptions = {
  readonly repoDir: string
  readonly remote: string
  readonly branch: string
  readonly servicePrefix: string
  readonly allowDirty: boolean
  readonly skipInstall: boolean
  readonly skipBuild: boolean
  readonly skipRestart: boolean
}

function getCurrentBranch(repoDir: string): string {
  return runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoDir,
    captureOutput: true
  })
}

function readOptions(): DeployOptions {
  const parsed = parseArgs(process.argv.slice(2))
  const repoDir = resolve(getStringArg(parsed, "repo-dir", process.cwd()))
  const branch = parsed.values.get("branch") ?? getCurrentBranch(repoDir)

  return {
    repoDir,
    remote: getStringArg(parsed, "remote", "origin"),
    branch,
    servicePrefix: getStringArg(parsed, "service-prefix", "ecrawler"),
    allowDirty: hasFlag(parsed, "allow-dirty"),
    skipInstall: hasFlag(parsed, "skip-install"),
    skipBuild: hasFlag(parsed, "skip-build"),
    skipRestart: hasFlag(parsed, "skip-restart")
  }
}

function ensureCleanWorktree(repoDir: string): void {
  const status = runCommand("git", ["status", "--porcelain"], {
    cwd: repoDir,
    captureOutput: true
  })
  if (status.length > 0) {
    throw new Error(
      "Working tree is dirty. Commit or stash changes first, or rerun with --allow-dirty."
    )
  }
}

function main(): void {
  requireLinux()
  requireRoot()

  const options = readOptions()
  if (!options.allowDirty) {
    ensureCleanWorktree(options.repoDir)
  }

  runCommand("git", ["fetch", options.remote, options.branch, "--prune"], {
    cwd: options.repoDir
  })

  runCommand(
    "git",
    ["reset", "--hard", `${options.remote}/${options.branch}`],
    {cwd: options.repoDir}
  )

  runCommand("git", ["clean", "-fd"], {cwd: options.repoDir})

  if (!options.skipInstall) {
    runCommand("corepack", ["yarn", "install", "--immutable"], {
      cwd: options.repoDir
    })
  }

  if (options.skipBuild) {
    console.log("Ignoring deprecated --skip-build flag. Deployment no longer runs build steps.")
  }

  if (!options.skipRestart) {
    const serverService = serviceName(options.servicePrefix, "server")
    const workerService = serviceName(options.servicePrefix, "worker")

    runCommand("systemctl", ["daemon-reload"])
    runCommand("systemctl", ["restart", serverService, workerService])

    const serverStatus = runCommand("systemctl", ["is-active", serverService], {
      captureOutput: true
    })
    const workerStatus = runCommand("systemctl", ["is-active", workerService], {
      captureOutput: true
    })

    console.log(`${serverService}: ${serverStatus}`)
    console.log(`${workerService}: ${workerStatus}`)
  }
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
}
