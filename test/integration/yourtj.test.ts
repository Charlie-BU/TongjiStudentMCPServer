import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import { getMajorsByGrade } from '../../src/integration/yourtj';

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
} from '../../src/integration/yourtj';

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
