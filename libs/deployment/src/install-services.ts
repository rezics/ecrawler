import {resolve} from "node:path"
import {getServiceFilePath, renderServiceUnit} from "./systemd.ts"
import {getStringArg, hasFlag, parseArgs, requireLinux, requireRoot, runCommand, serviceName, writeTextFile} from "./shared.ts"

type InstallOptions = {
  readonly repoDir: string
  readonly systemdDir: string
  readonly servicePrefix: string
  readonly serviceUser: string
  readonly serviceGroup: string
  readonly nodeEnv: string
  readonly nodeBinDir: string
  readonly yarnBinPath: string
  readonly serverEnvFile: string
  readonly workerEnvFile: string
  readonly createUser: boolean
  readonly enableServices: boolean
  readonly startServices: boolean
}

function readOptions(): InstallOptions {
  const parsed = parseArgs(process.argv.slice(2))
  const repoDir = resolve(getStringArg(parsed, "repo-dir", process.cwd()))

  return {
    repoDir,
    systemdDir: resolve(getStringArg(parsed, "systemd-dir", "/etc/systemd/system")),
    servicePrefix: getStringArg(parsed, "service-prefix", "ecrawler"),
    serviceUser: getStringArg(parsed, "service-user", "ecrawler"),
    serviceGroup: getStringArg(parsed, "service-group", "ecrawler"),
    nodeEnv: getStringArg(parsed, "node-env", "production"),
    nodeBinDir: resolve(getStringArg(parsed, "node-bin-dir", "/root/.nvm/versions/node/v24.14.0/bin")),
    yarnBinPath: resolve(getStringArg(parsed, "yarn-bin-path", "/root/.nvm/versions/node/v24.14.0/bin/yarn")),
    serverEnvFile: resolve(repoDir, getStringArg(parsed, "server-env-file", "apps/server/.env.production")),
    workerEnvFile: resolve(repoDir, getStringArg(parsed, "worker-env-file", "apps/worker/.env.production")),
    createUser: !hasFlag(parsed, "skip-user"),
    enableServices: !hasFlag(parsed, "skip-enable"),
    startServices: hasFlag(parsed, "start")
  }
}

function ensureSystemGroup(group: string): void {
  try {
    runCommand("getent", ["group", group], {captureOutput: true})
  } catch {
    runCommand("groupadd", ["--system", group])
  }
}

function ensureSystemUser(user: string, group: string, repoDir: string): void {
  try {
    runCommand("id", ["-u", user], {captureOutput: true})
  } catch {
    runCommand("useradd", ["--system", "--gid", group, "--home-dir", repoDir, "--no-create-home", "--shell", "/usr/sbin/nologin", user])
  }
}

function main(): void {
  requireLinux()
  requireRoot()

  const options = readOptions()
  if (options.createUser) {
    ensureSystemGroup(options.serviceGroup)
    ensureSystemUser(options.serviceUser, options.serviceGroup, options.repoDir)
  }

  const serverUnitPath = getServiceFilePath(options.systemdDir, options.servicePrefix, "server")
  const workerUnitPath = getServiceFilePath(options.systemdDir, options.servicePrefix, "worker")

  writeTextFile(serverUnitPath, renderServiceUnit(options, "server"))
  writeTextFile(workerUnitPath, renderServiceUnit(options, "worker"))

  runCommand("systemctl", ["daemon-reload"])

  const serverService = serviceName(options.servicePrefix, "server")
  const workerService = serviceName(options.servicePrefix, "worker")

  if (options.enableServices) {
    runCommand("systemctl", ["enable", serverService, workerService])
  }

  if (options.startServices) {
    runCommand("systemctl", ["restart", serverService, workerService])
  }

  console.log(`Installed ${serverService} -> ${serverUnitPath}`)
  console.log(`Installed ${workerService} -> ${workerUnitPath}`)
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
}