## CHANGELOG - 2026-07-25 15:22 - 统一 CAM OpenAPI 客户端输出并收敛 YourTJ 契约

### 撰写时间

- 2026-07-25 15:22

### Base Commit

- 9ffa4c6aa629a87911651c67a869e76a31ec53d0

### Compare Scope

- working_tree_only

### 背景与改动目标

- 第一版骨架把 CAM 生成结果直接放在 `src/integration/` 下，`tongji_openapi`、`tongji_poby` 和 `yourtj` 与人工维护的适配层混在一起。生成器再次执行时，文件归属、删除范围和业务封装边界都不够清楚。
- 这次不增加 MCP 工具，而是先把生成层收敛到单独目录，并更新 YourTJ 的 OpenAPI 契约。这样后续实现校园工具时，才能在生成代码之外明确放置认证、请求校验、错误归一与脱敏逻辑。

### 改动概览

- `cam.config.json` 的 `outDir` 改为 `src/integration/openapi`，并将 `cam-fe-code-generator` 升级至 `1.9.0`；`package.json` 增加 `pnpm cam` 命令，README 说明使用 `pnpm cam update` 同步已配置服务。
- 删除旧的 `src/integration/{tongji_openapi,tongji_poby,yourtj}` 生成目录，以及会在模块加载时发起请求的旧 `request-demo.ts`。
- 在新目录重新生成 `tongji_openapi`、`tongji_poby` 与 `yourtj` 客户端。YourTJ 客户端使用新的课程、学期、年级与专业查询 Schema，返回值从无类型 `any` 收敛为 CAM 生成的响应类型。
- 新增 `src/integration/test.ts` 作为人工验证生成客户端的独立示例，README 同步说明 CAM 输出不可直接作为生产适配器。

### 关键链路解析（含上下游）

- 上游依赖：`cam.config.json` 中的服务标识仍由 CAM 管理；`pnpm cam update` 读取该配置并将生成产物写入新的 `openapi` 目录。升级后的生成器是这些客户端文件和 Schema 的唯一来源。
- 当前改动：业务代码后续应从 `src/integration/openapi/<service>/` 导入生成类型和请求方法，再在独立适配器层注入可信身份、base URL、超时、错误处理和字段白名单。生成代码继续保留 `DO NOT EDIT` 标记，避免手工修改在下一次同步时丢失。
- 下游影响：现有 MCP 入口和工具目录没有导入旧客户端，因此迁移不会改变当前空 Tool Catalog 的运行行为。后续 `TongjiStudentAgent` 连接 MCP 服务时，仍只会看到显式注册的领域工具，而不会直接暴露 OpenAPI 方法。

### 改动结果与业务影响

- 生成代码与手写 integration 代码现在有明确目录边界，重新生成时不会覆盖未来的生产适配器。
- README 提供了 CAM 同步入口，并说明 `src/integration/openapi/` 仅是上游协议客户端，不承担生产环境的认证、脱敏或业务聚合。
- 当前没有新增正式 MCP Tool，也没有让进程入口调用同济开放平台；变更主要影响后续开发时的客户端生成和导入路径。

### 风险与待办

- `src/integration/test.ts` 仍会在被直接执行时访问 YourTJ 并打印结果，只能作为受控人工验证示例，不能被服务入口、工具实现或自动化测试导入。正式适配器应使用 fake HTTP 契约测试，不读取或输出真实学生数据。
- CAM 生成结果仍包含宽泛的 `any`、上游参数和敏感字段定义；在接入任何 MCP Tool 前，必须在手写适配器中限制请求参数、检查可信身份和 scope，并对白名单字段做脱敏。
- 本次未执行真实 CAM 同步或上游 API 调用验证。提交前至少应执行 `pnpm typecheck` 和 `pnpm build`，并在受控环境确认 `pnpm cam update` 不会产生非预期的生成差异。

### 建议 Commit Message（git-cz）

- `chore(openapi): consolidate CAM generated clients`

## CHANGELOG - 2026-07-25 02:28 - 建立同济校园能力 MCP Streamable HTTP 骨架

### 撰写时间

- 2026-07-25 02:28

### Base Commit

- 36ba4c7cb571e411fdbbf03e5989c5d47f2dc45a

### Compare Scope

- working_tree_only

### 背景与改动目标

- 同济校园能力此前没有独立的 MCP 服务边界。若直接让 Agent 调用开放平台接口，身份、scope、输入 Schema、字段脱敏与审计会散落在编排层，后续很难保证学生数据只按最小权限暴露。
- 因此这次先落一个可以启动、但不预置业务工具的 TypeScript 骨架。目标不是抢先暴露校园接口，而是固定 `Agent -> MCP -> 上游平台` 的边界，为后续按领域接入工具保留认证、归一化和隐私处理位置。

### 改动概览

- 新增 Node.js 20+、TypeScript CommonJS 与 pnpm 工程配置，固定 `@modelcontextprotocol/sdk` 1.x，并提供 `typecheck`、`build`、`dev` 和 `start` 命令。
- 新增 `createHttpServer`、`createMcpServer` 与空的 `registerTools` 入口。HTTP 服务提供 `/health/live` 和无状态的 `/mcp` Streamable HTTP 端点；每个请求创建独立 transport 和 MCP server，不保存业务会话。
- 新增 `ServerConfig` 与 `MCP_AUTH_REQUIRED` 边界。当前认证打开但未配置 verifier 时会拒绝 MCP 请求，避免把“尚未验证的调用方”误当成可信身份。
- 使用 CAM 生成 `tongji_openapi`、`tongji_poby`、`yourtj` 的类型客户端，作为后续 integration adapter 的输入；README 同步为真实的进程环境变量、端点与无状态边界说明。

### 关键链路解析（含上下游）

- 上游依赖：`src/index.ts` 读取 `HOST`、`PORT` 和 `MCP_AUTH_REQUIRED` 后创建 Node HTTP server；`StreamableHTTPServerTransport` 负责 MCP 协议解析，`McpServer` 负责承载注册后的工具目录。
- 当前改动：请求先经过 `authenticateCaller` 的可信调用方边界，再读取受 1 MiB 限制的 JSON body，随后连接无 session ID 的 transport。`registerTools` 目前为空，因此服务没有访问同济开放平台或返回个人数据的路径。
- 下游影响：`TongjiStudentAgent` 后续可通过 `/mcp` 连接并按 MCP 协议发现工具。真实校园数据能力应在 `tools` 中定义输入输出 Schema，在 `domain` 聚合业务，在 `integration` 调用上游，并在 `privacy` 与 `observability` 层完成脱敏和元数据观测。

### 改动结果与业务影响

- 当前骨架能完成 TypeScript 类型检查和 CommonJS 构建；SDK 的 `streamableHttp.js` 子路径已显式使用 `.js` 后缀，避免 CommonJS 运行时的 package exports 解析失败。
- README 不再要求复制不存在且不会被读取的 `.env.example`，改为列出实际由进程读取的环境变量和认证开关的当前行为。
- 已执行 `pnpm typecheck`、`pnpm build` 和 `git diff --check HEAD`。沙箱内监听 `127.0.0.1:3000` 被权限策略拒绝；在获批环境中启动命令不再出现 SDK 子路径加载错误，但仍需要在真实本地或部署环境完成 `/health/live` 与 MCP initialize 冒烟验证。

### 风险与待办

- `src/integration/request-demo.ts` 在被导入时仍会执行真实请求并输出响应。该项按 `WL-20260725-001` 临时豁免至 2026-08-25；首个正式工具接入前应移除顶层执行，改为 fake HTTP 契约测试。
- 当前没有 TypeScript 测试基座，也未覆盖健康检查、MCP 初始化、认证拒绝、非法 JSON 或请求体上限。该项按 `WL-20260725-002` 临时豁免至 2026-08-25；过期前必须补齐最小 HTTP/MCP 回归测试。
- 当前没有凭证 verifier、业务工具或个人数据脱敏实现。`MCP_AUTH_REQUIRED=true` 只能作为拒绝保护，不能代替正式认证；在接入任何校园数据之前必须完成身份、scope 和脱敏链路。

### 建议 Commit Message（git-cz）

- `feat(mcp): scaffold stateless campus MCP server`
