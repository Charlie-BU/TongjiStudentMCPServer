import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCourseDetail } from "../../integration/yourtj";
import { COURSE_ID_INPUT_SCHEMA, COURSE_DETAIL_DATA_SCHEMA } from "../../integration/yourtj-contract";
import type { ToolRegistrationContext } from "../registry";
import { createYourtjOutputSchema, runYourtjQuery } from "../yourtj-result";

// COURSE_DETAIL_TOOL_NAME 表示查询课程详情工具名称。
export const COURSE_DETAIL_TOOL_NAME = "tongji.student.course-detail";

// COURSE_DETAIL_OUTPUT_SCHEMA 定义查询课程详情的 MCP 输出契约。
export const COURSE_DETAIL_OUTPUT_SCHEMA = createYourtjOutputSchema(COURSE_DETAIL_DATA_SCHEMA);

// registerCourseDetailTool 注册查询课程详情工具。
export const registerCourseDetailTool = (server: McpServer, _context: ToolRegistrationContext): void => {
    server.registerTool(COURSE_DETAIL_TOOL_NAME, {
        title: "查询课程详情",
        description: "查询课程基础信息、学分乘以 10 的 creditX10、开课记录和评分统计。此工具不含评价正文，需使用 tongji.course.reviews 查询评价。",
        inputSchema: COURSE_ID_INPUT_SCHEMA,
        outputSchema: COURSE_DETAIL_OUTPUT_SCHEMA,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (input) => runYourtjQuery("课程详情", () => getCourseDetail(input.courseId), (data) => false));
};
