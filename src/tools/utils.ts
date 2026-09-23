import { TongjiBusinessError } from "../integration/tongji_openapi";
import axios from "axios";
import type { ToolErrorStatus } from "./types";
import type { ToolInvocationContext } from "../transport/invocation-context";

// unwrapResponseData 提取上游响应中的业务数据。
export const unwrapResponseData = (response: unknown): unknown => {
    if (isRecord(response) && "data" in response) {
        return response.data;
    }
    return response;
};

// isRecord 判断值是否为对象记录。
export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

// readArray 读取数组字段。
export const readArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];

// readStringArray 读取字符串数组字段。
export const readStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map((item) =>
        typeof item === "string" ? item : String(item),
    );
};

// readString 读取字符串字段。
export const readString = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return null;
};

// readNumber 读取数值字段。
export const readNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }
    return null;
};

// readBoolean 读取布尔字段。
export const readBoolean = (value: unknown): boolean | null => {
    if (typeof value === "boolean") {
        return value;
    }
    return null;
};

// isUnauthorizedUpstreamError 判断上游错误是否表示未授权。
export const isUnauthorizedUpstreamError = (error: unknown): boolean =>
    axios.isAxiosError(error) &&
    (error.response?.status === 401 || error.response?.status === 403);

// ErrorMessageConfig 表示工具错误消息的配置。
export interface ErrorMessageConfig {
    unauthorized?: string;
    upstreamUnavailable: string;
}

// createErrorResult 创建 MCP 工具错误结果。
export const createErrorResult = (
    status: ToolErrorStatus,
    message: string,
) => ({
    isError: true,
    content: [
        { type: "text" as const, text: JSON.stringify({ status, message }) },
    ],
});

// toErrorResult 将上游错误转换为 MCP 工具错误结果。
export const toErrorResult = (error: unknown, config: ErrorMessageConfig) => {
    if (error instanceof TongjiBusinessError) {
        return createErrorResult("upstream_unavailable", config.upstreamUnavailable.replace("暂时不可用", "返回异常"));
    }
    if (isUnauthorizedUpstreamError(error)) {
        return createErrorResult(
            "unauthorized",
            config.unauthorized ??
                "同济账号授权无效或已过期，请重新完成授权后再试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        config.upstreamUnavailable,
    );
};

// readCurrentUserId 从工具调用上下文读取当前用户 ID。
export const readCurrentUserId = (invocation: ToolInvocationContext): string | null =>
    invocation.accessToken && invocation.userId ? invocation.userId : null;

// readCursor 从上游响应中读取分页游标。
export const readCursor = (response: unknown, key: string): Record<string, string> => {
    const data = unwrapResponseData(response);
    let value = (isRecord(data) ? data[key] : undefined) ?? (isRecord(response) ? response[key] : undefined);
    if (value === undefined && isRecord(data) && Array.isArray(data.userInfos)) {
        const last = data.userInfos.at(-1);
        if (isRecord(last)) value = last[key === "sinceCardRecordID" ? "cardRecordID" : "visitNo"];
    }
    return (typeof value === "string" || typeof value === "number") && String(value) ? { [key]: String(value) } : {};
};

// readPagination 从上游响应中读取分页信息。
export const readPagination = (response: unknown): { pagination?: Record<string, string> } => {
    const data = unwrapResponseData(response);
    const pagination: Record<string, string> = {};
    for (const key of ["sinceUserId", "sinceWid", "sincePid", "sinceUpdateTime", "sinceCreateTime", "sinceNum", "sinceId"]) {
        const value = (isRecord(data) ? data[key] : undefined) ?? (isRecord(response) ? response[key] : undefined);
        if (typeof value === "string" && value) pagination[key] = value;
    }
    return Object.keys(pagination).length ? { pagination } : {};
};
