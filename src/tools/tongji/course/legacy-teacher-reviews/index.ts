import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { legacyTeacherNameSchema, searchLegacyTeacherReviews } from "./query";

export const LEGACY_TEACHER_REVIEWS_TOOL_NAME = "tongji.course.legacy-teacher-reviews";

export const registerLegacyTeacherReviewsTool = (server: McpServer): void => {
    server.registerTool(LEGACY_TEACHER_REVIEWS_TOOL_NAME, {
        title: "检索老师历史评价",
        description: "按至少两个字的老师姓名或姓名片段模糊检索评价，返回所有匹配老师的全部评价。保留课程和原始学期；属于历史学生主观评价，不一定代表当前情况。",
        inputSchema: { teacher: legacyTeacherNameSchema.describe("至少两个字的老师姓名或姓名片段（如“陈滨”），按连续子串匹配，自动去除首尾空白。") },
        outputSchema: z.object({ content: z.array(z.string()) }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ teacher }) => {
        try {
            const result = { content: searchLegacyTeacherReviews(teacher) };
            return {
                content: [{ type: "text", text: JSON.stringify(result) }],
                structuredContent: result,
            };
        } catch {
            return { isError: true, content: [{ type: "text", text: "本地历史教师评价数据库暂时不可用。" }] };
        }
    });
};
