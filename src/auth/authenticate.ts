import type { IncomingMessage } from "node:http";
import { timingSafeEqual, createHash } from "node:crypto";
import type { AuthConfig } from "./config";
import { AuthenticationError, type ToolInvocationContext } from "./types";

export const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
export const equalSecret = (a: string, b: string): boolean => timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
export const matchesApiKey = (token: string, keys: readonly string[]): boolean => {
    let matches = false;
    for (const key of keys) matches = equalSecret(token, key) || matches;
    return matches;
};

export const validateServiceCredential = async (accessToken: string): Promise<boolean> => {
    try {
        const { getUserBasicInfo } = await import("../integration/tongji_openapi");
        const result = await getUserBasicInfo({ accessToken, userId: "00001" }) as {
            code?: string; data?: { list?: { userId?: string; name?: string; userTypeName?: string }[] };
        };
        const service = result?.data?.list?.[0];
        return result?.code === "A00000" && service?.userId === "00001" && service.name === "李建中" && service.userTypeName === "教职工";
    } catch { return false; }
};

const singleHeader = (request: IncomingMessage, name: string): string | undefined => {
    const count = request.rawHeaders.filter((_, index) => index % 2 === 0 && request.rawHeaders[index].toLowerCase() === name).length;
    const value = request.headers[name];
    if (count > 1 || Array.isArray(value)) throw new AuthenticationError(400, "invalid_identity_header", "身份凭据请求头必须为单值。");
    return value;
};

export const authenticateRequest = async (
    request: IncomingMessage, config: AuthConfig, verifyOAuth: (token: string) => boolean,
    verifyTongji: (token: string) => Promise<boolean> = validateServiceCredential,
): Promise<ToolInvocationContext> => {
    const tongjiToken = singleHeader(request, "x-tongji-access-token");
    if (tongjiToken !== undefined) {
        const userId = singleHeader(request, "x-user-id");
        if (!userId?.trim()) throw new AuthenticationError(401, "user_id_required", "同济认证必须提供非空 X-User-Id。");
        if (!tongjiToken.trim() || !await verifyTongji(tongjiToken.trim())) {
            throw new AuthenticationError(403, "invalid_service_credential", "同济服务凭据无效或身份服务不可用。");
        }
        return { authentication: "tongji", accessToken: tongjiToken.trim(), userId };
    }
    // The caller's X-User-Id is never consulted in the Bearer branch.
    const authorization = singleHeader(request, "authorization");
    const token = authorization?.match(/^Bearer ([\x21-\x7e]+)$/i)?.[1];
    if (!token) throw new AuthenticationError(401, "authentication_required", "请完成 OAuth 授权或提供有效 API Key。");
    if (matchesApiKey(token, config.allowedApiKeys)) return { authentication: "api_key", userId: token };
    if (verifyOAuth(token)) return { authentication: "oauth", userId: token };
    throw new AuthenticationError(401, "invalid_token", "OAuth 凭据无效、已过期或已撤销。");
};
