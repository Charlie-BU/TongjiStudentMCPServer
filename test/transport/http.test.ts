import assert from 'node:assert/strict';
import { request as sendRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';
import { createHttpServer } from '../../src/transport/http';

// withHttpServer 在临时 loopback 端口启动并关闭 HTTP Server。
const withHttpServer = async (
  operation: (baseURL: string) => Promise<void>,
): Promise<void> => {
  const server = createHttpServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;
  try {
    await operation(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    });
  }
};

// requestBody 向本地 HTTP Server 发送具有显式 Content-Length 的请求体。
const requestBody = (
  url: string,
  body: string,
): Promise<{ statusCode: number; body: string }> =>
  new Promise((resolve, reject) => {
    const request = sendRequest(
      url,
      {
        method: 'POST',
        headers: {
          'content-length': Buffer.byteLength(body),
          'content-type': 'application/json',
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    request.on('error', reject);
    request.end(body);
  });

describe('createHttpServer', () => {
  it('应提供不依赖 MCP 会话的健康检查', async () => {
    await withHttpServer(async (baseURL) => {
      const response = await fetch(`${baseURL}/health`);

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: 'ok' });
    });
  });

  it('应拒绝非 GET 健康检查与未知路径', async () => {
    await withHttpServer(async (baseURL) => {
      const healthResponse = await fetch(`${baseURL}/health`, { method: 'POST' });
      const unknownPathResponse = await fetch(`${baseURL}/unknown`);

      assert.equal(healthResponse.status, 404);
      assert.deepEqual(await healthResponse.json(), { error: 'not found' });
      assert.equal(unknownPathResponse.status, 404);
      assert.deepEqual(await unknownPathResponse.json(), { error: 'not found' });
    });
  });

  it('应拒绝非法 JSON 的 MCP 请求且不建立外部连接', async () => {
    await withHttpServer(async (baseURL) => {
      const response = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: 'request body must be valid JSON',
      });
    });
  });

  it('应以 413 拒绝超过大小限制的请求体', async () => {
    await withHttpServer(async (baseURL) => {
      const response = await requestBody(
        `${baseURL}/mcp`,
        'x'.repeat(1_048_577),
      );

      assert.equal(response.statusCode, 413);
      assert.deepEqual(JSON.parse(response.body), {
        error: 'request body is too large',
      });
    });
  });
});
