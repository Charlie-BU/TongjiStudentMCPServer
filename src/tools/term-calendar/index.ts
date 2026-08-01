import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllTermCalendars } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readBoolean,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    TermCalendar,
    TermCalendarData,
    TermCalendarToolResult,
} from "./types";

// TERM_CALENDAR_TOOL_NAME 表示学期日历查询工具名称。
export const TERM_CALENDAR_TOOL_NAME = "tongji.student.term-calendar";

// TERM_CALENDAR_SCHEMA 表示单个学期日历的 MCP 输出结构。
const TERM_CALENDAR_SCHEMA = z.object({
    id: z.number().nullable().describe("学期记录ID。"),
    year: z.number().nullable().describe("学年起始年份。"),
    term: z.number().nullable().describe("学期编号，1 表示第一学期，2 表示第二学期。"),
    beginDay: z.number().nullable().describe("学期开始日期（Unix 时间戳，毫秒）。"),
    endDay: z.number().nullable().describe("学期结束日期（Unix 时间戳，毫秒）。"),
    weekNum: z.number().nullable().describe("该学期包含的教学周数。"),
    weekBenginDay: z.number().nullable().describe("每周起始日（1=周日，2=周一）。"),
    gradePartOne: z.string().nullable().describe("学年第一部分，例如 2021。"),
    gradePartTwo: z.string().nullable().describe("学年第二部分，例如 2022。"),
    fullName: z.string().nullable().describe("学期完整名称，例如 2021-2022学年第2学期。"),
    currentTermFlag: z.boolean().nullable().describe("是否为当前学期标识，true 表示是。"),
    nextTermFlag: z.boolean().nullable().describe("是否为下一学期标识，false 表示否。"),
    perTerm: z.string().nullable().describe("学期部分名称，例如 第2学期。"),
    perYear: z.string().nullable().describe("学年部分名称，例如 2021-2022学年。"),
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
                "查询同济大学所有学期的日历信息，返回学期ID、年份、学期编号、起止日期、周数、学年分段名称、学期完整名称及当前/下一学期标识。学期编号可用于查询课表、成绩等其他接口。",
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
                return toErrorResult(error, {
                    unauthorized: "同济账号授权无效或已过期，请重新完成授权后再试。",
                    upstreamUnavailable: "同济学期日历服务暂时不可用，请稍后重试。",
                });
            }
        },
    );
};

// normalizeTermCalendarData 裁剪并规范化学期日历业务数据。
const normalizeTermCalendarData = (data: unknown): TermCalendarData | undefined => {
    if (data === null) {
        return { terms: [] };
    }
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
        id: readNumber(source.id),
        year: readNumber(source.year),
        term: readNumber(source.term),
        beginDay: readNumber(source.beginDay),
        endDay: readNumber(source.endDay),
        weekNum: readNumber(source.weekNum),
        weekBenginDay: readNumber(source.weekBenginDay),
        gradePartOne: readString(source.gradePartOne),
        gradePartTwo: readString(source.gradePartTwo),
        fullName: readString(source.fullName),
        currentTermFlag: readBoolean(source.currentTermFlag),
        nextTermFlag: readBoolean(source.nextTermFlag),
        perTerm: readString(source.perTerm),
        perYear: readString(source.perYear),
    };
};



// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: TermCalendarData): boolean =>
    data.terms.length === 0;
