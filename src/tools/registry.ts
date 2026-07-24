import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TrustedCaller } from '../transport/auth';

// ToolRegistrationContext 表示注册工具所需的可信调用方上下文。
export interface ToolRegistrationContext {
  caller?: TrustedCaller;
}

// registerTools 注册校园领域工具目录。
export const registerTools = (
  _server: McpServer,
  _context: ToolRegistrationContext,
): void => {
  // TODO: 此处仅保留工具注册入口，业务工具暂不实现。
};
