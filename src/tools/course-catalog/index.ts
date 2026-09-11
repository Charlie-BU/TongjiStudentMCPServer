import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchCourses } from "../../integration/yourtj";
import { COURSE_SEARCH_INPUT_SCHEMA, COURSE_SEARCH_DATA_SCHEMA } from "../../integration/yourtj-contract";
import type { ToolRegistrationContext } from "../registry";
import { createYourtjOutputSchema, runYourtjQuery } from "../yourtj-result";

// COURSE_CATALOG_TOOL_NAME 表示查询课程目录工具名称。
export const COURSE_CATALOG_TOOL_NAME = "tongji.course.search";

// COURSE_CATALOG_OUTPUT_SCHEMA 定义查询课程目录的 MCP 输出契约。
export const COURSE_CATALOG_OUTPUT_SCHEMA = createYourtjOutputSchema(COURSE_SEARCH_DATA_SCHEMA);

// registerCourseCatalogTool 注册查询课程目录工具。
export const registerCourseCatalogTool = (server: McpServer, _context: ToolRegistrationContext): void => {
    server.registerTool(COURSE_CATALOG_TOOL_NAME, {
        title: "查询课程目录",
        description: "查询同济大学课程，支持关键词、教师、院系、学期和校区筛选。使用 page/size 分页，hasNext 为 true 时继续下一页。结果中的 id 可用于详情、评价和总结查询。",
        inputSchema: COURSE_SEARCH_INPUT_SCHEMA,
        outputSchema: COURSE_CATALOG_OUTPUT_SCHEMA,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (input) => runYourtjQuery("课程目录", () => searchCourses(input), (data) => data.list.length === 0));
};
