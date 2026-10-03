import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpInputError extends Error {
    constructor(public readonly status: number, message: string) { super(message); }
}

export const sendJSON = (response: ServerResponse, status: number, body: unknown): void => {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify(body));
};

export const readBody = async (request: IncomingMessage, maxBytes = 1_048_576): Promise<string> => {
    if (Number(request.headers["content-length"]) > maxBytes) {
        request.resume();
        throw new HttpInputError(413, "request body is too large");
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > maxBytes) throw new HttpInputError(413, "request body is too large");
        chunks.push(buffer);
    }
    return Buffer.concat(chunks).toString("utf8");
};

export const readJSONBody = async (request: IncomingMessage, maxBytes?: number): Promise<unknown> => {
    const body = await readBody(request, maxBytes);
    if (!body) return undefined;
    try { return JSON.parse(body); }
    catch { throw new HttpInputError(400, "request body must be valid JSON"); }
};
