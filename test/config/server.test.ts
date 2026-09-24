import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadServerConfig } from '../../src/config/server';

// withServerEnv 在调用结束后恢复与服务配置相关的环境变量。
const withServerEnv = <T>(
  values: { port?: string },
  operation: () => T,
): T => {
  const previousPort = process.env.PORT;

  try {
    if (values.port === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = values.port;
    }
    return operation();
  } finally {
    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  }
};

describe('loadServerConfig', () => {
  it('应在环境变量缺失时使用默认端口', () => {
    const config = withServerEnv({}, loadServerConfig);

    assert.deepEqual(config, { port: 3100 });
  });

  it('应拒绝超出有效范围的端口', () => {
    assert.throws(
      () => withServerEnv({ port: '65536' }, loadServerConfig),
      /PORT must be an integer between 1 and 65535/,
    );
  });

  it('应使用边界端口', () => {
    assert.deepEqual(
      withServerEnv({ port: '65535' }, loadServerConfig),
      { port: 65535 },
    );
    assert.deepEqual(
      withServerEnv({ port: '1' }, loadServerConfig),
      { port: 1 },
    );
  });

  it('应拒绝非整数端口', () => {
    assert.throws(
      () => withServerEnv({ port: '3100.5' }, loadServerConfig),
      /PORT must be an integer between 1 and 65535/,
    );
  });
});
