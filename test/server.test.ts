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

describe('createMcpServer', () => {
  it('应公布服务身份并声明成绩查询与学期日历工具', async () => {
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
});

// callScoreTool 通过内存传输调用成绩查询工具。
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
const readToolText = (result: ScoreToolCallResult | TermCalendarToolCallResult): string => {
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
