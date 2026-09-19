import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolRegistrationContext } from "../../../registry";
import { readCurrentUserId } from "../../../utils";
import { readLuckinCredential, markLuckinVerified } from "../../../../storage/luckin-credentials";
import { verifyLuckinToken } from "../../../../integration/luckin_coffee/mcp";

export const LUCKIN_CHECK_TOOL_NAME = "luckin.auth.check";

export const checkCurrentLuckinToken = async (accessToken?: string): Promise<boolean> => {
    try {
        if (!accessToken) return false;
        const userId = await readCurrentUserId(accessToken);
        if (!userId) return false;
        const credential = readLuckinCredential(userId);
        if (!credential || !await verifyLuckinToken(credential.luckin_token)) return false;
        return markLuckinVerified(userId, credential.luckin_token);
    } catch { return false; }
};

export const registerLuckinCheckTool = (server: McpServer, context: ToolRegistrationContext): void => {
    server.registerTool(LUCKIN_CHECK_TOOL_NAME, {
        title: "检查瑞幸登录状态",
        description: "检查当前同济用户已保存的瑞幸 Token 是否有效。不接受参数；缺少凭据、身份无法识别、超时、限流和上游故障均返回 valid:false。false 不一定表示 Token 已失效。",
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({ valid: z.boolean() }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async () => {
        const result = { valid: await checkCurrentLuckinToken(context.invocation.accessToken) };
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
    });
};
