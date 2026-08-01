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
