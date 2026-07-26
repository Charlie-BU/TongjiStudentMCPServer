import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../server";
import { readToolInvocationContext } from "./invocation-context";

const MCP_PATH = "/mcp";
const HEALTH_PATH = "/health";
// MAX_REQUEST_BYTES 表示 HTTP 请求体的最大字节数。
const MAX_REQUEST_BYTES = 1_048_576;

// createHttpServer 创建 MCP 服务的 HTTP 入口。
export const createHttpServer = () => {
    return createServer(async (request, response) => {
        if (request.url === HEALTH_PATH && request.method === "GET") {
            sendJSON(response, 200, { status: "ok" });
            return;
        }
        if (request.url !== MCP_PATH) {
            sendJSON(response, 404, { error: "not found" });
            return;
        }

        try {
            const invocation = readToolInvocationContext(request.headers);
            const body = await readJSONBody(request);
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined, // 无状态服务，不生成会话 ID。
            });
            const mcpServer = createMcpServer({ invocation });
            await mcpServer.connect(transport);
            await transport.handleRequest(request, response, body);
        } catch (error) {
            if (!response.headersSent) {
                const message =
                    error instanceof Error ? error.message : "invalid request";
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
        request.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_REQUEST_BYTES) {
                reject(new Error("request body is too large"));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on("error", reject);
        request.on("end", () => {
            try {
                resolve(
                    chunks.length === 0
                        ? undefined
                        : JSON.parse(Buffer.concat(chunks).toString("utf8")),
                );
            } catch {
                reject(new Error("request body must be valid JSON"));
            }
        });
    });
};

// sendJSON 写入 JSON 格式的 HTTP 响应。
const sendJSON = (
    response: ServerResponse,
    statusCode: number,
    body: unknown,
): void => {
    response.writeHead(statusCode, {
        "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(body));
};
