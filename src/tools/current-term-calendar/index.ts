import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCurrentTermCalendar } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    CurrentTermCalendar,
    CurrentTermCalendarToolResult,
} from "./types";

// CURRENT_TERM_CALENDAR_TOOL_NAME 表示当前学期日历查询工具名称。
export const CURRENT_TERM_CALENDAR_TOOL_NAME = "tongji.student.current-term-calendar";

// CurrentTermCalendarToolStatus 表示当前学期日历查询的结果状态。
// CurrentTermCalendarToolResult 表示当前学期日历的结构化结果。
// CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA 表示当前学期日历的 MCP 输出结构。
const CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的当前学期数据。"),
    data: z.object({
        year: z.number().nullable().describe("学年年份。"),
        term: z.number().nullable().describe("学期序号，1 表示第一学期，2 表示第二学期。"),
        weekNum: z.number().nullable().describe("该学期包含的教学周数。"),
        week: z.number().nullable().describe("当前所处的教学周序号。"),
        simpleName: z.string().nullable().describe("学期简称，例如 2021-2022学年度第2学期。"),
        now: z.string().nullable().describe("当前日期所在的月份描述，例如 2022年5月。"),
        name: z.string().nullable().describe("当前学期的完整描述，包含日期与周数。"),
    }).nullable().describe("当前学期日历数据，无数据时为 null。"),
    source: z.literal("Tongji Open Platform").describe("学期日历数据来源。"),
});

// registerCurrentTermCalendarTool 注册当前学期日历查询工具。
export const registerCurrentTermCalendarTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        CURRENT_TERM_CALENDAR_TOOL_NAME,
        {
            title: "查询当前学期日历",
            description:
                "查询同济大学当前学期的日历摘要，包含学年、学期、周数、当前所处教学周及学期描述。",
            inputSchema: {},
            outputSchema: CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA,
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
                const response = await getCurrentTermCalendar(
                    { accessToken },
                );
                const data = normalizeCurrentTermCalendarData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济当前学期日历服务返回异常，请稍后重试。",
                    );
                }
                const result: CurrentTermCalendarToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data: isEmptyData(data) ? null : data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error, {
                    unauthorized: "同济账号授权无效或已过期，请重新完成授权后再试。",
                    upstreamUnavailable: "同济当前学期日历服务暂时不可用，请稍后重试。",
                });
            }
        },
    );
};

// EMPTY_CURRENT_TERM_CALENDAR 表示全字段为 null 的空当前学期日历。
const EMPTY_CURRENT_TERM_CALENDAR: CurrentTermCalendar = {
    year: null,
    term: null,
    weekNum: null,
    week: null,
    simpleName: null,
    now: null,
    name: null,
};

// normalizeCurrentTermCalendarData 裁剪并规范化当前学期日历业务数据。
const normalizeCurrentTermCalendarData = (data: unknown): CurrentTermCalendar | undefined => {
    if (data === null) {
        return EMPTY_CURRENT_TERM_CALENDAR;
    }
    if (!isRecord(data) || !isRecord(data.schoolCalendar)) {
        return undefined;
    }
    const schoolCalendar = data.schoolCalendar;
    return {
        year: readNumber(schoolCalendar.year),
        term: readNumber(schoolCalendar.term),
        weekNum: readNumber(schoolCalendar.weekNum),
        week: readNumber(data.week),
        simpleName: readString(data.simpleName),
        now: readString(data.now),
        name: readString(data.name),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: CurrentTermCalendar): boolean =>
    data.year === null &&
    data.term === null &&
    data.weekNum === null &&
    data.week === null &&
    data.simpleName === null &&
    data.now === null &&
    data.name === null;

