import assert from 'node:assert/strict';
import { request as sendRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, describe, it } from 'node:test';
import { createTestSqlite } from '../fixtures/sqlite';
const sqlite = createTestSqlite();
const database = require('../../src/storage/database') as typeof import('../../src/storage/database');
const databaseModule = require.cache[require.resolve('../../src/storage/database')]!;
databaseModule.exports = { ...database, openDatabase: () => sqlite.open() };
const { createHttpServer } = require('../../src/transport/http') as typeof import('../../src/transport/http');
const { readLuckinCredential } = require('../../src/storage/luckin-credentials') as typeof import('../../src/storage/luckin-credentials');
after(() => { databaseModule.exports = database; sqlite.close(); });

// 固定 IPv4 loopback，避免容器中 localhost 的监听与连接解析到不同地址族。
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
  const headers={'content-type':'application/json',accept:'application/json, text/event-stream','x-tongji-access-token':'service-token','x-user-id':'student-a'};
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

import { withLuckinFake, success, smsData, tokenData, loginCookies } from '../fixtures/luckin';


it('HTTP 瑞幸支持无 Token 调用，携带 Token 时先校验并记录来源', async () => {
  await withLuckinFake(async request => {
    if (!request.url?.includes('lkcoffee.com')) {
      assert.equal(request.headers.Authorization, 'Bearer service-token');
      assert.equal(request.params.userId, '00001');
      return {data:{code:'A00000',data:{list:[{userId:'00001',name:'李建中',userTypeName:'教职工'}]}}};
    }
    if (request.url?.endsWith('/validcode')) return {data: success(smsData, 0)};
    if (request.url?.endsWith('/loginAi')) return {data: success({}), headers: {'set-cookie': loginCookies}};
    if (request.url?.endsWith('/getToken')) return {data: success(tokenData)};
    return {data: {jsonrpc:'2.0',id:1,result:{}}};
  }, async () => withHttpServer(async baseURL => {
    for (const withToken of [false,true]) {
      const userId = withToken ? 'http-student' : 'http-external';
      const headers: Record<string,string> = {'content-type':'application/json',accept:'application/json, text/event-stream','x-user-id':userId};
      if (withToken) headers['x-tongji-access-token'] = 'service-token';
      // 未携带 Token 可直接初始化和发现工具；携带时须先通过入口校验。
      for (const [method, params] of [['initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'luckin-http-test',version:'1'}}],['tools/list',{}]] as const) {
        const response = await fetch(baseURL+'/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
        assert.equal(response.status,200);
        assert.doesNotMatch(await response.text(),/invalid_service_credential/);
      }
      const invoke = async (name:string,args:Record<string,unknown>) => {
        const response = await fetch(baseURL+'/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});
        assert.equal(response.status,200);
        const result = await response.text();
        assert.doesNotMatch(result,/"isError":true/);
        return result;
      };
      await invoke('luckin.auth.send_sms_code',{mobile:'13800000000'});
      await invoke('luckin.auth.login',{mobile:'13800000000',validateCode:'012345'});
      assert.equal((await readLuckinCredential(userId))!.is_from_tongji,withToken);
      assert.match(await invoke('luckin.auth.check',{}),/valid/);
    }
  }));
});

it('HTTP 邮箱身份在初始化、发现和工具调用中被接受，未绑定时返回正常未登录结果', async () => {
  await withLuckinFake(async () => { throw new Error('must not access upstream'); }, async requests => withHttpServer(async baseURL => {
    const headers = {'content-type':'application/json', accept:'application/json, text/event-stream', 'X-User-Id':'15947513567charlie@gmail.com'};
    const calls = [
      {method:'initialize', params:{protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'email-identity-test', version:'1'}}},
      {method:'tools/list', params:{}},
      {method:'tools/call', params:{name:'luckin.auth.check', arguments:{}}},
    ];
    for (const call of calls) {
      const response = await fetch(baseURL+'/mcp', {method:'POST', headers, body:JSON.stringify({jsonrpc:'2.0', id:1, ...call})});
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.doesNotMatch(body, /"isError":true|"status":"user_id_required"/);
      if (call.method === 'tools/call') {
        assert.match(body, /"valid":false/);
        assert.match(body, /尚未登录瑞幸/);
      }
    }
    assert.equal(requests.length, 0);
  }));
});

it('HTTP 缺少 X-User-Id 时短信和检查不调用上游，校园工具只有用户 ID 时仍拒绝', async () => {
  await withLuckinFake(async () => {throw new Error('must not access upstream');}, async requests => withHttpServer(async baseURL => {
    for (const [name,args] of [['luckin.auth.send_sms_code',{mobile:'13800000000'}],['luckin.auth.check',{}],['tongji.user.card_balance',{}]] as const) {
      const headers:Record<string,string>={'content-type':'application/json',accept:'application/json, text/event-stream'};
      if (name.startsWith('tongji.')) headers['x-user-id']='external';
      const response=await fetch(baseURL+'/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});
      assert.equal(response.status,200);
      assert.match(await response.text(),/"isError":true/);
    }
    assert.equal(requests.length,0);
  }));
});

it('HTTP 瑞幸及协议请求携带失效 Token 或身份服务故障时返回 403，不访问瑞幸', async () => {
  for (const unavailable of [false,true]) {
    await withLuckinFake(async request => {
      assert.equal(request.url?.includes('lkcoffee.com'),false,'入口校验失败不得访问瑞幸');
      assert.equal(request.headers.Authorization,'Bearer invalid-service-token');
      if (unavailable) throw new Error('private-identity-error');
      return {data:{code:'A99999',data:{list:[]}}};
    }, async requests => withHttpServer(async baseURL => {
      const calls = [
        {method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1'}}},
        {method:'tools/list',params:{}},
        ...['luckin.auth.send_sms_code','luckin.auth.login','luckin.auth.check','luckin.shop.search','luckin.product.search','luckin.product.detail','luckin.product.switch','luckin.order.preview','luckin.order.create','luckin.order.get','luckin.order.cancel'].map(name=>({method:'tools/call',params:{name,arguments:{}}})),
      ];
      for (const call of calls) {
        const response = await fetch(baseURL+'/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','x-user-id':'external','x-tongji-access-token':'invalid-service-token'},body:JSON.stringify({jsonrpc:'2.0',id:1,...call})});
        assert.equal(response.status,403);
        assert.equal(response.headers.get('www-authenticate'),null);
        const payload = await response.json() as {error:string};
        assert.equal(payload.error,'invalid_service_credential');
        assert.doesNotMatch(JSON.stringify(payload),/private-identity-error/);
      }
      assert.equal(requests.length,calls.length);
    }));
  }
});
