export interface AuthConfig {
    allowedApiKeys: readonly string[];
    accessTokenExpireSeconds: number;
    publicUrl: string;
}

export const loadAuthConfig = (environment: NodeJS.ProcessEnv = process.env): AuthConfig => {
    let keys: unknown;
    try { keys = JSON.parse(environment.ALLOWED_API_KEYS ?? "[]"); }
    catch { throw new Error("ALLOWED_API_KEYS must be a JSON array of API keys"); }
    if (!Array.isArray(keys) || keys.some(key => typeof key !== "string" || key.length < 32 || /[^\x21-\x7e]/.test(key))) {
        throw new Error("ALLOWED_API_KEYS must be a JSON array; each key must contain at least 32 non-space ASCII characters");
    }
    const expiry = environment.ACCESS_TOKEN_EXPIRE_SECONDS ?? "2592000";
    const seconds = Number(expiry);
    if (!/^(?:-1|[1-9][0-9]*)$/.test(expiry) || !Number.isSafeInteger(seconds)) {
        throw new Error("ACCESS_TOKEN_EXPIRE_SECONDS must be -1 or a positive safe integer");
    }
    const url = new URL(environment.MCP_PUBLIC_URL ?? `http://localhost:${environment.APP_PORT ?? "3100"}`);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
        !(url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
        throw new Error("MCP_PUBLIC_URL must be an HTTPS origin or a loopback HTTP origin");
    }
    return { allowedApiKeys: [...new Set(keys as string[])], accessTokenExpireSeconds: seconds, publicUrl: url.origin };
};
