import type { IncomingHttpHeaders } from 'node:http';

// ToolInvocationContext 表示由 Agent 主仓注入的工具调用上下文。
export interface ToolInvocationContext {
  accessToken?: string;
}

// readToolInvocationContext 读取 Agent 主仓传入的工具调用上下文。
export const readToolInvocationContext = (
  headers: IncomingHttpHeaders,
): ToolInvocationContext => ({
  accessToken: readSingleHeader(headers['x-tongji-access-token']),
});

// readSingleHeader 读取单值 HTTP 请求头。
const readSingleHeader = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return undefined;
  }

  const normalizedValue = value?.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
};
