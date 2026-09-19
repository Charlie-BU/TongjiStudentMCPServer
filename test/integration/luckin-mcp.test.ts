import assert from "node:assert/strict";
import { it } from "node:test";
import { createLuckinMcpAdapter } from "../../src/integration/luckin_coffee/mcp";
import { LuckinMcpError } from "../../src/integration/luckin_coffee/contract";
import { withLuckinFake } from "../fixtures/luckin";

it("8 个工具通过 CAM 正确传递各自参数，保留长订单号和内容", async () => {
    const client = createLuckinMcpAdapter("fixture-token");
    const productList = [{ amount: 1, productId: 2, skuCode: "fixture-sku" }];
    const cases = [
        ["queryShopList", { longitude: 121, latitude: 31 }],
        ["searchProductForMcp", { deptId: 1, query: "拿铁" }],
        ["queryProductDetailInfo", { deptId: 1, productId: 2 }],
        ["switchProduct", { deptId: 1, productId: 2, skuCode: "fixture-sku", amount: 1,
            attrOperationParam: { attributeId: 1, subAttr: { attributeId: 2, operation: 1 } } }],
        ["previewOrder", { deptId: 1, productList }],
        ["createOrder", { deptId: 1, productList, longitude: 121, latitude: 31, couponCodeList: ["coupon"], remark: "test" }],
        ["queryOrderDetailInfo", { orderId: "1234567890123456789" }],
        ["cancelOrder", { orderId: "1234567890123456789" }],
    ] as const;
    const result = { content: [{ type: "text", text: '{"orderIdStr":"1234567890123456789"}' },
        { type: "image", data: "fixture", mimeType: "image/png" }], structuredContent: { value: 1 } };
    await withLuckinFake(async (request, index) => {
        assert.equal(request.url, "https://gwmcp.lkcoffee.com/order/user/mcp");
        assert.equal(request.headers.Authorization, "Bearer fixture-token");
        assert.equal(request.headers.Cookie, undefined);
        assert.equal(request.params, undefined);
        assert.deepEqual(JSON.parse(request.data), { id: 1, jsonrpc: "2.0", method: "tools/call",
            params: { name: cases[index][0], arguments: cases[index][1] } });
        return { data: { jsonrpc: "2.0", id: 1, result } };
    }, async requests => {
        for (const [name, args] of cases) {
            // 每种工具在上面的测试表中提供各自参数；公共 API 保留独立静态类型。
            assert.deepEqual(await (client[name] as (input: unknown) => Promise<unknown>)(args), result);
        }
        assert.equal(requests.length, 8);
    });
});

it("非法参数不发送请求，JSON-RPC/工具错误脱敏且创建订单不重试", async () => {
    const client = createLuckinMcpAdapter("fixture-token");
    await withLuckinFake(async () => { throw new Error("must not call"); }, async requests => {
        await assert.rejects(client.queryShopList({ longitude: 1 } as never), { reason: "invalid_input" });
        await assert.rejects(client.cancelOrder({ orderId: 123 } as never), { reason: "invalid_input" });
        await assert.rejects(client.queryShopList({ longitude: 1, latitude: 1, delivery: "pick" } as never), { reason: "invalid_input" });
        assert.equal(requests.length, 0);
    });
    for (const data of [
        { jsonrpc: "2.0", id: 1, error: { code: -1, message: "private-token" } },
        { jsonrpc: "2.0", id: 1, result: { isError: true, content: [{ type: "text", text: "private-token" }] } },
        { jsonrpc: "2.0", id: 2, result: { content: [] } },
        { jsonrpc: "2.0", id: 1, result: {} },
    ]) {
        await withLuckinFake(async () => ({ data }), async requests => {
            await assert.rejects(client.createOrder({ deptId: 1, productList: [], longitude: 1, latitude: 1 }), error => {
                assert.ok(error instanceof LuckinMcpError);
                assert.doesNotMatch(String(error), /private-token/);
                assert.equal(error.cause, undefined);
                return true;
            });
            assert.equal(requests.length, 1);
        });
    }
});

it("并发客户端隔离凭据，tools/list 传递游标", async () => {
    await withLuckinFake(async request => {
        const body = JSON.parse(request.data);
        assert.equal(body.method, "tools/list");
        assert.equal(request.headers.Authorization, `Bearer ${body.params.cursor}`);
        return { data: { jsonrpc: "2.0", id: 1, result: { tools: [{ name: "queryShopList", inputSchema: {} }], nextCursor: "next" } } };
    }, async () => {
        const results = await Promise.all(["user-a", "user-b"].map(token => createLuckinMcpAdapter(token).listTools(token)));
        assert.ok(results.every(result => result.nextCursor === "next"));
    });
});
