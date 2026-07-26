import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createMcpServer,
  SERVER_NAME,
  SERVER_VERSION,
} from '../src/server';

describe('createMcpServer', () => {
  it('应公布服务身份且在未注册工具时不声明 tools capability', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { accessToken: 'test-access-token' } });
    const client = new Client({ name: 'test-client', version: '1.0.0' });

    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      assert.deepEqual(client.getServerVersion(), {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      });
      assert.equal(client.getServerCapabilities()?.tools, undefined);
    } finally {
      await server.close();
    }
  });
});
