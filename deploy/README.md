# AINPE 自动部署（待部署和验证）

main 分支的 GitHub Actions 构建、测试并发布公开的带提交编号预发布产物。构建作业无写权限，发布作业单独申请 `contents: write`；仓库或组织政策可能禁止此权限，必须实际运行验证。公开仓库的产物也是公开的，不应放入凭据或不适合公开的内容。

服务器的 `poll_release.py` 从公开仓库取得 main 对应的产物，校验文件哈希和产物提交编号，先在独立端口以 ainpe 身份启动并检查，再切换软链接和重启 `ainpe.service`；新进程健康检查失败会尝试恢复旧版本。发布产物将持久化 data 与资料库分别链接到 `/var/lib/ainpe/data` 和 `/var/lib/ainpe/archive`。此机制不需要用户的 SSH 私钥，也不会在 VPS 执行 npm 构建。

本目录仅为准备文件。部署器会使用 GitHub 官方构建证明验签，固定仓库 ID、工作流、main、提交和 GitHub 托管运行环境；证明或策略不匹配时拒绝解压和运行候选服务。校验器通过公开 API 取得证明，gh 在独立配置目录中验证，不使用 GitHub 或 SSH 凭据。公开 CLI 发行包的独立验证已在本机成功，本仓库的实际签发和目标服务器验证仍未完成，不可直接启用自动任务。

服务器需先有可回滚的 `/opt/ainpe/current` 和正常的 `ainpe.service`，并确认目录所有权、网络、内存与权限。部署器与其状态目录必须由 root 控制，不能由网站运行账号修改。恢复记录用于进程中断后先恢复并检查旧站；旧版若缺少版本健康接口，只能检查首页内容与数据接口，无法精确证明旧进程源码身份。部署器自身的更新需要单独审核和安装，网站代码更新不会自动替换它。

## 实际启用前的操作与验证

1. 经审查后将本次 workflow、测试和部署相关源码纳入 main。仓库需允许 GitHub Actions、构建证明与发布，并允许发布作业的 `contents: write`；签发作业另外需要 `id-token: write` 和 `attestations: write`。触发一次 main 工作流，确认 build、attest、publish 全部成功，release 与同一 main SHA 相符。
2. VPS 需要 Python 3、Git、systemd、`/usr/bin/node`、网络和 GitHub CLI 2.102.0 或更新版。将可信安装来源的 gh 放到 root 所有且不可由组或其他用户写入的 `/opt/ainpe/deployer/bin/gh`；将 `poll_release.py`、`release_switch.py`、`verify_attestation.py`、`snappy_raw.py`、`trusted_paths.py` 放到 root 控制的 `/opt/ainpe/deployer/`。预先创建 root:root 0700 的 `/var/lib/ainpe-deployer`，并在其中创建 root:root 0700 的 `attestation-config` 与 `attestation-cache`；部署锁和恢复日志也仅保存在此目录。确认 `/opt/ainpe`、其各级父目录、releases 和 deployer 的所有权与权限满足要求。现有 `/var/lib/ainpe/data` 和 `/var/lib/ainpe/archive` 仍归网站账号使用，不作为 root 部署状态目录。
3. 测试阶段使用隔离服务与测试 release，先检查可访问 GitHub API、GitHub release 及其 attestation blob 和 Sigstore 公共信任服务，量测 gh 在 VPS 的内存占用。用真实仓库产物确认正确身份成功，错误提交、错误工作流、未签名包及损坏包均失败。再验证进程中断恢复、回滚后健康和 data／资料库持久化。
4. 完成上述测试并核实没有影响其他网站后，才在目标环境受控安装所附 systemd service / timer。部署器自身的更新需要单独审核和安装，网站代码更新不会自动替换它。

本地验证：先运行 `npm run build`，再运行 `python3 tests/deploy-release.test.py`、`python3 tests/deploy-pipeline.test.py`、`python3 tests/deploy-attestation.test.py` 和 `node --test tests/production-server.test.mjs`。本地模拟测试不等于 GitHub Actions 已获写权限，也不等于 VPS 已启用定时部署。每日生财数据同步是另一项任务，本机制不负责授权或数据采集。
