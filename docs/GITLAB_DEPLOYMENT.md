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
| `POSTGRES_DSN_SIT` | SIT 服务数据库连接串 |
| `POSTGRES_DSN_PROD` | PROD 服务数据库连接串，单独配置 Railway 生产库 |
| `DEVIP` / `PRODIP` | CI SSH 连接目标 |
| `USER` / `PASSWORD` | CI SSH 用户和密码 |
| `PORT` | CI SSH 端口，例如 10022；不是服务端口 |
| `MCP_HOST_PORT` | CI 配置的宿主机 HTTP 端口，默认 3100，可按环境覆盖 |
| `SSH_KNOWN_HOSTS` | 可选 File 变量，保存经核验的 SSH 主机公钥；未配置时本次作业首次信任新主机 |
| `CI_REGISTRY*` | GitLab 提供的镜像库地址和认证变量 |

**数据库变量是服务配置，其余变量用于 CI 部署，不注入服务。**
CI 根据环境将 `POSTGRES_DSN_SIT` 或 `POSTGRES_DSN_PROD` 映射为容器的 `POSTGRES_DSN`，
保持现有服务读取逻辑不变。每个容器只收到自己的连接串，生产缺少配置即失败，不回退到 SIT。
SSH 变量 `PORT` 不透传，容器监听端口单独固定为 3100。

连接串设为 Masked，关闭变量展开；使用受保护 main 分支时可同时设为 Protected。
DSN 使用单行，不加行末注释，密码中的特殊字符按 URL 编码。仓库不保存真实密码。
SIT 使用现有测试库，PROD 使用目标服务器可达的 Railway 数据库入口及其 TLS 参数。
MCP 不使用 Redis，无需 `REDIS_URL`。

## 镜像和运行

- 镜像标签：`$CI_REGISTRY_IMAGE/mcp:$CI_COMMIT_SHA-$CI_PIPELINE_IID`。
- 容器名：`tongji-student-mcp-sit` / `tongji-student-mcp-prod`。
- 数据卷：`tongji-student-mcp-sit-data` / `tongji-student-mcp-prod-data`。
- 默认访问：`http://<DEVIP 或 PRODIP>:3100/mcp`。
- 健康检查：`http://<IP>:3100/health`。
- SQLite 固定使用 `/app/data/mcp.sqlite`，命名卷挂载 `/app/data`，镜像携带完整的 `/app/seed/teacher-reviews.seed.sqlite`；首次启动或已有评价表为空时全量导入。已有非空评价表不重建、不覆盖，不清除已有数据。种子目录与挂载目录分离，挂载不会遮住种子库。
- 连接串通过临时文件和 SSH 传送，使用 Docker `--env-file` 注入；发布结束删除临时文件和临时 Registry 登录配置。

CI 拉取镜像后保留旧容器，启动新容器并等待健康检查。新容器失败时恢复旧容器；
首次部署无旧容器时删除失败容器，保留数据卷。容器切换会中断在途请求，不承诺零停机。
若作业在切换中被强制终止，服务器可能残留 `*-previous` 容器；下一次发布会停止并提示人工恢复或清理，避免覆盖备份。

## 前置条件

1. Runner 可访问 Docker daemon、GitLab Registry 和依赖下载地址，沿用 chatapp 的 Docker Runner 配置；如需 tag，配置与现有 Runner 一致的 tag。
2. 目标服务器安装 Docker，SSH 用户可以无交互执行 Docker；不再要求安装 Compose。
3. 服务器到数据库与业务上游的网络可用。开放 3100 给调用方；若 SIT/PROD 共用同一主机，配置不同 `MCP_HOST_PORT`。
4. PostgreSQL 必须已具备 `sql/user_luckin_credentials.sql` 定义的表及运行账号的 SELECT / INSERT / UPDATE 权限。
   **流水线和服务均不会自动创建 PostgreSQL 表。** `/health` 只检查 HTTP 存活，不验证数据库。

## 验收和排查

```sh
curl --fail http://<DEVIP>:3100/health
docker logs --tail 100 tongji-student-mcp-sit
docker inspect --format '{{.State.Health.Status}}' tongji-student-mcp-sit
```

用 MCP 客户端连接 `/mcp` 执行 initialize、tools/list；当前工具数为 59。
验证已知教师的评价查询有数据，并确认首次导入记录数与种子一致、容器重建后记录保持。再验证一次带合法身份的只读业务调用。
后续 Agent 配置 `MCP_SERVER_URL=http://<对应环境 IP>:3100/mcp`。
不要删除命名数据卷；也不要在日志中输出容器的完整环境变量。
