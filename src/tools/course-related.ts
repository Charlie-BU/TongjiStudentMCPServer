import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCourseRelated } from "../integration/yourtj";
import type { ToolRegistrationContext } from "./registry";

// COURSE_RELATED_TOOL_NAME 表示课程关联查询工具名称。
export const COURSE_RELATED_TOOL_NAME = "tongji.student.course-related";

// CourseRelatedToolStatus 表示课程关联查询的结果状态。
type CourseRelatedToolStatus = "ok" | "empty" | "upstream_unavailable";

// RelatedCourseSummary 表示关联课程摘要。
interface RelatedCourseSummary {
    id: number | null;
    code: string | null;
    name: string | null;
    teacher_name: string | null;
    review_avg: number | null;
    review_count: number | null;
}

// CourseRelatedData 表示课程关联的脱敏业务数据。
interface CourseRelatedData {
    teacherOtherCourses: RelatedCourseSummary[];
    sameCourseOtherTeachers: RelatedCourseSummary[];
}

// CourseRelatedToolResult 表示课程关联查询的结构化结果。
interface CourseRelatedToolResult {
    [key: string]: unknown;
    status: CourseRelatedToolStatus;
    data: CourseRelatedData | null;
    source: "YourTJ";
}

// RELATED_COURSE_SCHEMA 表示单条关联课程摘要的 MCP 输出结构。
const RELATED_COURSE_SCHEMA = z.object({
    id: z.number().nullable().describe("课程标识ID。"),
    code: z.string().nullable().describe("课程编码。"),
    name: z.string().nullable().describe("课程名称。"),
    teacher_name: z.string().nullable().describe("授课教师姓名。"),
    review_avg: z.number().nullable().describe("该课程的综合评分。"),
    review_count: z.number().nullable().describe("该课程的评价总数。"),
});

// COURSE_RELATED_OUTPUT_SCHEMA 表示课程关联查询的 MCP 输出结构。
const COURSE_RELATED_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有关联课程数据。"),
    data: z.object({
        teacherOtherCourses: z.array(RELATED_COURSE_SCHEMA).describe("该教师教授的其他课程列表。"),
        sameCourseOtherTeachers: z.array(RELATED_COURSE_SCHEMA).describe("同一门课程由其他教师授课的列表。"),
    }).nullable().describe("课程关联数据，无数据时返回 null。"),
    source: z.literal("YourTJ").describe("课程数据来源。"),
});

// registerCourseRelatedTool 注册课程关联查询工具。
export const registerCourseRelatedTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        COURSE_RELATED_TOOL_NAME,
        {
            title: "查询课程关联",
            description:
                "查询指定课程的关联信息，包括该教师教授的其他课程，以及同一门课程由其他教师授课的列表。",
            inputSchema: {
                id: z.number().int().positive().describe("课程ID，必填。"),
            },
            outputSchema: COURSE_RELATED_OUTPUT_SCHEMA,
        },
        async ({ id }) => {
            try {
                const response = await getCourseRelated(id);
                const data = normalizeCourseRelatedData(response);
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 课程关联服务返回异常，请稍后重试。",
                    );
                }
                const result: CourseRelatedToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data: isEmptyData(data) ? null : data,
                    source: "YourTJ",
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

// normalizeCourseRelatedData 裁剪并规范化课程关联业务数据。
const normalizeCourseRelatedData = (data: unknown): CourseRelatedData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    return {
        teacherOtherCourses: readArray(data.teacher_other_courses).map(normalizeRelatedCourse),
        sameCourseOtherTeachers: readArray(data.same_course_other_teachers).map(normalizeRelatedCourse),
    };
};

// normalizeRelatedCourse 裁剪并规范化单条关联课程摘要。
const normalizeRelatedCourse = (item: unknown): RelatedCourseSummary => {
    const source = isRecord(item) ? item : {};
    return {
        id: readNumber(source.id),
        code: readString(source.code),
        name: readString(source.name),
        teacher_name: readString(source.teacher_name),
        review_avg: readNumber(source.review_avg),
        review_count: readNumber(source.review_count),
    };
};

// isEmptyData 判断课程关联数据是否为空。
const isEmptyData = (data: CourseRelatedData): boolean =>
    data.teacherOtherCourses.length === 0 && data.sameCourseOtherTeachers.length === 0;

// readArray 读取数组字段。
const readArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];

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
        (error.response?.status === 404)
    ) {
        return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ status: "empty", message: "未找到指定课程的关联信息，请检查课程ID是否正确。" }) }],
        };
    }
    if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
    ) {
        return createErrorResult(
            "upstream_unavailable",
            "YourTJ 课程关联服务拒绝访问，请稍后重试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        "YourTJ 课程关联服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果，仅接受与 "ok"/"empty" 互斥的错误状态。
const createErrorResult = (
    status: Exclude<CourseRelatedToolStatus, "ok" | "empty">,
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
