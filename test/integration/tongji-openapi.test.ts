import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import {
  getCompetitionPrizes,
  getStudentScholarshipInfo,
  getUndergraduateScores,
} from '../../src/integration/tongji_openapi';

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

describe('getCompetitionPrizes', () => {
  it('应构造竞赛奖励查询的地址、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { count: 0, list: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getCompetitionPrizes({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 1_234,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/student_work_info/competition_winners',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.params, undefined);
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getStudentScholarshipInfo', () => {
  it('应构造奖学金查询的地址、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { count: 0, list: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getStudentScholarshipInfo({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 1_234,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/student_work_info/scholarship',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.params, undefined);
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
