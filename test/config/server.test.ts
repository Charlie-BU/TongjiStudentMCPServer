import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadServerConfig } from '../../src/config/server';

// withServerEnv 在调用结束后恢复与服务配置相关的环境变量。
const withServerEnv = <T>(
  values: { port?: string; timeoutMs?: string },
  operation: () => T,
): T => {
  const previousPort = process.env.APP_PORT;
  const previousTimeout = process.env.UPSTREAM_TIMEOUT_MS;

  try {
    if (values.port === undefined) {
      delete process.env.APP_PORT;
    } else {
      process.env.APP_PORT = values.port;
    }
    if (values.timeoutMs === undefined) {
      delete process.env.UPSTREAM_TIMEOUT_MS;
    } else {
      process.env.UPSTREAM_TIMEOUT_MS = values.timeoutMs;
    }
    return operation();
  } finally {
    if (previousPort === undefined) {
      delete process.env.APP_PORT;
    } else {
      process.env.APP_PORT = previousPort;
    }
    if (previousTimeout === undefined) {
      delete process.env.UPSTREAM_TIMEOUT_MS;
    } else {
      process.env.UPSTREAM_TIMEOUT_MS = previousTimeout;
    }
  }
};

describe('loadServerConfig', () => {
  it('应在环境变量缺失时使用默认端口与 20 秒超时', () => {
    const config = withServerEnv({}, loadServerConfig);

    assert.deepEqual(config, { port: 3100, upstreamTimeoutMs: 20_000 });
  });

  it('应拒绝超出有效范围的端口', () => {
    assert.throws(
      () => withServerEnv({ port: '65536' }, loadServerConfig),
      /APP_PORT must be an integer between 1 and 65535/,
    );
  });

  it('应使用边界端口', () => {
    assert.deepEqual(
      withServerEnv({ port: '65535' }, loadServerConfig),
      { port: 65535, upstreamTimeoutMs: 20_000 },
    );
    assert.deepEqual(
      withServerEnv({ port: '1' }, loadServerConfig),
      { port: 1, upstreamTimeoutMs: 20_000 },
    );
  });

  it('应拒绝非整数端口', () => {
    assert.throws(
      () => withServerEnv({ port: '3100.5' }, loadServerConfig),
      /APP_PORT must be an integer between 1 and 65535/,
    );
  });

  it('应读取环境变量中的超时并拒绝无效值', () => {
    assert.equal(withServerEnv({ timeoutMs: '30000' }, loadServerConfig).upstreamTimeoutMs, 30_000);
    for (const timeoutMs of ['', '0', '-1', '1.5', 'invalid', 'Infinity', '2147483648']) {
      assert.throws(
        () => withServerEnv({ timeoutMs }, loadServerConfig),
        /UPSTREAM_TIMEOUT_MS must be an integer between 1 and 2147483647/,
      );
    }
  });
});
