import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllTermCalendars } from "../integration/tongji_openapi";
import type { ToolRegistrationContext } from "./registry";

// TERM_CALENDAR_TOOL_NAME 表示学期日历查询工具名称。
export const TERM_CALENDAR_TOOL_NAME = "tongji.student.term-calendar";

// TermCalendarToolStatus 表示学期日历查询的结果状态。
type TermCalendarToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// TermCalendar 表示单个学期的日历信息。
interface TermCalendar {
    year: number | null;
    term: number | null;
    weekNum: number | null;
    fullName: string | null;
}

// TermCalendarData 表示学期日历的脱敏业务数据。
interface TermCalendarData {
    terms: TermCalendar[];
}

// TermCalendarToolResult 表示学期日历查询的结构化结果。
interface TermCalendarToolResult {
    [key: string]: unknown;
    status: TermCalendarToolStatus;
    data: TermCalendarData;
    source: "Tongji Open Platform";
}

// TERM_CALENDAR_SCHEMA 表示单个学期日历的 MCP 输出结构。
const TERM_CALENDAR_SCHEMA = z.object({
    year: z.number().nullable().describe("学年年份。"),
    term: z.number().nullable().describe("学期序号，1 表示第一学期，2 表示第二学期。"),
    weekNum: z.number().nullable().describe("该学期包含的教学周数。"),
    fullName: z.string().nullable().describe("学期完整名称，例如 2021-2022学年第2学期。"),
});

// TERM_CALENDAR_OUTPUT_SCHEMA 表示学期日历查询的 MCP 输出结构。
const TERM_CALENDAR_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的学期日历。"),
    data: z.object({
        terms: z.array(TERM_CALENDAR_SCHEMA).describe("全部学期日历列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("学期日历数据来源。"),
});

// registerAllTermCalendarTool 注册学期日历查询工具。
export const registerAllTermCalendarTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        TERM_CALENDAR_TOOL_NAME,
        {
            title: "查询学期日历",
            description:
                "查询同济大学所有学期的日历编号信息，返回年份、学期、周数和学期全称。学期编号可用于查询课表、成绩等其他接口。",
            inputSchema: {},
            outputSchema: TERM_CALENDAR_OUTPUT_SCHEMA,
        },
        async () => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getAllTermCalendars(
                    { accessToken },
                );
                const data = normalizeTermCalendarData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济学期日历服务返回异常，请稍后重试。",
                    );
                }
                const result: TermCalendarToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error);
            }
        },
    );
};

// unwrapResponseData 提取上游响应中的业务数据。
const unwrapResponseData = (response: unknown): unknown => {
    if (isRecord(response) && "data" in response) {
        return response.data;
    }
    return response;
};

// normalizeTermCalendarData 裁剪并规范化学期日历业务数据。
const normalizeTermCalendarData = (data: unknown): TermCalendarData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    const terms = data.map(normalizeTermCalendar);
    return { terms };
};

// normalizeTermCalendar 裁剪并规范化单条学期日历。
const normalizeTermCalendar = (item: unknown): TermCalendar => {
    const source = isRecord(item) ? item : {};
    return {
        year: readNumber(source.year),
        term: readNumber(source.term),
        weekNum: readNumber(source.weekNum),
        fullName: readString(source.fullName),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: TermCalendarData): boolean =>
    data.terms.length === 0;

// readString 读取字符串字段。
const readString = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return null;
};

// readNumber 读取数值字段。
const readNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }
    return null;
};

// toErrorResult 将上游错误转换为 MCP 工具错误结果。
const toErrorResult = (error: unknown) => {
    if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
    ) {
        return createErrorResult(
            "unauthorized",
            "同济账号授权无效或已过期，请重新完成授权后再试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        "同济学期日历服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果。
const createErrorResult = (
    status: Exclude<TermCalendarToolStatus, "ok" | "empty">,
    message: string,
) => ({
    isError: true,
    content: [
        { type: "text" as const, text: JSON.stringify({ status, message }) },
    ],
});

// isRecord 判断值是否为对象记录。
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
