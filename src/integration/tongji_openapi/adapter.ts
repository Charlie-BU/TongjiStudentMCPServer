import axios, { type AxiosRequestConfig } from "axios";
import TongjiOpenapiService from "../cam_auto_generated/tongji_openapi";

// DEFAULT_TONGJI_OPENAPI_BASE_URL 表示同济开放平台的默认地址。
const DEFAULT_TONGJI_OPENAPI_BASE_URL = "https://api.tongji.edu.cn";
// DEFAULT_TIMEOUT_MS 表示 OpenAPI 请求的默认超时时间。
const DEFAULT_TIMEOUT_MS = 10_000;

export class TongjiBusinessError extends Error {
    constructor() { super("Tongji OpenAPI business failure"); }
}

// TongjiOpenapiAdapterConfig 表示同济开放平台适配器的配置。
export interface TongjiOpenapiAdapterConfig {
    accessToken: string;
    userId: string;
    pagination?: Partial<Record<"sinceUserId" | "sinceWid" | "sinceUpdateTime" | "sincePid" | "sinceCreateTime", string>>;
    baseUrl?: string;
    timeoutMs?: number;
}

// TongjiOpenapiAdapter 表示同济开放平台的调用适配器。
export interface TongjiOpenapiAdapter {
    service: TongjiOpenapiService<AxiosRequestConfig>;
    withAuthorization: <T extends Record<string, unknown>>(
        request: T,
    ) => T & { Authorization: string; userId: string };
}

// createTongjiOpenapiAdapter 创建同济开放平台的调用适配器。
export const createTongjiOpenapiAdapter = (
    config: TongjiOpenapiAdapterConfig,
): TongjiOpenapiAdapter => {
    if (!config.accessToken?.trim() || !/^[A-Za-z0-9_-]+$/.test(config.userId ?? "")) {
        throw new Error("trusted service credential and single user identity are required");
    }
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const authorization = `Bearer ${config.accessToken}`;
    const service = new TongjiOpenapiService<AxiosRequestConfig>({
        baseURL: config.baseUrl ?? DEFAULT_TONGJI_OPENAPI_BASE_URL,
        request: (requestConfig, options) =>
            axios
                .request({
                    ...requestConfig,
                    ...options,
                    timeout: options?.timeout ?? timeoutMs,
                })
                .then((response) => {
                    const payload = response.data;
                    if (payload && typeof payload === "object" && ((payload.code !== undefined && payload.code !== "A00000") || (typeof payload.error_code === "number" && payload.error_code !== 0))) {
                        throw new TongjiBusinessError();
                    }
                    return payload;
                }),
    });

    return {
        service,
        withAuthorization: (request) => ({
            ...config.pagination,
            ...request,
            Authorization: authorization,
            userId: config.userId,
        }),
    };
};

