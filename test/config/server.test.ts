import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadServerConfig } from '../../src/config/server';

// withServerEnv 在调用结束后恢复与服务配置相关的环境变量。
const withServerEnv = <T>(
  values: { host?: string; port?: string },
  operation: () => T,
): T => {
  const previousHost = process.env.HOST;
  const previousPort = process.env.PORT;

  try {
    if (values.host === undefined) {
      delete process.env.HOST;
    } else {
      process.env.HOST = values.host;
    }
    if (values.port === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = values.port;
    }
    return operation();
  } finally {
    if (previousHost === undefined) {
      delete process.env.HOST;
    } else {
      process.env.HOST = previousHost;
    }
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  }
};

describe('loadServerConfig', () => {
  it('应在环境变量缺失时使用本地默认监听地址和端口', () => {
    const config = withServerEnv({}, loadServerConfig);

    assert.deepEqual(config, { host: '127.0.0.1', port: 3000 });
  });

  it('应拒绝超出有效范围的端口', () => {
    assert.throws(
      () => withServerEnv({ port: '65536' }, loadServerConfig),
      /PORT must be an integer between 1 and 65535/,
    );
  });

  it('应使用显式的监听地址和边界端口', () => {
    assert.deepEqual(
      withServerEnv({ host: '0.0.0.0', port: '1' }, loadServerConfig),
      { host: '0.0.0.0', port: 1 },
    );
    assert.deepEqual(
      withServerEnv({ port: '65535' }, loadServerConfig),
      { host: '127.0.0.1', port: 65535 },
    );
  });

  it('应拒绝非整数端口', () => {
    assert.throws(
      () => withServerEnv({ port: '3000.5' }, loadServerConfig),
      /PORT must be an integer between 1 and 65535/,
    );
  });
});
