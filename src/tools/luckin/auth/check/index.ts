import type { ToolInvocationContext } from "../../../../transport/invocation-context";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readCurrentUserId } from "../../../utils";
import type { ToolRegistrationContext } from "../../../registry";
import { readLuckinCredential, markLuckinVerified } from "../../../../storage/luckin-credentials";
import { createLuckinMcpAdapter } from "../../../../integration/luckin_coffee/mcp";
import { LuckinMcpError } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_CHECK_TOOL_NAME = "luckin.auth.check";
export const CHECK_ERROR_MESSAGES = {
    user_id_required: "缺少有效的 X-User-Id，请通过调用方提供用户身份。",
    upstream_timeout: "瑞幸登录检查超时，请稍后重试；当前不能判断 Token 是否有效。",
    rate_limited: "瑞幸登录检查过于频繁，请稍后重试，不要重新发送验证码。",
    upstream_unavailable: "瑞幸服务暂时不可用或响应异常，暂时无法检查登录状态，请稍后重试。",
    upstream_forbidden: "瑞幸拒绝访问，暂时无法确认登录状态，请稍后重试或联系平台维护方。",
    credential_store_unavailable: "瑞幸凭据存储暂时不可用，请稍后重试或联系平台维护方。",
    credential_changed: "瑞幸登录信息在检查期间发生变化，请重新检查登录状态。",
} as const;
type CheckErrorStatus = keyof typeof CHECK_ERROR_MESSAGES;
export class LuckinCheckError extends Error {
    constructor(public readonly status: CheckErrorStatus) { super(CHECK_ERROR_MESSAGES[status]); }
}

// false 仅代表未绑定或瑞幸明确拒绝 Token；无法完成检查时抛出不含原始凭据的分类错误。
export const checkCurrentLuckinToken = async (invocation: ToolInvocationContext): Promise<boolean> => {
    const userId = readCurrentUserId(invocation);
    if (!userId) throw new LuckinCheckError("user_id_required");
    let credential;
    try { credential = await readLuckinCredential(userId); }
    catch { throw new LuckinCheckError("credential_store_unavailable"); }
    if (!credential) return false;
    try { await createLuckinMcpAdapter(credential.luckin_token).ping(); }
    catch (error) {
        if (error instanceof LuckinMcpError) {
            if (error.reason === "unauthorized") return false;
            if (error.reason === "timeout") throw new LuckinCheckError("upstream_timeout");
            if (error.reason === "rate_limited") throw new LuckinCheckError("rate_limited");
            if (error.reason === "forbidden") throw new LuckinCheckError("upstream_forbidden");
        }
        throw new LuckinCheckError("upstream_unavailable");
    }
    let updated: boolean;
    try { updated = await markLuckinVerified(userId, credential.luckin_token); }
    catch { throw new LuckinCheckError("credential_store_unavailable"); }
    if (!updated) throw new LuckinCheckError("credential_changed");
    return true;
};

export const registerLuckinCheckTool = (server: McpServer, context: ToolRegistrationContext): void => {
    server.registerTool(LUCKIN_CHECK_TOOL_NAME, {
        title: "检查瑞幸登录状态",
        description: "检查 X-User-Id 对应用户已保存的瑞幸 Token。必须携带 X-User-Id；无需同济授权，X-Tongji-Access-Token 可选。不接受参数；所有结果包含 valid 和 message；确认有效返回 valid:true，未绑定或 Token 无效返回 valid:false。用户标识缺失、超时、限流、服务或存储故障返回 isError 和分类 status/message，须先判断错误状态，不得据 valid:false 发起短信登录。必须等待 login 成功后再单独调用。",
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({ valid: z.boolean(), message: z.string() }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async () => {
        try {
            const valid = await checkCurrentLuckinToken(context.invocation);
            const result = { valid, message: valid ? "瑞幸登录有效，可以继续操作。" : "尚未登录瑞幸或登录已失效，请完成瑞幸登录。" };
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
        } catch (error) {
            const status = error instanceof LuckinCheckError ? error.status : "upstream_unavailable";
            return { isError: true, content: [{ type: "text" as const,
                text: JSON.stringify({ valid: false, status, message: CHECK_ERROR_MESSAGES[status] }) }] };
        }
    });
};
