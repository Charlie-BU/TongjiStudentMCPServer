import axios from "axios";
import { z } from "zod";
import LuckinCoffeeMCPService from "../cam_auto_generated/LuckinCoffeeMCP";
import type { CallMcpBodyRequest } from "../cam_auto_generated/LuckinCoffeeMCP/namespaces";
import {
    LUCKIN_MCP_ARGUMENT_SCHEMAS, LUCKIN_MCP_ENVELOPE_SCHEMA, LUCKIN_MCP_LIST_SCHEMA,
    LUCKIN_MCP_PING_SCHEMA, LUCKIN_MCP_RESULT_SCHEMA, LuckinMcpError,
    type LuckinMcpArguments, type LuckinMcpConfig, type LuckinMcpToolName
} from "./contract";

const decodeResponse = (data: unknown): unknown => {
    if (typeof data !== "string") return data;
    try { return JSON.parse(data); } catch { /* SSE */ }
    const matches: unknown[] = [];
    for (const event of data.replace(/\r\n/g, "\n").split("\n\n")) {
        const text = event.split("\n").filter(line => line.startsWith("data:"))
            .map(line => line.slice(5).trimStart()).join("\n");
        if (!text) continue;
        try {
            const message = JSON.parse(text);
            if (message?.id === 1) matches.push(message);
        } catch { throw new LuckinMcpError("malformed"); }
    }
    if (matches.length !== 1) throw new LuckinMcpError("malformed");
    return matches[0];
};

// 每个实例绑定单个用户凭据；CAM 只负责序列化，手写传输层注入 Bearer 并处理 JSON/SSE。
export const createLuckinMcpAdapter = (token: string, config: LuckinMcpConfig = {}) => {
    if (!token || /\s/.test(token)) throw new LuckinMcpError("unauthorized");
    const service = new LuckinCoffeeMCPService({
        baseURL: "https://gwmcp.lkcoffee.com",
        request: async <R>(request: { url: string; method: string; data?: unknown }): Promise<R> => {
            try {
                const response = await axios.request({
                    ...request,
                    headers: {
                        Authorization: `Bearer ${token}`, "Content-Type": "application/json",
                        Accept: "application/json, text/event-stream"
                    },
                    timeout: config.timeoutMs ?? 5000, maxRedirects: 0, maxContentLength: 2 * 1024 * 1024,
                });
                if (response.status !== 200) throw new LuckinMcpError("unavailable");
                return decodeResponse(response.data) as R;
            } catch (error) {
                if (error instanceof LuckinMcpError) throw error;
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) throw new LuckinMcpError("unauthorized");
                    if (error.response?.status === 403) throw new LuckinMcpError("forbidden");
                    if (error.response?.status === 429) throw new LuckinMcpError("rate_limited");
                    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") throw new LuckinMcpError("timeout");
                }
                // 不携带 Axios config/cause，避免泄露 Bearer、订单信息；不自动重试写操作。
                throw new LuckinMcpError("unavailable");
            }
        },
    });
    const invoke = async <S extends z.ZodTypeAny>(method: string, params: CallMcpBodyRequest["params"], schema: S): Promise<z.output<S>> => {
        const response = await service.CallMcpPOST({ jsonrpc: "2.0", id: 1, method, params });
        const envelope = LUCKIN_MCP_ENVELOPE_SCHEMA.safeParse(response);
        if (!envelope.success) throw new LuckinMcpError("malformed");
        if (envelope.data.error) throw new LuckinMcpError("rpc_error");
        const parsed = schema.safeParse(envelope.data.result);
        if (!parsed.success) throw new LuckinMcpError("malformed");
        return parsed.data;
    };
    const callTool = async <N extends LuckinMcpToolName>(name: N, input: LuckinMcpArguments<N>) => {
        const parsed = LUCKIN_MCP_ARGUMENT_SCHEMAS[name].safeParse(input);
        if (!parsed.success) throw new LuckinMcpError("invalid_input");
        const result = await invoke("tools/call", { name, arguments: parsed.data }, LUCKIN_MCP_RESULT_SCHEMA);
        if (result.isError) throw new LuckinMcpError("tool_error");
        // 业务文本与非文本内容原样保留；不臆造上游未提供的 outputSchema。
        return result;
    };
    return {
        ping: () => invoke("ping", {}, LUCKIN_MCP_PING_SCHEMA),
        listTools: (cursor?: string) => invoke("tools/list", cursor === undefined ? {} : { cursor }, LUCKIN_MCP_LIST_SCHEMA),
        queryShopList: (args: LuckinMcpArguments<"queryShopList">) => callTool("queryShopList", args),
        searchProductForMcp: (args: LuckinMcpArguments<"searchProductForMcp">) => callTool("searchProductForMcp", args),
        queryProductDetailInfo: (args: LuckinMcpArguments<"queryProductDetailInfo">) => callTool("queryProductDetailInfo", args),
        switchProduct: (args: LuckinMcpArguments<"switchProduct">) => callTool("switchProduct", args),
        previewOrder: (args: LuckinMcpArguments<"previewOrder">) => callTool("previewOrder", args),
        createOrder: (args: LuckinMcpArguments<"createOrder">) => callTool("createOrder", args),
        queryOrderDetailInfo: (args: LuckinMcpArguments<"queryOrderDetailInfo">) => callTool("queryOrderDetailInfo", args),
        cancelOrder: (args: LuckinMcpArguments<"cancelOrder">) => callTool("cancelOrder", args),
    };
};

// 已实测 ping 受瑞幸 Token 鉴权保护；所有检测失败统一返回 false。
export const verifyLuckinToken = async (token: string): Promise<boolean> => {
    try { await createLuckinMcpAdapter(token).ping(); return true; }
    catch { return false; }
};
