import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readToolInvocationContext } from '../../src/transport/invocation-context';

it('原样读取独立用户 ID，仅规范化可选同济 Token 的空白', () => {
  assert.deepEqual(readToolInvocationContext({'x-user-id':' external-user '}), {userId:' external-user '});
  assert.deepEqual(readToolInvocationContext({'x-user-id':' student-1 ', 'x-tongji-access-token':' token '}), {userId:' student-1 ', accessToken:'token'});
  assert.deepEqual(readToolInvocationContext({'x-user-id':'external-user', 'x-tongji-access-token':' '}), {userId:'external-user'});
  assert.deepEqual(readToolInvocationContext({'x-user-id':'external-user', 'x-tongji-access-token':'not verified'}), {userId:'external-user', accessToken:'not verified'});
});
it('用户标识不限制字符格式且不改变原值', () => {
  for (const userId of ['15947513567charlie@gmail.com', '用户甲', 'a,b', 'a b', ' ', ' a+b/@:._- ', 'MixedCase@example.com']) {
    assert.deepEqual(readToolInvocationContext({'x-user-id': userId}), {userId});
  }
});
it('缺失、空字符串和非单字符串身份不进入上下文，不兼容旧身份头', () => {
  for (const headers of [{}, {'x-tongji-access-token':'token'}, {'x-user-id':''}, {'x-user-id':['a','b']}, {'x-tongji-user-id':'old-user','x-tongji-access-token':'token'}]) {
    assert.deepEqual(readToolInvocationContext(headers), {});
  }
});
