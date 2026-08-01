import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGradesByCalendarId } from "../../integration/yourtj";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type { GradeListData, GradeListToolResult } from "./types";

// GRADE_LIST_TOOL_NAME 表示年级/界别列表查询工具名称。
export const GRADE_LIST_TOOL_NAME = "tongji.course.grade_list";

// GRADE_LIST_OUTPUT_SCHEMA 表示年级/界别列表查询的 MCP 输出结构。
const GRADE_LIST_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的年级/界别列表。"),
    data: z.object({
        gradeList: z
            .array(z.number())
            .describe("年级或界别列表，例如 2025、2024，常用于筛选下拉菜单。"),
    }),
    source: z.literal("YourTJ").describe("年级/界别列表数据来源。"),
    calendarId: z.number().describe("本次查询指定的学期编号。"),
});

// registerGradeListTool 注册年级/界别列表查询工具。
export const registerGradeListTool = (
    server: McpServer,
    _context: ToolRegistrationContext,
): void => {
    server.registerTool(
        GRADE_LIST_TOOL_NAME,
        {
            title: "查询年级界别列表",
            description: "根据 YourTJ 学期编号查询该学期可用的年级/界别筛选列表。",
            inputSchema: {
                calendarId: z
                    .number()
                    .int()
                    .positive()
                    .describe("必填的学期编号。"),
            },
            outputSchema: GRADE_LIST_OUTPUT_SCHEMA,
        },
        async ({ calendarId }) => {
            try {
                const response = await getGradesByCalendarId({}, calendarId);
                const data = normalizeGradeListData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 年级界别服务返回异常，请稍后重试。",
                    );
                }
                const result: GradeListToolResult = {
                    status: data.gradeList.length === 0 ? "empty" : "ok",
                    data,
                    source: "YourTJ",
                    calendarId,
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    "YourTJ 年级界别服务暂时不可用，请稍后重试。",
                );
            }
        },
    );
};

// normalizeGradeListData 裁剪并规范化年级/界别业务数据。
const normalizeGradeListData = (data: unknown): GradeListData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.gradeList)) {
        return undefined;
    }
    return {
        gradeList: readArray(data.gradeList)
            .map(readNumber)
            .filter((grade): grade is number => grade !== null),
    };
};
