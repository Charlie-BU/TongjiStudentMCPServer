import { z } from "zod";
import { LuckinResponseError } from "../../integration/luckin_coffee/contract";
import { createErrorResult } from "../utils";

export const createLuckinOutputSchema = <S extends z.AnyZodObject>(data: S) => z.object({
    status: z.literal("ok"), data, source: z.literal("Luckin Coffee"),
});

export const runLuckinAction = async <D extends Record<string, unknown>>(action: () => Promise<D>) => {
    try {
        const result = { status: "ok" as const, data: await action(), source: "Luckin Coffee" as const };
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
    } catch (error) {
        let status: "unauthorized" | "upstream_unavailable" = "upstream_unavailable";
        let message = "瑞幸服务暂时不可用，请稍后重试。";
        if (error instanceof z.ZodError) message = "手机号、国家区号或短信验证码格式无效。";
        if (error instanceof LuckinResponseError) {
            if (error.reason === "rejected" || error.reason === "unauthorized") {
                if (error.stage !== "sms") status = "unauthorized";
                message = error.stage === "sms" ? "瑞幸未接受验证码发送请求，请核对手机号或稍后重试。"
                    : error.stage === "login" ? "瑞幸登录未成功，请核对手机号和验证码后重试。"
                        : "瑞幸登录态未通过验证，无法获取 Token，请重新登录。";
            }
            if (error.reason === "cookies_missing") message = "瑞幸未返回完整有效的登录凭据，无法获取 Token，请重新登录。";
            if (error.reason === "security_verification") message = "瑞幸要求额外安全校验或授权，请先在瑞幸开放平台完成。";
            if (error.reason === "rate_limited") message = "瑞幸请求过于频繁，请稍后重试。";
            if (error.reason === "timeout") message = "瑞幸请求超时，结果未确认；请勿立即重复发送验证码或登录。";
            if (error.reason === "malformed") message = "瑞幸服务返回的数据不完整，无法确认操作成功。";
        }
        return createErrorResult(status, message);
    }
};
