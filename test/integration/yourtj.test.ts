import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import { getCourseDetail, getCourseRelated, getMajorsByGrade } from '../../src/integration/yourtj';

describe('getCourseDetail', () => {
  it('应构造课程详情查询的地址与超时', async () => {
    const prev = axios.defaults.adapter;
    let c: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (v) => { c = v; return { data: { id: 12005, name: '军事理论', reviews: [], semesters: [] }, status: 200, statusText: 'OK', headers: {}, config: v }; };
    try {
      await getCourseDetail(12005, { baseUrl: 'https://jcourse.example.test/', timeoutMs: 3_333 });
      assert.equal(c?.url, 'https://jcourse.example.test/api/course/12005');
      assert.equal(c?.method, 'get');
      assert.equal(c?.timeout, 3_333);
    } finally { axios.defaults.adapter = prev; }
  });
});

describe('getCourseRelated', () => {
  it('应构造课程关联查询的地址与超时', async () => {
    const prev = axios.defaults.adapter;
    let c: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (v) => { c = v; return { data: { teacher_other_courses: [], same_course_other_teachers: [] }, status: 200, statusText: 'OK', headers: {}, config: v }; };
    try {
      await getCourseRelated(12005, { baseUrl: 'https://jcourse.example.test/', timeoutMs: 2_222 });
      assert.equal(c?.url, 'https://jcourse.example.test/api/course/12005/related');
      assert.equal(c?.method, 'get');
      assert.equal(c?.timeout, 2_222);
    } finally { axios.defaults.adapter = prev; }
  });
});

describe('getMajorsByGrade', () => {
  it('应构造专业查询的地址、请求体与超时', async () => {
    const prev = axios.defaults.adapter;
    let c: AxiosRequestConfig | undefined;
    axios.defaults.adapter = async (v) => { c = v; return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config: v }; };
    try {
      await getMajorsByGrade(118, 2024, { baseUrl: 'https://jcourse.example.test/', timeoutMs: 1_111 });
      assert.equal(c?.url, 'https://jcourse.example.test/api/findMajorByGrade');
      assert.equal(c?.method, 'post');
      assert.equal(c?.data, JSON.stringify({ calendarId: 118, grade: 2024 }));
      assert.equal(c?.timeout, 1_111);
    } finally { axios.defaults.adapter = prev; }
  });
});

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
