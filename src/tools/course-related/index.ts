import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCourseRelated } from "../../integration/yourtj";
import { COURSE_ID_INPUT_SCHEMA, COURSE_RELATED_DATA_SCHEMA } from "../../integration/yourtj-contract";
import type { ToolRegistrationContext } from "../registry";
import { createYourtjOutputSchema, runYourtjQuery } from "../yourtj-result";

// COURSE_RELATED_TOOL_NAME 表示查询课程关联工具名称。
export const COURSE_RELATED_TOOL_NAME = "tongji.course.course-related";

// COURSE_RELATED_OUTPUT_SCHEMA 定义查询课程关联的 MCP 输出契约。
export const COURSE_RELATED_OUTPUT_SCHEMA = createYourtjOutputSchema(COURSE_RELATED_DATA_SCHEMA);

// registerCourseRelatedTool 注册查询课程关联工具。
export const registerCourseRelatedTool = (server: McpServer, _context: ToolRegistrationContext): void => {
    server.registerTool(COURSE_RELATED_TOOL_NAME, {
        title: "查询课程关联",
        description: "查询教师的其他课程、同课程其他教师记录及课程关联信息。返回的新课程 id 可用于详情、评价和总结查询。",
        inputSchema: COURSE_ID_INPUT_SCHEMA,
        outputSchema: COURSE_RELATED_OUTPUT_SCHEMA,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (input) => runYourtjQuery("课程关联", () => getCourseRelated(input.courseId), (data) => data.teacherOtherCourses.length === 0 && !data.sameCourseOtherTeachers?.length && !data.lineage?.length));
};
