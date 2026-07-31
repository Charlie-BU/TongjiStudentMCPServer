import axios from "axios";
import { ToolStatus } from "./types";

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

// isUnauthorizedUpstreamError 判断上游错误是否表示未授权。
export const isUnauthorizedUpstreamError = (error: unknown): boolean =>
    axios.isAxiosError(error) &&
    (error.response?.status === 401 || error.response?.status === 403);

// createErrorResult 创建 MCP 工具错误结果。
export const createErrorResult = (status: ToolStatus, message: string) => ({
    isError: true,
    content: [
        { type: "text" as const, text: JSON.stringify({ status, message }) },
    ],
});


// toErrorResult 将上游错误转换为 MCP 工具错误结果。
export const toErrorResult = (
    error: unknown,
    upstreamUnavailableMessage = "同济成绩服务暂时不可用，请稍后重试。",
) => {
    if (isUnauthorizedUpstreamError(error)) {
        return createErrorResult(
            "unauthorized",
            "同济账号授权无效或已过期，请重新完成授权后再试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        upstreamUnavailableMessage,
    );
};
