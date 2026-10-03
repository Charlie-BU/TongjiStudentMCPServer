import assert from "node:assert/strict";
import { it } from "node:test";
import type { IncomingMessage } from "node:http";
import { authenticateRequest } from "../src/auth/authenticate";
import { loadAuthConfig } from "../src/auth/config";
import { AuthenticationError } from "../src/auth/types";
import { authorizeTool, withToolAuthorization } from "../src/auth/tools";
import { TOOL_POLICIES, TOOL_NAMES, toolPolicy, hasToolPolicy } from "../src/auth/tool-policy";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { testAuthConfig, TEST_API_KEY } from "./fixtures/auth";
const request = (...entries: [string, string][]) => ({
    headers: Object.fromEntries(entries.map(([name, value]) => [name.toLowerCase(), value])), rawHeaders: entries.flat(),
}) as IncomingMessage;
it("Tongji credentials take precedence, preserve upstream identity, and never fall back", async () => {
    const accepted = await authenticateRequest(request(["X-Tongji-Access-Token", " service "], ["X-User-Id", " arbitrary upstream ID "], ["Authorization", "Bearer invalid"]), testAuthConfig, () => false, async token => token === "service");
    assert.deepEqual(accepted, { authentication: "tongji", accessToken: "service", userId: " arbitrary upstream ID " });
    for (const token of ["", " ", "invalid"]) {
        await assert.rejects(authenticateRequest(request(["x-tongji-access-token", token], ["x-user-id", "victim"], ["authorization", `Bearer ${TEST_API_KEY}`]), testAuthConfig, () => true, async () => false), { status: 403 });
    }
    for (const id of [undefined, "", " "]) {
        await assert.rejects(authenticateRequest(request(["x-tongji-access-token", "valid"], ...(id === undefined ? [] : [["x-user-id", id] as [string,string]])), testAuthConfig, () => false, async () => true), { status: 401 });
    }
});
it("Bearer constructs identity and ignores forged X-User-Id, including for API keys", async () => {
    const oauth = await authenticateRequest(request(["authorization", "Bearer oauth-token"], ["x-user-id", "victim"]), testAuthConfig, token => token === "oauth-token");
    assert.deepEqual(oauth, { authentication: "oauth", userId: "oauth-token" });
    const key = await authenticateRequest(request(["authorization", `Bearer ${TEST_API_KEY}`]), testAuthConfig, () => { throw new Error("API keys bypass OAuth"); });
    assert.deepEqual(key, { authentication: "api_key", userId: TEST_API_KEY });
    for (const header of [undefined, "", "Bearer ", "Basic anything", "Bearer unknown", "Bearer valid extra"]) {
        const entries: [string,string][] = [["x-user-id", "victim"]];
        if (header !== undefined) entries.push(["authorization", header]);
        await assert.rejects(authenticateRequest(request(...entries), testAuthConfig, () => false), { status: 401 });
    }
});
it("duplicate security headers are rejected before credentials are selected", async () => {
    for (const headers of [
        [["authorization", `Bearer ${TEST_API_KEY}`], ["Authorization", `Bearer ${TEST_API_KEY}`]],
        [["x-tongji-access-token", "good"], ["X-Tongji-Access-Token", "bad"], ["x-user-id", "student"]],
        [["x-tongji-access-token", "good"], ["x-user-id", "one"], ["X-User-Id", "two"]],
    ] as [string,string][][]) {
        await assert.rejects(authenticateRequest(request(...headers), testAuthConfig, () => true, async () => true), { status: 400 });
    }
});
it("all 59 tools have explicit policies; API keys and OAuth cannot authorize campus tools", () => {
    assert.equal(TOOL_NAMES.length, 59);
    assert.equal(TOOL_POLICIES.tongji.length, 42);
    for (const name of TOOL_NAMES) {
        const policy = toolPolicy(name);
        authorizeTool(name, { userId: "student", authentication: "tongji", accessToken: "service" });
        for (const authentication of ["oauth", "api_key"] as const) {
            const invoke = () => authorizeTool(name, { userId: "credential", authentication });
            if (policy === "tongji") assert.throws(invoke, { status: 403 }); else invoke();
        }
        assert.throws(() => authorizeTool(name, { userId: " ", authentication: "oauth" }), AuthenticationError);
    }
    assert.equal(TOOL_POLICIES.authenticated.length, 17);
    assert.equal(hasToolPolicy("toString"), false);
    assert.throws(() => toolPolicy("unconfigured"), /no authentication policy/);
    const server = new McpServer({ name: "policy-test", version: "1" });
    const wrapped = withToolAuthorization(server, { userId: "key", authentication: "api_key" });
    assert.throws(() => wrapped.server.registerTool("unconfigured", {}, async () => ({ content: [] })), /no authentication policy/);
    assert.throws(wrapped.check, /not registered/);
});
it("configuration defaults to 30 days; only -1 or positive integers are accepted", () => {
    const defaults = loadAuthConfig({});
    assert.equal(defaults.accessTokenExpireSeconds, 2592000);
    assert.deepEqual(defaults.allowedApiKeys, []);
    assert.equal(loadAuthConfig({ ACCESS_TOKEN_EXPIRE_SECONDS: "-1" }).accessTokenExpireSeconds, -1);
    for (const value of ["", "0", "-2", "1.5", "1e3", "Infinity", "9007199254740992"]) {
        assert.throws(() => loadAuthConfig({ ACCESS_TOKEN_EXPIRE_SECONDS: value }), /ACCESS_TOKEN_EXPIRE_SECONDS/);
    }
    for (const value of ['"key"', '["short"]', '["has spaces and more than thirty two characters"]', 'not-json']) {
        assert.throws(() => loadAuthConfig({ ALLOWED_API_KEYS: value }), /ALLOWED_API_KEYS/);
    }
    assert.deepEqual(loadAuthConfig({ ALLOWED_API_KEYS: JSON.stringify([TEST_API_KEY,TEST_API_KEY]) }).allowedApiKeys, [TEST_API_KEY]);
    for (const url of ["http://public.example", "https://example.test/mcp", "https://user:secret@example.test", "https://example.test?query=1"]) {
        assert.throws(() => loadAuthConfig({ MCP_PUBLIC_URL: url }), /MCP_PUBLIC_URL/);
    }
});
