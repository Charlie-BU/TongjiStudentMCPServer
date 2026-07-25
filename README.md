# TongjiStudent MCP Server

`TongjiStudentMCPServer` 是同济校园业务能力的 MCP 服务边界。它面向
`TongjiStudentAgent` 提供受控的校园工具；它不保存对话历史、不调用模型、也不决定
Agent 的工具选择或回答内容。

当前仓库是**可启动的工程骨架**，还没有注册任何业务工具。进程入口不会调用同济开放平台；CAM 自动生成的客户端位于 `src/integration/openapi/`，不能直接作为生产适配器使用。目录中的 `TODO` 注释标明了每一层将来应承担的职责。

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
├── domain/                    # 后续确定性校园业务聚合
├── integration/
│   └── openapi/             # CAM 自动生成的上游 API 客户端
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
| `MCP_AUTH_REQUIRED` | `false` | 设为 `true` 时启用认证边界；当前尚未接入凭证校验器，因此 MCP 请求会被拒绝。 |

例如，修改端口可直接在启动命令前设置：

```bash
PORT=3100 pnpm start
```

服务启动后：

```bash
curl http://127.0.0.1:3000/health/live
```

MCP 客户端连接地址为 `http://127.0.0.1:3000/mcp`。当前 Tool Catalog 为空，这是预期行为。

`/health/live` 仅用于存活探针；`/mcp` 由 `StreamableHTTPServerTransport` 处理 MCP 请求。服务当前为无状态模式，不会分配 MCP session ID。

可用校验命令：

```bash
pnpm typecheck
pnpm build
pnpm start
```

## CAM 客户端生成

CAM 配置位于仓库根目录的 `cam.config.json`，生成代码统一写入
`src/integration/openapi/`。登录完成并需要同步已配置服务时，执行：

```bash
pnpm cam update
```

生成目录中的文件由 CAM 管理，不应手工编辑。业务层应在后续的
`src/integration/tongji-openapi/` 适配器中封装、校验和脱敏这些客户端调用。

## 下一步

首个业务闭环应实现 `campus.schedule.get_today`，并同时完成：可信身份传递、
`schedule:read:self` scope 校验、Fake OpenAPI 契约测试、空数据/超时/未授权错误归一，
以及结构化脱敏结果。通过该闭环前，不批量增加校园工具。

## SDK 选择

项目固定使用 `@modelcontextprotocol/sdk` 1.x。官方 SDK 将 Streamable HTTP 推荐用于远程
服务，而 stdio 适用于本地子进程；SDK v2 仍处于 pre-alpha，因此不作为当前生产基线。
参考 [MCP TypeScript SDK v1 文档](https://ts.sdk.modelcontextprotocol.io/) 和
[官方服务器指南](https://ts.sdk.modelcontextprotocol.io/server)。
