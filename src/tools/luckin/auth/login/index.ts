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
        description: "使用手机号和验证码登录瑞幸，获取 Token 并保存至当前同济用户。需要请求上下文中的同济 access_token；不返回 Token，失败不自动重试。",
        inputSchema: LUCKIN_LOGIN_INPUT_SCHEMA,
        outputSchema: createLuckinOutputSchema(z.object({ authenticated: z.literal(true) })),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input) => {
        let userId: string | null = null;
        try {
            if (context.invocation.accessToken) userId = await readCurrentUserId(context.invocation.accessToken);
        } catch { /* 不可识别身份时不发起瑞幸登录 */ }
        if (!userId) return createErrorResult("unauthorized", "无法识别当前同济用户，请重新授权后再绑定瑞幸账号。");
        const currentUserId = userId;
        return runLuckinAction(async () => {
            const token = await loginLuckinAndGetToken(input);
            saveLuckinCredential(currentUserId, token);
            return { authenticated: true as const };
        });
    });
};
