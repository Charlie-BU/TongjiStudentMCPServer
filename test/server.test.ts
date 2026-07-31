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
import { ANNUAL_BILL_TOOL_NAME } from '../src/tools/annual-bill';
import { CARD_SPENDING_FLOW_TOOL_NAME } from '../src/tools/card-spending-flow';
import { COMPETITION_PRIZE_TOOL_NAME } from '../src/tools/competition-prize';
import { LIBRARY_ACCESS_TOOL_NAME } from '../src/tools/library-access';
import { SCHOOL_ACCESS_TOOL_NAME } from '../src/tools/school-access';
import { SCHOLARSHIP_INFO_TOOL_NAME } from '../src/tools/scholarship-info';
import { STUDENT_TIMETABLE_TOOL_NAME } from '../src/tools/student-timetable';
import { UNDERGRADUATE_SCORE_TOOL_NAME } from '../src/tools/undergraduate-score';

// ToolCallResult 表示工具调用的测试结果。
interface ToolCallResult {
  isError?: boolean;
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}

describe('createMcpServer', () => {
  it('应公布服务身份并声明成绩查询工具', async () => {
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
      const annualBillTool = toolList.tools.find(
        (tool) => tool.name === ANNUAL_BILL_TOOL_NAME,
      );
      assert.ok(annualBillTool);
      assert.match(
        JSON.stringify(annualBillTool.outputSchema),
        /年度图书馆入馆总次数/,
      );
      assert.match(
        JSON.stringify(annualBillTool.outputSchema),
        /年度食堂总消费金额/,
      );
      const cardSpendingFlowTool = toolList.tools.find(
        (tool) => tool.name === CARD_SPENDING_FLOW_TOOL_NAME,
      );
      assert.ok(cardSpendingFlowTool);
      assert.match(
        JSON.stringify(cardSpendingFlowTool.outputSchema),
        /本次一卡通消费金额/,
      );
      assert.match(
        JSON.stringify(cardSpendingFlowTool.outputSchema),
        /完整交易时间戳/,
      );
      const studentTimetableTool = toolList.tools.find(
        (tool) => tool.name === STUDENT_TIMETABLE_TOOL_NAME,
      );
      assert.ok(studentTimetableTool);
      assert.match(
        JSON.stringify(studentTimetableTool.outputSchema),
        /结构化课表细则数组/,
      );
      assert.match(
        JSON.stringify(studentTimetableTool.outputSchema),
        /星期几，数字 1-7/,
      );
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
      const competitionPrizeTool = toolList.tools.find(
        (tool) => tool.name === COMPETITION_PRIZE_TOOL_NAME,
      );
      assert.ok(competitionPrizeTool);
      assert.match(
        JSON.stringify(competitionPrizeTool.outputSchema),
        /比赛名称/,
      );
      assert.match(
        JSON.stringify(competitionPrizeTool.outputSchema),
        /获奖人姓名/,
      );
      const scholarshipInfoTool = toolList.tools.find(
        (tool) => tool.name === SCHOLARSHIP_INFO_TOOL_NAME,
      );
      assert.ok(scholarshipInfoTool);
      assert.match(
        JSON.stringify(scholarshipInfoTool.outputSchema),
        /奖学金获奖数量/,
      );
      assert.match(
        JSON.stringify(scholarshipInfoTool.outputSchema),
        /奖学金奖项名称/,
      );
      const schoolAccessTool = toolList.tools.find(
        (tool) => tool.name === SCHOOL_ACCESS_TOOL_NAME,
      );
      assert.ok(schoolAccessTool);
      assert.match(
        JSON.stringify(schoolAccessTool.outputSchema),
        /校门通行记录次数/,
      );
      assert.match(
        JSON.stringify(schoolAccessTool.outputSchema),
        /校门通行点或设备名称/,
      );
      const libraryAccessTool = toolList.tools.find(
        (tool) => tool.name === LIBRARY_ACCESS_TOOL_NAME,
      );
      assert.ok(libraryAccessTool);
      assert.match(
        JSON.stringify(libraryAccessTool.outputSchema),
        /图书馆刷卡通行时间/,
      );
      assert.match(
        JSON.stringify(libraryAccessTool.outputSchema),
        /图书馆出入口名称/,
      );
    } finally {
      await server.close();
    }
  });

  it('应拒绝缺失 access token 的年度统计账单查询', async () => {
    const result = await callAnnualBillTool({}, { year: '2024' });

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token、传递年份并返回裁剪后的年度统计账单', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    let params: unknown;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      params = config.params;
      return {
        data: {
          data: [{
            annualBorrowedTopPct: 49.3,
            avgDailySpending: 12.7,
            booksCount: 3,
            canteenSpendingPct: 4.71,
            deptCode: '000170',
            deptName: '机械与能源工程学院',
            earliestEntryTime: '2024-10-15 07:30:30',
            earliestExitTime: '2024-03-06 08:58:13',
            lastDepartureCount: 1635,
            lateExitPct: 92.13,
            latestDepartureTime: '2024-02-28 21:40:01',
            latestExitTime: '2024-04-27 01:33:26',
            libraryAccessCount: 76,
            libraryAttendancePct: 0.14,
            libraryExitPct: 19.01,
            libraryStudyTime: 143.41,
            libraryStudyTopPct: 80.7,
            maxCumulativeAmt: 43.88,
            maxCumulativeLoc: '测试校区食堂',
            maxTransactionAmt: 18,
            maxTransactionLoc: '测试校区食堂',
            maxTransactionTime: '2024-05-28',
            name: '测**',
            shuttleRidesCount: 0,
            todayEntryCount: 32,
            todayLateExitPct: 0.36,
            totalEntries: 77,
            totalSpendingCanteen: 50.78,
            userId: '1*****0',
            userTypeCode: '4',
            weeklyExitAvg: 1.68,
            year: '2024',
          }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callAnnualBillTool(
        { accessToken: 'access-token-for-test' },
        { year: '2024' },
      );

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.deepEqual(params, { year: '2024' });
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          list: [{
            annualBorrowedTopPct: 49.3,
            avgDailySpending: 12.7,
            booksCount: 3,
            deptName: '机械与能源工程学院',
            earliestEntryTime: '2024-10-15 07:30:30',
            latestExitTime: '2024-04-27 01:33:26',
            libraryAccessCount: 76,
            libraryStudyTime: 143.41,
            libraryStudyTopPct: 80.7,
            maxCumulativeLoc: '测试校区食堂',
            maxTransactionAmt: 18,
            maxTransactionLoc: '测试校区食堂',
            maxTransactionTime: '2024-05-28',
            name: '测**',
            shuttleRidesCount: 0,
            totalEntries: 77,
            totalSpendingCanteen: 50.78,
            year: '2024',
          }],
        },
        source: 'Tongji Open Platform',
        year: '2024',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /canteenSpendingPct|deptCode|earliestExitTime|lastDepartureCount|lateExitPct|latestDepartureTime|libraryAttendancePct|libraryExitPct|maxCumulativeAmt|todayEntryCount|todayLateExitPct|userId|userTypeCode|weeklyExitAvg|1\*\*\*\*\*0/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空年度统计账单标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callAnnualBillTool(
        { accessToken: 'access-token-for-test' },
        { year: '2024' },
      );

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { list: [] },
        source: 'Tongji Open Platform',
        year: '2024',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将年度统计账单业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callAnnualBillTool(
        { accessToken: 'access-token-for-test' },
        { year: '2024' },
      );

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济年度统计账单服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将年度统计账单上游未授权错误归一为工具错误', async () => {
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
      const result = await callAnnualBillTool(
        { accessToken: 'expired-token-for-test' },
        { year: '2024' },
      );

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将年度统计账单上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callAnnualBillTool(
        { accessToken: 'access-token-for-test' },
        { year: '2024' },
      );

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /年度统计账单服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应拒绝缺失 access token 的一卡通消费流水查询', async () => {
    const result = await callCardSpendingFlowTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token、传递时间参数并返回裁剪后的一卡通消费流水', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    let params: unknown;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      params = config.params;
      return {
        data: {
          data: {
            count: 5,
            userInfos: [{
              campusAreaName: '四平校区',
              cardBalance: 184.45,
              fromAccount: 342668,
              mercName: '四平路校区西北超市',
              mercTypeName: '超市与店铺',
              name: '测试用户',
              personTypeCode: '派遣人员',
              posCode: 9,
              restaurantName: '无',
              sexCode: '1',
              tradeAmount: 4.5,
              tradeDate: '2025-05-28',
              tradeDateTime: '2025-05-28 14:03:36',
              tradeMonth: '05',
              tradeTime: '14:00',
              tranCode: '15',
              userId: '1*****9',
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
      const result = await callCardSpendingFlowTool(
        { accessToken: 'access-token-for-test' },
        {
          tradeStartTime: '2025-05-01 00:00:00',
          tradeEndTime: '2025-05-31 23:59:59',
        },
      );

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.deepEqual(params, {
        tradeStartTime: '2025-05-01 00:00:00',
        tradeEndTime: '2025-05-31 23:59:59',
      });
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          userInfos: [{
            campusAreaName: '四平校区',
            cardBalance: 184.45,
            mercName: '四平路校区西北超市',
            mercTypeName: '超市与店铺',
            name: '测试用户',
            personTypeCode: '派遣人员',
            restaurantName: '无',
            tradeAmount: 4.5,
            tradeDateTime: '2025-05-28 14:03:36',
          }],
        },
        source: 'Tongji Open Platform',
        tradeStartTime: '2025-05-01 00:00:00',
        tradeEndTime: '2025-05-31 23:59:59',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /"count"|"fromAccount"|"posCode"|"sexCode"|"tradeDate"|"tradeMonth"|"tradeTime"|"tranCode"|"userId"|342668|1\*\*\*\*\*9/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空一卡通消费流水标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { count: 0, userInfos: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCardSpendingFlowTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { userInfos: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将一卡通消费流水业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCardSpendingFlowTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济一卡通消费流水服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将一卡通消费流水上游未授权错误归一为工具错误', async () => {
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
      const result = await callCardSpendingFlowTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将一卡通消费流水上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callCardSpendingFlowTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /一卡通消费流水服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应拒绝缺失 access token 的学生课表查询', async () => {
    const result = await callStudentTimetableTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token、传递学期编号并返回裁剪后的学生课表', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    let params: unknown;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      params = config.params;
      return {
        data: {
          data: [{
            teachingClassId: 1111111124870610,
            classCode: '10101901',
            className: '01班',
            campus: '1',
            courseCode: '101019',
            courseName: '数据结构',
            assessmentMode: '2',
            isExemptionCourse: null,
            credits: 4,
            teacherName: '张亚英',
            classTime: '星期五 3-4节 [1-17],星期三 5-6节 [1-17]',
            classRoom: '2515',
            classRoomName: null,
            classRoomPractice: '校内',
            remark: '',
            timeTableList: [{
              dayOfWeek: 3,
              timeStart: 5,
              timeEnd: 6,
              roomId: '2515',
              teacherCode: '05152',
              weekNum: '[1-17]',
              weekstr: '星期三',
              teacherName: '张亚英(05152)',
              timeAndRoom: '星期三 5-6节[1-17]北115',
              timeTab: '星期三 5-6节 [1-17]',
              className: '01班',
              classCode: '10101901',
              courseName: '数据结构',
              courseCode: '101019',
              teachingClassId: 1111111124870610,
              campus: '1',
              weeks: [1, 2, 3, 4],
              timeId: null,
              popover: '[5-6节] [1-17] 数据结构(101019) 张亚英(05152) 北115 ',
              roomCategory: '1',
              roomLable: '',
              roomIdI18n: '北115',
              campusI18n: '四平路校区',
            }],
            compulsory: '0',
            classType: '1',
            roomCategory: '1',
            roomLable: '',
            courseTakeType: 1,
            teachingWay: '2',
            cloudCourseType: '',
            nonpubCloudCourseAddr: '',
            teachMode: null,
            campusI18n: '四平路校区',
            assessmentModeI18n: '考查',
            classRoomI18n: '北115',
            teachingWayI18n: '线下授课',
            teachModeI18n: '',
          }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callStudentTimetableTool(
        { accessToken: 'access-token-for-test' },
        { calendarId: '120' },
      );

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.deepEqual(params, { calendarId: '120' });
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          list: [{
            classCode: '10101901',
            className: '01班',
            courseCode: '101019',
            courseName: '数据结构',
            credits: 4,
            teacherName: '张亚英',
            classTime: '星期五 3-4节 [1-17],星期三 5-6节 [1-17]',
            classRoom: '2515',
            classRoomPractice: '校内',
            remark: '',
            timeTableList: [{
              dayOfWeek: 3,
              timeStart: 5,
              timeEnd: 6,
              weekNum: '[1-17]',
              weekstr: '星期三',
              weeks: [1, 2, 3, 4],
              popover: '[5-6节] [1-17] 数据结构(101019) 张亚英(05152) 北115 ',
              roomIdI18n: '北115',
              campusI18n: '四平路校区',
            }],
            campusI18n: '四平路校区',
            assessmentModeI18n: '考查',
            classRoomI18n: '北115',
            teachingWayI18n: '线下授课',
          }],
        },
        source: 'Tongji Open Platform',
        calendarId: '120',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /"teachingClassId"|"campus"|"assessmentMode"|"isExemptionCourse"|"classRoomName"|"compulsory"|"classType"|"roomCategory"|"roomLable"|"courseTakeType"|"teachingWay"|"cloudCourseType"|"nonpubCloudCourseAddr"|"teachMode"|"teachModeI18n"|"roomId"|"teacherCode"|"timeAndRoom"|"timeTab"|"timeId"/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空学生课表标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callStudentTimetableTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { list: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将学生课表业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callStudentTimetableTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济课表服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将学生课表上游未授权错误归一为工具错误', async () => {
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
      const result = await callStudentTimetableTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将学生课表上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callStudentTimetableTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /课表服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
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

  it('应拒绝缺失 access token 的竞赛奖励查询', async () => {
    const result = await callCompetitionPrizeTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回裁剪后的竞赛奖励记录', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: {
            count: 2,
            list: [{
              achievementRecognitionType: '竞赛获奖',
              awardCategory: '竞赛获奖',
              awardDate: '2015',
              awardLevel: '一等奖',
              competitionLevel: '校级',
              competitionName: '卓越杯测试选拔赛',
              credit: 3,
              deptCode: '000255',
              deptName: '医学院',
              id: 10721,
              name: '测**',
              schoolYear: '2016-2017',
              userId: '1*****5',
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
      const result = await callCompetitionPrizeTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          list: [{
            awardCategory: '竞赛获奖',
            awardDate: '2015',
            awardLevel: '一等奖',
            competitionLevel: '校级',
            competitionName: '卓越杯测试选拔赛',
            deptName: '医学院',
            name: '测**',
            schoolYear: '2016-2017',
          }],
        },
        source: 'Tongji Open Platform',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /achievementRecognitionType|credit|deptCode|id|userId|count|1\*\*\*\*\*5|10721/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空竞赛奖励记录标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { count: 0, list: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCompetitionPrizeTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { list: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将竞赛奖励业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callCompetitionPrizeTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济竞赛奖励服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将竞赛奖励上游未授权错误归一为工具错误', async () => {
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
      const result = await callCompetitionPrizeTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将竞赛奖励上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callCompetitionPrizeTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /竞赛奖励服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应拒绝缺失 access token 的奖学金查询', async () => {
    const result = await callScholarshipInfoTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token 并返回裁剪后的奖学金记录', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      return {
        data: {
          data: {
            count: 3,
            list: [{
              amount: '3000',
              deptCode: '000170',
              deptName: '机械与能源工程学院',
              name: '测**',
              rating: '校内',
              ratingYear: '2016',
              scholarshipLevel: '二等奖',
              scholarshipName: '优秀学生奖学金（本科生）',
              updateTime: '2025-11-10T00:00:00',
              userId: '1*****4',
              wid: 'test-wid-001',
            }],
            sinceWid: '0******3',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await callScholarshipInfoTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          count: 3,
          list: [{
            deptName: '机械与能源工程学院',
            name: '测**',
            rating: '校内',
            ratingYear: '2016',
            scholarshipLevel: '二等奖',
            scholarshipName: '优秀学生奖学金（本科生）',
            updateTime: '2025-11-10T00:00:00',
          }],
        },
        source: 'Tongji Open Platform',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /amount|deptCode|userId|wid|sinceWid|3000|1\*\*\*\*\*4|test-wid-001|0\*\*\*\*\*\*3/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空奖学金记录标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { count: 0, list: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callScholarshipInfoTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { count: 0, list: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将奖学金业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callScholarshipInfoTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济奖学金服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将奖学金上游未授权错误归一为工具错误', async () => {
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
      const result = await callScholarshipInfoTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将奖学金上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callScholarshipInfoTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /奖学金服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应拒绝缺失 access token 的校门通行查询', async () => {
    const result = await callSchoolAccessTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token、传递查询参数并返回裁剪后的校门通行记录', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    let params: unknown;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      params = config.params;
      return {
        data: {
          data: {
            count: 2,
            userInfos: [{
              cardData: '2******6',
              codeIndex: '0',
              dataTime: '20**-**-12 18:42:43',
              deptName: '测试学院',
              equptId: '2**7',
              equptName: '测试门西侧道闸-人通道出',
              job: '01',
              lctnName: '测试路50号',
              multiEvent: '0',
              name: '测**',
              personnelId: '2****2',
              portNum: '出门',
              sex: '男',
              userId: '1*****1',
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
      const result = await callSchoolAccessTool(
        { accessToken: 'access-token-for-test' },
        {
          portNum: '出门',
          dataStartTime: '2026-07-01 00:00:00',
          dataEndTime: '2026-07-31 23:59:59',
        },
      );

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.deepEqual(params, {
        portNum: '出门',
        dataStartTime: '2026-07-01 00:00:00',
        dataEndTime: '2026-07-31 23:59:59',
      });
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          count: 2,
          userInfos: [{
            dataTime: '20**-**-12 18:42:43',
            deptName: '测试学院',
            equptName: '测试门西侧道闸-人通道出',
            lctnName: '测试路50号',
            name: '测**',
            portNum: '出门',
            sex: '男',
          }],
        },
        source: 'Tongji Open Platform',
        portNum: '出门',
        dataStartTime: '2026-07-01 00:00:00',
        dataEndTime: '2026-07-31 23:59:59',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /cardData|codeIndex|equptId|job|multiEvent|personnelId|userId|2\*\*\*\*\*\*6|1\*\*\*\*\*1/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空校门通行记录标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { count: 0, userInfos: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callSchoolAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { count: 0, userInfos: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将校门通行业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callSchoolAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济校门通行服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将校门通行上游未授权错误归一为工具错误', async () => {
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
      const result = await callSchoolAccessTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将校门通行上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callSchoolAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /校门通行服务暂时不可用/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应拒绝缺失 access token 的图书馆通行查询', async () => {
    const result = await callLibraryAccessTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
  });

  it('应注入 token、传递查询参数并返回裁剪后的图书馆通行记录', async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    let params: unknown;
    axios.defaults.adapter = async (config) => {
      authorization = config.headers?.Authorization as string | undefined;
      params = config.params;
      return {
        data: {
          data: {
            count: 3,
            userInfos: [{
              deptName: '测试学院',
              direction: '1',
              door: '测试图书馆东门',
              gateNo: '18',
              libPlace: '嘉定',
              name: '测**',
              type: '硕士研究生',
              userId: '2*****9',
              visitTime: '2022-12-02 08:19:25.0',
              visitno: '1*****9',
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
      const result = await callLibraryAccessTool(
        { accessToken: 'access-token-for-test' },
        {
          direction: '1',
          visitStartTime: '2026-07-01 00:00:00',
          visitEndTime: '2026-07-31 23:59:59',
        },
      );

      assert.equal(authorization, 'Bearer access-token-for-test');
      assert.deepEqual(params, {
        direction: '1',
        visitStartTime: '2026-07-01 00:00:00',
        visitEndTime: '2026-07-31 23:59:59',
      });
      assert.equal(result.isError, undefined);
      assert.deepEqual(result.structuredContent, {
        status: 'ok',
        data: {
          userInfos: [{
            deptName: '测试学院',
            direction: '1',
            door: '测试图书馆东门',
            libPlace: '嘉定',
            name: '测**',
            type: '硕士研究生',
            visitTime: '2022-12-02 08:19:25.0',
          }],
        },
        source: 'Tongji Open Platform',
        direction: '1',
        visitStartTime: '2026-07-01 00:00:00',
        visitEndTime: '2026-07-31 23:59:59',
      });
      assert.doesNotMatch(
        JSON.stringify(result.structuredContent),
        /count|gateNo|userId|visitno|2\*\*\*\*\*9|1\*\*\*\*\*9/,
      );
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将空图书馆通行记录标记为空结果', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { data: { count: 0, userInfos: [] } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callLibraryAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.deepEqual(result.structuredContent, {
        status: 'empty',
        data: { userInfos: [] },
        source: 'Tongji Open Platform',
      });
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将图书馆通行业务错误响应归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { code: 500, message: 'upstream business error' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await callLibraryAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /同济图书馆通行服务返回异常/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将图书馆通行上游未授权错误归一为工具错误', async () => {
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
      const result = await callLibraryAccessTool({
        accessToken: 'expired-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
      axios.defaults.adapter = previousAdapter;
    }
  });

  it('应将图书馆通行上游不可用错误归一为工具错误', async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
      throw new Error('upstream unavailable');
    };

    try {
      const result = await callLibraryAccessTool({
        accessToken: 'access-token-for-test',
      });

      assert.equal(result.isError, true);
      assert.match(readToolText(result), /图书馆通行服务暂时不可用/);
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
  return callTool(UNDERGRADUATE_SCORE_TOOL_NAME, invocation, args);
};

// callAnnualBillTool 通过内存传输调用年度统计账单查询工具。
const callAnnualBillTool = async (
  invocation: { accessToken?: string },
  args: { year: string },
) => {
  return callTool(ANNUAL_BILL_TOOL_NAME, invocation, args);
};

// callCardSpendingFlowTool 通过内存传输调用一卡通消费流水查询工具。
const callCardSpendingFlowTool = async (
  invocation: { accessToken?: string },
  args: {
    tradeStartTime?: string;
    tradeEndTime?: string;
  } = {},
) => {
  return callTool(CARD_SPENDING_FLOW_TOOL_NAME, invocation, args);
};

// callStudentTimetableTool 通过内存传输调用学生课表查询工具。
const callStudentTimetableTool = async (
  invocation: { accessToken?: string },
  args: { calendarId?: string } = {},
) => {
  return callTool(STUDENT_TIMETABLE_TOOL_NAME, invocation, args);
};

// callCompetitionPrizeTool 通过内存传输调用竞赛奖励查询工具。
const callCompetitionPrizeTool = async (
  invocation: { accessToken?: string },
) => {
  return callTool(COMPETITION_PRIZE_TOOL_NAME, invocation);
};

// callScholarshipInfoTool 通过内存传输调用奖学金查询工具。
const callScholarshipInfoTool = async (
  invocation: { accessToken?: string },
) => {
  return callTool(SCHOLARSHIP_INFO_TOOL_NAME, invocation);
};

// callSchoolAccessTool 通过内存传输调用校门通行查询工具。
const callSchoolAccessTool = async (
  invocation: { accessToken?: string },
  args: {
    portNum?: "入门" | "出门";
    dataStartTime?: string;
    dataEndTime?: string;
  } = {},
) => {
  return callTool(SCHOOL_ACCESS_TOOL_NAME, invocation, args);
};

// callLibraryAccessTool 通过内存传输调用图书馆通行查询工具。
const callLibraryAccessTool = async (
  invocation: { accessToken?: string },
  args: {
    direction?: "1" | "2";
    visitStartTime?: string;
    visitEndTime?: string;
  } = {},
) => {
  return callTool(LIBRARY_ACCESS_TOOL_NAME, invocation, args);
};

// callTool 通过内存传输调用指定工具。
const callTool = async (
  name: string,
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
      name,
      arguments: args,
    })) as ToolCallResult;
  } finally {
    await server.close();
  }
};

// readToolText 读取 MCP 工具结果中的文本内容。
const readToolText = (result: ToolCallResult): string => {
  const text = result.content.find((item) => item.type === 'text')?.text;
  return text ?? '';
};
