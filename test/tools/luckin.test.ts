import assert from "node:assert/strict";
import { after, it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { withLuckinFake, success, smsData, tokenData, loginCookies } from "../fixtures/luckin";

const directory = mkdtempSync(join(tmpdir(), "luckin-tools-"));
const database = require("../../src/storage/database") as typeof import("../../src/storage/database");
const originalOpenDatabase = database.openDatabase;
// 仅在此测试进程替换模块依赖，生产数据库路径始终固定。
const databaseModule = require.cache[require.resolve("../../src/storage/database")]!;
databaseModule.exports = { ...database, openDatabase: () => originalOpenDatabase(join(directory, "mcp.sqlite")) };
const { createMcpServer } = require("../../src/server") as typeof import("../../src/server");
const { readLuckinCredential, saveLuckinCredential } = require("../../src/storage/luckin-credentials") as typeof import("../../src/storage/luckin-credentials");
after(() => {
    databaseModule.exports = database;
    rmSync(directory, { recursive: true, force: true });
});
const input = { mobile: "13800000000", validateCode: "012345" };
const withClient = async (run: (client: Client) => Promise<void>, accessToken: string | undefined = "campus-test-token") => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { accessToken } });
    const client = new Client({ name: "luckin-test", version: "1" });
    try { await server.connect(st); await client.connect(ct); await run(client); }
    finally { await client.close(); await server.close(); }
};
const identity = { data: { list: [{ userId: "student-1" }] } };
const isIdentity = (url?: string) => !url?.includes("lkcoffee.com");

it("注册瑞幸工具：check 无参数且只有 valid 输出，login 不返回 Token", async () => withClient(async client => {
    const { tools } = await client.listTools();
    const luckin = tools.filter(t => t.name.startsWith("luckin.auth."));
    assert.deepEqual(luckin.map(t => t.name).sort(), ["luckin.auth.check", "luckin.auth.login", "luckin.auth.send_sms_code"]);
    const check = luckin.find(t => t.name.endsWith("check"))!;
    assert.deepEqual(check.inputSchema.properties, {});
    assert.deepEqual(Object.keys(check.outputSchema!.properties!), ["valid"]);
    assert.doesNotMatch(JSON.stringify(luckin.find(t => t.name.endsWith("login"))!.outputSchema), /luckyMcpToken/);
}));

it("登录通过同济身份绑定并持久化五字段凭据，结果不暴露 Token", async () => {
    await withLuckinFake(async request => {
        if (isIdentity(request.url)) {
            assert.equal(request.headers.Authorization, "Bearer campus-test-token");
            return { data: identity };
        }
        assert.equal(request.headers.Authorization, undefined);
        if (request.url?.endsWith("/validcode")) return { data: success(smsData, 0) };
        if (request.url?.endsWith("/loginAi")) return { data: success({}), headers: { "set-cookie": loginCookies } };
        return { data: success(tokenData) };
    }, async () => withClient(async client => {
        const sms = await client.callTool({ name: "luckin.auth.send_sms_code", arguments: { mobile: input.mobile } });
        assert.deepEqual(sms.structuredContent, { status: "ok", data: smsData, source: "Luckin Coffee" });
        const result = await client.callTool({ name: "luckin.auth.login", arguments: input });
        assert.deepEqual(result.structuredContent, { status: "ok", data: { authenticated: true }, source: "Luckin Coffee" });
        assert.doesNotMatch(JSON.stringify(result), /fake-luckin-token|012345|13800000000/);
        assert.deepEqual({ ...readLuckinCredential("student-1") }, {
            user_id: "student-1", luckin_token: tokenData.luckyMcpToken, token_date: tokenData.luckyMcpTokenDate,
            token_timeout: tokenData.luckyMcpTokenTimeout, last_verified_at: null,
        });
    }));
});

it("check 使用数据库 Token ping，更新成功验证时间，不泄露凭据", async () => {
    saveLuckinCredential("student-1", tokenData);
    await withLuckinFake(async request => {
        if (isIdentity(request.url)) return { data: identity };
        assert.equal(request.headers.Authorization, `Bearer ${tokenData.luckyMcpToken}`);
        assert.deepEqual(JSON.parse(request.data), { jsonrpc: "2.0", id: 1, method: "ping", params: {} });
        return { data: { jsonrpc: "2.0", id: 1, result: {} } };
    }, async () => withClient(async client => {
        const result = await client.callTool({ name: "luckin.auth.check", arguments: {} });
        assert.deepEqual(result.structuredContent, { valid: true });
        assert.deepEqual(JSON.parse((result.content as { text: string }[])[0].text), { valid: true });
        assert.ok(readLuckinCredential("student-1")!.last_verified_at);
    }));
});

it("缺失凭据、身份异常和上游失败均返回 false，且不删除已有 Token", async () => {
    for (const scenario of ["no-user", "identity-error", "no-token", "unauthorized", "timeout", "rate-limit", "server-error", "malformed"]) {
        await withLuckinFake(async request => {
            if (isIdentity(request.url)) {
                if (scenario === "identity-error") throw new Error("private-identity-error");
                return { data: scenario === "no-user" ? {} : scenario === "no-token"
                    ? { data: { list: [{ userId: "another-user" }] } } : identity };
            }
            if (scenario === "malformed") return { data: { jsonrpc: "2.0", id: 1, error: { code: -1 } } };
            throw new Error(scenario);
        }, async () => withClient(async client => {
            const result = await client.callTool({ name: "luckin.auth.check", arguments: {} });
            assert.notEqual(result.isError, true);
            assert.deepEqual(result.structuredContent, { valid: false }, scenario);
        }));
    }
    assert.equal(readLuckinCredential("student-1")!.luckin_token, tokenData.luckyMcpToken);
});

it("没有 access_token 不调用上游；check 不接受模型指定用户", async () => {
    await withLuckinFake(async () => { throw new Error("must not execute"); }, async requests => {
        await withClient(async client => {
            const result = await client.callTool({ name: "luckin.auth.check", arguments: {} });
            assert.deepEqual(result.structuredContent, { valid: false });
            const login = await client.callTool({ name: "luckin.auth.login", arguments: input });
            assert.equal(login.isError, true);
            const invalid = await client.callTool({ name: "luckin.auth.check", arguments: { userId: "another" } });
            assert.equal(invalid.isError, true);
        }, "");
        assert.equal(requests.length, 0);
    });
});

it("验证码失败不覆盖数据库，非法入参不调用上游", async () => {
    await withLuckinFake(async request => isIdentity(request.url) ? { data: identity } : {
        data: { code: 7, status: "BASE_ERROR", busiCode: "BASE001", content: null, msg: "private-secret" },
    }, async requests => withClient(async client => {
        const result = await client.callTool({ name: "luckin.auth.login", arguments: input });
        assert.equal(result.isError, true);
        assert.doesNotMatch(JSON.stringify(result), /private-secret|012345/);
        assert.equal(requests.length, 2);
        assert.equal(readLuckinCredential("student-1")!.luckin_token, tokenData.luckyMcpToken);
        for (const args of [{ mobile: "bad" }, { ...input, validateCode: 123456 }, { ...input, countryCode: "+86" }]) {
            assert.equal((await client.callTool({ name: "luckin.auth.login", arguments: args })).isError, true);
        }
        assert.equal(requests.length, 2);
    }));
});

const businessCases = [
    ["luckin.shop.search", "queryShopList", { longitude: 121, latitude: 31 }],
    ["luckin.product.search", "searchProductForMcp", { deptId: 1, query: "拿铁" }],
    ["luckin.product.detail", "queryProductDetailInfo", { deptId: 1, productId: 2 }],
    ["luckin.product.switch", "switchProduct", { deptId: 1, productId: 2, skuCode: "fixture-sku", amount: 1,
        attrOperationParam: { attributeId: 1, subAttr: { attributeId: 2, operation: 1 } } }],
    ["luckin.order.preview", "previewOrder", { deptId: 1, productList: [{ amount: 1, productId: 2, skuCode: "fixture-sku" }] }],
    ["luckin.order.create", "createOrder", { deptId: 1, productList: [{ amount: 1, productId: 2, skuCode: "fixture-sku" }],
        longitude: 121, latitude: 31, couponCodeList: ["fixture-coupon"], remark: "test" }],
    ["luckin.order.get", "queryOrderDetailInfo", { orderId: "1234567890123456789" }],
    ["luckin.order.cancel", "cancelOrder", { orderId: "1234567890123456789" }],
] as const;

it("全部 8 个业务工具注册并经过真实 MCP/CAM 调用链，不额外 ping", async () => {
    saveLuckinCredential("student-1", tokenData);
    const data = { content: [{ type: "text", text: '{"orderIdStr":"1234567890123456789"}' }],
        structuredContent: { orderIdStr: "1234567890123456789", payOrderQrCodeUrl: "https://example.com/qr" } };
    const businessRequests: unknown[] = [];
    await withLuckinFake(async request => {
        if (isIdentity(request.url)) return { data: identity };
        assert.equal(request.headers.Authorization, `Bearer ${tokenData.luckyMcpToken}`);
        const body = JSON.parse(request.data);
        assert.equal(body.method, "tools/call");
        businessRequests.push(body.params);
        return { data: { jsonrpc: "2.0", id: 1, result: data } };
    }, async () => withClient(async client => {
        const { tools } = await client.listTools();
        assert.equal(tools.filter(tool => tool.name.startsWith("luckin.")).length, 11);
        for (const [name, upstream, args] of businessCases) {
            const tool = tools.find(tool => tool.name === name)!;
            assert.ok(tool, name);
            assert.doesNotMatch(JSON.stringify(tool.inputSchema), /userId|accessToken|luckin_token/);
            const mutation = name === "luckin.order.create" || name === "luckin.order.cancel";
            assert.equal(tool.annotations?.readOnlyHint, !mutation);
            assert.equal(tool.annotations?.destructiveHint, mutation);
            assert.equal(tool.annotations?.idempotentHint, !mutation);
            const response = await client.callTool({ name, arguments: args });
            assert.notEqual(response.isError, true);
            assert.deepEqual(response.structuredContent, { status: "ok", data, source: "Luckin Coffee" });
            assert.deepEqual(JSON.parse((response.content as { text: string }[])[0].text), response.structuredContent);
            assert.deepEqual(businessRequests.at(-1), { name: upstream, arguments: args });
            assert.doesNotMatch(JSON.stringify(response), /fake-luckin-token|campus-test-token/);
        }
        assert.equal(businessRequests.length, 8);
    }));
});

it("业务工具缺身份/缺凭据不访问瑞幸，非法参数不执行任何请求", async () => {
    await withLuckinFake(async request => {
        assert.ok(isIdentity(request.url));
        return { data: { data: { list: [{ userId: "no-credential-user" }] } } };
    }, async requests => {
        await withClient(async client => {
            const result = await client.callTool({ name: "luckin.shop.search", arguments: { longitude: 121, latitude: 31 } });
            assert.equal(result.isError, true);
        }, "");
        assert.equal(requests.length, 0);
        await withClient(async client => {
            for (const [name, , args] of businessCases) {
                const result = await client.callTool({ name, arguments: args });
                assert.equal(result.isError, true);
            }
            const count = requests.length;
            for (const args of [{ longitude: 121 }, { longitude: 121, latitude: 31, userId: "student-1" }]) {
                assert.equal((await client.callTool({ name: "luckin.shop.search", arguments: args })).isError, true);
            }
            assert.equal(requests.length, count);
        });
    });
});

it("多用户业务请求只使用各自数据库 Token", async () => {
    saveLuckinCredential("student-b", { ...tokenData, luckyMcpToken: "fixture-token-b" });
    const tokens: string[] = [];
    await withLuckinFake(async request => {
        if (isIdentity(request.url)) return { data: { data: { list: [{ userId:
            request.headers.Authorization === "Bearer campus-b" ? "student-b" : "student-1" }] } } };
        tokens.push(String(request.headers.Authorization));
        return { data: { jsonrpc: "2.0", id: 1, result: { content: [] } } };
    }, async () => {
        await Promise.all(["campus-test-token", "campus-b"].map(access => withClient(async client => {
            assert.notEqual((await client.callTool({ name: "luckin.shop.search", arguments: { longitude: 121, latitude: 31 } })).isError, true);
        }, access)));
        assert.deepEqual(tokens.sort(), ["Bearer fake-luckin-token", "Bearer fixture-token-b"]);
    });
});

it("业务错误脱敏；订单操作超时只执行一次并提示先核实状态", async () => {
    const { AxiosError } = await import("axios");
    for (const mode of ["timeout", "unauthorized", "rate-limit", "malformed", "tool-error"]) {
        let calls = 0;
        await withLuckinFake(async request => {
            if (isIdentity(request.url)) return { data: identity };
            calls++;
            if (mode === "tool-error") return { data: { jsonrpc: "2.0", id: 1,
                result: { content: [{ type: "text", text: "private-secret" }], isError: true } } };
            if (mode === "malformed") return { data: { bad: "private-secret" } };
            throw new AxiosError("private-secret", mode === "timeout" ? "ECONNABORTED" : undefined, request,
                undefined, mode === "timeout" ? undefined : { data: "private-secret", status: mode === "unauthorized" ? 401 : 429,
                    statusText: "test", headers: {}, config: request });
        }, async () => withClient(async client => {
            const result = await client.callTool({ name: "luckin.order.create", arguments: businessCases[5][2] });
            assert.equal(result.isError, true);
            assert.doesNotMatch(JSON.stringify(result), /private-secret|fake-luckin-token/);
            if (["timeout", "malformed", "tool-error"].includes(mode)) assert.match(JSON.stringify(result), /不要直接重复/);
            assert.equal(calls, 1);
        }));
    }
});

it("模拟闭环：check false → 短信 → 登录 → check true → 选品预览创建 → 支付后查单 → 取消", async () => {
    const sequence: string[] = [];
    let paid = false;
    await withLuckinFake(async request => {
        if (isIdentity(request.url)) return { data: { data: { list: [{ userId: "workflow-user" }] } } };
        if (request.url?.endsWith("/validcode")) { sequence.push("sms"); return { data: success(smsData, 0) }; }
        if (request.url?.endsWith("/loginAi")) { sequence.push("login"); return { data: success({}), headers: { "set-cookie": loginCookies } }; }
        if (request.url?.endsWith("/getToken")) { sequence.push("token"); return { data: success(tokenData) }; }
        const requestBody = JSON.parse(request.data);
        const method = requestBody.method === "ping" ? "ping" : requestBody.params.name;
        sequence.push(method);
        const payload = method === "queryOrderDetailInfo" ? { orderIdStr: "1234567890123456789", paid, pickupCode: paid ? "A123" : null }
            : method === "createOrder" ? { orderIdStr: "1234567890123456789", payOrderQrCodeUrl: "https://example.com/qr", discountPrice: 10 }
            : method === "previewOrder" ? { discountPrice: 10, couponCodeList: ["fixture-coupon"] }
            : method === "cancelOrder" ? { cancelled: true }
            : { success: true };
        return { data: { jsonrpc: "2.0", id: 1, result: method === "ping" ? {} : { content: [{ type: "text", text: JSON.stringify(payload) }] } } };
    }, async () => withClient(async client => {
        const invoke = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
        assert.deepEqual((await invoke("luckin.auth.check")).structuredContent, { valid: false });
        assert.notEqual((await invoke("luckin.auth.send_sms_code", { mobile: input.mobile })).isError, true);
        assert.notEqual((await invoke("luckin.auth.login", input)).isError, true);
        assert.deepEqual((await invoke("luckin.auth.check")).structuredContent, { valid: true });
        for (const [name, , args] of businessCases.slice(0, 6)) assert.notEqual((await invoke(name, args)).isError, true);
        const before = await invoke("luckin.order.get", { orderId: "1234567890123456789" });
        assert.match(JSON.stringify(before), /false/);
        paid = true; // 模拟用户在瑞幸支付，不调用任何支付 API。
        const afterPayment = await invoke("luckin.order.get", { orderId: "1234567890123456789" });
        assert.match(JSON.stringify(afterPayment), /A123/);
        assert.notEqual((await invoke("luckin.order.cancel", { orderId: "1234567890123456789" })).isError, true);
        assert.deepEqual(sequence, ["sms", "login", "token", "ping", ...businessCases.slice(0,6).map(row=>row[1]), "queryOrderDetailInfo", "queryOrderDetailInfo", "cancelOrder"]);
    }));
});
