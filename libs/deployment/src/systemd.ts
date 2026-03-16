import {resolve} from "node:path"
import {serviceName, toSystemdPath} from "./shared.ts"

export type ServiceKind = "server" | "worker"

export type ServiceTemplateOptions = {
  readonly repoDir: string
  readonly servicePrefix: string
  readonly serviceUser: string
  readonly serviceGroup: string
  readonly nodeEnv: string
  readonly serverEnvFile: string
  readonly workerEnvFile: string
}

export function getServiceFilePath(systemdDir: string, servicePrefix: string, kind: ServiceKind): string {
  return resolve(systemdDir, serviceName(servicePrefix, kind))
}

export function renderServiceUnit(options: ServiceTemplateOptions, kind: ServiceKind): string {
  const repoDir = toSystemdPath(resolve(options.repoDir))
  const envFile = toSystemdPath(resolve(kind === "server" ? options.serverEnvFile : options.workerEnvFile))
  const description = kind === "server" ? "ecrawler server" : "ecrawler worker"
  const workspace = kind === "server" ? "@ecrawler/server" : "@ecrawler/worker"
  const extraUnitDependencies =
    kind === "worker"
      ? `After=network-online.target ${serviceName(options.servicePrefix, "server")}\nWants=network-online.target ${serviceName(options.servicePrefix, "server")}`
      : "After=network-online.target\nWants=network-online.target"

  return [
    "[Unit]",
    `Description=${description}`,
    extraUnitDependencies,
    "",
    "[Service]",
    "Type=simple",
    `User=${options.serviceUser}`,
    `Group=${options.serviceGroup}`,
    `WorkingDirectory=${repoDir}`,
    `Environment=NODE_ENV=${options.nodeEnv}`,
    `EnvironmentFile=${envFile}`,
    `ExecStart=/usr/bin/env corepack yarn workspace ${workspace} run start`,
    "Restart=always",
    "RestartSec=5",
    "KillSignal=SIGINT",
    "TimeoutStopSec=30",
    "StandardOutput=journal",
    "StandardError=journal",
    "",
    "[Install]",
    "WantedBy=multi-user.target",
    ""
  ].join("\n")
}
