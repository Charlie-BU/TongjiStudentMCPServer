import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCourses } from "../../integration/yourtj";
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
    CourseCatalogData,
    CourseCatalogItem,
    CourseCatalogToolResult,
} from "./types";

// COURSE_CATALOG_TOOL_NAME 表示课程目录查询工具名称。
export const COURSE_CATALOG_TOOL_NAME = "tongji.course.catalog";

// COURSE_CATALOG_ITEM_SCHEMA 表示单条课程目录信息的 MCP 输出结构。
const COURSE_CATALOG_ITEM_SCHEMA = z.object({
    code: z.string().nullable().describe("课程代码，例如 54011212。"),
    name: z.string().nullable().describe("课程名称。"),
    rating: z
        .number()
        .nullable()
        .describe("课程评分或评教得分，可按前端需要格式化展示。"),
    review_count: z
        .number()
        .nullable()
        .describe("课程评价人数或点评条数。"),
    teacher_name: z.string().nullable().describe("授课教师姓名。"),
    department: z.string().nullable().describe("开课院系或开设学院名称。"),
    credit: z.number().nullable().describe("课程学分。"),
    semesters: z
        .array(z.string())
        .describe("开课学期列表，适合用于筛选下拉框或标签展示。"),
});

// COURSE_CATALOG_OUTPUT_SCHEMA 表示课程目录查询的 MCP 输出结构。
const COURSE_CATALOG_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的课程目录记录。"),
    data: z.object({
        list: z
            .array(COURSE_CATALOG_ITEM_SCHEMA)
            .describe("符合查询条件的课程目录列表。"),
    }),
    source: z.literal("YourTJ").describe("课程目录数据来源。"),
    page: z.number().optional().describe("本次查询指定的页码。"),
    limit: z.number().optional().describe("本次查询指定的每页条数。"),
    q: z.string().optional().describe("本次查询指定的课程检索关键词。"),
});

// registerCourseCatalogTool 注册课程目录查询工具。
export const registerCourseCatalogTool = (
    server: McpServer,
    _context: ToolRegistrationContext,
): void => {
    server.registerTool(
        COURSE_CATALOG_TOOL_NAME,
        {
            title: "查询课程目录",
            description:
                "查询 YourTJ 课程目录，支持按课程名称、课程代码或教师关键词检索。",
            inputSchema: {
                page: z
                    .number()
                    .int()
                    .positive()
                    .optional()
                    .describe("可选的页码，从 1 开始。"),
                limit: z
                    .number()
                    .int()
                    .positive()
                    .optional()
                    .describe("可选的每页条数。"),
                q: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe("可选的查询关键词，支持课程名称、课程代码或教师姓名。"),
            },
            outputSchema: COURSE_CATALOG_OUTPUT_SCHEMA,
        },
        async ({ page, limit, q }) => {
            try {
                const response = await getCourses(
                    {},
                    page,
                    limit,
                    q,
                    undefined,
                );
                const data = normalizeCourseCatalogData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 课程目录服务返回异常，请稍后重试。",
                    );
                }
                const result: CourseCatalogToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "YourTJ",
                    ...(page ? { page } : {}),
                    ...(limit ? { limit } : {}),
                    ...(q ? { q } : {}),
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    "YourTJ 课程目录服务暂时不可用，请稍后重试。",
                );
            }
        },
    );
};

// normalizeCourseCatalogData 裁剪并规范化课程目录业务数据。
const normalizeCourseCatalogData = (
    data: unknown,
): CourseCatalogData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeCourseCatalogItem),
    };
};

// normalizeCourseCatalogItem 裁剪并规范化单条课程目录信息。
const normalizeCourseCatalogItem = (item: unknown): CourseCatalogItem => {
    const source = isRecord(item) ? item : {};
    return {
        code: readString(source.code),
        name: readString(source.name),
        rating: readNumber(source.rating),
        review_count: readNumber(source.review_count),
        teacher_name: readString(source.teacher_name),
        department: readString(source.department),
        credit: readNumber(source.credit),
        semesters: readArray(source.semesters)
            .map(readString)
            .filter((semester): semester is string => semester !== null),
    };
};
