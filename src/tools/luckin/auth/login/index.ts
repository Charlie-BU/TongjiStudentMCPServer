import { z } from "zod";
import type { ToolRegistrationContext } from "../../../registry";
import { readCurrentUserId, createErrorResult } from "../../../utils";
import { saveLuckinCredential } from "../../../../storage/luckin-credentials";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loginLuckinAndGetToken } from "../../../../integration/luckin_coffee/auth";
import { LUCKIN_LOGIN_INPUT_SCHEMA } from "../../../../integration/luckin_coffee/contract";
import { createLuckinOutputSchema, runLuckinAction } from "../../result";

export const LUCKIN_LOGIN_TOOL_NAME = "luckin.auth.login";

export const registerLuckinLoginTool = (server: McpServer, context: ToolRegistrationContext): void => {
    server.registerTool(LUCKIN_LOGIN_TOOL_NAME, {
        title: "登录瑞幸并保存凭据",
        description: "使用手机号和验证码登录瑞幸，获取 Token 并保存至 X-User-Id 对应的用户。本工具必须携带 X-User-Id，不需要同济授权；X-Tongji-Access-Token 可选，仅用于记录凭据来源；不返回 Token，失败不自动重试。",
        inputSchema: LUCKIN_LOGIN_INPUT_SCHEMA,
        outputSchema: createLuckinOutputSchema(z.object({ authenticated: z.literal(true) })),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input) => {
        let userId: string | null = null;
        try {
            userId = readCurrentUserId(context.invocation);
        } catch { /* 缺少用户标识时不发起瑞幸登录 */ }
        if (!userId) return createErrorResult("unauthorized", "缺少有效的 X-User-Id，请通过调用方提供用户身份。");
        const currentUserId = userId;
        return runLuckinAction(async () => {
            const token = await loginLuckinAndGetToken(input);
            await saveLuckinCredential(currentUserId, token, !!context.invocation.accessToken);
            return { authenticated: true as const };
        });
    });
};
