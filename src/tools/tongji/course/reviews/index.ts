import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCourseReviews } from "../../../../integration/yourtj";
import { COURSE_REVIEW_INPUT_SCHEMA, COURSE_REVIEW_DATA_SCHEMA } from "../../../../integration/yourtj-contract";
import type { ToolRegistrationContext } from "../../../registry";
import { createYourtjOutputSchema, runYourtjQuery } from "../../../yourtj-result";

// COURSE_REVIEWS_TOOL_NAME 表示查询课程评价工具名称。
export const COURSE_REVIEWS_TOOL_NAME = "tongji.course.reviews";

// COURSE_REVIEWS_OUTPUT_SCHEMA 定义查询课程评价的 MCP 输出契约。
export const COURSE_REVIEWS_OUTPUT_SCHEMA = createYourtjOutputSchema(COURSE_REVIEW_DATA_SCHEMA);

// registerCourseReviewsTool 注册查询课程评价工具。
export const registerCourseReviewsTool = (server: McpServer, _context: ToolRegistrationContext): void => {
    server.registerTool(COURSE_REVIEWS_TOOL_NAME, {
        title: "查询课程评价",
        description: "查询课程评价正文、评分和开课记录，可按 offeringId 筛选。使用 pageSize 和 cursor 分页，nextCursor 缺失或为空时结束；翻页时保持筛选条件不变。",
        inputSchema: COURSE_REVIEW_INPUT_SCHEMA,
        outputSchema: COURSE_REVIEWS_OUTPUT_SCHEMA,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (input) => runYourtjQuery("课程评价", () => getCourseReviews(input), (data) => data.list.length === 0));
};
