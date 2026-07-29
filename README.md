# TongjiStudent MCP Server

`TongjiStudentMCPServer` 是同济校园业务能力的 MCP 服务边界。它面向
`TongjiStudentAgent` 提供受控的校园工具；它不保存对话历史、不调用模型、也不决定
Agent 的工具选择或回答内容。

当前仓库是**可启动且已接入首个业务工具的 MCP 服务**。当前已注册
`tongji.student.score`，用于查询本科生指定学期的成绩。进程入口不会直接调用同济开放平台；手写适配器位于 `src/integration/*.ts`，CAM 自动生成的客户端位于 `src/integration/openapi/`，不能直接作为生产适配器使用。

项目使用 CommonJS 运行时与 TypeScript 的 CommonJS 编译配置；项目内相对导入可省略 `.js` 后缀。

## 架构边界

```text
Gateway
  → TongjiStudentAgent（身份上下文、会话、编排、工具策略）
  → TongjiStudentMCPServer（认证、Schema、领域聚合、脱敏、审计）
  → 同济开放平台 / 济星云业务接口
```

- 传输：MCP Streamable HTTP，统一端点 `POST /mcp`。
- 状态：服务使用无 MCP 会话业务状态的模式；Agent 保持会话状态，因此 MCP 服务可水平扩容。
- 身份：未来仅接受 Agent 签发且 MCP 验证过的短期下游凭证。工具参数中的学号、用户 ID、学院或角色不可信。
- 工具：按任务暴露领域工具，不把开放平台接口逐一暴露为工具。
- 数据：上游响应必须在服务端归一、裁剪与脱敏后再作为 MCP Tool Result 返回。

## 目录

```text
src/
├── config/                    # 监听与开关配置
├── transport/                 # /mcp、认证边界与 HTTP 适配
├── tools/                     # Tool 注册与输入/输出 Schema
│   ├── registry.ts            # Tool Catalog 注册入口
│   └── undergraduate-score/   # 本科生成绩查询工具
├── domain/                    # 后续确定性校园业务聚合
├── integration/
│   ├── openapi/               # CAM 自动生成的上游 API 客户端
│   ├── tongji_openapi.ts      # 同济开放平台手写适配器
│   ├── tongji_poby.ts         # 济星云手写适配器边界
│   ├── yourtj.ts              # YourTJ 手写适配器边界
│   └── test.ts                # 受控人工验证示例
├── privacy/                   # 后续字段白名单与脱敏策略
├── observability/             # 后续日志、Trace、指标
├── server.ts                  # MCP Server 创建
└── index.ts                   # 进程入口
```

## 本地运行

要求：Node.js 20+。

```bash
pnpm install
pnpm dev
```

当前服务直接读取进程环境变量，不加载 `.env` 文件：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | HTTP 监听地址。 |
| `PORT` | `3000` | HTTP 监听端口，必须在 `1` 到 `65535` 之间。 |

例如，修改端口可直接在启动命令前设置：

```bash
PORT=3100 pnpm start
```

服务启动后：

```bash
curl http://127.0.0.1:3000/health
```

MCP 客户端连接地址为 `http://127.0.0.1:3000/mcp`。当前提供的工具为 `tongji.student.score`，用于查询本科生指定学期的成绩；`calendarId` 可选，缺省时由同济开放平台查询当前学期。

`/health` 仅用于存活探针；`/mcp` 由 `StreamableHTTPServerTransport` 处理 MCP 请求。服务当前为无状态模式，不会分配 MCP session ID。

### 使用 MCP Inspector 调试工具调用

保持 `pnpm dev` 运行，并在另一个终端启动 MCP Inspector：

```bash
npx @modelcontextprotocol/inspector
```

在 Inspector 页面中选择 `Streamable HTTP` 传输方式，并填写 MCP 服务地址：

```text
http://127.0.0.1:3000/mcp
```

通过 Inspector 的 `Tools` 页面执行工具发现，确认可看到
`tongji.student.score`。随后选择该工具进行调用：不传参数即可查询当前学期；也可传入
指定学期，例如：

```json
{
  "calendarId": "2025-2026-1"
}
```

调用实际同济开放平台接口时，需要在 Inspector 的自定义请求头中增加：

```text
X-Tongji-Access-Token: <access_token>
```

未提供 token 时，工具会返回 `unauthorized`；授权失效或上游服务不可用时，也会在工具
结果中返回对应的结构化错误。不要将有效 token 复制到截图、提交记录或日志中。

### Agent 调用上下文

主仓在每次需要调用同济 OpenAPI 的 MCP Tool 时，必须在 MCP HTTP 请求中传入：

```text
X-Tongji-Access-Token: <access_token>
```

本服务将该值放入仅供服务端使用的 Tool 调用上下文，供后续 OpenAPI 适配层传递给上游接口。服务不对 token 进行独立鉴权或持久化，且 token 不得出现在 Tool Schema、Tool Result 或日志中。

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
`src/integration/openapi/`。登录完成并需要同步已配置服务时，执行：

```bash
pnpm cam update
```

生成目录中的文件由 CAM 管理，不应手工编辑。业务层应在手写的
`src/integration/*.ts` 适配器中封装、校验和脱敏这些客户端调用。

## 下一步

当前已完成 `tongji.student.score` 业务闭环，并覆盖：调用上下文中的
access token 注入、Fake OpenAPI 契约测试、空数据/上游未授权/上游不可用错误归一，以及结构化脱敏结果。

后续新增校园工具时，应复用相同模式：先在手写适配层封装上游调用，再补齐错误归一、字段白名单与离线测试。`campus.schedule.get_term` 可以作为下一个优先接入的闭环，但不应绕过现有的上下文传递、适配器封装与脱敏约束。

## SDK 选择

项目固定使用 `@modelcontextprotocol/sdk` 1.x。官方 SDK 将 Streamable HTTP 推荐用于远程
服务，而 stdio 适用于本地子进程；SDK v2 仍处于 pre-alpha，因此不作为当前生产基线。
参考 [MCP TypeScript SDK v1 文档](https://ts.sdk.modelcontextprotocol.io/) 和
[官方服务器指南](https://ts.sdk.modelcontextprotocol.io/server)。
