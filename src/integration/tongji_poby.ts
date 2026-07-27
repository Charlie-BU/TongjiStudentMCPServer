import axios, { type AxiosRequestConfig } from "axios";
import TongjiPobyService from "./openapi/tongji_poby";

// DEFAULT_TONGJI_POBY_BASE_URL 表示同济 Poby 服务的默认地址。
const DEFAULT_TONGJI_POBY_BASE_URL = "https://app.tongji.edu.cn/wallbreakerApi";
// DEFAULT_TIMEOUT_MS 表示 OpenAPI 请求的默认超时时间。
const DEFAULT_TIMEOUT_MS = 10_000;

// TongjiPobyAdapterConfig 表示同济 Poby 服务适配器的配置。
interface TongjiPobyAdapterConfig {
    baseUrl?: string;
    sessionId?: string;
    timeoutMs?: number;
}

// TongjiPobyAdapter 表示同济 Poby 服务的调用适配器。
interface TongjiPobyAdapter {
    service: TongjiPobyService<AxiosRequestConfig>;
    withSessionId: <T extends Record<string, unknown>>(
        request: T,
    ) => T & { JSESSIONID: string };
}

// createTongjiPobyAdapter 创建同济 Poby 服务的调用适配器。
export const createTongjiPobyAdapter = (
    config: TongjiPobyAdapterConfig,
): TongjiPobyAdapter => {
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const sessionCookie = config.sessionId
        ? `JSESSIONID=${config.sessionId}`
        : undefined;
    const service = new TongjiPobyService<AxiosRequestConfig>({
        baseURL: config.baseUrl ?? DEFAULT_TONGJI_POBY_BASE_URL,
        request: (requestConfig, options) =>
            axios
                .request({
                    ...requestConfig,
                    ...options,
                    headers: {
                        ...requestConfig.headers,
                        ...options?.headers,
                        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
                    },
                    timeout: options?.timeout ?? timeoutMs,
                })
                .then((response) => response.data),
    });

    return {
        service,
        withSessionId: (request) => {
            if (!config.sessionId) {
                throw new Error("Tongji Poby session ID is required");
            }
            return { ...request, JSESSIONID: config.sessionId };
        },
    };
};
