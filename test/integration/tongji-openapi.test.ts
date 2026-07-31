import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import {
  getCompetitionPrizes,
  getLibraryAccess,
  getSchoolAccess,
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

describe('getSchoolAccess', () => {
  it('应构造校门通行查询的地址、参数、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { count: 0, userInfos: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getSchoolAccess(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        '出门',
        '2026-07-01 00:00:00',
        '2026-07-31 23:59:59',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/dc/door/school_access_control',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, {
        portNum: '出门',
        dataStartTime: '2026-07-01 00:00:00',
        dataEndTime: '2026-07-31 23:59:59',
      });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getLibraryAccess', () => {
  it('应构造图书馆通行查询的地址、参数、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { count: 0, userInfos: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getLibraryAccess(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        '1',
        '2026-07-01 00:00:00',
        '2026-07-31 23:59:59',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/dc/lib/lib_access_control',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, {
        direction: '1',
        visitStartTime: '2026-07-01 00:00:00',
        visitEndTime: '2026-07-31 23:59:59',
      });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
