import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolInvocationContext } from "../transport/invocation-context";
import { registerCompetitionPrizeTool } from "./competition-prize";
import { registerUndergraduateScoreTool } from "./undergraduate-score";

// ToolRegistrationContext 表示注册工具所需的可信调用方上下文。
export interface ToolRegistrationContext {
    invocation: ToolInvocationContext;
}

// registerTools 注册校园领域工具目录。
export const registerTools = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    // 注册本科生成绩查询工具。
    registerUndergraduateScoreTool(server, context);
    // 注册本科生竞赛奖励查询工具。
    registerCompetitionPrizeTool(server, context);
};
