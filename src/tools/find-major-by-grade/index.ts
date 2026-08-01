import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMajorsByGrade } from "../../integration/yourtj";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    MajorEntry,
    FindMajorByGradeData,
    FindMajorByGradeToolResult,
} from "./types";

// FIND_MAJOR_BY_GRADE_TOOL_NAME 表示按学期年级查询专业工具名称。
export const FIND_MAJOR_BY_GRADE_TOOL_NAME = "tongji.student.find-major-by-grade";

// FindMajorByGradeToolStatus 表示按学期年级查询专业的结果状态。
// FindMajorByGradeData 表示专业列表的脱敏业务数据。
// FindMajorByGradeToolResult 表示按学期年级查询专业的结构化结果。
// MAJOR_ENTRY_SCHEMA 表示单条专业信息的 MCP 输出结构。
const MAJOR_ENTRY_SCHEMA = z.object({
    code: z.string().nullable().describe("专业编码。"),
    name: z.string().nullable().describe("专业名称。"),
});

// FIND_MAJOR_BY_GRADE_OUTPUT_SCHEMA 表示按学期年级查询专业的 MCP 输出结构。
const FIND_MAJOR_BY_GRADE_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的专业数据。"),
    data: z.object({
        records: z.array(MAJOR_ENTRY_SCHEMA).describe("专业信息列表。"),
    }),
    source: z.literal("YourTJ").describe("专业数据来源。"),
});

// registerFindMajorByGradeTool 注册按学期年级查询专业工具。
export const registerFindMajorByGradeTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        FIND_MAJOR_BY_GRADE_TOOL_NAME,
        {
            title: "按学期年级查询专业",
            description:
                "根据学期编号和年级查询 YourTJ 上的专业列表，返回专业编码和名称。",
            inputSchema: {
                calendarId: z.number().int().positive().describe("学期编号，必填。"),
                grade: z.number().int().positive().describe("年级，必填。"),
            },
            outputSchema: FIND_MAJOR_BY_GRADE_OUTPUT_SCHEMA,
        },
        async ({ calendarId, grade }) => {
            try {
                const response = await getMajorsByGrade(calendarId, grade);
                const data = normalizeFindMajorByGradeData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 专业查询服务返回异常，请稍后重试。",
                    );
                }
                const result: FindMajorByGradeToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "YourTJ",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error, {
                    upstreamUnavailable: "YourTJ 专业查询服务暂时不可用，请稍后重试。",
                });
            }
        },
    );
};
// normalizeFindMajorByGradeData 裁剪并规范化专业列表业务数据。
const normalizeFindMajorByGradeData = (data: unknown): FindMajorByGradeData | undefined => {
    if (data === null) {
        return { records: [] };
    }
    if (!Array.isArray(data)) {
        return undefined;
    }
    const records = (data as unknown[]).map(normalizeMajorEntry);
    return { records };
};

// normalizeMajorEntry 裁剪并规范化单条专业信息。
const normalizeMajorEntry = (item: unknown): MajorEntry => {
    const source = isRecord(item) ? item : {};
    return {
        code: readString(source.code),
        name: readString(source.name),
    };
};

// isEmptyData 判断专业数据是否为空。
const isEmptyData = (data: FindMajorByGradeData): boolean =>
    data.records.length === 0;
