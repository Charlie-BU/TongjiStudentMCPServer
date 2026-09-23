import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type TongjiOpenapiAdapterConfig } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import { createErrorResult, isRecord, readPagination, toErrorResult } from "../utils";

// sanitizeCampusData 对敏感数据进行脱敏处理，防止泄露。
const privateKey = /^(authorization|access_?token|refresh_?token|client_?secret|userId|studentId|studentIds|studentIdList|idCard|idCardNo|identityNo|logTrace|hostUrl|zcode)$/i;
export const sanitizeCampusData = (value: unknown, accessToken: string): unknown => {
    if (typeof value === "string") return value.split(accessToken).join("[redacted]");
    if (Array.isArray(value)) return value.map(item => sanitizeCampusData(item, accessToken));
    if (isRecord(value)) return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !privateKey.test(key))
        .map(([key, item]) => [key, sanitizeCampusData(item, accessToken)]));
    return value;
};

// 工具只声明业务请求和响应转换；注册、鉴权、校验、异常及协议封装统一在此处理。
type CampusResponse<S extends z.ZodRawShape, O extends z.AnyZodObject> = {
    data: z.ZodTypeAny;
    output?: never;
    mapResponse?: never;
} | {
    data?: never;
    output: O;
    // 保留已有工具的字段映射、空值语义和游标格式；undefined 表示上游数据异常。
    mapResponse: (response: unknown, input: z.output<z.ZodObject<S>>) => z.input<O> | undefined;
};

// redactToken 对敏感数据进行脱敏处理，防止泄露。
const redactToken = (value: unknown, token: string): unknown => {
    if (typeof value === "string") return value.split(token).join("[redacted]");
    if (Array.isArray(value)) return value.map(item => redactToken(item, token));
    if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactToken(item, token)]));
    return value;
};

// campusTool 定义了同济校园平台工具的通用结构，包含请求和响应转换。
export const campusTool = <S extends z.ZodRawShape, O extends z.AnyZodObject>(definition: {
    name: string;
    title: string;
    description: string;
    input: z.ZodObject<S>;
    write?: boolean;
    errors?: { invalidResponse?: string; upstreamUnavailable?: string };
    validate?: (input: z.output<z.ZodObject<S>>) => string | undefined;
    query: (config: TongjiOpenapiAdapterConfig, input: z.output<z.ZodObject<S>>) => Promise<unknown>;
} & CampusResponse<S, O>) => ({
    name: definition.name,
    register(server: McpServer, context: ToolRegistrationContext): void {
        const output = definition.output ?? z.object({ status: z.enum(["ok", "empty"]), data: definition.data!.nullable(), pagination: z.record(z.string()).optional(), source: z.literal("Tongji Open Platform") });
        const inputSchema = definition.input.strict();
        server.registerTool<typeof inputSchema, typeof output>(definition.name, {
            title: definition.title,
            description: definition.description + " 仅操作当前登录用户；身份及凭据由 Agent 提供。" + (definition.write ? " 仅在用户明确要求执行该操作时调用；失败后先核实结果，不自动重试。" : ""),
            inputSchema,
            outputSchema: output,
            annotations: { readOnlyHint: !definition.write, destructiveHint: !!definition.write, idempotentHint: !definition.write, openWorldHint: true },
        }, async input => {
            const { accessToken, userId } = context.invocation;
            if (!accessToken || !userId) return createErrorResult("unauthorized", "未提供同济账号授权，请重新完成授权后再试。");
            const invalid = definition.validate?.(input);
            if (invalid) return createErrorResult("invalid_arguments", invalid);
            try {
                const response = await definition.query({ accessToken, userId }, input);
                if (!isRecord(response) || (response.code !== "A00000" && (response.code !== undefined || !definition.mapResponse)) || !("data" in response)) {
                    return createErrorResult("upstream_unavailable", definition.write ? "上游未确认操作成功，请先核实结果，不要自动重试。" : (definition.errors?.invalidResponse ?? "同济服务返回异常，请稍后重试。"));
                }
                let result: Record<string, unknown>;
                if (definition.mapResponse) {
                    // 显式输出 Schema 裁剪字段，保留旧契约中已脱敏的业务身份展示字段。
                    const mapped = definition.mapResponse(response, input);
                    if (mapped === undefined) return createErrorResult("upstream_unavailable", definition.errors?.invalidResponse ?? "同济服务返回的数据格式异常。");
                    const parsed = output.safeParse({ ...mapped, data: redactToken(mapped.data, accessToken) });
                    if (!parsed.success) return createErrorResult("upstream_unavailable", definition.errors?.invalidResponse ?? "同济服务返回的数据格式异常。");
                    result = parsed.data;
                } else {
                    const parsed = definition.data.nullable().safeParse(sanitizeCampusData(response.data ?? null, accessToken));
                    if (!parsed.success) return createErrorResult("upstream_unavailable", definition.errors?.invalidResponse ?? "同济服务返回的数据格式异常。");
                    const data = parsed.data;
                    const empty = data === null || (Array.isArray(data) && data.length === 0)
                        || (isRecord(data) && Array.isArray(data.list) && data.list.length === 0);
                    result = { status: !definition.write && empty ? "empty" : "ok", data, ...readPagination(sanitizeCampusData(response, accessToken)), source: "Tongji Open Platform" };
                }
                return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
            } catch (error) {
                return toErrorResult(error, { upstreamUnavailable: definition.write ? "操作结果尚未确认，请先核实结果，不要自动重试。" : (definition.errors?.upstreamUnavailable ?? "同济服务暂时不可用，请稍后重试。") });
            }
        });
    },
});

