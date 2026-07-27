# TongjiStudent MCP Server 单元测试规范

本文为 `TongjiStudentMCPServer` 的单元测试规范。它以本仓库的职责和现有骨架为准：服务是 TongjiStudentAgent 与同济开放平台／济星云接口之间的**无状态 MCP 服务边界**，负责可信调用上下文传递、MCP/HTTP 协议适配、领域聚合、数据裁剪与脱敏；不负责会话、模型调用或 Agent 的工具决策。

本文不引入 CI。每次提交前由开发者在本地执行受影响测试和全量测试；将来如引入 CI，可复用这些命令，但不应反过来为 CI 改写测试设计。

## 1. 目标与边界

- 用确定性、离线的测试守住 MCP 对外契约、身份上下文和校园数据隐私边界。
- 覆盖领域规则与上游错误归一，避免把同济开放平台的单个 API 直接暴露成 MCP Tool。
- 测试失败应能定位到配置、传输、工具、领域或适配层；不依赖真实账号、真实 token、真实校园数据或外网。
- 单测不替代与真实 OpenAPI 的联调。真实系统联调另行安排，不能混入提交前单测。

适用范围是 `src/` 中手写的生产代码。CAM 管理的 `src/integration/openapi/` 是生成客户端：不手改、不为其生成代码补逐行单测；应测试其上层的业务适配器和调用契约。

## 2. 基线工具与执行方式

项目当前使用 Node.js 20+、TypeScript、CommonJS，并已依赖 `tsx`。首阶段统一使用 Node 原生测试运行器 `node:test` 与 `node:assert/strict`，由 `tsx` 执行 TypeScript 测试。这样无需为了单测再引入 Jest、Vitest 或额外转译链路。

首次加入测试时，在 `package.json` 增加以下脚本：

```json
{
  "scripts": {
    "test": "node --import tsx --test test/*.test.ts test/**/*.test.ts",
    "test:watch": "node --import tsx --test --watch test/*.test.ts test/**/*.test.ts",
    "test:typecheck": "tsc --noEmit -p tsconfig.test.json",
    "check": "pnpm test && pnpm test:typecheck && pnpm typecheck && pnpm build"
  }
}
```

约定命令如下：

```bash
# 跑全部单测（提交前必跑）
pnpm test

# 跑一个受影响文件
node --import tsx --test test/transport/invocation-context.test.ts

# 只跑名称匹配的场景
node --import tsx --test --test-name-pattern='缺失 token' test/transport/invocation-context.test.ts

# 类型和产物校验（提交前必跑）
pnpm test:typecheck
pnpm typecheck
pnpm build
```

当前未设置覆盖率门槛或覆盖率脚本。先保证关键边界有高价值用例；当工具和领域逻辑形成稳定规模后，再评估本地覆盖率报告与阈值，不能以覆盖率数字替代契约、隐私和错误路径断言。

## 3. 目录、命名与测试结构

测试与源码分离，统一放在包根目录的 `test/`。这样现有 `tsconfig.json` 的 `include: ["src/**/*.ts"]` 不会把测试编译进 `dist/`，也不会影响生产启动入口。

```text
TongjiStudentMCPServer/
├── src/
│   ├── config/
│   ├── transport/
│   ├── tools/
│   ├── domain/
│   └── integration/
│       ├── tongji-openapi/      # 后续手写适配器
│       └── openapi/             # CAM 生成代码，不在此直接测试
└── test/
    ├── config/server.test.ts
    ├── transport/invocation-context.test.ts
    ├── transport/http.test.ts
    ├── tools/<domain>.test.ts
    ├── domain/<domain>.test.ts
    ├── integration/tongji-openapi/<adapter>.test.ts
    ├── fixtures/
    └── helpers/
```

- 文件名为 `<被测模块名>.test.ts`，测试目录按源码职责镜像组织。
- `describe` 使用模块或 Tool 名；`it`/`test` 描述可观察行为，使用“应……”或 `should ...`，同一文件保持一致。
- 一个测试只验证一个核心行为；相关边界场景可以放在同一个 `describe` 下。
- `test/fixtures/` 只放稳定、脱敏且可复用的协议或上游响应样例；`test/helpers/` 只放测试工厂、Fake 和本地 HTTP 辅助函数。禁止把通用业务逻辑搬入 helper 以逃避测试。
- `src/integration/test.ts` 是当前的人工调用示例，不是单测；不得在 `pnpm test` 中执行，也不得作为测试数据来源。

最小示例：

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readToolInvocationContext } from '../../src/transport/invocation-context';

describe('readToolInvocationContext', () => {
  it('应去除单个 access token 的首尾空白', () => {
    const context = readToolInvocationContext({
      'x-tongji-access-token': ' test-token ',
    });

    assert.deepEqual(context, { accessToken: 'test-token' });
  });
});
```

## 4. Mock 与依赖注入原则

测试隔离跨进程和不稳定边界，不 mock 被测单元自身的业务实现。

| 依赖或边界 | 单测做法 |
| --- | --- |
| 同济开放平台／济星云 HTTP 调用 | 使用可注入的接口和 Fake；断言请求构造、token 注入、超时与错误归一，绝不发真实请求。 |
| CAM 生成客户端 | 在手写适配器边界替换为 Fake，不深度 mock 或修改 `src/integration/openapi/`。 |
| MCP SDK、HTTP 网络栈 | 传输层可以在 loopback 临时端口上做协议测试；不得访问外网。纯工具和领域逻辑优先直接调用。 |
| 时间、随机数、环境变量 | 显式注入，或在测试中保存并恢复；不得让用例依赖当前日期、端口、机器环境或执行顺序。 |
| 日志、Trace、指标 | 注入 spy/Fake，断言不含 token 和敏感字段；不要因日志实现细节写快照。 |

新建 OpenAPI 适配器时，应先定义由本仓拥有的最小接口，再把生成 client 封装在适配器内。Tool 和领域层只依赖该接口。这既是可测性要求，也是防止生成接口向上渗透、泄露上游字段的架构约束。

禁止：

- 在测试中使用真实 `X-Tongji-Access-Token`、Cookie、学号、姓名、课表、成绩、消费记录或生产 URL。
- 通过 mock 私有函数、断言内部调用次数来替代对输入、输出和副作用的验证。
- 让单测依赖真实开放平台、真实数据库或可用网络。
- 用“全量上游响应”的快照断言 Tool Result；它会固化无关字段，并可能把敏感数据写入仓库。

## 5. 分层覆盖要求

每次新增或修改手写逻辑，都应在其职责层补齐适用场景。

### 5.1 配置层：`src/config/`

以 `loadServerConfig` 为例，至少覆盖默认 `HOST`/`PORT`、合法边界端口 `1` 与 `65535`、非整数、超范围端口，以及环境变量恢复。测试不得永久修改 `process.env`，无论成功或失败都要还原。

### 5.2 传输与可信上下文：`src/transport/`

这是本仓的安全边界，须优先覆盖：

- `GET /health` 的成功响应，及其他路径／方法的拒绝行为；
- `/mcp` 的合法 MCP 请求转交、非法 JSON、空请求体和超过 `MAX_REQUEST_BYTES`（HTTP 413）的请求；
- `X-Tongji-Access-Token` 的缺失、空白、首尾空白和重复 header；重复值必须按当前安全策略视为不可信，不能任意选择一个；
- 每个 HTTP 请求创建独立 MCP Server 与调用上下文；无状态服务不得把前一个请求的 token 或业务数据带到下一个请求；
- 错误响应不泄露 token、上游响应体、堆栈或内部实现细节。

HTTP 测试必须在 `finally` 中关闭临时 server，避免端口泄漏和测试进程悬挂。

### 5.3 MCP Server 与 Tool 注册：`src/server.ts`、`src/tools/`

对外验证 MCP 的可见行为，不测试 SDK 私有实现。当前 Tool Catalog 为空时，应验证服务身份信息与空目录的预期行为。未来每个 Tool 至少覆盖：

- 工具名称、说明、输入 Schema 与输出结构的 MCP 契约；
- 合法输入的正常结果；缺失、类型错误和边界输入的拒绝；
- 参数中的学号、用户 ID、学院、角色等不可信身份字段不影响身份决策；身份只能来自调用上下文；
- 缺失或无效下游凭证时的统一错误；
- Tool Result 只包含允许字段，且不含 access token、Cookie、学号和未经批准的上游原始字段。

Tool 测试不应只断言 `server.tool` 或某个 mock “被调用一次”；必须同时断言调用参数和面向 MCP 客户端的结果／错误。

### 5.4 领域层：`src/domain/`

领域层承载确定性的校园业务聚合。每个公开能力应覆盖正常结果、空数据、排序/筛选/去重、跨系统字段冲突、领域边界与可读的业务错误。领域测试使用最小化的脱敏 fixture，不依赖 HTTP 或 MCP SDK。

首个 `campus.schedule.get_term` 闭环至少要验证：调用上下文的 token 仅交给适配器、正常课表/学期数据的归一结果、空数据、超时、上游未授权和异常响应的统一映射，以及输出字段白名单。

### 5.5 上游适配与隐私：`src/integration/tongji-openapi/`、`src/privacy/`

适配器测试通过 Fake CAM client 验证 URL/方法/参数和认证头构造，并将网络错误、超时、4xx/5xx 与上游业务错误映射为领域可识别的错误。隐私测试以“应保留字段”的 allowlist 为中心：即使 fixture 新增未知字段，也不得出现在领域对象、Tool Result、日志或错误信息中。

## 6. 测试数据与断言

- Fixture 使用虚构值，例如 `test-access-token`、`student_001`；不要使用任何可识别真实个人的信息。
- 每个用例创建自己的可变输入，不能共享后再修改同一个对象。
- 对响应断言状态码、MCP 错误类别、关键字段和允许字段集合；对复杂对象优先 `deepEqual` 最小期望对象，避免大快照。
- 对安全相关场景，增加反向断言：序列化后的结果、错误和日志均 `doesNotMatch` token 或敏感字段值。
- 错误断言关注稳定的错误类别或公开消息，不依赖 Node、axios 或 MCP SDK 的完整错误文本。

## 7. 提交前本地闭环

本仓暂不设 CI 门禁，以下是每次提交前的必做流程：

1. 确认改动所在层及其下游影响；新增 Tool 时从 Tool、领域、适配器和隐私边界逐层列出需要补测的场景。
2. 先运行最小受影响测试文件；失败时修正实现或错误的测试预期。
3. 运行 `pnpm test`，确保所有单测可重复通过。
4. 运行 `pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，确保测试约定没有干扰 CommonJS 产物；也可执行 `pnpm check`。
5. 检查 fixture、终端输出和断言中没有 token、Cookie、真实学生数据或生产地址。

如果本地环境无法完成真实上游联调，不能因此跳过单测：应使用 Fake 覆盖本次变更的请求构造和错误归一。任何未覆盖的边界必须在提交说明中明确记录原因与后续计划。

## 8. 评审检查清单

- [ ] 新增或变更的手写逻辑有对应 `.test.ts`，且测试位于 `test/`。
- [ ] 正常、空值/边界和失败路径均按职责层覆盖。
- [ ] 上游 HTTP、时间、环境和日志等外部边界已隔离；没有真实网络请求。
- [ ] Tool 未信任来自参数的身份字段；token 只来自调用上下文，且不会出现在输出或日志中。
- [ ] 上游响应经过归一、裁剪和脱敏；生成 OpenAPI 代码没有被手改或深度 mock。
- [ ] 临时 HTTP Server、环境变量和 mock 在测试结束后得到清理/恢复。
- [ ] 已本地执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 与 `pnpm build`（或 `pnpm check`）。

## 9. 演进原则

当后续需要浏览器、数据库、真实服务联调或多进程协议验证时，应另建明确标识的集成测试，而不是稀释本规范的离线单测。只有当 Node 原生断言或 mock 已经无法清晰表达需求时，才评估引入额外测试库；引入前须说明解决的具体问题，并保持本文的目录、边界、隐私和本地提交前流程不变。
