import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import { getAllTermCalendars, getBookLendInfo, getCetScores, getCurrentTermCalendar, getStatisticsInfo, getStipendInfo, getUndergraduateScores } from '../../src/integration/tongji_openapi';

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

describe('getAllTermCalendars', () => {
  it('应构造学期日历查询的地址、认证头与超时', async () => {
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
      await getAllTermCalendars({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 4_567,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/rt/onetongji/school_calendar_all_term_calendar',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 4_567);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getCurrentTermCalendar', () => {
  it('应构造当前学期日历查询的地址、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { schoolCalendar: {} } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getCurrentTermCalendar({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 3_210,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/rt/onetongji/school_calendar_current_term_calendar',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 3_210);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getCetScores', () => {
  it('应构造四六级成绩查询的地址、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { list: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getCetScores({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 8_888,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v1/rt/onetongji/cet_score',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 8_888);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getBookLendInfo', () => {
  it('应构造图书借阅查询的地址、认证头与超时', async () => {
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
      await getBookLendInfo({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 6_666,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/lib/lend_info_all',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 6_666);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getStatisticsInfo', () => {
  it('应构造个人统计查询的地址、认证头与超时', async () => {
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
      await getStatisticsInfo({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 7_777,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/user/user_data_statistics',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 7_777);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getStipendInfo', () => {
  it('应构造助学金查询的地址、认证头与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { list: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getStipendInfo({
        accessToken: 'test-access-token',
        baseUrl: 'https://api.example.test/',
        timeoutMs: 5_555,
      });

      assert.equal(
        capturedConfig?.url,
        'https://api.example.test/v2/dc/student_work_info/stipend',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.headers?.Authorization, 'Bearer test-access-token');
      assert.equal(capturedConfig?.timeout, 5_555);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
