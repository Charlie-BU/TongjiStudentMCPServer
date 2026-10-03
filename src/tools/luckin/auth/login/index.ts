import { z } from "zod";
import type { ToolRegistrationContext } from "../../../registry";
import { saveLuckinCredential } from "../../../../storage/luckin-credentials";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loginLuckinAndGetToken } from "../../../../integration/luckin_coffee/auth";
import { LUCKIN_LOGIN_INPUT_SCHEMA } from "../../../../integration/luckin_coffee/contract";
import { createLuckinOutputSchema, runLuckinAction } from "../../result";

export const LUCKIN_LOGIN_TOOL_NAME = "luckin.auth.login";

export const registerLuckinLoginTool = (server: McpServer, context: ToolRegistrationContext): void => {
    server.registerTool(LUCKIN_LOGIN_TOOL_NAME, {
        title: "登录瑞幸并保存凭据",
        description: "使用手机号和验证码登录瑞幸，获取 Token 并保存至已认证身份对应的用户。本工具必须通过同济认证、OAuth 或 API Key 认证；不返回 Token，失败不自动重试。",
        inputSchema: LUCKIN_LOGIN_INPUT_SCHEMA,
        outputSchema: createLuckinOutputSchema(z.object({ authenticated: z.literal(true) })),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input) => {
        const currentUserId = context.invocation.userId;
        return runLuckinAction(async () => {
            const token = await loginLuckinAndGetToken(input);
            await saveLuckinCredential(currentUserId, token, !!context.invocation.accessToken);
            return { authenticated: true as const };
        });
    });
};
