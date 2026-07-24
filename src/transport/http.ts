import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { ServerConfig } from '../config/server';
import { createMcpServer } from '../server';
import { authenticateCaller } from './auth';

// MCP_PATH 表示 MCP Streamable HTTP 服务路径。
const MCP_PATH = '/mcp';
// MAX_REQUEST_BYTES 表示 HTTP 请求体的最大字节数。
const MAX_REQUEST_BYTES = 1_048_576;

// createHttpServer 创建 MCP 服务的 HTTP 入口。
export const createHttpServer = (config: ServerConfig) => {
  return createServer(async (request, response) => {
    if (request.url === '/health/live' && request.method === 'GET') {
      sendJSON(response, 200, { status: 'ok' });
      return;
    }
    if (request.url !== MCP_PATH) {
      sendJSON(response, 404, { error: 'not found' });
      return;
    }

    try {
      const caller = authenticateCaller(request.headers, config.authRequired);
      const body = await readJSONBody(request);
      const transport = new StreamableHTTPServerTransport({
        // 该服务不保存 MCP 会话状态。
        sessionIdGenerator: undefined,
      });
      const mcpServer = createMcpServer({ caller });
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response, body);
    } catch (error) {
      if (!response.headersSent) {
        const message = error instanceof Error ? error.message : 'invalid request';
        sendJSON(response, 400, { error: message });
      }
    }
  });
};

// readJSONBody 读取并解析 HTTP 请求体。
const readJSONBody = (request: IncomingMessage): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        reject(new Error('request body is too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('error', reject);
    request.on('end', () => {
      try {
        resolve(chunks.length === 0 ? undefined : JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('request body must be valid JSON'));
      }
    });
  });
};

// sendJSON 写入 JSON 格式的 HTTP 响应。
const sendJSON = (response: ServerResponse, statusCode: number, body: unknown): void => {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};
