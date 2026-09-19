import axios from "axios";
import { z } from "zod";

const pingResponse = z.object({
    jsonrpc: z.literal("2.0"), id: z.literal(1), result: z.object({}).strict(),
}).strict();

// 2026-09-19 实测：ping 有效 Token 返回 result:{}；无效/缺失 Token 返回 HTTP 401。
// 直接调用上游已验证支持的无状态 JSON-RPC ping，不创建会话、不访问订单。
export const verifyLuckinToken = async (token: string): Promise<boolean> => {
    if (!token || /\s/.test(token)) return false;
    try {
        const response = await axios.post("https://gwmcp.lkcoffee.com/order/user/mcp",
            { jsonrpc: "2.0", id: 1, method: "ping", params: {} }, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json",
                    Accept: "application/json, text/event-stream" },
                timeout: 5000, maxRedirects: 0, maxContentLength: 65536,
            });
        if (response.status !== 200) return false;
        if (typeof response.data !== "string") return pingResponse.safeParse(response.data).success;
        // 兼容 JSON 与 MCP 的 SSE data 消息；任何不完整/异常响应均视为失败。
        try { return pingResponse.safeParse(JSON.parse(response.data)).success; } catch { /* SSE */ }
        const messages = response.data.replace(/\r\n/g, "\n").split("\n\n")
            .map((event) => event.split("\n").filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).trimStart()).join("\n")).filter(Boolean);
        return messages.some((message) => {
            try { return pingResponse.safeParse(JSON.parse(message)).success; } catch { return false; }
        });
    } catch { return false; }
};
