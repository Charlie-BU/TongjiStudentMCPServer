import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import {
  getAllCalendars,
  getCourses,
  getGradesByCalendarId,
} from '../../src/integration/yourtj';

describe('getCourses', () => {
  it('应构造课程目录查询的地址、参数与超时', async () => {
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
      await getCourses(
        {
          baseUrl: 'https://jcourse.example.test/',
          timeoutMs: 1_234,
        },
        1,
        20,
        '思想道德',
        true,
      );

      assert.equal(
        capturedConfig?.url,
        'https://jcourse.example.test/api/courses',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.deepEqual(capturedConfig?.params, {
        page: 1,
        limit: 20,
        q: '思想道德',
        includeTotal: true,
      });
      assert.equal(capturedConfig?.headers?.Authorization, undefined);
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getAllCalendars', () => {
  it('应构造学期列表查询的地址与超时', async () => {
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
      await getAllCalendars({
        baseUrl: 'https://jcourse.example.test/',
        timeoutMs: 1_234,
      });

      assert.equal(
        capturedConfig?.url,
        'https://jcourse.example.test/api/getAllCalendar',
      );
      assert.equal(capturedConfig?.method, 'get');
      assert.equal(capturedConfig?.params, undefined);
      assert.equal(capturedConfig?.headers?.Authorization, undefined);
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});

describe('getGradesByCalendarId', () => {
  it('应构造年级界别查询的地址、请求体与超时', async () => {
    const previousAdapter = axios.defaults.adapter;
    let capturedConfig: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { data: { gradeList: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await getGradesByCalendarId(
        {
          baseUrl: 'https://jcourse.example.test/',
          timeoutMs: 1_234,
        },
        123,
      );

      assert.equal(
        capturedConfig?.url,
        'https://jcourse.example.test/api/findGradeByCalendarId',
      );
      assert.equal(capturedConfig?.method, 'post');
      assert.deepEqual(JSON.parse(String(capturedConfig?.data)), {
        calendarId: 123,
      });
      assert.equal(capturedConfig?.params, undefined);
      assert.equal(capturedConfig?.headers?.Authorization, undefined);
      assert.equal(capturedConfig?.timeout, 1_234);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });
});
