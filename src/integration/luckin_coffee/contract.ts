import { z } from "zod";

// 手机号、验证码保留字符串，避免丢失前导零；不假定上游只支持六位验证码。
const mobile = z.string().trim().regex(/^\d{5,15}$/).describe("接收瑞幸登录验证码的手机号，不含国家区号。");
const countryCode = z.string().trim().regex(/^[1-9]\d{0,3}$/).default("86")
    .describe("国家或地区电话区号，不含 +，默认 86；发送与登录时保持一致。");

export const LUCKIN_SMS_INPUT_SCHEMA = z.object({ mobile, countryCode }).strict();
export const LUCKIN_LOGIN_INPUT_SCHEMA = z.object({
    mobile,
    countryCode,
    validateCode: z.string().trim().regex(/^\d{1,16}$/).describe("用户收到的短信验证码，使用字符串保留前导零。"),
}).strict();

export type LuckinSMSInput = z.input<typeof LUCKIN_SMS_INPUT_SCHEMA>;
export type LuckinLoginInput = z.input<typeof LUCKIN_LOGIN_INPUT_SCHEMA>;

export const LUCKIN_SMS_DATA_SCHEMA = z.object({
    msg: z.string().describe("验证码发送结果。"),
    remain: z.number().int().nonnegative().describe("上游 remain 原值；时间单位尚未确认。"),
    validate: z.boolean().describe("上游校验标志，不作为发送成功的判断条件。"),
});

export const LUCKIN_TOKEN_DATA_SCHEMA = z.object({
    luckyMcpToken: z.string().min(1).regex(/^\S+$/).describe("瑞幸 MCP Bearer Token；敏感凭据，不得写入日志或聊天历史。"),
    luckyMcpTokenDate: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
        .describe("上游 Token 日期字段原值，具体时间单位和语义待确认。"),
    luckyMcpTokenTimeout: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
        .describe("上游 Token 超时字段原值，不与 Cookie 有效期混用。"),
});

export type Stage = "sms" | "login" | "token";
export type Failure = "rejected" | "malformed" | "cookies_missing" | "security_verification"
    | "timeout" | "rate_limited" | "unauthorized" | "unavailable";

export interface LuckinAdapterConfig {
    baseUrl?: string;
    timeoutMs?: number;
}

// 不保留 Axios error/cause：其中可能包含验证码、Cookie 和上游响应凭据。
export class LuckinResponseError extends Error {
    constructor(public readonly stage: Stage, public readonly reason: Failure) {
        super(`Luckin ${stage}: ${reason}`);
    }
}


// CAM 将 MCP arguments 生成为全可选集合；这里按上游 tools/list 补齐工具约束。
const id = z.number().int().safe();
const product = z.object({ amount: id, productId: id, skuCode: z.string() }).strict();
export const LUCKIN_MCP_ARGUMENT_SCHEMAS = {
    queryShopList: z.object({ longitude: z.number(), latitude: z.number(), deptName: z.string().optional() }).strict(),
    searchProductForMcp: z.object({ deptId: id, query: z.string() }).strict(),
    queryProductDetailInfo: z.object({ deptId: id, productId: id }).strict(),
    switchProduct: z.object({ deptId: id, productId: id, skuCode: z.string(), amount: id,
        attrOperationParam: z.object({ attributeId: id,
            subAttr: z.object({ attributeId: id, operation: id }).strict() }).strict() }).strict(),
    previewOrder: z.object({ deptId: id, productList: z.array(product) }).strict(),
    createOrder: z.object({ deptId: id, productList: z.array(product), longitude: z.number(), latitude: z.number(),
        couponCodeList: z.array(z.string()).optional(), remark: z.string().optional() }).strict(),
    queryOrderDetailInfo: z.object({ orderId: z.string() }).strict(),
    cancelOrder: z.object({ orderId: z.string() }).strict(),
};
export type LuckinMcpToolName = keyof typeof LUCKIN_MCP_ARGUMENT_SCHEMAS;
export type LuckinMcpArguments<N extends LuckinMcpToolName> = z.input<typeof LUCKIN_MCP_ARGUMENT_SCHEMAS[N]>;
export interface LuckinMcpConfig { timeoutMs?: number; }
export class LuckinMcpError extends Error {
    constructor(public readonly reason: "invalid_input" | "unauthorized" | "forbidden" | "timeout" | "rate_limited"
        | "unavailable" | "malformed" | "rpc_error" | "tool_error") {
        super(`Luckin MCP: ${reason}`);
    }
}
export const LUCKIN_MCP_ENVELOPE_SCHEMA = z.object({
    jsonrpc: z.literal("2.0"), id: z.literal(1), result: z.unknown().optional(),
    error: z.object({ code: z.number().int(), message: z.string(), data: z.unknown().optional() }).optional(),
}).passthrough().refine(value => ("result" in value) !== ("error" in value));
export const LUCKIN_MCP_PING_SCHEMA = z.object({}).strict();
export const LUCKIN_MCP_LIST_SCHEMA = z.object({
    tools: z.array(z.object({ name: z.string(), description: z.string().optional(),
        inputSchema: z.record(z.unknown()), outputSchema: z.record(z.unknown()).optional() }).passthrough()),
    nextCursor: z.string().optional(),
}).passthrough();
export const LUCKIN_MCP_RESULT_SCHEMA = z.object({
    content: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()
        .refine(item => item.type !== "text" || typeof item.text === "string")),
    structuredContent: z.record(z.unknown()).optional(), isError: z.boolean().optional(),
}).passthrough();
