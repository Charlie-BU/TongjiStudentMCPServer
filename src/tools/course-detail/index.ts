import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCourseDetail } from "../../integration/yourtj";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    readString,
    readStringArray,
    unwrapResponseData,
} from "../utils";
import type {
    CourseReview,
    CourseDetailData,
    CourseDetailToolResult,
} from "./types";

// COURSE_DETAIL_TOOL_NAME 表示课程详情查询工具名称。
export const COURSE_DETAIL_TOOL_NAME = "tongji.student.course-detail";

// CourseDetailToolStatus 表示课程详情查询的结果状态。
// CourseDetailData 表示课程详情的脱敏业务数据。
// CourseDetailToolResult 表示课程详情查询的结构化结果。
// COURSE_REVIEW_SCHEMA 表示单条课程评价的 MCP 输出结构。
const COURSE_REVIEW_SCHEMA = z.object({
    id: z.number().nullable().describe("评价记录ID。"),
    course_id: z.number().nullable().describe("关联的课程ID。"),
    semester: z.string().nullable().describe("评价对应的上课学期。"),
    rating: z.number().nullable().describe("学生给出的评分，范围为 1 至 5 分。"),
    comment: z.string().nullable().describe("评价正文，通常包含考核方式与授课质量等信息。"),
    score: z.string().nullable().describe("学生最终成绩。"),
    created_at: z.number().nullable().describe("评价创建时间（Unix 时间戳）。"),
    approve_count: z.number().nullable().describe("赞同数。"),
    disapprove_count: z.number().nullable().describe("反对数。"),
    is_hidden: z.number().nullable().describe("是否被隐藏，0 表示否，1 表示是。"),
    reviewer_name: z.string().nullable().describe("评价人姓名，不可用于身份验证或在公开输出中直接引用。"),
    like_count: z.number().nullable().describe("点赞总数。"),
});

// COURSE_DETAIL_OUTPUT_SCHEMA 表示课程详情查询的 MCP 输出结构。
const COURSE_DETAIL_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示未找到课程或课程数据为空。"),
    data: z.object({
        id: z.number().nullable().describe("课程ID。"),
        code: z.string().nullable().describe("课程编码。"),
        name: z.string().nullable().describe("课程名称。"),
        credit: z.number().nullable().describe("学分值。"),
        department: z.string().nullable().describe("开课院系或部门名称。"),
        teacher_id: z.number().nullable().describe("授课教师ID。"),
        review_count: z.number().nullable().describe("评价总数。"),
        review_avg: z.number().nullable().describe("综合评分。"),
        search_keywords: z.string().nullable().describe("用于搜索的关联关键词，包含课程编码、名称、院系及教师姓名。"),
        teacher_name: z.string().nullable().describe("授课教师姓名。"),
        semesters: z.array(z.string()).describe("该课程开设的学期列表。"),
        reviews: z.array(COURSE_REVIEW_SCHEMA).describe("学生评价列表。"),
    }).nullable().describe("课程详情数据，未找到时返回 null。"),
    source: z.literal("YourTJ").describe("课程数据来源。"),
});

// registerCourseDetailTool 注册课程详情查询工具。
export const registerCourseDetailTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        COURSE_DETAIL_TOOL_NAME,
        {
            title: "查询课程详情",
            description:
                "查询指定课程ID的详细信息，包含课程编码、名称、学分、开课院系、授课教师、综合评分、开设学期列表及学生评价。",
            inputSchema: {
                id: z.number().int().positive().describe("课程ID，必填。"),
            },
            outputSchema: COURSE_DETAIL_OUTPUT_SCHEMA,
        },
        async ({ id }) => {
            try {
                const response = await getCourseDetail(id);
                const data = normalizeCourseDetailData(response);
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "YourTJ 课程详情服务返回异常，请稍后重试。",
                    );
                }
                const result: CourseDetailToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data: isEmptyData(data) ? null : data,
                    source: "YourTJ",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResultLocal(error);
            }
        },
    );
};

// normalizeCourseDetailData 裁剪并规范化课程详情业务数据。
const normalizeCourseDetailData = (data: unknown): CourseDetailData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    const source = data;
    return {
        id: readNumber(source.id),
        code: readString(source.code),
        name: readString(source.name),
        credit: readNumber(source.credit),
        department: readString(source.department),
        teacher_id: readNumber(source.teacher_id),
        review_count: readNumber(source.review_count),
        review_avg: readNumber(source.review_avg),
        search_keywords: readString(source.search_keywords),
        teacher_name: readString(source.teacher_name),
        semesters: readStringArray(source.semesters),
        reviews: readArray(source.reviews).map(normalizeCourseReview),
    };
};

// normalizeCourseReview 裁剪并规范化单条课程评价。
const normalizeCourseReview = (item: unknown): CourseReview => {
    const source = isRecord(item) ? item : {};
    return {
        id: readNumber(source.id),
        course_id: readNumber(source.course_id),
        semester: readString(source.semester),
        rating: readNumber(source.rating),
        comment: readString(source.comment),
        score: readString(source.score),
        created_at: readNumber(source.created_at),
        approve_count: readNumber(source.approve_count),
        disapprove_count: readNumber(source.disapprove_count),
        is_hidden: readNumber(source.is_hidden),
        reviewer_name: readString(source.reviewer_name),
        like_count: readNumber(source.like_count),
    };
};

// isEmptyData 判断课程数据是否为空。
const isEmptyData = (data: CourseDetailData): boolean =>
    data.id === null && data.name === null;

// toErrorResultLocal 将上游错误转换为 MCP 工具错误结果（含 404 特殊处理）。
const toErrorResultLocal = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ status: "empty", message: "未找到指定课程，请检查课程ID 是否正确。" }) }],
        };
    }
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        return createErrorResult("upstream_unavailable", "YourTJ 课程详情服务拒绝访问，请稍后重试。");
    }
    return createErrorResult("upstream_unavailable", "YourTJ 课程详情服务暂时不可用，请稍后重试。");
};

