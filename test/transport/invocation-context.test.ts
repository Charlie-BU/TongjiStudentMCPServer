import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readToolInvocationContext } from '../../src/transport/invocation-context';

describe('readToolInvocationContext', () => {
  it('应读取并规范化单个 access token', () => {
    const context = readToolInvocationContext({
      'x-tongji-access-token': ' test-access-token ',
    });

    assert.deepEqual(context, { accessToken: 'test-access-token' });
  });

  it('应将空白或重复 access token 视为不可信', () => {
    assert.deepEqual(
      readToolInvocationContext({ 'x-tongji-access-token': '   ' }),
      { accessToken: undefined },
    );
    assert.deepEqual(
      readToolInvocationContext({
        'x-tongji-access-token': ['first-token', 'second-token'],
      }),
      { accessToken: undefined },
    );
  });

  it('应在 access token 缺失时返回空调用上下文', () => {
    assert.deepEqual(readToolInvocationContext({}), { accessToken: undefined });
  });
});
