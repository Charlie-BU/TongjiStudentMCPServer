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
const readToolText = (result: ScoreToolCallResult | TermCalendarToolCallResult | CurrentTermCalendarToolCallResult | CetScoreToolCallResult | BookLendInfoToolCallResult | StatisticsInfoToolCallResult): string => {
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
