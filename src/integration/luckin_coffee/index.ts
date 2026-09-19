import { randomBytes } from "node:crypto";
import axios from "axios";
import { z } from "zod";
import LuckinCoffeeAuthService from "../cam_auto_generated/LuckinCoffeeAuth";
import {
    LUCKIN_SMS_INPUT_SCHEMA, LUCKIN_LOGIN_INPUT_SCHEMA,
    LUCKIN_SMS_DATA_SCHEMA, LUCKIN_TOKEN_DATA_SCHEMA,
    type LuckinSMSInput, type LuckinLoginInput,
} from "./contract";

const DEFAULT_BASE_URL = "https://open.lkcoffee.com";
const CSID = "LK_luckyopen_prod_CSID";
const SSID = "LK_PROD_LUCKYOPEN_SSID";
type IdentityCookies = Record<typeof CSID | typeof SSID, string>;
type Stage = "sms" | "login" | "token";
type Failure = "rejected" | "malformed" | "cookies_missing" | "security_verification"
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

interface RequestOptions {
    stage: Stage;
    identity?: IdentityCookies;
    onSetCookie?: (headers: unknown) => void;
}

// 每次业务调用独立创建客户端。CAM 不序列化 Cookie，因此在手写传输层补齐。
const createLuckinAdapter = (config: LuckinAdapterConfig = {}) => {
    const csrf = randomBytes(24).toString("hex");
    const service = new LuckinCoffeeAuthService<RequestOptions>({
        baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
        request: async <R>(request: {
            url: string; method: string; data?: unknown; params?: unknown;
        }, options?: RequestOptions): Promise<R> => {
            const stage = options?.stage ?? "sms";
            const cookie = [`csrfToken=${csrf}`];
            if (options?.identity) {
                cookie.push(`${CSID}=${options.identity[CSID]}`, `${SSID}=${options.identity[SSID]}`);
            }
            try {
                const response = await axios.request<R>({
                    ...request,
                    params: { _csrf: csrf },
                    headers: {
                        Accept: "application/json", "Content-Type": "application/json",
                        Origin: DEFAULT_BASE_URL, Referer: `${DEFAULT_BASE_URL}/mcp`,
                        Cookie: cookie.join("; "),
                    },
                    timeout: config.timeoutMs ?? 10_000,
                    // 不将手机号/验证码/Cookie 随重定向发送到其他地址，也不自动重试短信或登录。
                    maxRedirects: 0,
                });
                options?.onSetCookie?.(response.headers["set-cookie"]);
                return response.data;
            } catch (error) {
                let reason: Failure = "unavailable";
                if (axios.isAxiosError(error)) {
                    const status = error.response?.status;
                    if (status === 401 || status === 403) reason = "unauthorized";
                    if (status === 429) reason = "rate_limited";
                    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") reason = "timeout";
                }
                throw new LuckinResponseError(stage, reason);
            }
        },
    });
    return { service, csrf };
};

const envelopeSchema = z.object({
    code: z.number().int(), busiCode: z.string(), status: z.string(),
    content: z.unknown(), loginState: z.number().optional(),
});

const readContent = <S extends z.ZodTypeAny>(response: unknown, stage: Stage, schema: S): z.output<S> => {
    const parsed = envelopeSchema.safeParse(response);
    if (!parsed.success) throw new LuckinResponseError(stage, "malformed");
    const envelope = parsed.data;
    if (envelope.code !== 1 || envelope.busiCode !== "BASE000" || envelope.status !== "SUCCESS") {
        throw new LuckinResponseError(stage, "rejected");
    }
    if (stage !== "sms" && envelope.loginState !== 1) {
        throw new LuckinResponseError(stage, "unauthorized");
    }
    const result = schema.safeParse(envelope.content);
    if (!result.success) throw new LuckinResponseError(stage, "malformed");
    return result.data;
};

// 只提取这次成功登录返回的两个 Cookie。按 Set-Cookie 行解析，绝不按逗号切分 Expires。
const readIdentityCookies = (headers: unknown): IdentityCookies => {
    const lines = Array.isArray(headers) ? headers : typeof headers === "string" ? [headers] : [];
    const cookies: Partial<IdentityCookies> = {};
    for (const line of lines) {
        if (typeof line !== "string") continue;
        const [pair, ...attributes] = line.split(";");
        const separator = pair.indexOf("=");
        const name = pair.slice(0, separator).trim();
        if (separator < 0 || (name !== CSID && name !== SSID)) continue;
        const value = pair.slice(separator + 1).trim();
        // RFC cookie-octet，拒绝换行、分号、逗号及歧义的重复身份 Cookie。
        if (!/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/.test(value) || cookies[name]) {
            throw new LuckinResponseError("login", "cookies_missing");
        }
        if (attributes.some((attribute) => /^\s*max-age\s*=\s*-?\d+\s*$/i.test(attribute)
            && Number(attribute.split("=")[1]) <= 0)) {
            throw new LuckinResponseError("login", "cookies_missing");
        }
        cookies[name] = value;
    }
    if (!cookies[CSID] || !cookies[SSID]) throw new LuckinResponseError("login", "cookies_missing");
    return { [CSID]: cookies[CSID], [SSID]: cookies[SSID] };
};

export const sendLuckinSMSCode = async (input: LuckinSMSInput, config: LuckinAdapterConfig = {}) => {
    const args = LUCKIN_SMS_INPUT_SCHEMA.parse(input);
    const { service, csrf } = createLuckinAdapter(config);
    const response = await service.GetSMSCodePOST({
        mobile: args.mobile, callCode: args.countryCode, _csrf: csrf, csrfToken: csrf,
    }, { stage: "sms" });
    const data = readContent(response, "sms", LUCKIN_SMS_DATA_SCHEMA);
    // 不回显上游自由文本，以免其夹带手机号或诊断数据。
    return { ...data, msg: "验证码已发送" };
};

export const loginLuckinAndGetToken = async (input: LuckinLoginInput, config: LuckinAdapterConfig = {}) => {
    const args = LUCKIN_LOGIN_INPUT_SCHEMA.parse(input);
    const { service, csrf } = createLuckinAdapter(config);
    let setCookies: unknown;
    const login = await service.LoginPOST({
        mobile: args.mobile, countryNo: args.countryCode, validateCode: args.validateCode,
        type: 1, _csrf: csrf, csrfToken: csrf,
    }, { stage: "login", onSetCookie: (headers) => { setCookies = headers; } });
    const user = readContent(login, "login", z.object({
        needSecurityVerify: z.boolean().optional(), guestMode: z.boolean().optional(),
        needAuthorized: z.number().optional(),
    }));
    if (user.needSecurityVerify || user.guestMode || (user.needAuthorized ?? 0) !== 0) {
        throw new LuckinResponseError("login", "security_verification");
    }
    const identity = readIdentityCookies(setCookies);
    const token = await service.GetTokenPOST({
        oauthApp: "LUCKIN_MCP_AI", _csrf: csrf, csrfToken: csrf, ...identity,
    }, { stage: "token", identity });
    return readContent(token, "token", LUCKIN_TOKEN_DATA_SCHEMA);
};
