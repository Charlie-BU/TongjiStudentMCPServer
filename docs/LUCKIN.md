# 瑞幸接入

当前 11 个 `luckin.*` 工具均要求已认证身份。策略统一在 `src/auth/tool-policy.ts` 配置，工具本身不解析或验证身份头。

携带同济 token 时，必须有非空 `X-User-Id`，入口验证 token 后透传 ID；失败返回 403，不回退。无同济 token 时，验证 `Authorization: Bearer <OAuth access_token/API Key>`，以凭据自身作为内部用户 ID，忽略请求中的 `X-User-Id`。初始化和工具发现同样要求认证。OAuth 授权和配置见 [身份认证与 OAuth](AUTH.md)。登录来源 `is_from_tongji` 仅作元数据。

凭据保存在 `data/mcp.sqlite` 的 `user_luckin_credentials` 表，以 `user_id` 为主键。
不新增手机号字段，不迁移旧凭据，不使用远端数据库或数据库连接环境变量。
新登录替换 Token 和来源，并清空最近验证时间。来源是布尔元数据，不作为访问控制条件。

正常流程：`check({})` → 未绑定时经用户授权发送短信 → 收集验证码 → `login`
→ 写入完成后单独 `check({})` → 业务调用。手机号只用于短信登录。
检查失败须先读取错误状态，不能将存储、上游或用户标识错误解释为 Token 过期。
身份失败在统一鉴权中拒绝，不访问瑞幸上游。
工具完整参数和描述见 [工具目录](TOOLS.md)。

瑞幸鉴权、登录检查和业务请求统一读取环境变量 `UPSTREAM_TIMEOUT_MS`，
未配置时每次 HTTP 请求默认超时为 20 秒。登录包含两个串行上游请求，
整次工具调用还可能包含入口服务凭据校验，因此总耗时可能超过 20 秒。
超时表示结果未确认，不自动重发验证码、提交登录或订单写操作。

Agent 同济用户使用上游用户 ID 与服务 token；外部调用者必须提供自己的 Bearer 凭据，不再接受 `anonymous_<sessionID>`。新 OAuth token 或新 API Key 是新身份，重新绑定瑞幸属于预期行为。

校园工具仍要求同济服务 Token；不兼容旧用户身份请求头或旧凭据实现。
SQLite 须使用持久化数据卷和一致性备份，多主机副本不自动共享瑞幸凭据。
