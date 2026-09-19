import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

export const smsData = { msg: "验证码已发送", remain: 60, validate: false };
export const tokenData = {
    luckyMcpToken: "fake-luckin-token", luckyMcpTokenDate: 1797326468904, luckyMcpTokenTimeout: 7767567,
};
export const loginCookies = [
    "LK_luckyopen_prod_CSID=fake-csid; Path=/; Expires=Wed, 23 Sep 2037 11:41:35 GMT",
    "LK_PROD_LUCKYOPEN_SSID=fake-ssid==; Path=/; Max-Age=604800; HttpOnly",
];
export const success = (content: unknown, loginState = 1) => ({
    code: 1, busiCode: "BASE000", status: "SUCCESS", loginState, content,
    uid: "private-diagnostic", msg: "private-upstream-message",
});

export const withLuckinFake = async (
    respond: (config: InternalAxiosRequestConfig, index: number) => Promise<{
        data: unknown; headers?: Record<string, string | string[]>;
    }>,
    run: (requests: AxiosRequestConfig[]) => Promise<void>,
) => {
    const previous = axios.defaults.adapter;
    const requests: AxiosRequestConfig[] = [];
    axios.defaults.adapter = async (config) => {
        requests.push(config);
        const response = await respond(config, requests.length - 1);
        return { ...response, headers: response.headers ?? {}, status: 200, statusText: "OK", config };
    };
    try { await run(requests); } finally { axios.defaults.adapter = previous; }
};
