import type { IncomingHttpHeaders } from 'node:http';

// TrustedCaller 表示经 MCP 服务验证后的可信调用方。
export interface TrustedCaller {
  subject: string;
  scopes: readonly string[];
  runId?: string;
  sessionId?: string;
}

// authenticateCaller 验证 Agent 到 MCP 服务的调用方身份。
export const authenticateCaller = (
  _headers: IncomingHttpHeaders,
  authRequired: boolean,
): TrustedCaller | undefined => {
  // TODO: 验证 Agent 签发的短期凭证，并仅从已验证声明中构造可信身份。
  if (!authRequired) {
    return undefined;
  }
  throw new Error('MCP authentication is required but no credential verifier is configured');
};
