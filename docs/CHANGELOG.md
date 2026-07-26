## CHANGELOG - 2026-07-26 12:55 - 将校园 access token 收敛为单次 MCP 工具调用上下文

### 撰写时间

- 2026-07-26 12:55

### Base Commit

- b21eff1f9caec84f30a8f8b0da1c74b7d22a1929

### Compare Scope

- working_tree_only

### 背景与改动目标

- MCP 服务即将开始调用同济 OpenAPI，但工具参数不能承担 access token：把凭据放进 Schema 会让 Agent、模型和 Tool Result 都有机会看到它，也会使每个工具重复处理同一份传递逻辑。
- 因此这次把 token 传递约束成主仓到 MCP 的部署内调用上下文。MCP 服务不保存 token、不把它映射为用户身份，也不单独做校园 token 鉴权；它只把主仓提供的短期 bearer token 交给当前请求创建的 Tool 实例使用。

### 改动概览

- 新增 `src/transport/invocation-context.ts`。`readToolInvocationContext` 读取单值 `X-Tongji-Access-Token`，会丢弃重复 header，并在空白值时返回空上下文。
- `createHttpServer` 在创建无状态 `StreamableHTTPServerTransport` 和 `McpServer` 前构造调用上下文，再通过 `ToolRegistrationContext` 传入 `registerTools`。每个 HTTP 请求独立创建上下文，不产生 MCP session ID 或跨请求 token 缓存。
- 删除尚未有 verifier 实现的 `auth.ts` 与 `MCP_AUTH_REQUIRED` 配置，HTTP 存活探针统一为 `GET /health`；README 说明请求头名称、用途以及 token 不得进入 Tool Schema、Tool Result 或日志的约束。
- 新增 CAM 生成目录的只读规则，禁止在生成客户端中注入 token、身份、脱敏或业务逻辑，要求后续适配器在生成层之外消费调用上下文。

### 关键链路解析（含上下游）

- 上游依赖：`TongjiStudentAgent` 在需要校园数据的 MCP 请求中注入 `X-Tongji-Access-Token`。该设计依赖主仓与 MCP 服务处于可信部署边界；token 的签发、用户绑定和有效期仍由主仓及同济开放平台负责。
- 当前改动：`src/transport/http.ts` 从 HTTP headers 创建 `ToolInvocationContext`，随后调用 `createMcpServer({ invocation })`；`src/tools/registry.ts` 将同一上下文交给后续注册的领域工具。生成的 OpenAPI 客户端不直接接触 HTTP headers。
- 下游影响：后续 OpenAPI adapter 可以从 Tool 调用上下文读取 token 并设置上游 Authorization header，而不需要扩大 Tool 输入协议。当前 Tool Catalog 仍为空，因此本次没有触发真实校园数据调用。

### 改动结果与业务影响

- 当前 token 的生命周期被限制在单个 MCP HTTP 请求及其创建的 Tool 实例内，避免了包级缓存、会话存储和模型可见参数。
- 删除未实现的认证开关后，运行配置只保留监听地址和端口；`/health` 与 `/mcp` 的路径在 README 和历史 changelog 中同步为实际行为。
- 已执行 `pnpm typecheck`、`pnpm build` 与 `git diff --check HEAD`。离线 header 解析验证确认单值会进入调用上下文，重复 header 会被忽略；当前仍没有 TypeScript 自动化测试基座。

### 风险与待办

- 主仓注入 bearer token 而 MCP 不独立验证的设计按 `WL-20260726-001` 临时豁免至 2026-08-26。该豁免仅适用于可信部署边界；若 MCP 改为可被非主仓直接访问，必须先引入受认证的服务间传输或签名短期凭据。
- 调用上下文的正常、缺失、空白和重复 header 分支尚未有自动化测试；旧的骨架测试缺口按 `WL-20260725-002` 继续豁免至 2026-08-25。首个正式校园工具接入时必须补齐 HTTP/MCP 契约测试。
- token 只解决上游调用凭据传递，不替代参数 ownership、scope 限制和响应脱敏。领域工具接入时仍需禁止用户通过工具参数指定他人学号、身份证号或其他身份字段。

### 建议 Commit Message（git-cz）

- `feat(transport): pass campus token through tool context`

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
- 新增 `createHttpServer`、`createMcpServer` 与空的 `registerTools` 入口。HTTP 服务提供 `/health` 和无状态的 `/mcp` Streamable HTTP 端点；每个请求创建独立 transport 和 MCP server，不保存业务会话。
- 新增 `ServerConfig` 与 `MCP_AUTH_REQUIRED` 边界。当前认证打开但未配置 verifier 时会拒绝 MCP 请求，避免把“尚未验证的调用方”误当成可信身份。
- 使用 CAM 生成 `tongji_openapi`、`tongji_poby`、`yourtj` 的类型客户端，作为后续 integration adapter 的输入；README 同步为真实的进程环境变量、端点与无状态边界说明。

### 关键链路解析（含上下游）

- 上游依赖：`src/index.ts` 读取 `HOST`、`PORT` 和 `MCP_AUTH_REQUIRED` 后创建 Node HTTP server；`StreamableHTTPServerTransport` 负责 MCP 协议解析，`McpServer` 负责承载注册后的工具目录。
- 当前改动：请求先经过 `authenticateCaller` 的可信调用方边界，再读取受 1 MiB 限制的 JSON body，随后连接无 session ID 的 transport。`registerTools` 目前为空，因此服务没有访问同济开放平台或返回个人数据的路径。
- 下游影响：`TongjiStudentAgent` 后续可通过 `/mcp` 连接并按 MCP 协议发现工具。真实校园数据能力应在 `tools` 中定义输入输出 Schema，在 `domain` 聚合业务，在 `integration` 调用上游，并在 `privacy` 与 `observability` 层完成脱敏和元数据观测。

### 改动结果与业务影响

- 当前骨架能完成 TypeScript 类型检查和 CommonJS 构建；SDK 的 `streamableHttp.js` 子路径已显式使用 `.js` 后缀，避免 CommonJS 运行时的 package exports 解析失败。
- README 不再要求复制不存在且不会被读取的 `.env.example`，改为列出实际由进程读取的环境变量和认证开关的当前行为。
- 已执行 `pnpm typecheck`、`pnpm build` 和 `git diff --check HEAD`。沙箱内监听 `127.0.0.1:3000` 被权限策略拒绝；在获批环境中启动命令不再出现 SDK 子路径加载错误，但仍需要在真实本地或部署环境完成 `/health` 与 MCP initialize 冒烟验证。

### 风险与待办

- `src/integration/request-demo.ts` 在被导入时仍会执行真实请求并输出响应。该项按 `WL-20260725-001` 临时豁免至 2026-08-25；首个正式工具接入前应移除顶层执行，改为 fake HTTP 契约测试。
- 当前没有 TypeScript 测试基座，也未覆盖健康检查、MCP 初始化、认证拒绝、非法 JSON 或请求体上限。该项按 `WL-20260725-002` 临时豁免至 2026-08-25；过期前必须补齐最小 HTTP/MCP 回归测试。
- 当前没有凭证 verifier、业务工具或个人数据脱敏实现。`MCP_AUTH_REQUIRED=true` 只能作为拒绝保护，不能代替正式认证；在接入任何校园数据之前必须完成身份、scope 和脱敏链路。

### 建议 Commit Message（git-cz）

- `feat(mcp): scaffold stateless campus MCP server`
