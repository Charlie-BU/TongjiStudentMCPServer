import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { type AxiosRequestConfig } from 'axios';
import { getCourseDetail } from '../../src/integration/yourtj';

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
