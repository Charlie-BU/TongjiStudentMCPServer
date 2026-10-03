import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../server";
import { authenticateRequest } from "../auth/authenticate";
import { loadAuthConfig, type AuthConfig } from "../auth/config";
import { AuthenticationError } from "../auth/types";
import { authorizeTool } from "../auth/tools";
import { hasToolPolicy } from "../auth/tool-policy";
import { OAuthServer } from "../oauth/server";
import { readJSONBody, sendJSON, HttpInputError } from "./http-utils";
import { LEGACY_TEACHER_REVIEWS_PATH, legacyTeacherNameSchema, searchLegacyTeacherReviews } from "../tools/tongji/course/legacy-teacher-reviews/query";
export const createHttpServer = (options: { authConfig?: AuthConfig; oauth?: OAuthServer } = {}) => {
    const config = options.authConfig ?? options.oauth?.config ?? loadAuthConfig();
    const oauth = options.oauth ?? new OAuthServer(config);
    return createServer(async (request, response) => {
        let url: URL;
        try { url = new URL(request.url ?? "/", config.publicUrl); }
        catch { sendJSON(response, 400, { error: "invalid_request" }); return; }
        if (url.pathname === "/health" && request.method === "GET") {
            sendJSON(response, 200, { status: "ok" }); return;
        }
        if (await oauth.handle(request, response, url)) return;
        if (url.pathname !== "/mcp" && url.pathname !== LEGACY_TEACHER_REVIEWS_PATH) {
            sendJSON(response, 404, { error: "not_found" }); return;
        }
        try {
            const invocation = await authenticateRequest(request, config, oauth.verifyAccessToken);
            if (url.pathname === LEGACY_TEACHER_REVIEWS_PATH) {
                authorizeTool("tongji.course.legacy-teacher-reviews", invocation);
                if (request.method !== "GET") {
                    response.setHeader("allow", "GET"); sendJSON(response, 405, { error: "method_not_allowed" }); return;
                }
                const names = url.searchParams.getAll("teacher");
                const parsed = legacyTeacherNameSchema.safeParse(names.length === 1 ? names[0] : undefined);
                if (!parsed.success) { sendJSON(response, 400, { error: "invalid_teacher" }); return; }
                try { sendJSON(response, 200, searchLegacyTeacherReviews(parsed.data)); }
                catch { sendJSON(response, 503, { error: "legacy_teacher_reviews_unavailable" }); }
                return;
            }
            const body = await readJSONBody(request);
            // Reject insufficient tool privileges before dispatch; registration wrappers also enforce this.
            if (body && typeof body === "object" && !Array.isArray(body)) {
                const message = body as { method?: unknown; params?: { name?: unknown } };
                const name = message.params?.name;
                if (message.method === "tools/call" && typeof name === "string" && hasToolPolicy(name)) authorizeTool(name, invocation);
            }
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
            const server = createMcpServer({ invocation });
            response.once("close", () => { void Promise.allSettled([transport.close(), server.close()]); });
            await server.connect(transport);
            await transport.handleRequest(request, response, body);
        } catch (error) {
            if (response.headersSent) return;
            if (error instanceof AuthenticationError) {
                if (error.status === 401 && request.headers["x-tongji-access-token"] === undefined) {
                    response.setHeader("www-authenticate", `Bearer resource_metadata="${oauth.resourceMetadataUrl}", scope="tongji.external"`);
                }
                sendJSON(response, error.status, { error: error.code, message: error.message });
            } else if (error instanceof HttpInputError) sendJSON(response, error.status, { error: "invalid_request", message: error.message });
            else sendJSON(response, 500, { error: "server_error" });
        }
    });
};
