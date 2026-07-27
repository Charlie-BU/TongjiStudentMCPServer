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
        if (isRequestBodyTooLarge(request)) {
            request.resume();
            sendJSON(response, 413, { error: "request body is too large" });
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

// isRequestBodyTooLarge 根据 Content-Length 提前拒绝超大请求体。
const isRequestBodyTooLarge = (request: IncomingMessage): boolean => {
    const contentLength = request.headers["content-length"];
    if (Array.isArray(contentLength) || contentLength === undefined) {
        return false;
    }

    const size = Number(contentLength);
    return Number.isFinite(size) && size > MAX_REQUEST_BYTES;
};

// readJSONBody 读取并解析 HTTP 请求体。
const readJSONBody = (request: IncomingMessage): Promise<unknown> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let settled = false;
        const rejectOnce = (error: Error): void => {
            if (!settled) {
                settled = true;
                reject(error);
            }
        };
        request.on("data", (chunk: Buffer) => {
            if (settled) {
                return;
            }
            size += chunk.length;
            if (size > MAX_REQUEST_BYTES) {
                rejectOnce(new Error("request body is too large"));
                return;
            }
            chunks.push(chunk);
        });
        request.on("error", rejectOnce);
        request.on("end", () => {
            if (settled) {
                return;
            }
            try {
                const body =
                    chunks.length === 0
                        ? undefined
                        : JSON.parse(Buffer.concat(chunks).toString("utf8"));
                settled = true;
                resolve(body);
            } catch {
                rejectOnce(new Error("request body must be valid JSON"));
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
