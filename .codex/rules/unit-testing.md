# MCP Server 单元测试规则

## 规范来源

- 单元测试的唯一项目规范是仓库根目录的 `docs/UTSpec.md`。
- 该文档定义本 MCP Server 的测试目录、Node 原生测试栈、Mock 边界、校园数据脱敏要求、分层覆盖重点和提交前本地闭环。

## 强制要求

- 新增或修改手写 TypeScript 逻辑、MCP Tool、HTTP/认证边界、领域规则、OpenAPI 适配器、隐私策略或测试配置前，必须先阅读 `docs/UTSpec.md` 并按其编写/更新 `.test.ts` 用例。
- 测试置于 `test/`，不得放入 `src/` 或 CAM 管理的 `src/integration/openapi/`；生成客户端只通过手写适配器边界以 Fake 隔离。
- 测试必须离线、确定性且使用虚构脱敏数据；禁止真实 token、Cookie、学生数据、校园平台或外网调用。
- 完成改动后必须执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`；也可使用 `pnpm check` 一次完成。失败不得标记为通过。
