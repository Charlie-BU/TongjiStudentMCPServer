import { randomBytes, createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthConfig } from "../auth/config";
import { digest, equalSecret, matchesApiKey } from "../auth/authenticate";
import { readBody, readJSONBody, sendJSON, HttpInputError } from "../transport/http-utils";
import { OAuthStore } from "./store";

const SCOPE = "tongji.external";
const randomSecret = () => randomBytes(32).toString("base64url");
const escapeHTML = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
class OAuthError extends Error {
    constructor(public readonly code: string, public readonly status = 400) { super(code); }
}

interface Client {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    token_endpoint_auth_method: "none" | "client_secret_post" | "client_secret_basic";
    secretDigest?: string;
}
interface Authorization {
    clientId: string;
    redirectUri: string;
    state?: string;
    challenge: string;
    resource: string;
    csrfDigest?: string;
}
interface Code extends Authorization { ownerDigest: string }
interface Access { clientId: string; ownerDigest: string; resource: string }
const routes = new Set(["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource/mcp", "/register", "/authorize", "/oauth/consent", "/token", "/revoke"]);
const validCallback = (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value);
        return !url.username && !url.password && !url.hash && (url.protocol === "https:" ||
            (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
    } catch { return false; }
};
const one = (parameters: URLSearchParams, name: string, required = true): string => {
    const values = parameters.getAll(name);
    if (values.length > 1 || (required && (!values[0] || !values[0].trim()))) throw new OAuthError("invalid_request");
    return values[0] ?? "";
};

export class OAuthServer {
    readonly resource: string;
    readonly resourceMetadataUrl: string;
    private readonly limits = new Map<string, { count: number; reset: number }>();
    constructor(readonly config: AuthConfig, readonly store = new OAuthStore(), private readonly now = Date.now) {
        this.resource = config.publicUrl + "/mcp";
        this.resourceMetadataUrl = config.publicUrl + "/.well-known/oauth-protected-resource/mcp";
    }
    verifyAccessToken = (token: string): boolean => {
        const record = this.store.read<Access>("access", token);
        return !!record && record.resource === this.resource && this.ownerValid(record.ownerDigest);
    };
    private ownerValid(hash: string): boolean {
        return this.config.allowedApiKeys.some(key => equalSecret(digest(key), hash));
    }
    private getClient(id: string): Client {
        const client = this.store.read<Client>("client", id);
        if (!client) throw new OAuthError("invalid_client", 401);
        return client;
    }
    private checkResource(value: string): void {
        if (value !== this.resource) throw new OAuthError("invalid_target");
    }
    private rateLimit(request: IncomingMessage, path: string): void {
        const now = this.now();
        for (const [key, value] of this.limits) if (value.reset <= now) this.limits.delete(key);
        const key = (request.socket.remoteAddress ?? "local") + path;
        const limit = this.limits.get(key);
        if (limit) { if (++limit.count > 2_000) throw new OAuthError("temporarily_unavailable", 429); }
        else {
            if (this.limits.size >= 4096) throw new OAuthError("temporarily_unavailable", 429);
            this.limits.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
        }
    }
    async handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
        if (!routes.has(url.pathname)) return false;
        const consent = url.pathname === "/oauth/consent";
        response.setHeader("cache-control", "no-store");
        response.setHeader("x-content-type-options", "nosniff");
        if (!consent) {
            response.setHeader("access-control-allow-origin", "*");
            response.setHeader("access-control-allow-headers", "Content-Type, Authorization");
            response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
            if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return true; }
        }
        try {
            const method = request.method;
            const allowed = url.pathname.startsWith("/.well-known/") || url.pathname === "/authorize" ? ["GET"]
                : consent ? ["GET", "POST"] : ["POST"];
            if (!method || !allowed.includes(method)) {
                response.setHeader("allow", allowed.join(", "));
                sendJSON(response, 405, { error: "method_not_allowed" });
            } else if (url.pathname === "/.well-known/oauth-protected-resource/mcp") {
                sendJSON(response, 200, { resource: this.resource, authorization_servers: [this.config.publicUrl], scopes_supported: [SCOPE], bearer_methods_supported: ["header"] });
            } else if (url.pathname === "/.well-known/oauth-authorization-server") {
                sendJSON(response, 200, {
                    issuer: this.config.publicUrl, authorization_endpoint: this.config.publicUrl + "/authorize",
                    token_endpoint: this.config.publicUrl + "/token", registration_endpoint: this.config.publicUrl + "/register",
                    revocation_endpoint: this.config.publicUrl + "/revoke", response_types_supported: ["code"],
                    grant_types_supported: ["authorization_code"], scopes_supported: [SCOPE], code_challenge_methods_supported: ["S256"],
                    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
                    authorization_response_iss_parameter_supported: true,
                });
            } else {
                this.rateLimit(request, url.pathname);
                if (url.pathname === "/register") await this.register(request, response);
                else if (url.pathname === "/authorize") this.authorize(response, url);
                else if (consent) await this.consent(request, response, url);
                else await this.exchange(request, response, url.pathname === "/revoke");
            }
        } catch (error) {
            if (error instanceof OAuthError) sendJSON(response, error.status, { error: error.code });
            else if (error instanceof HttpInputError) sendJSON(response, error.status, { error: "invalid_request" });
            else sendJSON(response, 500, { error: "server_error" });
        }
        return true;
    }
    private async register(request: IncomingMessage, response: ServerResponse): Promise<void> {
        const value = await readJSONBody(request, 16_384);
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new OAuthError("invalid_client_metadata");
        const input = value as Record<string, unknown>;
        const callbacks = input.redirect_uris;
        const method = input.token_endpoint_auth_method ?? "none";
        if (!Array.isArray(callbacks) || callbacks.length < 1 || callbacks.length > 10 || !callbacks.every(validCallback) ||
            (typeof method !== "string" || !["none", "client_secret_post", "client_secret_basic"].includes(method)) ||
            (input.scope !== undefined && input.scope !== SCOPE) ||
            (input.grant_types !== undefined && (!Array.isArray(input.grant_types) || !input.grant_types.includes("authorization_code"))) ||
            (input.response_types !== undefined && (!Array.isArray(input.response_types) || input.response_types.length !== 1 || input.response_types[0] !== "code"))) {
            throw new OAuthError("invalid_client_metadata");
        }
        const secret = method === "none" ? undefined : randomSecret();
        const client: Client = {
            client_id: randomSecret(), client_name: typeof input.client_name === "string" ? input.client_name.slice(0, 200) : "OAuth 客户端",
            redirect_uris: callbacks, token_endpoint_auth_method: method as Client["token_endpoint_auth_method"], secretDigest: secret ? digest(secret) : undefined
        };
        this.store.transaction(db => this.store.put(db, "client", client.client_id, client, null));
        const { secretDigest: _, ...metadata } = client;
        sendJSON(response, 201, {
            ...metadata, client_id_issued_at: Math.floor(this.now() / 1000),
            ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
            grant_types: ["authorization_code"], response_types: ["code"], scope: SCOPE
        });
    }
    private authorize(response: ServerResponse, url: URL): void {
        const p = url.searchParams;
        const client = this.getClient(one(p, "client_id"));
        const redirect = one(p, "redirect_uri");
        if (!client.redirect_uris.includes(redirect)) throw new OAuthError("invalid_request");
        if (one(p, "response_type") !== "code" || one(p, "code_challenge_method") !== "S256") throw new OAuthError("invalid_request");
        const challenge = one(p, "code_challenge");
        if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new OAuthError("invalid_request");
        const resource = one(p, "resource");
        this.checkResource(resource);
        if ((one(p, "scope", false) || SCOPE) !== SCOPE) throw new OAuthError("invalid_scope");
        const record: Authorization = { clientId: client.client_id, redirectUri: redirect, challenge, resource, state: one(p, "state", false) || undefined };
        const id = randomSecret();
        this.store.transaction(db => this.store.put(db, "request", id, record, 600));
        response.writeHead(302, { location: this.config.publicUrl + "/oauth/consent?request=" + id });
        response.end();
    }
    private securityHeaders(response: ServerResponse, callback: string): void {
        response.setHeader("referrer-policy", "same-origin");
        response.setHeader("content-security-policy", `default-src 'none'; form-action 'self' ${new URL(callback).origin}; frame-ancestors 'none'`);
    }
    private async consent(request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
        if (request.method === "GET") {
            const id = one(url.searchParams, "request");
            const csrf = randomSecret();
            const record = this.store.transaction(db => {
                const record = this.store.get<Authorization>(db, "request", id);
                if (!record) throw new OAuthError("invalid_request");
                record.csrfDigest = digest(csrf);
                this.store.put(db, "request", id, record, 600);
                return record;
            });
            const client = this.getClient(record.clientId);
            this.securityHeaders(response, record.redirectUri);
            response.setHeader("set-cookie", `tongji_oauth_${id}=${csrf}; Max-Age=600; Path=/oauth/consent; HttpOnly; SameSite=Strict${this.config.publicUrl.startsWith("https:") ? "; Secure" : ""}`);
            response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
            response.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>同济助手 MCP 授权</title><body><h1>同济助手 MCP 授权</h1><p>应用：${escapeHTML(client.client_name)}（名称由客户端提供）</p><p>回调地址：<code>${escapeHTML(record.redirectUri)}</code></p><p>允许该应用查询课程评价、登录瑞幸并执行瑞幸业务。此授权不授予校园个人工具权限。请输入配置好的 API Key 确认授权，Key 只发送到本服务。</p><form method="post" action="/oauth/consent"><input type="hidden" name="request" value="${id}"><input type="hidden" name="csrf" value="${csrf}"><label>API Key <input type="password" name="api_key" autocomplete="off" maxlength="4096" required></label><button name="decision" value="allow">授权连接</button><button name="decision" value="deny" formnovalidate>拒绝</button></form></body></html>`);
            return;
        }
        if (request.headers.origin && request.headers.origin !== this.config.publicUrl) throw new OAuthError("invalid_request", 403);
        const form = new URLSearchParams(await readBody(request, 16_384));
        const id = one(form, "request");
        if (!/^[A-Za-z0-9_-]{43}$/.test(id)) throw new OAuthError("invalid_request");
        const csrf = one(form, "csrf");
        const cookie = request.headers.cookie?.split(/;\s*/).find(part => part.startsWith(`tongji_oauth_${id}=`))?.split("=")[1];
        const decision = one(form, "decision");
        if (!["allow", "deny"].includes(decision)) throw new OAuthError("invalid_request");
        const target = this.store.transaction(db => {
            const record = this.store.get<Authorization>(db, "request", id);
            if (!record || !cookie || !equalSecret(csrf, cookie) || !record.csrfDigest || !equalSecret(digest(csrf), record.csrfDigest)) throw new OAuthError("invalid_request", 403);
            if (!this.store.get<Client>(db, "client", record.clientId)) throw new OAuthError("invalid_client", 401);
            const redirect = new URL(record.redirectUri);
            if (decision === "deny") redirect.searchParams.set("error", "access_denied");
            else {
                const key = one(form, "api_key");
                if (!matchesApiKey(key, this.config.allowedApiKeys)) throw new OAuthError("access_denied", 401);
                const code = randomSecret();
                this.store.put(db, "code", code, { ...record, csrfDigest: undefined, ownerDigest: digest(key) } satisfies Code, 120);
                redirect.searchParams.set("code", code);
            }
            this.store.get(db, "request", id, true);
            if (record.state !== undefined) redirect.searchParams.set("state", record.state);
            redirect.searchParams.set("iss", this.config.publicUrl);
            return redirect;
        });
        this.securityHeaders(response, target.href);
        response.setHeader("set-cookie", `tongji_oauth_${id}=; Max-Age=0; Path=/oauth/consent; HttpOnly; SameSite=Strict`);
        response.writeHead(302, { location: target.href }); response.end();
    }
    private authenticateClient(request: IncomingMessage, form: URLSearchParams): Client {
        const authorization = request.headers.authorization;
        let id = one(form, "client_id", false);
        let secret = one(form, "client_secret", false);
        let method: Client["token_endpoint_auth_method"] = secret ? "client_secret_post" : "none";
        if (authorization !== undefined) {
            if (!authorization.startsWith("Basic ") || secret) throw new OAuthError("invalid_client", 401);
            const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
            const separator = decoded.indexOf(":");
            if (separator < 0) throw new OAuthError("invalid_client", 401);
            const basicId = decodeURIComponent(decoded.slice(0, separator));
            if (id && id !== basicId) throw new OAuthError("invalid_client", 401);
            id = basicId; secret = decodeURIComponent(decoded.slice(separator + 1)); method = "client_secret_basic";
        }
        const client = this.getClient(id);
        if (client.token_endpoint_auth_method !== method || (method !== "none" && (!client.secretDigest || !equalSecret(digest(secret), client.secretDigest)))) {
            throw new OAuthError("invalid_client", 401);
        }
        return client;
    }
    private async exchange(request: IncomingMessage, response: ServerResponse, revoke: boolean): Promise<void> {
        const form = new URLSearchParams(await readBody(request, 16_384));
        const client = this.authenticateClient(request, form);
        if (revoke) {
            const token = one(form, "token");
            this.store.transaction(db => {
                const record = this.store.get<Access>(db, "access", token);
                if (record?.clientId === client.client_id) this.store.get(db, "access", token, true);
            });
            sendJSON(response, 200, {}); return;
        }
        if (one(form, "grant_type") !== "authorization_code") throw new OAuthError("unsupported_grant_type");
        const code = one(form, "code");
        const verifier = one(form, "code_verifier");
        if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) throw new OAuthError("invalid_grant");
        const resource = one(form, "resource");
        this.checkResource(resource);
        const redirect = one(form, "redirect_uri");
        const token = this.store.transaction(db => {
            const record = this.store.get<Code>(db, "code", code);
            const challenge = createHash("sha256").update(verifier).digest("base64url");
            if (!record || record.clientId !== client.client_id || record.redirectUri !== redirect || record.resource !== resource ||
                !equalSecret(challenge, record.challenge) || !this.ownerValid(record.ownerDigest)) throw new OAuthError("invalid_grant");
            this.store.get(db, "code", code, true);
            const token = "oauth_" + randomSecret();
            this.store.put(db, "access", token, { clientId: client.client_id, ownerDigest: record.ownerDigest, resource } satisfies Access,
                this.config.accessTokenExpireSeconds === -1 ? null : this.config.accessTokenExpireSeconds);
            return token;
        });
        sendJSON(response, 200, {
            access_token: token, token_type: "Bearer", scope: SCOPE,
            ...(this.config.accessTokenExpireSeconds === -1 ? {} : { expires_in: this.config.accessTokenExpireSeconds })
        });
    }
}
