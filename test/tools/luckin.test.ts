import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AxiosError } from "axios";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../src/server";
import { withLuckinFake, success, smsData, tokenData, loginCookies } from "../fixtures/luckin";

const withClient = async (run: (client: Client) => Promise<void>) => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { accessToken: "campus-token-must-not-be-used" } });
    const client = new Client({ name: "luckin-test", version: "1" });
    try { await server.connect(st); await client.connect(ct); await run(client); }
    finally { await client.close(); await server.close(); }
};
const input = { mobile: "13800000000", validateCode: "012345" };

describe("Luckin MCP 工具", () => {
    it("公布两个工具及完整 schema，隐藏 Cookie/CSRF 且标记非幂等写操作", async () => {
        await withClient(async (client) => {
            const { tools } = await client.listTools();
            const luckin = tools.filter((tool) => tool.name.startsWith("luckin."));
            assert.deepEqual(luckin.map((t) => t.name).sort(), ["luckin.auth.login", "luckin.auth.send_sms_code"]);
            for (const tool of luckin) {
                assert.equal(tool.annotations?.readOnlyHint, false);
                assert.equal(tool.annotations?.idempotentHint, false);
                assert.ok(tool.outputSchema);
                assert.doesNotMatch(JSON.stringify(tool.inputSchema), /csrf|Cookie|accessToken|oauthApp/);
            }
            const login = luckin.find((t) => t.name.endsWith(".login"))!;
            assert.deepEqual(login.inputSchema.required, ["mobile", "validateCode"]);
            assert.match(JSON.stringify(login.outputSchema), /luckyMcpTokenTimeout/);
        });
    });

    it("两个工具遵循 status/data/source，并仅返回公开契约字段", async () => {
        await withLuckinFake(async (request) => {
            assert.equal(request.headers.Authorization, undefined);
            assert.doesNotMatch(JSON.stringify(request), /campus-token-must-not-be-used/);
            if (request.url?.endsWith("/validcode")) return { data: success(smsData, 0) };
            if (request.url?.endsWith("/loginAi")) return {
                data: success({ name: "private-name", mobile: input.mobile }), headers: { "set-cookie": loginCookies },
            };
            return { data: success({ ...tokenData, sessionKey: "private-session-key" }) };
        }, async () => withClient(async (client) => {
            for (const [name, args, data] of [
                ["luckin.auth.send_sms_code", { mobile: input.mobile }, smsData],
                ["luckin.auth.login", input, tokenData],
            ] as const) {
                const result = await client.callTool({ name, arguments: args });
                assert.notEqual(result.isError, true);
                assert.deepEqual(result.structuredContent, { status: "ok", data, source: "Luckin Coffee" });
                const content = result.content as Array<{ text: string }>;
                assert.deepEqual(JSON.parse(content[0].text), result.structuredContent);
                assert.doesNotMatch(JSON.stringify(result), /private-|fake-csid|fake-ssid|13800000000/);
            }
        }));
    });

    it("验证码失败不继续获取 Token，业务失败和 HTTP 错误不回显凭据", async () => {
        for (const status of [200, 401, 403, 429, 500]) {
            await withLuckinFake(async (request) => {
                const data = { code: 7, status: "BASE_ERROR", busiCode: "BASE001", content: null, msg: "private-secret" };
                if (status !== 200) throw new AxiosError("private-secret", undefined, request, undefined,
                    { data, status, statusText: "test", headers: {}, config: request });
                return { data };
            }, async (requests) => withClient(async (client) => {
                const result = await client.callTool({ name: "luckin.auth.login", arguments: input });
                assert.equal(result.isError, true);
                assert.doesNotMatch(JSON.stringify(result), /private-secret|012345|13800000000|同济账号/);
                assert.equal(requests.length, 1);
            }));
        }
    });

    it("非法入参不能发送短信或触发登录", async () => {
        await withLuckinFake(async () => { throw new Error("must not execute"); }, async (requests) => withClient(async (client) => {
            for (const args of [{ mobile: "bad" }, { ...input, validateCode: 123456 }, { ...input, countryCode: "+86" }]) {
                const result = await client.callTool({ name: "luckin.auth.login", arguments: args });
                assert.equal(result.isError, true);
            }
            assert.equal(requests.length, 0);
        }));
    });
});
