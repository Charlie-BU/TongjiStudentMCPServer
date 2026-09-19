import assert from "node:assert/strict";
import { it } from "node:test";
import axios, { AxiosError } from "axios";
import { verifyLuckinToken } from "../../src/integration/luckin_coffee/mcp";

it("ping 接受 JSON/SSE 成功响应，拒绝协议错误、错 ID、异常状态和传输失败", async () => {
    const original = axios.defaults.adapter;
    try {
        for (const [data, status, valid] of [
            [{ jsonrpc: "2.0", id: 1, result: {} }, 200, true],
            ['data: {"jsonrpc":"2.0","id":1,"result":{}}\r\n\r\n', 200, true],
            ['{"jsonrpc":"2.0","id":1,"result":{}}', 200, true],
            [{ jsonrpc: "2.0", id: 2, result: {} }, 200, false],
            [{ jsonrpc: "2.0", id: 1, error: { code: -1 } }, 200, false],
            [{}, 200, false], ["not-json", 200, false],
            [{ jsonrpc: "2.0", id: 1, result: {} }, 401, false],
            [{}, 403, false], [{}, 429, false], [{}, 500, false],
        ] as const) {
            axios.defaults.adapter = async config => {
                assert.equal(config.headers.Authorization, "Bearer fixture-token");
                assert.equal(config.timeout, 5000);
                assert.equal(config.maxRedirects, 0);
                return { data, status, statusText: "test", headers: {}, config };
            };
            assert.equal(await verifyLuckinToken("fixture-token"), valid);
        }
        axios.defaults.adapter = async () => { throw new AxiosError("private-timeout", "ECONNABORTED"); };
        assert.equal(await verifyLuckinToken("fixture-token"), false);
        assert.equal(await verifyLuckinToken(""), false);
    } finally { axios.defaults.adapter = original; }
});
