# MCP 身份认证与 OAuth

全部 59 个工具的策略只在 `src/auth/tool-policy.ts` 配置：42 个要求同济身份，17 个要求已认证身份。业务工具不再自行判断请求头。未配置的工具或已配置但未注册的工具导致注册失败。

## 请求身份

- 携带 `X-Tongji-Access-Token` 时，必须提供单个非空 `X-User-Id`。入口查询固定服务账号 `00001`，校验同济服务 token；只验证服务凭据，不验证调用者与用户 ID 的归属关系。通过后原样透传上游 Agent 用户 ID。失效、空白 token 或身份服务异常不会回退到 Bearer 认证。
- 未携带同济 token 时，只接受 `Authorization: Bearer <凭据>`。凭据必须是配置的 API Key 或本服务签发、未过期且未撤销的 OAuth access token。入口以该凭据构造内部 `userId`，忽略请求中的 `X-User-Id`。
- 校园工具只允许同济路径；API Key 和 OAuth 均不能豁免同济身份要求。其余工具允许两条路径，包含全部课程/历史评价工具和瑞幸工具。
- 初始化、工具发现、工具调用与历史评价 HTTP 路由都要求认证。OAuth 发现、注册、授权、兑换和撤销端点按各自协议处理；健康检查不要求身份。
- 同济 token 和用户 ID、外部 Authorization 必须为单值；缺失或空白身份不会进入业务调用。外部认证失败返回 401，并以 `WWW-Authenticate` 指向受保护资源元数据；同济服务校验失败或工具权限不足返回 403。

身份来自可信上游 Agent 的同济路径是明确的信任边界：持有有效同济服务 token 的调用方可以选择任意非空上游用户 ID。

## 配置

持久化目录由 `MCP_DATA_DIR` 指定，未设置时使用 `RAILWAY_VOLUME_MOUNT_PATH`，再回退到项目 `data/`。`mcp.sqlite` 和 `oauth.sqlite` 共用该目录，备份与挂载应覆盖实际目录；Railway 环境要求目录位于已挂载的持久卷内。

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `ALLOWED_API_KEYS` | `[]` | API Key 的 JSON 数组；每个 Key 至少 32 个无空白 ASCII 字符。空数组禁用 API Key 和 API Key 确认的 OAuth 授权。 |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `2592000` | 新签发 token 有效期，单位秒；正整数或 `-1`。`-1` 表示没有时间过期。 |
| `MCP_PUBLIC_URL` | `http://localhost:<APP_PORT>` | 不带 `/mcp` 的服务源地址；生产必须使用 HTTPS，开发可用回环 HTTP。 |

API Key 没有时间过期。永久 OAuth token 仍可撤销；从配置移除其授权使用的 API Key 并重启加载配置后，关联 OAuth token 也失效。修改有效期配置只影响新签发 token。

生产应通过环境变量配置独立的高熵 API Key。不要把 Key、OAuth token 或同济 token 写入工具参数、模型上下文和日志。外部 `userId` 自身就是秘密凭据；瑞幸 SQLite 中的 `user_id` 因而也按敏感数据保护，不得导出或记录。

## OAuth 流程

参考 `/Users/mac/Desktop/Work/MyHome/MijiaMCP/src/oauth.py`，使用授权码流程与 S256 PKCE；不签发 refresh token，不支持刷新 grant。

1. 客户端通过 `/.well-known/oauth-protected-resource/mcp` 与 `/.well-known/oauth-authorization-server` 发现服务。
2. `/register` 注册客户端，支持 `none`、`client_secret_post`、`client_secret_basic`。注册只声明支持 `authorization_code`，不会授予工具访问。
3. `/authorize` 校验注册回调、目标资源 `/mcp`、PKCE challenge 和 scope，打开 `/oauth/consent`。
4. 授权页显示客户端名称、回调地址和权限；用户输入配置好的 API Key 确认。授权页使用 CSRF token、HttpOnly SameSite cookie 和来源检查。授权请求有效 10 分钟，授权码有效 120 秒且只能兑换一次。
5. `/token` 验证客户端、回调、resource、PKCE verifier 及授权 Key，签发随机 access token。授权及兑换必须使用公开 MCP URL 作为 `resource`，scope 为 `tongji.external`。
6. 客户端只发送 `Authorization: Bearer <access_token>` 即可访问外部工具；`/revoke` 可撤销当前客户端的 token。

客户端注册、授权请求、授权码和 token 存储在 `data/oauth.sqlite`；OAuth token、授权码、API Key 和客户端 secret 只存摘要，文件权限为 `0600`。必须持久化并备份整个 `/app/data`。重启保留客户端注册及有效 token；更换源地址导致旧资源绑定的 token 无效。

本设计以 access token 或 API Key 本身作为外部身份。不同 OAuth token、不同 API Key 的瑞幸绑定相互独立；重新授权或轮换 API Key 后是新身份，需要重新绑定瑞幸。配置永久 token 时，部署设置 `ACCESS_TOKEN_EXPIRE_SECONDS=-1`，代码默认仍为 30 天。

## OAuth 限流

注册、授权、授权确认、兑换和撤销端点按连接来源地址及路径分别限流，每 15 分钟最多 2,000 次。授权确认的 GET/POST 共用路径额度，失败请求也计数；发现端点不计入。反向代理后的用户可能共享代理地址及额度，提高阈值不会解决这一隔离问题。

## Agent 接入

Agent 配置 `MCP_SERVER_API_KEY`，用于启动初始化和工具发现；该 Key 必须存在于 MCP 的 `ALLOWED_API_KEYS`。它不作为匿名调用者的业务身份。

同济用户沿用实际用户 ID 与同济服务 token。外部调用者须通过 `WithBearerCredential` 将其 OAuth token 或独立 API Key 放入请求上下文；该凭据只附加到当前调用。匿名 session ID 不再可用于 MCP 认证。Agent 的匿名聊天入口未新增 OAuth 登录 UI；没有调用者凭据时，工具包装器本地返回认证提示，不使用共享发现 Key 执行业务。
