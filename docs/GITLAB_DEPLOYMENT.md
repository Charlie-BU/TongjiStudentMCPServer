# MCP GitLab CI 部署

所有构建、SSH 和 Docker 部署命令均在 `.gitlab-ci.yml` 中；没有额外部署目录、触发脚本或数据库初始化脚本。

## 触发规则

- 仅推送到 `main`（包括合并进入 main）自动创建流水线。
- `build` 构建并推送镜像；Dockerfile 中执行 `pnpm check`。
- `deploy_sit` 自动部署到 `DEVIP`。
- `deploy_prod` 必须手动点击，生产失败不作为允许忽略的失败；未点击时流水线会显示等待手动操作。
- 非 main 分支、MR 流水线、标签和定时任务不触发这份流水线。
- 同一环境通过 `resource_group` 串行发布；建议 GitLab 同时启用防止过时部署。

## 变量用途

变量配置在 MCP 项目或父组中；Agent 项目的变量不会自动继承给 MCP。

| GitLab 变量 | 用途 |
| --- | --- |
| `DEVIP` / `PRODIP` | CI SSH 连接目标 |
| `USER` / `PASSWORD` | CI SSH 用户和密码 |
| `PORT` | CI SSH 端口，例如 10022；不是服务端口 |
| `UPSTREAM_TIMEOUT_MS` | 可选，注入 MCP 容器的上游请求超时（毫秒），默认 `20000`，有效范围 `1` 到 `2147483647` |
| `ALLOWED_API_KEYS` | 必填、按环境配置的 API Key JSON 数组，至少一个 Key 用于 Agent 发现；每个 Key 至少 32 个无空白 ASCII 字符 |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | 默认 `2592000`；永久 token 配置 `-1` |
| `MCP_PUBLIC_URL` | 必填，当前环境的公网 HTTPS 源地址，不含 `/mcp` |
| `CI_REGISTRY*` | GitLab 提供的镜像库地址和认证变量，无需手动配置 |

服务注入固定应用端口 `APP_PORT=3100`、`UPSTREAM_TIMEOUT_MS` 与上述认证变量。认证变量通过权限受限的临时 env 文件传输，部署完成清理；不放入 SSH 命令参数。
SSH 变量 `PORT` 不透传。MCP 仅使用本地 SQLite，无远端数据库配置，也不使用 Redis。

## 镜像和运行

- 镜像标签：`$CI_REGISTRY_IMAGE/mcp:$CI_COMMIT_SHA-$CI_PIPELINE_IID`。
- 容器名：`tongji-student-mcp-sit` / `tongji-student-mcp-prod`。
- 数据卷：`tongji-student-mcp-sit-data` / `tongji-student-mcp-prod-data`。
- 默认访问：`http://<DEVIP 或 PRODIP>:3100/mcp`。
- 健康检查：`http://<IP>:3100/health`。
- SQLite 固定使用 `/app/data/mcp.sqlite`，命名卷挂载 `/app/data`，镜像携带完整的 `/app/seed/teacher-reviews.seed.sqlite`；首次启动或已有评价表为空时全量导入。已有非空评价表不重建、不覆盖，不清除已有数据。种子目录与挂载目录分离，挂载不会遮住种子库。
- Registry 凭据通过临时文件和 SSH 传送；发布结束删除临时文件和临时 Registry 登录配置。
- OAuth 的 `oauth.sqlite` 也保存在同一持久化数据卷。重建数据卷会丢失客户端注册和 OAuth token。瑞幸凭据与教师评价共用 SQLite 数据卷；启动自动建立新凭据表，不迁移旧远端凭据。切换后须重新瑞幸短信登录。

CI 拉取镜像后保留旧容器，启动新容器并等待健康检查。新容器失败时恢复旧容器；
首次部署无旧容器时删除失败容器，保留数据卷。容器切换会中断在途请求，不承诺零停机。
若作业在切换中被强制终止，服务器可能残留 `*-previous` 容器；下一次发布会停止并提示人工恢复或清理，避免覆盖备份。

## 前置条件

1. Runner 可访问 Docker daemon、GitLab Registry 和依赖下载地址，沿用 chatapp 的 Docker Runner 配置；如需 tag，配置与现有 Runner 一致的 tag。
2. 目标服务器安装 Docker，SSH 用户可以无交互执行 Docker；不再要求安装 Compose。
3. 服务器到业务上游的网络可用。宿主机和容器端口均固定为 3100（`3100:3100`）；确保端口空闲并允许调用方访问。SIT/PROD 应部署在不同主机，避免端口冲突。
4. `/app/data` 数据卷须可写并持久化。服务自动初始化 SQLite 表；`/health` 只检查 HTTP 存活，不验证数据库或上游。
5. 每个环境单实例使用自己的卷。多主机副本不会自动共享瑞幸凭据；运行库一致性备份应包含 WAL 状态。

## 验收和排查

其他部署环境可通过 `MCP_DATA_DIR` 指定持久化目录，两个 SQLite 数据库共用该目录。Railway 自动读取 `RAILWAY_VOLUME_MOUNT_PATH`，显式配置的 `MCP_DATA_DIR` 优先且必须位于卷内；Railway 缺少持久卷时拒绝启动。当前 Dockerfile 与 MijiaMCP 一致，默认以 root 运行以写入挂载卷，无需额外设置 `RAILWAY_RUN_UID`。种子库路径不变，已有数据库需自行迁移到新目录。

```sh
curl --fail http://<DEVIP>:3100/health
docker logs --tail 100 tongji-student-mcp-sit
docker inspect --format '{{.State.Health.Status}}' tongji-student-mcp-sit
```

用 MCP 客户端连接 `/mcp` 执行 initialize、tools/list；当前工具数为 59。
验证已知教师的评价查询有数据，并确认首次导入记录数与种子一致、容器重建后记录保持。再验证一次带合法身份的只读业务调用。
后续 Agent 配置 `MCP_SERVER_URL=http://<对应环境 IP>:3100/mcp`。
不要删除命名数据卷；也不要在日志中输出容器的完整环境变量。
