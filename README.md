# TongjiStudent MCP Server

`TongjiStudentMCPServer` 是同济校园业务能力的 MCP 服务边界。它面向
`TongjiStudentAgent` 提供受控的校园工具；它不保存对话历史、不调用模型、也不决定
Agent 的工具选择或回答内容。

当前注册 **59 个工具**：42 个同济校园工具、6 个课程/历史评价工具、11 个瑞幸工具。接口覆盖矩阵、身份协议和兼容变化见 [同济 API 迁移](docs/TONGJI_API.md)。CAM 文件保持自动生成。

项目使用 CommonJS 运行时与 TypeScript 的 CommonJS 编译配置；项目内相对导入可省略 `.js` 后缀。

YourTJ 课程调用已迁移至新版五个课程 API；输入参数和输出字段有变更，见 [YourTJ 接入与迁移](docs/YOURTJ.md)。当前完整注册表与 JSON Schema 见 [Tool 目录](docs/TOOLS.md)。

瑞幸提供三个鉴权工具及查店、选品、预览、创建、查单、取消等八个业务工具；全部瑞幸工具要求通过同济认证、OAuth 或 API Key 认证。凭据按认证后的用户 ID 保存至本地 SQLite；完整协议见 [身份认证与 OAuth](docs/AUTH.md)。
CSRF 与登录 Cookie 由手写适配器处理，详见 [瑞幸短信登录工具](docs/LUCKIN.md)。

## 架构边界

```text
Gateway
  → TongjiStudentAgent（身份上下文、会话、编排、工具策略）
  → TongjiStudentMCPServer（认证、Schema、领域聚合、脱敏、审计）
  → 同济开放平台 / 济星云业务接口
```

- 传输：MCP Streamable HTTP，统一端点 `POST /mcp`。
- 状态：服务不分配 MCP 会话 ID；Agent 保持对话状态。瑞幸凭据保存在实例的持久化 SQLite 中，多主机副本不自动共享凭据。
- 身份：`src/auth/` 集中鉴权与工具权限；同济路径验证服务 token 并透传非空 `X-User-Id`，失败不回退。外部路径验证 `Authorization: Bearer <OAuth access_token/API Key>` 并构造内部用户 ID，不使用外部 `X-User-Id`。校园工具只允许同济路径。工具入参不得提供身份或凭据。
- 工具：按任务暴露领域工具，不把开放平台接口逐一暴露为工具。
- 数据：上游响应必须在服务端归一、裁剪与脱敏后再作为 MCP Tool Result 返回。

## 目录

```text
src/
├── config/                    # 监听与开关配置
├── auth/                      # 统一身份认证、工具权限与完整工具配置
├── oauth/                     # 授权码流程、授权页与 OAuth SQLite 存储
├── transport/                 # /mcp 与 HTTP 适配
├── tools/                     # Tool 注册与输入/输出 Schema，按工具名分层（如 tongji/student/cet-score/）
│   ├── registry.ts            # Tool Catalog 注册入口
│   └── tongji/                # tongji.* 工具命名空间
│       ├── student/           # tongji.student.*（如 score/、cet-score/）
│       ├── course/            # tongji.course.*
│       ├── postgraduate/      # tongji.postgraduate.*
│       ├── card/              # tongji.card.*
│       ├── research/          # tongji.research.*
│       ├── teacher/           # tongji.teacher.*
│       ├── campus-tool.ts     # 同济工具的公共注册、校验和响应处理
│       └── user/              # tongji.user.*
├── integration/
│   ├── cam_auto_generated/    # CAM 自动生成的上游 API 客户端
│   ├── luckin_coffee/         # 瑞幸 contract.ts、auth.ts、mcp.ts
│   ├── tongji_openapi/        # adapter.ts 统一认证与请求配置，methods.ts 集中上游方法
│   ├── tongji_poby/           # 济星云适配器
│   └── yourtj/                # YourTJ 适配器 index.ts 与 contract.ts
├── server.ts                  # MCP Server 创建
└── index.ts                   # 进程入口
```

## 本地运行

要求：Node.js 22.13+（使用内置 SQLite）。

```bash
pnpm install
pnpm dev
```

服务优先使用进程环境变量；配置模块也会加载仓库根目录的 `.env`，已有环境变量优先：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ALLOWED_API_KEYS` | `[]` | API Key JSON 数组；空数组禁用 API Key 和 OAuth 授权。 |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `2592000` | OAuth token 有效秒数，`-1` 永久；没有 refresh token。 |
| `MCP_PUBLIC_URL` | 本地服务源地址 | 生产 HTTPS 源地址，不含 `/mcp`。 |
| `APP_PORT` | `3100` | HTTP 监听端口，必须在 `1` 到 `65535` 之间。 |
| `UPSTREAM_TIMEOUT_MS` | `20000` | 单次上游 HTTP 请求超时，单位毫秒，必须为 `1` 到 `2147483647` 之间的整数。 |

所有上游 HTTP 请求统一读取 `UPSTREAM_TIMEOUT_MS`，未配置时默认 20 秒，
包括瑞幸鉴权和业务请求、同济开放平台、济星云及 YourTJ。适配器显式传入的超时优先。
此限制针对单次上游请求，不是整次工具执行时限；登录等工具可能包含多个串行请求。
Agent 不额外设置 MCP HTTP 客户端超时，调用取消或已有 deadline 由请求上下文传递。

例如，修改端口可直接在启动命令前设置：

```bash
APP_PORT=3100 pnpm start
```

服务启动后：

```bash
curl http://localhost:3100/health
```

MCP 客户端本地连接地址可使用 `http://localhost:3100/mcp`。完整工具见 [目录](docs/TOOLS.md)。例如 `tongji.bachelor.score` 查询本科生成绩；`calendarId` 可选，缺省时由同济开放平台查询当前学期。

`/health` 仅用于存活探针；`/mcp` 由 `StreamableHTTPServerTransport` 处理 MCP 请求。服务当前为无状态模式，不会分配 MCP session ID。

### 使用 MCP Inspector 调试工具调用

保持 `pnpm dev` 运行，并在另一个终端启动 MCP Inspector：

```bash
pnpx @modelcontextprotocol/inspector
```

在 Inspector 页面中选择 `Streamable HTTP` 传输方式，并填写 MCP 服务地址：

```text
http://localhost:3100/mcp
```

通过 Inspector 的 `Tools` 页面执行工具发现，确认可看到
`tongji.bachelor.score`。随后选择该工具进行调用：不传参数即可查询当前学期；也可传入
指定学期，例如：

```json
{
  "calendarId": 120
}
```

调用实际同济开放平台接口时，需要在 Inspector 的自定义请求头中增加：

```text
X-Tongji-Access-Token: <service_access_token>
X-User-Id: <本轮用户 userId>
```

Inspector 的 Server Settings → Custom Headers 支持直接配置上述两个请求头。无需配置 OAuth 或动态客户端注册。服务 token 必须由客户端凭据模式申请，不能使用前端用户 token；userId 填实际用户身份。

未提供完整身份时可连接和查看工具列表，调用校园工具返回 `unauthorized`。服务 token 校验失败时返回 HTTP 403 和 `invalid_service_credential`，不触发 Inspector 的 OAuth `/register` 流程；检查 token 是否过期、服务账号身份是否匹配及上游是否可用。不要将有效 token 复制到截图、提交记录或日志中。

### Agent 调用上下文

主仓在每次需要调用同济 OpenAPI 的 MCP Tool 时，必须在 MCP HTTP 请求中传入：

```text
X-Tongji-Access-Token: <service_access_token>
X-User-Id: <本轮用户 userId>
```

本服务验证同济服务凭据后，透传非空用户 ID；个人 API 的 userId 由适配器最后写入，模型参数不能覆盖。外部课程与瑞幸工具也可通过 OAuth 连接，或提供 `Authorization: Bearer <配置的 API Key>`。外部请求无需 `X-User-Id`，身份由入口验证 Bearer 后构造。同济 token 失败不回退。完整流程与配置见 [身份认证与 OAuth](docs/AUTH.md)。

可用校验命令：

```bash
pnpm test
pnpm test:typecheck
pnpm typecheck
pnpm build
# 依次执行以上四项检查
pnpm check
pnpm start
```

## CAM 客户端生成

CAM 配置位于仓库根目录的 `cam.config.json`，生成代码统一写入
`src/integration/cam_auto_generated/`。登录完成并需要同步已配置服务时，执行：

```bash
pnpm cam update
```

生成目录中的文件由 CAM 管理，不应手工编辑。业务层应在手写的
`src/integration/<来源>/index.ts` 适配器中封装、校验和脱敏这些客户端调用。

## 下一步

当前已完成 `tongji.bachelor.score` 业务闭环，并覆盖：调用上下文中的
access token 注入、Fake OpenAPI 契约测试、空数据/上游未授权/上游不可用错误归一，以及结构化脱敏结果。

后续新增校园工具时，应复用相同模式：先在手写适配层封装上游调用，再补齐错误归一、字段白名单与离线测试。`campus.schedule.get_term` 可以作为下一个优先接入的闭环，但不应绕过现有的上下文传递、适配器封装与脱敏约束。

## SDK 选择

项目固定使用 `@modelcontextprotocol/sdk` 1.x。官方 SDK 将 Streamable HTTP 推荐用于远程
服务，而 stdio 适用于本地子进程；SDK v2 仍处于 pre-alpha，因此不作为当前生产基线。
参考 [MCP TypeScript SDK v1 文档](https://ts.sdk.modelcontextprotocol.io/) 和
[官方服务器指南](https://ts.sdk.modelcontextprotocol.io/server)。


### 本地历史教师评价

- `GET /legacy/teacher-reviews?teacher=陈滨`：姓名片段连续子串匹配，去除首尾空白，返回全部 item 的 `content` 字符串数组；无匹配返回 `[]`。缺少姓名、空白姓名、重复参数或超过 100 字符返回 400，非 GET 返回 405，数据库不可用返回 503。
- MCP tool：`tongji.course.legacy-teacher-reviews`，输入 `{"teacher":"陈滨"}`，结构化输出 `{"content":["..."]}`。不需要账号授权。
- 运行数据库：`data/mcp.sqlite`，存储教师评价和瑞幸凭据。数据库不存在时自动创建；评价表为空时从 `seed/teacher-reviews.seed.sqlite` 全量导入教师评价。所有环境均须携带种子库，运行库须可写；发布不得覆盖运行库，瑞幸凭据存储见下节。
- GitLab / Docker 部署使用固定运行库路径 `/app/data/mcp.sqlite`，镜像携带完整种子库，在评价表为空时全量导入（包括此前已部署的空库）。已有非空评价表保持原样，不覆盖修改或删除数据。种子位于 `/app/seed/teacher-reviews.seed.sqlite`，与运行库挂载目录分开；宿主机数据由 Docker 命名卷保留。
- 数据说明见 [历史评价说明](docs/LEGACY_TEACHER_REVIEWS.md)。

## 瑞幸凭据 SQLite

瑞幸凭据保存在 `data/mcp.sqlite` 的 `user_luckin_credentials` 表。启动自动建表，
不依赖远端数据库或数据库环境变量，不迁移旧凭据；切换后用户须重新短信登录。

| 字段 | SQLite 类型 | 含义 |
| --- | --- | --- |
| `user_id` | TEXT PRIMARY KEY NOT NULL | 认证后的用户标识：同济路径为上游 ID，外部路径为 Bearer 凭据 |
| `is_from_tongji` | INTEGER NOT NULL，限制 0/1 | 登录时携带同济 Token 为 true，否则 false；应用层返回 boolean |
| `luckin_token` | TEXT NOT NULL | 瑞幸 Token，不在工具结果中返回 |
| `token_date` / `token_timeout` | INTEGER NOT NULL | 瑞幸原始整数时间字段 |
| `last_verified_at` | INTEGER，可空 | 最近成功验证的 Unix 毫秒时间 |

所有 11 个瑞幸工具都要求认证。同济路径验证同济服务 token 并透传用户 ID；外部路径验证 OAuth token 或 API Key，以 Bearer 凭据本身构造用户 ID。外部 `X-User-Id` 被忽略。来源标志 `is_from_tongji` 仅用于记录，不作为访问控制条件。

登录完成 SQLite 写入后才返回成功；检查成功时按用户和 Token 条件更新验证时间，避免旧检查覆盖并发登录的新 Token。身份失败由统一鉴权拦截；存储故障返回 `credential_store_unavailable`，不得据此自动发短信或重登录。

OAuth 数据库为 `data/oauth.sqlite`。外部 token 过期需重新授权；新 token 是新身份，原瑞幸绑定不会自动继承。API Key 轮换也产生新身份。

部署须持久化 `/app/data`；同一环境的多主机副本不会自动共享本地凭据。
备份应使用 SQLite 一致性备份，不能在运行中只复制主文件而忽略 WAL。
不兼容旧的无凭据或匿名 session ID 调用。

## GitLab CI 部署

现已提供 Dockerfile；main 分支更新自动构建和发布 SIT，PROD 必须手动发布。
部署命令直接维护在 `.gitlab-ci.yml`，包含容器健康检查和失败时恢复旧容器，不执行数据库初始化。
部署到现有 DEVIP / PRODIP，默认对外端口 3100；SQLite 首次从完整种子库初始化，后续发布保留运行数据。
变量设置、服务器前置条件和验收步骤见 [GitLab 部署说明](docs/GITLAB_DEPLOYMENT.md)。
