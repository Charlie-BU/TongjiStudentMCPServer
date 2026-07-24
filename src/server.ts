import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerTools,
    type ToolRegistrationContext,
} from "./tools/registry";

// SERVER_NAME 表示 MCP 服务名称。
export const SERVER_NAME = "tongji-student-mcp-server";
// SERVER_VERSION 表示 MCP 服务版本。
export const SERVER_VERSION = "0.1.0";

// createMcpServer 创建单次无状态请求使用的 MCP 服务实例。
export const createMcpServer = (
    context: ToolRegistrationContext,
): McpServer => {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });
    registerTools(server, context);
    return server;
};
