import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllCalendars } from "../../integration/yourtj";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    CalendarListData,
    CalendarListItem,
    CalendarListToolResult,
} from "./types";

// CALENDAR_LIST_TOOL_NAME 表示学期列表查询工具名称。
export const CALENDAR_LIST_TOOL_NAME = "tongji.course.calendar_list";

// CALENDAR_LIST_ITEM_SCHEMA 表示单个学期选项的 MCP 输出结构。
const CALENDAR_LIST_ITEM_SCHEMA = z.object({
    calendarId: z
        .number()
        .nullable()
        .describe("选中的学期 ID 或值，用作传递给后端的查询参数值。"),
    calendarName: z
        .string()
        .nullable()
        .describe("学期名称，通常作为下拉菜单展示给用户看的文本。"),
});

// CALENDAR_LIST_OUTPUT_SCHEMA 表示学期列表查询的 MCP 输出结构。
const CALENDAR_LIST_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的学期列表。"),
    data: z.object({
        list: z
            .array(CALENDAR_LIST_ITEM_SCHEMA)
            .describe("可供选择的学期列表。"),
    }),
    source: z.literal("YourTJ").describe("学期列表数据来源。"),
});

// registerCalendarListTool 注册学期列表查询工具。
export const registerCalendarListTool = (
    server: McpServer,
    _context: ToolRegistrationContext,
): void => {
    server.registerTool(
        CALENDAR_LIST_TOOL_NAME,
        {
            title: "查询学期列表",
            description: "查询 YourTJ 可用学期列表，用于课程、年级等筛选项。",
            inputSchema: {},
            outputSchema: CALENDAR_LIST_OUTPUT_SCHEMA,
        },
        async () => {
            try {
                const response = await getAllCalendars({});
                const data = normalizeCalendarListData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 学期列表服务返回异常，请稍后重试。",
                    );
                }
                const result: CalendarListToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "YourTJ",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "YourTJ 学期列表服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeCalendarListData 裁剪并规范化学期列表业务数据。
const normalizeCalendarListData = (
    data: unknown,
): CalendarListData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeCalendarListItem),
    };
};

// normalizeCalendarListItem 裁剪并规范化单个学期选项。
const normalizeCalendarListItem = (item: unknown): CalendarListItem => {
    const source = isRecord(item) ? item : {};
    return {
        calendarId: readNumber(source.calendarId),
        calendarName: readString(source.calendarName),
    };
};
