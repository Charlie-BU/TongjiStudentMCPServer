import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import { getUndergraduateScores } from '../../src/integration/tongji_openapi';

describe('getUndergraduateScores', () => {
  it('应构造成绩查询的地址、参数、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { term: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getUndergraduateScores(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        'test-calendar',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/rt/onetongji/undergraduate_score',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, { calendarId: 'test-calendar' });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
