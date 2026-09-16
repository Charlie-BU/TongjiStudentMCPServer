import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCourseSummary } from "../../../../integration/yourtj";
import { COURSE_SUMMARY_INPUT_SCHEMA, COURSE_SUMMARY_DATA_SCHEMA } from "../../../../integration/yourtj-contract";
import type { ToolRegistrationContext } from "../../../registry";
import { createYourtjOutputSchema, runYourtjQuery } from "../../../yourtj-result";

// COURSE_SUMMARY_TOOL_NAME 表示查询课程 AI 总结工具名称。
export const COURSE_SUMMARY_TOOL_NAME = "tongji.course.summary";

// COURSE_SUMMARY_OUTPUT_SCHEMA 定义查询课程 AI 总结的 MCP 输出契约。
export const COURSE_SUMMARY_OUTPUT_SCHEMA = createYourtjOutputSchema(COURSE_SUMMARY_DATA_SCHEMA);

// registerCourseSummaryTool 注册查询课程 AI 总结工具。
export const registerCourseSummaryTool = (server: McpServer, _context: ToolRegistrationContext): void => {
    server.registerTool(COURSE_SUMMARY_TOOL_NAME, {
        title: "查询课程 AI 总结",
        description: "查询已有 AI 课程总结、关键词、优缺点和生成时间。check 固定为 true；不触发生成或刷新。data.status 保留上游状态，总结缺失时请参考原始课评。",
        inputSchema: COURSE_SUMMARY_INPUT_SCHEMA,
        outputSchema: COURSE_SUMMARY_OUTPUT_SCHEMA,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (input) => runYourtjQuery("课程总结", () => getCourseSummary(input), (data) => data.summary == null));
};
