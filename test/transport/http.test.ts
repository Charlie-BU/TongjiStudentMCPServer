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
    server.listen(0, 'localhost', resolve);
  });

  const address = server.address() as AddressInfo;
  try {
    await operation(`http://localhost:${address.port}`);
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

it('应无需认证通过本地路由返回老师全部评价数组并校验输入', async () => {
  await withHttpServer(async (baseURL) => {
    const { searchLegacyTeacherReviews } = await import('../../src/tools/tongji/course/legacy-teacher-reviews/query');
    const response = await fetch(`${baseURL}/legacy/teacher-reviews?teacher=${encodeURIComponent(' 陈滨 ')}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), searchLegacyTeacherReviews('陈滨'));
    const empty = await fetch(`${baseURL}/legacy/teacher-reviews?teacher=${encodeURIComponent('不存在的老师')}`);
    assert.deepEqual(await empty.json(), []);
    for (const query of ['', '?teacher=' + encodeURIComponent(' 陈 '), '?teacher=', '?teacher=%20', '?teacher=A&teacher=B', '?teacher=' + 'A'.repeat(101)]) {
      const invalid = await fetch(`${baseURL}/legacy/teacher-reviews${query}`);
      assert.equal(invalid.status, 400);
    }
    const post = await fetch(`${baseURL}/legacy/teacher-reviews?teacher=A`, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET');
  });
});

import axios from 'axios';
it('authenticates the service credential and forwards the human ID without accepting model overrides',async()=>{
 const previous=axios.defaults.adapter;
 const identities:string[]=[];
 let reject=false;
 axios.defaults.adapter=async config=>{
  identities.push(config.params.userId);
  assert.equal(config.headers.Authorization,'Bearer service-token');
  return {data:{code:reject?'A99999':'A00000',data:config.params.userId==='00001'?{list:[{userId:'00001',name:'李建中',userTypeName:'教职工'}]}:[{balance:12}]},status:200,statusText:'OK',headers:{},config};
 };
 try{await withHttpServer(async baseURL=>{
  const headers={'content-type':'application/json',accept:'application/json, text/event-stream','x-tongji-access-token':'service-token','x-tongji-user-id':'student-a'};
  const body=JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'tongji.user.card_balance',arguments:{}}});
  const result=await fetch(baseURL+'/mcp',{method:'POST',headers,body});
  assert.equal(result.status,200);
  assert.match(await result.text(),/12/);
  assert.deepEqual(identities,['00001','student-a']);
  reject=true;
  const denied=await fetch(baseURL+'/mcp',{method:'POST',headers,body});
  assert.equal(denied.status,403);
  assert.equal(denied.headers.get('www-authenticate'),null);
  assert.equal((await denied.json() as {error:string}).error,'invalid_service_credential');
  assert.deepEqual(identities,['00001','student-a','00001']);
 });}finally{axios.defaults.adapter=previous;}
});
