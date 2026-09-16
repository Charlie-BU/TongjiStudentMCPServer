# 瑞幸短信登录工具

调用链：`CAM integration/cam_auto_generated/LuckinCoffee → integration/luckin_coffee/index.ts → tools/luckin/auth/* → registry`。
CAM 生成文件保持只读，两个工具不依赖同济 access token，也不需要 Shell。

## 1. `luckin.auth.send_sms_code`

用户要求发送登录验证码后调用：

```json
{"mobile":"13800000000","countryCode":"86"}
```

`mobile` 必填，`countryCode` 可选，默认 `86`。手机号与区号分别传递，不带 `+`。
适配器将 `countryCode` 映射为 GetSMSCode 的 `callCode`。

成功示例：

```json
{"status":"ok","data":{"msg":"验证码已发送","remain":60,"validate":false},"source":"Luckin Coffee"}
```

`remain`、`validate` 保留上游原值，尚未确认 remain 的单位；validate=false 不代表失败。
工具不返回验证码，用户需要读取收到的短信。

## 2. `luckin.auth.login`

用户提供收到的验证码后调用：

```json
{"mobile":"13800000000","countryCode":"86","validateCode":"012345"}
```

`mobile`、`validateCode` 必填，验证码必须为字符串以保留前导零。区号与发送短信时保持一致。
工具顺序执行 Login（countryNo=countryCode、type=1）和 GetToken（oauthApp=LUCKIN_MCP_AI）。
失败、额外安全校验、访客模式或缺少完整身份 Cookie 时不调用 GetToken。

成功示例（凭据为虚构值）：

```json
{
  "status":"ok",
  "data":{
    "luckyMcpToken":"example-token-not-a-real-credential",
    "luckyMcpTokenDate":1797326468904,
    "luckyMcpTokenTimeout":7767567
  },
  "source":"Luckin Coffee"
}
```

两个时间字段保留原值，不做单位换算。工具只返回这三个字段，不返回登录用户资料、
Cookie、上游诊断标识或验证码。**Token 本身仍是敏感凭据**：当前工具按调用方请求返回
Token，不负责持久化或用户绑定。接入 Agent 时需在工具结果进入模型、SSE、Trace 和聊天
历史之前由受信任业务代码截获并安全保存；不能仅靠工具描述达到脱敏效果。

## 传输与失败行为

- CAM 生成方法声明了 Cookie 入参，但没有序列化为 HTTP Cookie 头；手写传输层补齐。
- 每次操作生成随机 CSRF，query `_csrf` 与 Cookie `csrfToken` 始终相同。
  Login 与紧接的 GetToken 使用同一个值；两次独立工具调用无共享登录态。
- 逐行提取 Login 响应的 `LK_luckyopen_prod_CSID`、`LK_PROD_LUCKYOPEN_SSID`，
  GetToken 同时发送两者。保留 Cookie 值中的 `=`，不按逗号切分 Expires。
- Cookie 仅存在于单次调用的局部变量，不保存到全局 Axios、环境变量或磁盘。
- 检查 HTTP 200 内的 `status=SUCCESS`、`code=1`、`busiCode=BASE000`；
  登录及取 Token 还检查 `loginState=1`，并校验响应字段类型。
- 超时默认 10 秒/请求，关闭重定向，无自动重试。两个工具都是非只读、非幂等操作。
- 错误使用既有 `isError: true` 和稳定 `unauthorized` / `upstream_unavailable` 状态，
  不返回原始 Axios 错误、上游自由错误正文或个人资料。
- 适配器的 `baseUrl` / `timeoutMs` 仅供服务代码与离线测试配置，不是模型可输入参数。

## 验证与集成边界

`test/integration/luckin.test.ts` 验证 CAM 请求、CSRF、Cookie、流程中断、错误脱敏与并发隔离；
`test/tools/luckin.test.ts` 通过内存 MCP 客户端验证注册、输入输出 Schema 和结果包装。
测试使用虚构凭据和模拟上游，不发送真实短信、不登录真实账号。

本次只新增 MCP Server 工具，不修改 Agent 白名单、账号绑定界面、凭据存储或限流策略。
Agent 当前的通用工具结果链路会保存/展示工具结果，不能直接将登录工具开白给模型。
对外部署短信入口时，调用方还需实施用户授权及短信发送频率控制。
