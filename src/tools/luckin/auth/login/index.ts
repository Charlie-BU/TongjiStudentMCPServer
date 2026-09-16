import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loginLuckinAndGetToken } from "../../../../integration/luckin_coffee";
import { LUCKIN_LOGIN_INPUT_SCHEMA, LUCKIN_TOKEN_DATA_SCHEMA } from "../../../../integration/luckin_coffee/contract";
import { createLuckinOutputSchema, runLuckinAction } from "../../result";

export const LUCKIN_LOGIN_TOOL_NAME = "luckin.auth.login";

export const registerLuckinLoginTool = (server: McpServer): void => {
    server.registerTool(LUCKIN_LOGIN_TOOL_NAME, {
        title: "登录瑞幸并获取 Token",
        description: "使用用户提供的手机号及短信验证码登录瑞幸，然后自动携带登录 Cookie 获取 MCP Token。无需传入 Cookie、CSRF 或同济凭据。返回 Token 为敏感数据，调用方必须安全保存，不得写入日志、聊天历史或向用户复述；失败不自动重试。",
        inputSchema: LUCKIN_LOGIN_INPUT_SCHEMA,
        outputSchema: createLuckinOutputSchema(LUCKIN_TOKEN_DATA_SCHEMA),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input) => runLuckinAction(() => loginLuckinAndGetToken(input)));
};
