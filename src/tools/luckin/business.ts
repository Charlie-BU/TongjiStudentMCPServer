import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolRegistrationContext } from "../registry";
import { createErrorResult, readCurrentUserId } from "../utils";
import { readLuckinCredential } from "../../storage/luckin-credentials";
import { createLuckinMcpAdapter } from "../../integration/luckin_coffee/mcp";
import { LUCKIN_MCP_RESULT_SCHEMA, LuckinMcpError } from "../../integration/luckin_coffee/contract";
import { createLuckinOutputSchema } from "./result";

type Adapter = ReturnType<typeof createLuckinMcpAdapter>;
interface BusinessTool<S extends z.AnyZodObject> {
    name: string;
    title: string;
    description: string;
    schema: S;
    mutation?: boolean;
    invoke: (client: Adapter, input: z.output<S>) => Promise<z.output<typeof LUCKIN_MCP_RESULT_SCHEMA>>;
}

// 统一身份解析与凭据读取；只调用目标业务方法，不自动登录、发送短信或重复 ping。
export const registerLuckinBusinessTool = <S extends z.AnyZodObject>(
    server: McpServer, context: ToolRegistrationContext, definition: BusinessTool<S>,
): void => {
    server.registerTool(definition.name, {
        title: definition.title,
        description: definition.description + " 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。",
        inputSchema: definition.schema as z.AnyZodObject,
        outputSchema: createLuckinOutputSchema(LUCKIN_MCP_RESULT_SCHEMA),
        annotations: {
            readOnlyHint: !definition.mutation, destructiveHint: !!definition.mutation,
            idempotentHint: !definition.mutation, openWorldHint: true
        },
    }, async (input) => {
        let userId: string | null;
        try {
            if (!context.invocation.accessToken) return createErrorResult("unauthorized", "无法识别当前同济用户，请先完成同济授权。");
            userId = await readCurrentUserId(context.invocation.accessToken);
            if (!userId) return createErrorResult("unauthorized", "无法识别当前同济用户，请先完成同济授权。");
        } catch { return createErrorResult("upstream_unavailable", "暂时无法验证当前同济用户，请稍后重试。"); }
        let invoked = false;
        try {
            const credential = readLuckinCredential(userId);
            if (!credential) return createErrorResult("unauthorized", "当前用户尚未绑定瑞幸账号，请先完成瑞幸登录。");
            const client = createLuckinMcpAdapter(credential.luckin_token);
            invoked = true;
            const data = await definition.invoke(client, definition.schema.parse(input));
            const result = { status: "ok" as const, data, source: "Luckin Coffee" as const };
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
        } catch (error) {
            const reason = error instanceof LuckinMcpError ? error.reason : undefined;
            if (reason === "unauthorized") return createErrorResult("unauthorized", "瑞幸授权无效，请重新完成瑞幸登录。");
            let message = "瑞幸服务暂时不可用，请稍后重试。";
            if (reason === "rate_limited") message = "瑞幸请求过于频繁，请稍后重试。";
            if (reason === "invalid_input") message = "瑞幸业务参数无效，请检查门店、商品或订单信息。";
            if (reason === "rpc_error" || reason === "tool_error") message = "瑞幸未能完成本次操作，请核对业务信息。";
            if (reason === "malformed") message = "瑞幸返回的数据不完整，无法确认操作结果。";
            if (reason === "timeout") message = "瑞幸请求超时，请稍后重试。";
            if (definition.mutation && invoked && !["invalid_input", "rate_limited"].includes(reason ?? "")) {
                // 可能已被上游处理；不能向模型提供“重试创建/取消”的建议。
                message = "瑞幸订单操作结果未确认，请先核实订单状态，不要直接重复创建或取消订单。";
            }
            return createErrorResult("upstream_unavailable", message);
        }
    });
};
