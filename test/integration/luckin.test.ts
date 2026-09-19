import { LuckinResponseError } from "../../src/integration/luckin_coffee/contract";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AxiosError } from "axios";
import { loginLuckinAndGetToken, sendLuckinSMSCode } from "../../src/integration/luckin_coffee/auth";
import { withLuckinFake, success, smsData, tokenData, loginCookies } from "../fixtures/luckin";

const config = { baseUrl: "https://luckin.example.test/", timeoutMs: 1234 };
const input = { mobile: "13800000000", validateCode: "012345" };
const hasReason = (reason: string) => (error: unknown) =>
    error instanceof LuckinResponseError && error.reason === reason;

describe("Luckin CAM 手写适配器", () => {
    it("发送短信应补齐 CSRF Cookie，保留区号映射且不携带登录态", async () => {
        await withLuckinFake(async () => ({ data: success({ ...smsData, secret: "private" }, 0) }), async (requests) => {
            assert.deepEqual(await sendLuckinSMSCode({ mobile: input.mobile }, config), smsData);
            const request = requests[0];
            assert.equal(request.url, "https://luckin.example.test/capi/resource/m/sys/base/validcode");
            assert.deepEqual(JSON.parse(request.data), { mobile: input.mobile, callCode: "86" });
            assert.match(request.params._csrf, /^[a-f0-9]{48}$/);
            assert.equal(request.headers?.Cookie, `csrfToken=${request.params._csrf}`);
            assert.equal(request.headers?.Authorization, undefined);
            assert.equal(request.timeout, 1234);
            assert.equal(request.maxRedirects, 0);
        });
    });

    it("登录成功后顺序获取 Token，两个 Cookie 完整传递且仅返回 Token 白名单", async () => {
        await withLuckinFake(async (_, index) => index === 0
            ? { data: success({ userId: "private-user", needSecurityVerify: false }), headers: { "set-cookie": loginCookies } }
            : { data: success({ ...tokenData, mobile: input.mobile, sessionKey: "private-session" }) }, async (requests) => {
            assert.deepEqual(await loginLuckinAndGetToken({ ...input, countryCode: "852" }, config), tokenData);
            assert.equal(requests.length, 2);
            assert.equal(requests[0].url, "https://luckin.example.test/capi/resource/m/user/loginAi");
            assert.deepEqual(JSON.parse(requests[0].data), {
                mobile: input.mobile, countryNo: "852", validateCode: "012345", type: 1,
            });
            const csrf = requests[0].params._csrf;
            assert.equal(requests[0].headers?.Cookie, `csrfToken=${csrf}`);
            assert.equal(requests[1].url, "https://luckin.example.test/capi/resource/m/oauth/mcp/getToken");
            assert.deepEqual(JSON.parse(requests[1].data), { oauthApp: "LUCKIN_MCP_AI" });
            assert.equal(requests[1].params._csrf, csrf);
            assert.equal(requests[1].headers?.Cookie,
                `csrfToken=${csrf}; LK_luckyopen_prod_CSID=fake-csid; LK_PROD_LUCKYOPEN_SSID=fake-ssid==`);
            assert.equal(requests[1].headers?.Authorization, undefined);
        });
    });

    it("HTTP 200 业务失败即使设置 Cookie 也不能继续获取 Token", async () => {
        for (const response of [
            { code: 7, busiCode: "BASE001", status: "BASE_ERROR", content: null, msg: "private-error" },
            { ...success({}), status: "BASE_ERROR" }, { ...success({}), busiCode: "BASE001" },
            { ...success({}), code: 7 }, success({}, 0), null, "<html>private-error</html>", success(null),
        ]) await withLuckinFake(async () => ({ data: response, headers: { "set-cookie": loginCookies } }), async (requests) => {
            await assert.rejects(loginLuckinAndGetToken(input, config), LuckinResponseError);
            assert.equal(requests.length, 1);
        });
    });

    it("拒绝缺失、删除、重复或包含注入字符的身份 Cookie", async () => {
        for (const cookies of [undefined, [], [loginCookies[0]], [loginCookies[1]],
            [loginCookies[0], "LK_PROD_LUCKYOPEN_SSID=; Max-Age=0"],
            [loginCookies[0], "LK_PROD_LUCKYOPEN_SSID=deleted; Max-Age=0"],
            [...loginCookies, "LK_PROD_LUCKYOPEN_SSID=another-value; Path=/"],
            [loginCookies[0], "LK_PROD_LUCKYOPEN_SSID=bad,Injected=yes"],
        ]) await withLuckinFake(async () => ({ data: success({}), headers: cookies ? { "set-cookie": cookies } : undefined }), async (requests) => {
            await assert.rejects(loginLuckinAndGetToken(input, config), hasReason("cookies_missing"), JSON.stringify(cookies));
            assert.equal(requests.length, 1);
        });
    });

    it("需要额外安全校验、授权或访客模式时停止登录流程", async () => {
        for (const content of [{ needSecurityVerify: true }, { needAuthorized: 1 }, { guestMode: true }]) {
            await withLuckinFake(async () => ({ data: success(content), headers: { "set-cookie": loginCookies } }), async (requests) => {
                await assert.rejects(loginLuckinAndGetToken(input, config), hasReason("security_verification"));
                assert.equal(requests.length, 1);
            });
        }
    });

    it("校验 Token 业务状态及字段，不把部分成功作为完整登录结果", async () => {
        for (const response of [success({}), success({ ...tokenData, luckyMcpToken: "" }),
            success({ ...tokenData, luckyMcpTokenDate: "1797326468904" }),
            success({ ...tokenData, luckyMcpTokenTimeout: -1 }), success(tokenData, 0),
            { code: 7, busiCode: "BASE001", status: "BASE_ERROR", content: null },
        ]) await withLuckinFake(async (_, index) => index === 0
            ? { data: success({}), headers: { "set-cookie": loginCookies } }
            : { data: response }, async (requests) => {
            await assert.rejects(loginLuckinAndGetToken(input, config), LuckinResponseError);
            assert.equal(requests.length, 2);
        });
    });

    it("并发登录的 CSRF 与两枚 Cookie 按调用隔离", async () => {
        const csrfByMobile = new Map<string, string>();
        await withLuckinFake(async (request) => {
            const body = JSON.parse(request.data);
            if (request.url?.endsWith("/loginAi")) {
                csrfByMobile.set(body.mobile, request.params._csrf);
                await new Promise<void>((resolve) => setImmediate(resolve));
                return { data: success({}), headers: { "set-cookie": [
                    `LK_luckyopen_prod_CSID=csid-${body.mobile}; Path=/`,
                    `LK_PROD_LUCKYOPEN_SSID=ssid-${body.mobile}; HttpOnly`,
                ] } };
            }
            const cookie = String(request.headers.Cookie);
            const mobile = cookie.match(/CSID=csid-(\d+)/)?.[1];
            assert.ok(mobile);
            assert.ok(cookie.includes(`SSID=ssid-${mobile}`));
            assert.equal(request.params._csrf, csrfByMobile.get(mobile));
            return { data: success({ ...tokenData, luckyMcpToken: `token-${mobile}` }) };
        }, async (requests) => {
            const results = await Promise.all([input.mobile, "13900000000"].map((mobile) =>
                loginLuckinAndGetToken({ ...input, mobile }, config)));
            assert.deepEqual(results.map((r) => r.luckyMcpToken), ["token-13800000000", "token-13900000000"]);
            assert.equal(new Set(csrfByMobile.values()).size, 2);
            assert.equal(requests.length, 4);
        });
    });

    it("网络错误被脱敏且不重试；非法输入不请求上游", async () => {
        await withLuckinFake(async (request) => { throw new AxiosError("private-secret", "ETIMEDOUT", request); }, async (requests) => {
            await assert.rejects(sendLuckinSMSCode({ mobile: input.mobile }, config), (error: unknown) => {
                assert.ok(error instanceof LuckinResponseError);
                assert.equal(error.reason, "timeout");
                assert.doesNotMatch(JSON.stringify(error), /private-secret|13800000000/);
                return true;
            });
            assert.equal(requests.length, 1);
            for (const invalid of [{ ...input, mobile: "invalid" }, { ...input, validateCode: 12345 },
                { ...input, countryCode: "86;evil" }, { ...input, csrfToken: "injected" }]) {
                await assert.rejects(loginLuckinAndGetToken(invalid as never, config));
            }
            assert.equal(requests.length, 1);
        });
    });
});
