import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readToolInvocationContext } from '../../src/transport/invocation-context';

it('读取独立用户 ID 和可选同济 Token，并规范化空白', () => {
  assert.deepEqual(readToolInvocationContext({'x-user-id':' external-user '}), {userId:'external-user'});
  assert.deepEqual(readToolInvocationContext({'x-user-id':' student-1 ', 'x-tongji-access-token':' token '}), {userId:'student-1', accessToken:'token'});
  assert.deepEqual(readToolInvocationContext({'x-user-id':'external-user', 'x-tongji-access-token':' '}), {userId:'external-user'});
  assert.deepEqual(readToolInvocationContext({'x-user-id':'external-user', 'x-tongji-access-token':'not verified'}), {userId:'external-user', accessToken:'not verified'});
});
it('拒绝缺失、批量、重复和非法用户标识，不兼容旧身份头', () => {
  for (const headers of [{}, {'x-tongji-access-token':'token'}, {'x-user-id':'a,b'}, {'x-user-id':['a','b']}, {'x-user-id':' '}, {'x-user-id':'a b'}, {'x-tongji-user-id':'old-user','x-tongji-access-token':'token'}]) {
    assert.deepEqual(readToolInvocationContext(headers), {});
  }
});
