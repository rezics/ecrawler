# deployment package

这个包提供一套面向 Linux 服务器的部署工具，不依赖 Effect，全部使用 TypeScript 和 Node.js 原生 API 实现。

## 包含内容

- `src/install-services.ts`：生成并安装 systemd service。
- `src/deploy.ts`：拉取最新 Git 代码、安装依赖并重启服务。
- `scripts/install-services.sh`：安装 service 的 shell 脚本入口。
- `scripts/deploy-latest.sh`：更新并部署的 shell 脚本入口。

## 生成的 service

- `ecrawler-server.service`
- `ecrawler-worker.service`

默认会读取下面两个环境文件：

- `apps/server/.env.production`
- `apps/worker/.env.production`

## 安装 service

先把仓库放到目标机器，例如 `/opt/ecrawler`，然后执行：

```bash
cd /opt/ecrawler
chmod +x libs/deployment/scripts/install-services.sh
sudo ./libs/deployment/scripts/install-services.sh --repo-dir /opt/ecrawler
```

常用参数：

- `--service-prefix ecrawler`
- `--service-user ecrawler`
- `--service-group ecrawler`
- `--systemd-dir /etc/systemd/system`
- `--server-env-file apps/server/.env.production`
- `--worker-env-file apps/worker/.env.production`
- `--start`：安装后立即启动服务
- `--skip-user`：跳过系统用户和用户组创建
- `--skip-enable`：跳过 `systemctl enable`

## 更新并部署

journalctl -u ecrawler-server -n 100 --no-pager
systemctl  restart ecrawler-server

```bash
cd /opt/ecrawler
chmod +x libs/deployment/scripts/deploy-latest.sh
sudo ./libs/deployment/scripts/deploy-latest.sh --repo-dir /opt/ecrawler --branch main
```

部署脚本会执行以下流程：

1. `git fetch` 拉取远端最新代码。
2. `git reset --hard <remote>/<branch>` 同步到目标分支最新提交，并清理未跟踪文件。
3. `corepack yarn install --immutable` 安装依赖。
4. `systemctl restart` 重启两个 service。

常用参数：

- `--remote origin`
- `--branch main`
- `--service-prefix ecrawler`
- `--allow-dirty`
- `--skip-install`
- `--skip-build`：兼容保留参数，当前部署策略下不会触发构建
- `--skip-restart`

## 说明

- 这套脚本假设生产环境通过 `corepack yarn workspace ... run start` 直接启动服务源码入口，不依赖 `dist` 构建产物。
- `deploy-latest.sh` 需要在已经安装过 service 的 Linux 主机上运行。
