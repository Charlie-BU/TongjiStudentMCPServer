import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import {
  getCardSpendingFlow,
  getCompetitionPrizes,
  getLibraryAccess,
  getSchoolAccess,
  getStatisticsInfoByYear,
  getStudentHonoraryTitles,
  getStudentScholarshipInfo,
  getStudentTimetable,
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

describe('getStudentHonoraryTitles', () => {
  it('应构造荣誉称号查询的地址、认证头与超时', async () => {
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
      await getStudentHonoraryTitles({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 1_234,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/student_work_info/honorary_title',
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

describe('getStatisticsInfoByYear', () => {
  it('应构造年度统计账单查询的地址、参数、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getStatisticsInfoByYear(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        '2024',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/user/user_annual_bill',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, { year: '2024' });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getCardSpendingFlow', () => {
  it('应构造一卡通消费流水查询的地址、参数、认证头与超时', async () => {
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
      await getCardSpendingFlow(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        '2025-05-01 00:00:00',
        '2025-05-31 23:59:59',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/dc/card/card_history_flow',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, {
        tradeStartTime: '2025-05-01 00:00:00',
        tradeEndTime: '2025-05-31 23:59:59',
      });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getStudentTimetable', () => {
  it('应构造学生课表查询的地址、参数、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getStudentTimetable(
        {
          accessToken: 'test-access-token',
          baseUrl: 'https://api.example.test/',
          timeoutMs: 1_234,
        },
        '120',
      );

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/rt/onetongji/student_timetable',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, { calendarId: '120' });
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
