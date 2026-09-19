# 瑞幸登录与凭据检测

调用链：CAM `integration/cam_auto_generated/LuckinCoffeeAuth` → `integration/luckin_coffee` → `tools/luckin/auth`。
CAM 文件保持只读。无需 Shell。

## 用户身份

Agent 通过 `X-Tongji-Access-Token` 传入同济 access_token。登录和检测均使用
`src/tools/utils.ts` 的 `readCurrentUserId` 获取当前用户，工具不接受 userId 或 Token 参数。
短信发送本身不需要同济凭据。瑞幸 Cookie/Token 不与同济 access_token 混用。

## 工具契约

- `luckin.auth.send_sms_code`：`{mobile, countryCode?: "86"}`，保留
  `{status:"ok",data:{msg,remain,validate},source:"Luckin Coffee"}`。
- `luckin.auth.login`：`{mobile,validateCode,countryCode?: "86"}`。验证码为字符串。
  先解析当前同济身份，再依次 Login → GetToken → 按 user_id upsert。
  成功返回 `{status:"ok",data:{authenticated:true},source:"Luckin Coffee"}`。
  不再返回原先的三个 Token 字段；调用方应适配这一契约变化。保存失败不报告成功。
- `luckin.auth.check`：输入 `{}`，输出仅 `{valid:true}` 或 `{valid:false}`，
  同时提供等价 JSON 文本和 structuredContent。
  无 Token、无同济凭据、无法识别身份、瑞幸鉴权失败、超时、限流、上游/数据库故障均返回 false。
  false 表示本次未能确认有效，不删除凭据、不自动重发短信。非法工具参数由 MCP 参数校验拒绝。

## Token 探测

使用官方地址 `https://gwmcp.lkcoffee.com/order/user/mcp` 的 JSON-RPC `ping`，
携带当前用户保存的 Bearer。2026-09-19 实测：有效 Token 返回 HTTP 200 和
`{"jsonrpc":"2.0","id":1,"result":{}}`；随机无效 Token 和缺失 Token 均返回 HTTP 401。
`tools/list` 也呈现相同鉴权差异，最终选取响应更小、不需要业务参数的 ping。
不需要门店定位、不查询或创建订单。接受已验证的 JSON 响应及 SSE data 消息。
请求超时 5 秒，禁用重定向，无自动重试；校验 JSON-RPC 版本、id 和空对象 result。
检测通过只代表检查时有效，后续业务仍需处理 Token 过期。

## 常驻数据库

数据库固定为 `data/mcp.sqlite`（相对服务目录定位，不依赖启动目录）。
数据库不存在时自动创建，从随代码发布的 `data/teacher-reviews.seed.sqlite` 导入全部 2704 条教师评价，瑞幸凭据表初始为空。已有空评价表也会补齐；非空评价表及用户凭据保持不变。
初始化在事务中完成，重复启动不会重复导入或覆盖已有评价。部署须携带种子库；种子库只包含教师评价，不含用户凭据。运行库及 WAL/SHM 已忽略，不可提交用户凭据。
`teacher_reviews` 保持原结构和检索行为，新增表恰有五个字段：

```sql
CREATE TABLE user_luckin_credentials (
  user_id TEXT PRIMARY KEY NOT NULL,
  luckin_token TEXT NOT NULL,
  token_date INTEGER NOT NULL,
  token_timeout INTEGER NOT NULL,
  last_verified_at INTEGER
);
```

按需求明文保存 Token。token_date/token_timeout 保留上游原值，不推测单位或本地到期时间。
last_verified_at 为最近一次 ping 成功的 Unix 毫秒时间；登录替换 Token 时清空。
成功更新带 user_id 和原 Token 条件，避免并发登录后将旧 Token 的验证结果写到新 Token 上。

单实例部署使用持久化可写目录；运行库使用 WAL 和 5 秒 busy_timeout。
发布只更新代码，不能覆盖运行库。备份使用 SQLite 备份接口，或停止服务并在所有
连接关闭后备份；不要在运行中只复制主文件而遗漏 WAL。多机器部署需另行设计共享存储。

## 登录传输与验证

每次操作生成随机 CSRF，query `_csrf` 与 Cookie `csrfToken` 保持一致。
Login/GetToken 在一次调用内共用 CSRF，并从两条 Set-Cookie 读取
`LK_luckyopen_prod_CSID`、`LK_PROD_LUCKYOPEN_SSID`；不使用全局 Cookie jar。
同时检查业务 code/status/busiCode；缺失 Cookie、额外安全校验或业务失败均中断流程。
不记录 Token、Cookie、验证码和原始 Axios 错误。登录失败不会覆盖已有凭据。

离线测试覆盖初始化、教师评价保留、用户隔离、覆盖登录、并发条件更新、JSON/SSE 探测和
全部 false 分支；使用临时数据库和模拟凭据，不发送真实短信。
