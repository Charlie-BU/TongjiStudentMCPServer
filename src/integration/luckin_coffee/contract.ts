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
