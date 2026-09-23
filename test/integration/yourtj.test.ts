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
