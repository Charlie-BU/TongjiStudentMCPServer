import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readToolInvocationContext } from '../../src/transport/invocation-context';

describe('readToolInvocationContext', () => {
  it('应读取并规范化单个 access token', () => {
    const context = readToolInvocationContext({
      'x-tongji-access-token': ' test-access-token ',
'x-tongji-user-id': ' student-1 ',
    });

    assert.deepEqual(context, { accessToken: 'test-access-token', userId: 'student-1' });
  });

  it('应将空白或重复 access token 视为不可信', () => {
    assert.deepEqual(
      readToolInvocationContext({ 'x-tongji-access-token': '   ' }),
      {},
    );
    assert.deepEqual(
      readToolInvocationContext({
        'x-tongji-access-token': ['first-token', 'second-token'],
      }),
      {},
    );
  });

  it('应在 access token 缺失时返回空调用上下文', () => {
    assert.deepEqual(readToolInvocationContext({}), {});
  });
});

it('rejects incomplete pairs, batches and duplicate identity headers', () => {
 for (const headers of [
  {'x-tongji-access-token':'service-token'},
  {'x-tongji-user-id':'student-a'},
  {'x-tongji-access-token':'service-token','x-tongji-user-id':'a,b'},
  {'x-tongji-access-token':'service-token','x-tongji-user-id':['a','b']},
 ]) assert.deepEqual(readToolInvocationContext(headers),{});
});
