import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import axios, { AxiosError } from 'axios';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createMcpServer,
  SERVER_NAME,
  SERVER_VERSION,
} from '../src/server';
import { UNDERGRADUATE_SCORE_TOOL_NAME } from '../src/tools/undergraduate-score';
import { TERM_CALENDAR_TOOL_NAME } from '../src/tools/term-calendar';
import { CURRENT_TERM_CALENDAR_TOOL_NAME } from '../src/tools/current-term-calendar';
import { CET_SCORE_TOOL_NAME } from '../src/tools/cet-score';
import { BOOK_LEND_INFO_TOOL_NAME } from '../src/tools/book-lend-info';
import { STATISTICS_INFO_TOOL_NAME } from '../src/tools/statistics-info';
import { STIPEND_INFO_TOOL_NAME } from '../src/tools/stipend-info';
import { ACCOMMODATION_INFO_TOOL_NAME } from '../src/tools/accommodation-info';
import { COURSE_DETAIL_TOOL_NAME } from '../src/tools/course-detail';
import { COURSE_RELATED_TOOL_NAME } from '../src/tools/course-related';
import { FIND_MAJOR_BY_GRADE_TOOL_NAME } from '../src/tools/find-major-by-grade';

// ScoreToolCallResult 表示成绩查询工具的测试结果。
interface ScoreToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// TermCalendarToolCallResult 表示学期日历查询工具的测试结果。
interface TermCalendarToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// CurrentTermCalendarToolCallResult 表示当前学期日历查询工具的测试结果。
interface CurrentTermCalendarToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// CetScoreToolCallResult 表示四六级成绩查询工具的测试结果。
interface CetScoreToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// BookLendInfoToolCallResult 表示图书借阅信息查询工具的测试结果。
interface BookLendInfoToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// CourseRelatedToolCallResult 表示课程关联查询工具的测试结果。
interface CourseRelatedToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// FindMajorByGradeToolCallResult 表示按学期年级查询专业工具的测试结果。
interface FindMajorByGradeToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// CourseDetailToolCallResult 表示课程详情查询工具的测试结果。
interface CourseDetailToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// AccommodationInfoToolCallResult 表示住宿信息查询工具的测试结果。
interface AccommodationInfoToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// StipendInfoToolCallResult 表示助学金信息查询工具的测试结果。
interface StipendInfoToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

// StatisticsInfoToolCallResult 表示个人统计数据查询工具的测试结果。
interface StatisticsInfoToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

describe('createMcpServer', () => {
  it('应公布服务身份并声明成绩查询、学期日历、四六级成绩、图书借阅与个人统计工具', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { accessToken: 'test-access-token' } });
    const client = new Client({ name: 'test-client', version: '1.0.0' });

    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      assert.deepEqual(client.getServerVersion(), {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      });
      assert.ok(client.getServerCapabilities()?.tools);
      const toolList = await client.listTools();
      const scoreTool = toolList.tools.find(
        (tool) => tool.name === UNDERGRADUATE_SCORE_TOOL_NAME,
      );
      assert.ok(scoreTool);
      assert.match(
        JSON.stringify(scoreTool.outputSchema),
        /全部学期已修总学分/,
      );
      assert.match(
        JSON.stringify(scoreTool.outputSchema),
        /本学期课程成绩列表/,
      );
      const calendarTool = toolList.tools.find(
        (tool) => tool.name === TERM_CALENDAR_TOOL_NAME,
      );
      assert.ok(calendarTool);
      assert.match(
        JSON.stringify(calendarTool.outputSchema),
        /学期完整名称/,
      );
      assert.match(
        JSON.stringify(calendarTool.outputSchema),
        /全部学期日历列表/,
      );
      const currentTermTool = toolList.tools.find(
        (tool) => tool.name === CURRENT_TERM_CALENDAR_TOOL_NAME,
      );
      assert.ok(currentTermTool);
      assert.match(
        JSON.stringify(currentTermTool.outputSchema),
        /当前所处的教学周序号/,
      );
      assert.match(
        JSON.stringify(currentTermTool.outputSchema),
        /当前学期日历数据/,
      );
      const cetScoreTool = toolList.tools.find(
        (tool) => tool.name === CET_SCORE_TOOL_NAME,
      );
      assert.ok(cetScoreTool);
      assert.match(
        JSON.stringify(cetScoreTool.outputSchema),
        /考试科目名称/,
      );
      assert.match(
        JSON.stringify(cetScoreTool.outputSchema),
        /四六级考试成绩记录列表/,
      );
      const bookLendTool = toolList.tools.find(
        (tool) => tool.name === BOOK_LEND_INFO_TOOL_NAME,
      );
      assert.ok(bookLendTool);
      assert.match(
        JSON.stringify(bookLendTool.outputSchema),
        /责任者（作者）/,
      );
      assert.match(
        JSON.stringify(bookLendTool.outputSchema),
        /图书借阅记录列表/,
      );
      const statsTool = toolList.tools.find(
        (tool) => tool.name === STATISTICS_INFO_TOOL_NAME,
      );
      assert.ok(statsTool);
      assert.match(
        JSON.stringify(statsTool.outputSchema),
        /食堂累计消费总金额/,
      );
      assert.match(
        JSON.stringify(statsTool.outputSchema),
        /个人统计数据记录列表/,
      );
      const stipendTool = toolList.tools.find(
        (tool) => tool.name === STIPEND_INFO_TOOL_NAME,
      );
      assert.ok(stipendTool);
      assert.match(
        JSON.stringify(stipendTool.outputSchema),
        /助学金名称/,
      );
      assert.match(
        JSON.stringify(stipendTool.outputSchema),
        /助学金记录列表/,
      );
      const accTool = toolList.tools.find(
        (tool) => tool.name === ACCOMMODATION_INFO_TOOL_NAME,
      );
      assert.ok(accTool);
      assert.match(JSON.stringify(accTool.outputSchema), /宿舍楼名称/);
      assert.match(JSON.stringify(accTool.outputSchema), /住宿记录列表/);
      const courseTool = toolList.tools.find(t => t.name === COURSE_DETAIL_TOOL_NAME);
      assert.ok(courseTool);
      assert.match(JSON.stringify(courseTool.inputSchema), /课程ID/);
      assert.match(JSON.stringify(courseTool.outputSchema), /授课教师姓名/);
      const relatedTool = toolList.tools.find(t => t.name === COURSE_RELATED_TOOL_NAME);
      assert.ok(relatedTool);
      assert.match(JSON.stringify(relatedTool.outputSchema), /该教师教授的其他课程列表/);
    } finally {
      await server.close();
    }
  });

  it('应拒绝缺失 access token 的成绩查询', async () => {
    const result = await callScoreTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回上游成绩数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: {
            actualCredit: '143.50000',
            failingCourseCount: '1',
            failingCredits: '3.00000',
            totalGradePoint: '4.11',
            term: [{
              averagePoint: '4.49',
              calName: '20251',
              creditInfo: [{
                courseCode: '420268',
                courseName: '汇编语言',
                credit: 2,
                gradePoint: 5,
                isPass: 1,
                isPassName: '是',
                publicCoursesName: '必修',
                score: '优',
                scoreName: '优',
                updateTime: '2026-01-07 14:28:20',
                year: '2025',
                studentId: '2350939',
                studentName: '卜天',
                id: 20260107177272,
                courseNum: '42026801',
              }],
              termName: '2025-2026学年第1学期',
              termcode: '120',
              hiddenField: 'ignored',
            }],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callScoreTool({ accessToken: 'access-token-for-test' }, { calendarId: '118' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          actualCredit: '143.50000',
          failingCourseCount: '1',
          failingCredits: '3.00000',
          totalGradePoint: '4.11',
          term: [{
            averagePoint: '4.49',
            calName: '20251',
            creditInfo: [{
              courseCode: '420268',
              courseName: '汇编语言',
              credit: 2,
              gradePoint: 5,
              isPass: 1,
              isPassName: '是',
              publicCoursesName: '必修',
              score: '优',
              scoreName: '优',
              updateTime: '2026-01-07 14:28:20',
              year: '2025',
            }],
            termName: '2025-2026学年第1学期',
            termcode: '120',
          }],
        },
        source: 'Tongji Open Platform',
        calendarId: '118',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空成绩数据标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { term: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callScoreTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: {
          actualCredit: null,
          failingCourseCount: null,
          failingCredits: null,
          totalGradePoint: null,
          term: [],
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callScoreTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济成绩服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callScoreTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callScoreTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /成绩服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 学期日历工具测试 ---

  it('应拒绝缺失 access token 的学期日历查询', async () => {
    const result = await callTermCalendarTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回学期日历数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: [
            {
              id: 113,
              year: 2021,
              term: 2,
              beginDay: 1645372800000,
              endDay: 1661702399000,
              weekNum: 27,
              weekBeginDay: 2,
              createdAt: '2019-08-16 10:53:06',
              updatedAt: '2022-02-21 10:42:57',
              deleteFlag: 0,
              ids: null,
              gradePartOne: '2021',
              gradePartTwo: '2022',
              fullName: '2021-2022学年第2学期',
              currentTermFlag: true,
              nextTermFlag: false,
              perTerm: '第2学期',
              perYear: '2021-2022学年',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          terms: [
            {
              year: 2021,
              term: 2,
              weekNum: 27,
              fullName: '2021-2022学年第2学期',
            },
          ],
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空的学期日历数据标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { terms: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济学期日历服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callTermCalendarTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /学期日历服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 当前学期日历工具测试 ---

  it('应拒绝缺失 access token 的当前学期日历查询', async () => {
    const result = await callCurrentTermCalendarTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回当前学期日历数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: {
            schoolCalendar: {
              id: 113,
              year: 2021,
              term: 2,
              weekNum: 27,
              beginDay: 1645372800000,
              endDay: 1661702399000,
            },
            week: 5,
            simpleName: '2021-2022学年度第2学期',
            now: '2022年5月',
            name: '现在是2021-2022学年第2学期第5周，当前学期从2022-02-21到2022-08-28，共27周',
            hiddenField: 'ignored',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          year: 2021,
          term: 2,
          weekNum: 27,
          week: 5,
          simpleName: '2021-2022学年度第2学期',
          now: '2022年5月',
          name: '现在是2021-2022学年第2学期第5周，当前学期从2022-02-21到2022-08-28，共27周',
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空的当前学期日历对象标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { schoolCalendar: {} } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: null,
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游 data:null 响应视为空数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: null,
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为当前学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济当前学期日历服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为当前学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为当前学期日历工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callCurrentTermCalendarTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /当前学期日历服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 四六级成绩工具测试 ---

  it('应拒绝缺失 access token 的四六级成绩查询', async () => {
    const result = await callCetScoreTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回四六级成绩数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: {
            pageNum_: 1,
            pageSize_: 20,
            total_: 2,
            list: [
              {
                calendarId: 112,
                calendarYear: null,
                calendarTerm: null,
                calendarYearTerm: null,
                calendarYearTermCn: '2021-2022学年第1学期',
                studentId: '205****',
                studentName: '欧****',
                title: null,
                subjectCode: null,
                competitionType: null,
                writtenSubjectName: '（2）英语六级笔试',
                cardNo: '31003121*******',
                score: '603.00',
                scoreRank: null,
                oralScore: null,
                examTime: null,
                cetType: 2,
                competitionId: null,
                scoreExamCategory: null,
                competitionExamCategory: null,
                signUpStudentId: null,
              },
              {
                calendarId: 111,
                calendarYear: null,
                calendarTerm: null,
                calendarYearTerm: null,
                calendarYearTermCn: '2020-2021学年第2学期',
                studentId: '205****',
                studentName: '欧****',
                title: null,
                subjectCode: null,
                competitionType: null,
                writtenSubjectName: '（1）英语四级笔试',
                cardNo: '31003121*******',
                score: '599.00',
                scoreRank: null,
                oralScore: null,
                examTime: null,
                cetType: 1,
                competitionId: null,
                scoreExamCategory: null,
                competitionExamCategory: null,
                signUpStudentId: null,
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callCetScoreTool({ accessToken: 'access-token-for-test' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          records: [
            {
              studentId: '205****',
              studentName: '欧****',
              competitionType: null,
              writtenSubjectName: '（2）英语六级笔试',
              cardNo: '31003121*******',
              score: '603.00',
              scoreRank: null,
              oralScore: null,
              examTime: null,
              cetType: 2,
            },
            {
              studentId: '205****',
              studentName: '欧****',
              competitionType: null,
              writtenSubjectName: '（1）英语四级笔试',
              cardNo: '31003121*******',
              score: '599.00',
              scoreRank: null,
              oralScore: null,
              examTime: null,
              cetType: 1,
            },
          ],
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空的四六级成绩数据标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { list: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCetScoreTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { records: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为四六级成绩工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCetScoreTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /四六级成绩服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为四六级成绩工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callCetScoreTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为四六级成绩工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callCetScoreTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /四六级成绩服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 图书借阅信息工具测试 ---

  it('应拒绝缺失 access token 的图书借阅查询', async () => {
    const result = await callBookLendInfoTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回图书借阅数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: [
            {
              asbackDate: '',
              asbackTimes: '0',
              author: '(日) 东野圭吾著',
              callNo: 'I',
              callNoName: '文学',
              countryCode: 'CN',
              countryName: '中国',
              debtFlag: '0',
              deptCode: '000182',
              deptName: '土木工程学院',
              docTypeCode: '01',
              docTypeName: '中文图书',
              isJournal: '否',
              isbn: '978-7-5448-3396-7',
              langCode: 'CHI',
              langName: '中文',
              lendDate: '2021-03-1512:05:39',
              locationCode: 'A2001',
              locationName: '四平路校区图书馆书库',
              name: '张三',
              propNo: '02734098',
              pubYear: '2014',
              publisher: '接力出版社',
              renewDate: '',
              renewTimes: '0',
              retDate: '2021-05-1017:59:49',
              title: '圣女的救赎',
              totalLendQty: '7',
              userId: '20**4',
              internalField: 'ignored',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callBookLendInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          records: [
            {
              asbackDate: '',
              asbackTimes: 0,
              author: '(日) 东野圭吾著',
              callNo: 'I',
              callNoName: '文学',
              countryCode: 'CN',
              countryName: '中国',
              debtFlag: 0,
              deptCode: '000182',
              deptName: '土木工程学院',
              docTypeCode: '01',
              docTypeName: '中文图书',
              isbn: '978-7-5448-3396-7',
              langCode: 'CHI',
              langName: '中文',
              lendDate: '2021-03-1512:05:39',
              locationCode: 'A2001',
              locationName: '四平路校区图书馆书库',
              name: '张三',
              propNo: '02734098',
              pubYear: '2014',
              publisher: '接力出版社',
              renewDate: '',
              renewTimes: 0,
              retDate: '2021-05-1017:59:49',
              title: '圣女的救赎',
              totalLendQty: 7,
              userId: '20**4',
            },
          ],
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空的图书借阅数据标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callBookLendInfoTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { records: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为图书借阅工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callBookLendInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /图书借阅服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为图书借阅工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callBookLendInfoTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为图书借阅工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callBookLendInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /图书借阅服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 个人统计数据工具测试 ---

  it('应拒绝缺失 access token 的个人统计查询', async () => {
    const result = await callStatisticsInfoTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回个人统计数据', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: [{
            bookCategory: '中文图书',
            bookCoun: 11,
            bookFirst: '大乔小乔',
            canteenAmount: 1565.64,
            canteenAmtPercentileRank: 0.2902,
            canteenCoun: 225,
            canteenOften: '四平校区学苑饮食广场中点部',
            canteenOftenPercentileRank: 0.6089,
            cardPelaceCoun: 3,
            college: '环*******院',
            consumMostAmount: 68,
            consumMostTime: '2019-11-29 19:35:52',
            consumePlaceOften: '四平校区学苑饮食广场中点部',
            consumeTotal: 1618.34,
            consumeTotalPercentileRank: 0.2608,
            earlistTime: '2021-10-31 07:54:24',
            entYear: 2018,
            entranceCoun: 34,
            firstCardPlaceTime: '2018-11-22 20:06:55',
            gender: '0',
            latestTime: '2021-10-31 19:59:04',
            major: '环**程',
            marketAmount: 17.7,
            rechargeTimeSlot: '18:00-20:00',
            rideCoun: 0,
            scholarshipCoun: 0,
            sname: '**轻',
            stayTime: 173.53,
            stayTimePercentileRank: 0.4121,
            stayYear: 4,
            stuLevel: '1',
            userId: '1****9',
            hiddenField: 'ignored',
          }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callStatisticsInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          records: [{
            bookCategory: '中文图书',
            bookCoun: 11,
            bookFirst: '大乔小乔',
            canteenAmount: 1565.64,
            canteenAmtPercentileRank: 0.2902,
            canteenCoun: 225,
            canteenOften: '四平校区学苑饮食广场中点部',
            canteenOftenPercentileRank: 0.6089,
            cardPelaceCoun: 3,
            college: '环*******院',
            consumMostAmount: 68,
            consumMostTime: '2019-11-29 19:35:52',
            consumePlaceOften: '四平校区学苑饮食广场中点部',
            consumeTotal: 1618.34,
            consumeTotalPercentileRank: 0.2608,
            earlistTime: '2021-10-31 07:54:24',
            entYear: 2018,
            entranceCoun: 34,
            firstCardPlaceTime: '2018-11-22 20:06:55',
            gender: '0',
            latestTime: '2021-10-31 19:59:04',
            major: '环**程',
            marketAmount: 17.7,
            rechargeTimeSlot: '18:00-20:00',
            rideCoun: 0,
            scholarshipCoun: 0,
            sname: '**轻',
            stayTime: 173.53,
            stayTimePercentileRank: 0.4121,
            stayYear: 4,
            stuLevel: '1',
            userId: '1****9',
          }],
        },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空的个人统计数据标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callStatisticsInfoTool({ accessToken: 'access-token-for-test' });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { records: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游业务错误响应归一为个人统计工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callStatisticsInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /个人统计服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游未授权错误归一为个人统计工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    try {
      const result = await callStatisticsInfoTool({ accessToken: 'expired-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将上游不可用错误归一为个人统计工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callStatisticsInfoTool({ accessToken: 'access-token-for-test' });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /个人统计服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  // --- 助学金信息工具测试 ---

  it('应拒绝缺失 access token 的助学金查询', async () => {
    const result = await callStipendInfoTool({});
    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回助学金数据', async () => {
    const prev = axios.defaults.adapter;
    let auth: string | undefined;
    axios.defaults.adapter = async (c) => {
      auth = c.headers?.Authorization as string | undefined;
      return { data: { data: { count: 1, list: [{ amount: 1000, deptCode: '000215', deptName: '材料科学与工程学院', name: '柳**', rankName: '不分等级', ratingTerm: '不分学期', ratingYear: '2020', stipendName: '研究生**使用项', unitAbbreviation: '材料科学与工程学院', updateTime: '2025-09-29T00:00:00', userId: '1*****2', wid: 'B8101D5249AB62CDE053647CA8C08EFD', sinceWid: 'ignored' }] } }, status: 200, statusText: 'OK', headers: {}, config: c };
    };
    try {
      const r = await callStipendInfoTool({ accessToken: 't' });
      assert.equal(auth, 'Bearer t');
      assert.equal(r.isError, undefined);
      assert.deepEqual(r.structuredContent, { status: 'ok', data: { records: [{ amount: 1000, deptCode: '000215', deptName: '材料科学与工程学院', name: '柳**', rankName: '不分等级', ratingTerm: '不分学期', ratingYear: '2020', stipendName: '研究生**使用项', unitAbbreviation: '材料科学与工程学院', updateTime: '2025-09-29T00:00:00', userId: '1*****2', wid: 'B8101D5249AB62CDE053647CA8C08EFD' }] }, source: 'Tongji Open Platform' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将空的助学金数据标记为空结果', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { data: { list: [] } }, status: 200, statusText: 'OK', headers: {}, config: c });
    try {
      const r = await callStipendInfoTool({ accessToken: 't' });
      assert.deepEqual(r.structuredContent, { status: 'empty', data: { records: [] }, source: 'Tongji Open Platform' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游业务错误响应归一为助学金工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { code: 500 }, status: 200, statusText: 'OK', headers: {}, config: c });
    try {
      const r = await callStipendInfoTool({ accessToken: 't' });
      assert.equal(r.isError, true);
      assert.match(readToolText(r), /助学金服务返回异常/);
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游未授权错误归一为助学金工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => { throw new AxiosError('Unauthorized', undefined, c, undefined, { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config: c }); };
    try {
      const r = await callStipendInfoTool({ accessToken: 'expired' });
      assert.equal(r.isError, true);
      assert.match(readToolText(r), /授权无效或已过期/);
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游不可用错误归一为助学金工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => { throw new Error('upstream unavailable'); };
    try {
      const r = await callStipendInfoTool({ accessToken: 't' });
      assert.equal(r.isError, true);
      assert.match(readToolText(r), /助学金服务暂时不可用/);
    } finally { axios.defaults.adapter = prev; }
  });

  // --- 住宿信息工具测试 ---

  it('应拒绝缺失 access token 的住宿查询', async () => {
    const r = await callAccommodationInfoTool({});
    assert.equal(r.isError, true);
    assert.match(readToolText(r), /未提供同济账号授权/);
  });

  it('应注入 token 并返回住宿数据', async () => {
    const prev = axios.defaults.adapter; let auth: string | undefined;
    axios.defaults.adapter = async (c) => { auth = c.headers?.Authorization as string|undefined; return { data: { data: { list: [{ accomBuildingCode:'2622',accomBuildingName:'彰武2号楼（女）',accomRegionCode:'8',accomRegionName:'彰武路校区',deptCode:'000624',deptName:'口腔医学院',floor:'19',name:'朱**',roomNo:'1909',schoolCode:null,schoolName:null,updateTime:'2026-01-04T00:00:00',userId:'21****4',usertypeCode:'3',usertypeName:'硕士研究生',internal:'ignored' }] } }, status:200, statusText:'OK', headers:{}, config:c }; };
    try {
      const r = await callAccommodationInfoTool({ accessToken: 't' });
      assert.equal(auth, 'Bearer t'); assert.equal(r.isError, undefined);
      assert.deepEqual(r.structuredContent, { status:'ok', data:{ records:[{ accomBuildingCode:'2622',accomBuildingName:'彰武2号楼（女）',accomRegionCode:'8',accomRegionName:'彰武路校区',deptCode:'000624',deptName:'口腔医学院',floor:'19',name:'朱**',roomNo:'1909',userId:'21****4',usertypeCode:'3',usertypeName:'硕士研究生' }] }, source:'Tongji Open Platform' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将空的住宿数据标记为空结果', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { data: { list: [] } }, status:200, statusText:'OK', headers:{}, config:c });
    try { const r = await callAccommodationInfoTool({ accessToken: 't' }); assert.deepEqual(r.structuredContent, { status:'empty', data:{ records:[] }, source:'Tongji Open Platform' }); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游业务错误响应归一为住宿工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data:{ code:500 }, status:200, statusText:'OK', headers:{}, config:c });
    try { const r = await callAccommodationInfoTool({ accessToken: 't' }); assert.equal(r.isError, true); assert.match(readToolText(r), /住宿信息服务返回异常/); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游未授权错误归一为住宿工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => { throw new AxiosError('Unauthorized',undefined,c,undefined,{ data:{},status:401,statusText:'Unauthorized',headers:{},config:c }); };
    try { const r = await callAccommodationInfoTool({ accessToken:'expired' }); assert.equal(r.isError,true); assert.match(readToolText(r),/授权无效或已过期/); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游不可用错误归一为住宿工具错误', async () => {
    const prev = axios.defaults.adapter; axios.defaults.adapter = async () => { throw new Error('unavailable'); };
    try { const r = await callAccommodationInfoTool({ accessToken:'t' }); assert.equal(r.isError,true); assert.match(readToolText(r),/住宿信息服务暂时不可用/); } finally { axios.defaults.adapter = prev; }
  });

  // --- 课程详情工具测试 ---

  it('应注入课程ID并返回课程详情与裁剪后的评价', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { id:12005, code:'36002907', name:'军事理论', credit:2, department:'武装部', teacher_id:2808, review_count:58, review_avg:5, search_keywords:'36002907 军事理论', is_legacy:0, is_icu:1, teacher_name:'郑义炜', semesters:['2025-2026学年第2学期'], reviews:[{ sqid:'ckJ9', id:18232, course_id:12005, semester:'2025-2026学年第1学期', rating:5, comment:'## 考核方式：\n期末开卷考', score:null, created_at:1784192109, approve_count:0, disapprove_count:0, is_hidden:0, is_legacy:0, is_icu:0, reviewer_name:'', reviewer_avatar:'', like_count:0, liked:false, can_edit:false }] }, status:200, statusText:'OK', headers:{}, config:c });
    try {
      const r = await callCourseDetailTool({}, { id:12005 });
      assert.equal(r.isError, undefined);
      assert.deepEqual(r.structuredContent, { status:'ok', data:{ id:12005, code:'36002907', name:'军事理论', credit:2, department:'武装部', teacher_id:2808, review_count:58, review_avg:5, search_keywords:'36002907 军事理论', teacher_name:'郑义炜', semesters:['2025-2026学年第2学期'], reviews:[{ id:18232, course_id:12005, semester:'2025-2026学年第1学期', rating:5, comment:'## 考核方式：\n期末开卷考', score:null, created_at:1784192109, approve_count:0, disapprove_count:0, is_hidden:0, reviewer_name:'', like_count:0 }] }, source:'YourTJ' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将无课程数据的响应标记为空结果', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => { throw new axios.AxiosError('Not Found', undefined, c, undefined, { data:{}, status:404, statusText:'Not Found', headers:{}, config:c }); };
    try { const r = await callCourseDetailTool({}, { id:99999 }); assert.equal(r.isError, true); assert.match(readToolText(r), /未找到指定课程/); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游不可用错误归一为课程详情工具错误', async () => {
    const prev = axios.defaults.adapter; axios.defaults.adapter = async () => { throw new Error('unavailable'); };
    try { const r = await callCourseDetailTool({}, { id:12005 }); assert.equal(r.isError, true); assert.match(readToolText(r), /课程详情服务暂时不可用/); } finally { axios.defaults.adapter = prev; }
  });

  // --- 课程关联工具测试 ---

  it('应注入课程ID并返回关联课程数据', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { teacher_other_courses:[{ id:2846, code:'360007', name:'世界大战与局部战争', teacher_name:'郑义炜', review_avg:5, review_count:43 }], same_course_other_teachers:[{ id:9258, code:'36002907', name:'军事理论', teacher_name:'袁品仕', review_avg:0, review_count:0 }] }, status:200, statusText:'OK', headers:{}, config:c });
    try {
      const r = await callCourseRelatedTool({}, { id:12005 });
      assert.equal(r.isError, undefined);
      assert.deepEqual(r.structuredContent, { status:'ok', data:{ teacherOtherCourses:[{ id:2846, code:'360007', name:'世界大战与局部战争', teacher_name:'郑义炜', review_avg:5, review_count:43 }], sameCourseOtherTeachers:[{ id:9258, code:'36002907', name:'军事理论', teacher_name:'袁品仕', review_avg:0, review_count:0 }] }, source:'YourTJ' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将无关联数据的响应标记为空结果', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { teacher_other_courses:[], same_course_other_teachers:[] }, status:200, statusText:'OK', headers:{}, config:c });
    try { const r = await callCourseRelatedTool({}, { id:12005 }); assert.deepEqual(r.structuredContent, { status:'empty', data:null, source:'YourTJ' }); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游不可用错误归一为课程关联工具错误', async () => {
    const prev = axios.defaults.adapter; axios.defaults.adapter = async () => { throw new Error('unavailable'); };
    try { const r = await callCourseRelatedTool({}, { id:12005 }); assert.equal(r.isError, true); assert.match(readToolText(r), /课程关联服务暂时不可用/); } finally { axios.defaults.adapter = prev; }
  });

  // --- 按学期年级查询专业工具测试 ---

  it('应注入参数并返回专业列表', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { data: [{ code:'00304', name:'2024(00304 基础学科拔尖基地(数学))' }] }, status:200, statusText:'OK', headers:{}, config:c });
    try {
      const r = await callFindMajorByGradeTool({}, { calendarId:118, grade:2024 });
      assert.equal(r.isError, undefined);
      assert.deepEqual(r.structuredContent, { status:'ok', data:{ records:[{ code:'00304', name:'2024(00304 基础学科拔尖基地(数学))' }] }, source:'YourTJ' });
    } finally { axios.defaults.adapter = prev; }
  });

  it('应将空专业列表标记为空结果', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: { data:[] }, status:200, statusText:'OK', headers:{}, config:c });
    try { const r = await callFindMajorByGradeTool({}, { calendarId:118, grade:2024 }); assert.deepEqual(r.structuredContent, { status:'empty', data:{ records:[] }, source:'YourTJ' }); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游业务错误响应归一为专业查询工具错误', async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({ data: 'not json', status:200, statusText:'OK', headers:{}, config:c });
    try { const r = await callFindMajorByGradeTool({}, { calendarId:118, grade:2024 }); assert.equal(r.isError, true); assert.match(readToolText(r), /专业查询服务返回异常/); } finally { axios.defaults.adapter = prev; }
  });

  it('应将上游不可用错误归一为专业查询工具错误', async () => {
    const prev = axios.defaults.adapter; axios.defaults.adapter = async () => { throw new Error('unavailable'); };
    try { const r = await callFindMajorByGradeTool({}, { calendarId:118, grade:2024 }); assert.equal(r.isError, true); assert.match(readToolText(r), /专业查询服务暂时不可用/); } finally { axios.defaults.adapter = prev; }
  });
});
const callScoreTool = async (
  invocation: { accessToken?: string },
  args: { calendarId?: string } = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: UNDERGRADUATE_SCORE_TOOL_NAME,
      arguments: args,
    })) as ScoreToolCallResult;
  } finally {
    await server.close();
  }
};

// readToolText 读取 MCP 工具结果中的文本内容。
const readToolText = (result: ScoreToolCallResult | TermCalendarToolCallResult | CurrentTermCalendarToolCallResult | CetScoreToolCallResult | BookLendInfoToolCallResult | StatisticsInfoToolCallResult | StipendInfoToolCallResult | AccommodationInfoToolCallResult | CourseDetailToolCallResult | CourseRelatedToolCallResult | FindMajorByGradeToolCallResult): string => {
  const text = result.content.find((item) => item.type === 'text')?.text;
  return text ?? '';
};

// callTermCalendarTool 通过内存传输调用学期日历查询工具。
const callTermCalendarTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: TERM_CALENDAR_TOOL_NAME,
      arguments: args,
    })) as TermCalendarToolCallResult;
  } finally {
    await server.close();
  }
};

// callCurrentTermCalendarTool 通过内存传输调用当前学期日历查询工具。
const callCurrentTermCalendarTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: CURRENT_TERM_CALENDAR_TOOL_NAME,
      arguments: args,
    })) as CurrentTermCalendarToolCallResult;
  } finally {
    await server.close();
  }
};

// callCetScoreTool 通过内存传输调用四六级成绩查询工具。
const callCetScoreTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: CET_SCORE_TOOL_NAME,
      arguments: args,
    })) as CetScoreToolCallResult;
  } finally {
    await server.close();
  }
};

// callBookLendInfoTool 通过内存传输调用图书借阅信息查询工具。
const callBookLendInfoTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: BOOK_LEND_INFO_TOOL_NAME,
      arguments: args,
    })) as BookLendInfoToolCallResult;
  } finally {
    await server.close();
  }
};

// callStatisticsInfoTool 通过内存传输调用个人统计数据查询工具。
const callStatisticsInfoTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({
      name: STATISTICS_INFO_TOOL_NAME,
      arguments: args,
    })) as StatisticsInfoToolCallResult;
  } finally {
    await server.close();
  }
};

// callStipendInfoTool 通过内存传输调用助学金信息查询工具。
const callStipendInfoTool = async (
  invocation: { accessToken?: string },
  args: Record<string, unknown> = {},
) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return (await client.callTool({ name: STIPEND_INFO_TOOL_NAME, arguments: args })) as StipendInfoToolCallResult;
  } finally { await server.close(); }
};

// callAccommodationInfoTool 通过内存传输调用住宿信息查询工具。
const callAccommodationInfoTool = async (invocation: { accessToken?: string }, args: Record<string, unknown> = {}) => {
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 't', version: '1' });
  try { await server.connect(st); await client.connect(ct); return (await client.callTool({ name: ACCOMMODATION_INFO_TOOL_NAME, arguments: args })) as AccommodationInfoToolCallResult; } finally { await server.close(); }
};

// callCourseDetailTool 通过内存传输调用课程详情查询工具。
const callCourseDetailTool = async (invocation: { accessToken?: string }, args: { id: number }) => {
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 't', version: '1' });
  try { await server.connect(st); await client.connect(ct); return (await client.callTool({ name: COURSE_DETAIL_TOOL_NAME, arguments: args })) as CourseDetailToolCallResult; } finally { await server.close(); }
};

// callCourseRelatedTool 通过内存传输调用课程关联查询工具。
const callCourseRelatedTool = async (invocation: { accessToken?: string }, args: { id: number }) => {
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 't', version: '1' });
  try { await server.connect(st); await client.connect(ct); return (await client.callTool({ name: COURSE_RELATED_TOOL_NAME, arguments: args })) as CourseRelatedToolCallResult; } finally { await server.close(); }
};

// callFindMajorByGradeTool 通过内存传输调用按学期年级查询专业工具。
const callFindMajorByGradeTool = async (invocation: { accessToken?: string }, args: { calendarId: number; grade: number }) => {
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({ invocation });
  const client = new Client({ name: 't', version: '1' });
  try { await server.connect(st); await client.connect(ct); return (await client.callTool({ name: FIND_MAJOR_BY_GRADE_TOOL_NAME, arguments: args })) as FindMajorByGradeToolCallResult; } finally { await server.close(); }
};
