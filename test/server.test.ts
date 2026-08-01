import assert from "node:assert/strict";
import { describe, it } from "node:test";
import axios, { AxiosError } from "axios";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from "../src/server";
import { ANNUAL_BILL_TOOL_NAME } from "../src/tools/annual-bill";
import { CALENDAR_LIST_TOOL_NAME } from "../src/tools/calendar-list";
import { CARD_SPENDING_FLOW_TOOL_NAME } from "../src/tools/card-spending-flow";
import { COMPETITION_PRIZE_TOOL_NAME } from "../src/tools/competition-prize";
import { COURSE_CATALOG_TOOL_NAME } from "../src/tools/course-catalog";
import { GRADE_LIST_TOOL_NAME } from "../src/tools/grade-list";
import { HONORARY_TITLE_TOOL_NAME } from "../src/tools/honorary-title";
import { LIBRARY_ACCESS_TOOL_NAME } from "../src/tools/library-access";
import { SCHOOL_ACCESS_TOOL_NAME } from "../src/tools/school-access";
import { SCHOLARSHIP_INFO_TOOL_NAME } from "../src/tools/scholarship-info";
import { STUDENT_DETAILED_INFO_TOOL_NAME } from "../src/tools/student-detailed-info";
import { STUDENT_TIMETABLE_TOOL_NAME } from "../src/tools/student-timetable";
import { UNDERGRADUATE_SCORE_TOOL_NAME } from "../src/tools/undergraduate-score";
import { TERM_CALENDAR_TOOL_NAME } from "../src/tools/term-calendar";
import { CURRENT_TERM_CALENDAR_TOOL_NAME } from "../src/tools/current-term-calendar";
import { CET_SCORE_TOOL_NAME } from "../src/tools/cet-score";
import { BOOK_LEND_INFO_TOOL_NAME } from "../src/tools/book-lend-info";
import { STATISTICS_INFO_TOOL_NAME } from "../src/tools/statistics-info";
import { STIPEND_INFO_TOOL_NAME } from "../src/tools/stipend-info";
import { ACCOMMODATION_INFO_TOOL_NAME } from "../src/tools/accommodation-info";
import { COURSE_DETAIL_TOOL_NAME } from "../src/tools/course-detail";
import { COURSE_RELATED_TOOL_NAME } from "../src/tools/course-related";
import { FIND_MAJOR_BY_GRADE_TOOL_NAME } from "../src/tools/find-major-by-grade";
import { USER_BASIC_INFO_TOOL_NAME } from "../src/tools/user-basic-info";

// ToolCallResult 表示工具调用的测试结果。
interface ToolCallResult {
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

describe("createMcpServer", () => {
    it("应公布服务身份并声明成绩查询、学期日历、四六级成绩、图书借阅与个人统计工具", async () => {
        const [clientTransport, serverTransport] =
            InMemoryTransport.createLinkedPair();
        const server = createMcpServer({
            invocation: { accessToken: "test-access-token" },
        });
        const client = new Client({ name: "test-client", version: "1.0.0" });

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
            const courseCatalogTool = toolList.tools.find(
                (tool) => tool.name === COURSE_CATALOG_TOOL_NAME,
            );
            assert.ok(courseCatalogTool);
            assert.match(
                JSON.stringify(courseCatalogTool.outputSchema),
                /课程评分或评教得分/,
            );
            assert.match(
                JSON.stringify(courseCatalogTool.outputSchema),
                /开课学期列表/,
            );
            const calendarListTool = toolList.tools.find(
                (tool) => tool.name === CALENDAR_LIST_TOOL_NAME,
            );
            assert.ok(calendarListTool);
            assert.match(
                JSON.stringify(calendarListTool.outputSchema),
                /选中的学期 ID/,
            );
            assert.match(
                JSON.stringify(calendarListTool.outputSchema),
                /下拉菜单展示/,
            );
            const gradeListTool = toolList.tools.find(
                (tool) => tool.name === GRADE_LIST_TOOL_NAME,
            );
            assert.ok(gradeListTool);
            assert.match(
                JSON.stringify(gradeListTool.outputSchema),
                /年级或界别列表/,
            );
            assert.match(
                JSON.stringify(gradeListTool.outputSchema),
                /筛选下拉菜单/,
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
            const studentDetailedInfoTool = toolList.tools.find(
                (tool) => tool.name === STUDENT_DETAILED_INFO_TOOL_NAME,
            );
            assert.ok(studentDetailedInfoTool);
            assert.match(
                JSON.stringify(studentDetailedInfoTool.outputSchema),
                /学生学号/,
            );
            assert.match(
                JSON.stringify(studentDetailedInfoTool.outputSchema),
                /培养层次/,
            );
            assert.match(
                JSON.stringify(studentDetailedInfoTool.outputSchema),
                /通讯地址或联系地址/,
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
            const courseTool = toolList.tools.find(
                (t) => t.name === COURSE_DETAIL_TOOL_NAME,
            );
            assert.ok(courseTool);
            assert.match(JSON.stringify(courseTool.inputSchema), /课程ID/);
            assert.match(
                JSON.stringify(courseTool.outputSchema),
                /授课教师姓名/,
            );
            const relatedTool = toolList.tools.find(
                (t) => t.name === COURSE_RELATED_TOOL_NAME,
            );
            assert.ok(relatedTool);
            assert.match(
                JSON.stringify(relatedTool.outputSchema),
                /该教师教授的其他课程列表/,
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
            const honoraryTitleTool = toolList.tools.find(
                (tool) => tool.name === HONORARY_TITLE_TOOL_NAME,
            );
            assert.ok(honoraryTitleTool);
            assert.match(
                JSON.stringify(honoraryTitleTool.outputSchema),
                /荣誉称号或奖项名称/,
            );
            assert.match(
                JSON.stringify(honoraryTitleTool.outputSchema),
                /评定年份/,
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
            const userBasicInfoTool = toolList.tools.find(
                (tool) => tool.name === USER_BASIC_INFO_TOOL_NAME,
            );
            assert.ok(userBasicInfoTool);
            assert.match(
                JSON.stringify(userBasicInfoTool.outputSchema),
                /学籍或账号状态/,
            );
            assert.match(
                JSON.stringify(userBasicInfoTool.outputSchema),
                /人员或身份类型/,
            );
        } finally {
            await server.close();
        }
    });

    it("应拒绝缺失 access token 的年度统计账单查询", async () => {
        const result = await callAnnualBillTool({}, { year: "2024" });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token、传递年份并返回裁剪后的年度统计账单", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        let params: unknown;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            params = config.params;
            return {
                data: {
                    data: [
                        {
                            annualBorrowedTopPct: 49.3,
                            avgDailySpending: 12.7,
                            booksCount: 3,
                            canteenSpendingPct: 4.71,
                            deptCode: "000170",
                            deptName: "机械与能源工程学院",
                            earliestEntryTime: "2024-10-15 07:30:30",
                            earliestExitTime: "2024-03-06 08:58:13",
                            lastDepartureCount: 1635,
                            lateExitPct: 92.13,
                            latestDepartureTime: "2024-02-28 21:40:01",
                            latestExitTime: "2024-04-27 01:33:26",
                            libraryAccessCount: 76,
                            libraryAttendancePct: 0.14,
                            libraryExitPct: 19.01,
                            libraryStudyTime: 143.41,
                            libraryStudyTopPct: 80.7,
                            maxCumulativeAmt: 43.88,
                            maxCumulativeLoc: "测试校区食堂",
                            maxTransactionAmt: 18,
                            maxTransactionLoc: "测试校区食堂",
                            maxTransactionTime: "2024-05-28",
                            name: "测**",
                            shuttleRidesCount: 0,
                            todayEntryCount: 32,
                            todayLateExitPct: 0.36,
                            totalEntries: 77,
                            totalSpendingCanteen: 50.78,
                            userId: "1*****0",
                            userTypeCode: "4",
                            weeklyExitAvg: 1.68,
                            year: "2024",
                        },
                    ],
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callAnnualBillTool(
                { accessToken: "access-token-for-test" },
                { year: "2024" },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.deepEqual(params, { year: "2024" });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            annualBorrowedTopPct: 49.3,
                            avgDailySpending: 12.7,
                            booksCount: 3,
                            deptName: "机械与能源工程学院",
                            earliestEntryTime: "2024-10-15 07:30:30",
                            latestExitTime: "2024-04-27 01:33:26",
                            libraryAccessCount: 76,
                            libraryStudyTime: 143.41,
                            libraryStudyTopPct: 80.7,
                            maxCumulativeLoc: "测试校区食堂",
                            maxTransactionAmt: 18,
                            maxTransactionLoc: "测试校区食堂",
                            maxTransactionTime: "2024-05-28",
                            name: "测**",
                            shuttleRidesCount: 0,
                            totalEntries: 77,
                            totalSpendingCanteen: 50.78,
                            year: "2024",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                year: "2024",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /canteenSpendingPct|deptCode|earliestExitTime|lastDepartureCount|lateExitPct|latestDepartureTime|libraryAttendancePct|libraryExitPct|maxCumulativeAmt|todayEntryCount|todayLateExitPct|userId|userTypeCode|weeklyExitAvg|1\*\*\*\*\*0/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空年度统计账单标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: [] },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callAnnualBillTool(
                { accessToken: "access-token-for-test" },
                { year: "2024" },
            );

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
                year: "2024",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将年度统计账单业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callAnnualBillTool(
                { accessToken: "access-token-for-test" },
                { year: "2024" },
            );

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济年度统计账单服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将年度统计账单上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callAnnualBillTool(
                { accessToken: "expired-token-for-test" },
                { year: "2024" },
            );

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将年度统计账单上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callAnnualBillTool(
                { accessToken: "access-token-for-test" },
                { year: "2024" },
            );

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /年度统计账单服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的一卡通消费流水查询", async () => {
        const result = await callCardSpendingFlowTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token、传递时间参数并返回裁剪后的一卡通消费流水", async () => {
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
                        userInfos: [
                            {
                                campusAreaName: "四平校区",
                                cardBalance: 184.45,
                                fromAccount: 342668,
                                mercName: "四平路校区西北超市",
                                mercTypeName: "超市与店铺",
                                name: "测试用户",
                                personTypeCode: "派遣人员",
                                posCode: 9,
                                restaurantName: "无",
                                sexCode: "1",
                                tradeAmount: 4.5,
                                tradeDate: "2025-05-28",
                                tradeDateTime: "2025-05-28 14:03:36",
                                tradeMonth: "05",
                                tradeTime: "14:00",
                                tranCode: "15",
                                userId: "1*****9",
                            },
                        ],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callCardSpendingFlowTool(
                { accessToken: "access-token-for-test" },
                {
                    tradeStartTime: "2025-05-01 00:00:00",
                    tradeEndTime: "2025-05-31 23:59:59",
                },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.deepEqual(params, {
                tradeStartTime: "2025-05-01 00:00:00",
                tradeEndTime: "2025-05-31 23:59:59",
            });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    userInfos: [
                        {
                            campusAreaName: "四平校区",
                            cardBalance: 184.45,
                            mercName: "四平路校区西北超市",
                            mercTypeName: "超市与店铺",
                            name: "测试用户",
                            personTypeCode: "派遣人员",
                            restaurantName: "无",
                            tradeAmount: 4.5,
                            tradeDateTime: "2025-05-28 14:03:36",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                tradeStartTime: "2025-05-01 00:00:00",
                tradeEndTime: "2025-05-31 23:59:59",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /"count"|"fromAccount"|"posCode"|"sexCode"|"tradeDate"|"tradeMonth"|"tradeTime"|"tranCode"|"userId"|342668|1\*\*\*\*\*9/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空一卡通消费流水标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, userInfos: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCardSpendingFlowTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { userInfos: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将一卡通消费流水业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCardSpendingFlowTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(
                readToolText(result),
                /同济一卡通消费流水服务返回异常/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将一卡通消费流水上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callCardSpendingFlowTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将一卡通消费流水上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callCardSpendingFlowTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /一卡通消费流水服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应传递检索参数并返回裁剪后的课程目录", async () => {
        const previousAdapter = axios.defaults.adapter;
        let params: unknown;
        axios.defaults.adapter = async (config) => {
            params = config.params;
            return {
                data: {
                    data: [
                        {
                            id: 11154,
                            code: "54011212",
                            name: "思想道德与法治",
                            rating: 4.0789,
                            review_count: 38,
                            is_legacy: 0,
                            teacher_name: "王少",
                            department: "马克思主义学院",
                            credit: 3,
                            semester_names:
                                "2025-2026学年第2学期||2025-2026学年第1学期",
                            semesters: [
                                "2025-2026学年第2学期",
                                "2025-2026学年第1学期",
                            ],
                        },
                    ],
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callCourseCatalogTool(
                {},
                {
                    page: 1,
                    limit: 20,
                    q: "思想道德",
                },
            );

            assert.deepEqual(params, {
                page: 1,
                limit: 20,
                q: "思想道德",
                includeTotal: undefined,
            });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            id: 11154,
                            code: "54011212",
                            name: "思想道德与法治",
                            rating: 4.0789,
                            review_count: 38,
                            teacher_name: "王少",
                            department: "马克思主义学院",
                            credit: 3,
                            semesters: [
                                "2025-2026学年第2学期",
                                "2025-2026学年第1学期",
                            ],
                        },
                    ],
                },
                source: "YourTJ",
                page: 1,
                limit: 20,
                q: "思想道德",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /"is_legacy"|"semester_names"|2025-2026学年第2学期\|\|2025-2026学年第1学期/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空课程目录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: [] },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCourseCatalogTool({});

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "YourTJ",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将课程目录业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCourseCatalogTool({});

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 课程目录服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将课程目录上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callCourseCatalogTool({});

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 课程目录服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应返回裁剪后的学期列表", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: {
                code: 200,
                msg: "查询成功",
                data: [
                    {
                        calendarId: 122,
                        calendarName: "2026-2027学年第1学期",
                    },
                    {
                        calendarId: 121,
                        calendarName: "2025-2026学年第2学期",
                    },
                ],
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCalendarListTool({});

            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            calendarId: 122,
                            calendarName: "2026-2027学年第1学期",
                        },
                        {
                            calendarId: 121,
                            calendarName: "2025-2026学年第2学期",
                        },
                    ],
                },
                source: "YourTJ",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /"code"|"msg"|查询成功/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空学期列表标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: [] },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCalendarListTool({});

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "YourTJ",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学期列表业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCalendarListTool({});

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 学期列表服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学期列表上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callCalendarListTool({});

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 学期列表服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应传递学期编号并返回裁剪后的年级界别列表", async () => {
        const previousAdapter = axios.defaults.adapter;
        let data: unknown;
        axios.defaults.adapter = async (config) => {
            data = config.data;
            return {
                data: {
                    code: 200,
                    msg: "查询成功",
                    data: {
                        gradeList: [2025, 2024, 2023, 2022, 2021, 2020],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callGradeListTool(
                {},
                {
                    calendarId: 123,
                },
            );

            assert.deepEqual(JSON.parse(String(data)), { calendarId: 123 });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    gradeList: [2025, 2024, 2023, 2022, 2021, 2020],
                },
                source: "YourTJ",
                calendarId: 123,
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /"code"|"msg"|查询成功/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空年级界别列表标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { gradeList: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callGradeListTool({}, { calendarId: 123 });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { gradeList: [] },
                source: "YourTJ",
                calendarId: 123,
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将年级界别业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callGradeListTool({}, { calendarId: 123 });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 年级界别服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将年级界别上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callGradeListTool({}, { calendarId: 123 });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /YourTJ 年级界别服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的学生课表查询", async () => {
        const result = await callStudentTimetableTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token、传递学期编号并返回裁剪后的学生课表", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        let params: unknown;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            params = config.params;
            return {
                data: {
                    data: [
                        {
                            teachingClassId: 1111111124870610,
                            classCode: "10101901",
                            className: "01班",
                            campus: "1",
                            courseCode: "101019",
                            courseName: "数据结构",
                            assessmentMode: "2",
                            isExemptionCourse: null,
                            credits: 4,
                            teacherName: "张亚英",
                            classTime:
                                "星期五 3-4节 [1-17],星期三 5-6节 [1-17]",
                            classRoom: "2515",
                            classRoomName: null,
                            classRoomPractice: "校内",
                            remark: "",
                            timeTableList: [
                                {
                                    dayOfWeek: 3,
                                    timeStart: 5,
                                    timeEnd: 6,
                                    roomId: "2515",
                                    teacherCode: "05152",
                                    weekNum: "[1-17]",
                                    weekstr: "星期三",
                                    teacherName: "张亚英(05152)",
                                    timeAndRoom: "星期三 5-6节[1-17]北115",
                                    timeTab: "星期三 5-6节 [1-17]",
                                    className: "01班",
                                    classCode: "10101901",
                                    courseName: "数据结构",
                                    courseCode: "101019",
                                    teachingClassId: 1111111124870610,
                                    campus: "1",
                                    weeks: [1, 2, 3, 4],
                                    timeId: null,
                                    popover:
                                        "[5-6节] [1-17] 数据结构(101019) 张亚英(05152) 北115 ",
                                    roomCategory: "1",
                                    roomLable: "",
                                    roomIdI18n: "北115",
                                    campusI18n: "四平路校区",
                                },
                            ],
                            compulsory: "0",
                            classType: "1",
                            roomCategory: "1",
                            roomLable: "",
                            courseTakeType: 1,
                            teachingWay: "2",
                            cloudCourseType: "",
                            nonpubCloudCourseAddr: "",
                            teachMode: null,
                            campusI18n: "四平路校区",
                            assessmentModeI18n: "考查",
                            classRoomI18n: "北115",
                            teachingWayI18n: "线下授课",
                            teachModeI18n: "",
                        },
                    ],
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callStudentTimetableTool(
                { accessToken: "access-token-for-test" },
                { calendarId: "120" },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.deepEqual(params, { calendarId: "120" });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            classCode: "10101901",
                            className: "01班",
                            courseCode: "101019",
                            courseName: "数据结构",
                            credits: 4,
                            teacherName: "张亚英",
                            classTime:
                                "星期五 3-4节 [1-17],星期三 5-6节 [1-17]",
                            classRoom: "2515",
                            classRoomPractice: "校内",
                            remark: "",
                            timeTableList: [
                                {
                                    dayOfWeek: 3,
                                    timeStart: 5,
                                    timeEnd: 6,
                                    weekNum: "[1-17]",
                                    weekstr: "星期三",
                                    weeks: [1, 2, 3, 4],
                                    popover:
                                        "[5-6节] [1-17] 数据结构(101019) 张亚英(05152) 北115 ",
                                    roomIdI18n: "北115",
                                    campusI18n: "四平路校区",
                                },
                            ],
                            campusI18n: "四平路校区",
                            assessmentModeI18n: "考查",
                            classRoomI18n: "北115",
                            teachingWayI18n: "线下授课",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                calendarId: "120",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /"teachingClassId"|"campus"|"assessmentMode"|"isExemptionCourse"|"classRoomName"|"compulsory"|"classType"|"roomCategory"|"roomLable"|"courseTakeType"|"teachingWay"|"cloudCourseType"|"nonpubCloudCourseAddr"|"teachMode"|"teachModeI18n"|"roomId"|"teacherCode"|"timeAndRoom"|"timeTab"|"timeId"/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空学生课表标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: [] },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callStudentTimetableTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生课表业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callStudentTimetableTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济课表服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生课表上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callStudentTimetableTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生课表上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callStudentTimetableTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /课表服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的学生详细学籍信息查询", async () => {
        const result = await callStudentDetailedInfoTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应从基础信息读取 userId、注入 token 并返回裁剪后的学生详细学籍信息", async () => {
        const previousAdapter = axios.defaults.adapter;
        const authorizations: string[] = [];
        let detailedRequestData: unknown;
        axios.defaults.adapter = async (config) => {
            authorizations.push(config.headers?.Authorization as string);
            if (config.url?.endsWith("/v2/rt/user/all_info")) {
                return {
                    data: {
                        data: {
                            count: 1,
                            list: [{ userId: "internal-user-id", name: "测*" }],
                        },
                    },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                };
            }
            if (config.url?.endsWith("/v1/rt/user/all_student")) {
                detailedRequestData = config.data;
                return {
                    data: {
                        code: "A00000",
                        msg: "操作成功",
                        data: [
                            {
                                degreeCode: "31251",
                                isIncumbency: "是",
                                nation: "汉族",
                                stationTerminiCode: "2030",
                                trainingCategoryCode: "3",
                                trainingMethodsCode: "12",
                                specialCategory: "",
                                faculty: "经济与管理学院",
                                statusProfessionCode: "125100",
                                maritalStatusCode: "1",
                                degreeTypeCode: "2",
                                degreeCategory: "专业学位硕士",
                                enrolDate: "2021-09-01 00:00:00",
                                cultureProfession: "工商管理",
                                state: "中国",
                                nameSpelling: "****",
                                spcialPlanCode: "0",
                                profession: "工商管理",
                                isDobleDegree: "否",
                                specialCategoryCode: "",
                                projIdCode: "4",
                                cultureProfessionCode: "125100",
                                expectedGraduationDate: "2026-08-31 00:00:00",
                                campus: "四平路校区",
                                studentCategory: "学历生",
                                degree: "工商管理硕士学位",
                                enrolMethods: "全国统考",
                                studentSource: "吴中区",
                                enrolCategoryCode: "12",
                                degreeCategoryCode: "403",
                                grade: 2021,
                                name: "****",
                                spcialPlan: "无专项计划",
                                stateCode: "156",
                                householdRegister: "吴中区",
                                trainingMethods: "国家任务（定向）",
                                maritalStatus: "已婚",
                                chinaSon: "非港澳台",
                                birthday: "1984-01-03 00:00:00",
                                projId: "在职研究生",
                                leaveSchool: "校内在读",
                                degreeType: "专业型",
                                studentSourceCode: "320506",
                                learningStyle: "半脱产",
                                enrolSeasonCode: "1",
                                formLearningCode: "2",
                                studentCategoryCode: "1",
                                studentId: "****",
                                trainingCategory: "学历学位生",
                                isOverseasCode: "0",
                                enrolCategory: "国家任务(定向)",
                                learningStyleCode: "2",
                                facultyCode: "000192",
                                trainingLevel: "硕士",
                                nationCode: "01",
                                enrolMethodsCode: "21",
                                trainingLevelCode: "4",
                                currentGrade: 2021,
                                professionCode: "125100",
                                politicalStatus: "中共党员",
                                campusCode: "1",
                                sex: "女",
                                politicalStatusCode: "01",
                                categoryCode: "1251",
                                enrolSeason: "秋季",
                                isOverseas: "否",
                                sexCode: "2",
                                teacherId: "08050",
                                mailingAddress: "************************",
                                formLearning: "非全日制",
                                householdRegisterCode: "320506",
                                stationTermini: "上海",
                                statusProfession: "工商管理",
                                researchDirection: "同济综合MBA项目",
                                chinaSonCode: "0",
                                lengthSchooling: "2",
                                leaveSchoolCode: "1",
                                category: "工商管理",
                                stationStart: "上海",
                                isIncumbencyCode: "1",
                                userId: "internal-user-id",
                            },
                        ],
                    },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                };
            }
            throw new Error(`unexpected url: ${config.url}`);
        };

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(authorizations, [
                "Bearer access-token-for-test",
                "Bearer access-token-for-test",
            ]);
            assert.deepEqual(JSON.parse(String(detailedRequestData)), {
                userId: "internal-user-id",
            });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            nation: "汉族",
                            faculty: "经济与管理学院",
                            degreeCategory: "专业学位硕士",
                            enrolDate: "2021-09-01 00:00:00",
                            cultureProfession: "工商管理",
                            state: "中国",
                            profession: "工商管理",
                            expectedGraduationDate: "2026-08-31 00:00:00",
                            campus: "四平路校区",
                            degree: "工商管理硕士学位",
                            enrolMethods: "全国统考",
                            studentSource: "吴中区",
                            grade: 2021,
                            name: "****",
                            householdRegister: "吴中区",
                            trainingMethods: "国家任务（定向）",
                            maritalStatus: "已婚",
                            birthday: "1984-01-03 00:00:00",
                            projId: "在职研究生",
                            leaveSchool: "校内在读",
                            degreeType: "专业型",
                            learningStyle: "半脱产",
                            studentId: "****",
                            enrolCategory: "国家任务(定向)",
                            trainingLevel: "硕士",
                            politicalStatus: "中共党员",
                            sex: "女",
                            enrolSeason: "秋季",
                            teacherId: "08050",
                            mailingAddress: "************************",
                            formLearning: "非全日制",
                            stationTermini: "上海",
                            researchDirection: "同济综合MBA项目",
                            lengthSchooling: "2",
                            stationStart: "上海",
                        },
                    ],
                },
                source: "Tongji Open Platform",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /degreeCode|stationTerminiCode|trainingCategoryCode|trainingMethodsCode|facultyCode|sexCode|userId|internal-user-id|nameSpelling|currentGrade|professionCode|leaveSchoolCode|isIncumbencyCode/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空学生详细学籍信息标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            if (config.url?.endsWith("/v2/rt/user/all_info")) {
                return {
                    data: { data: { list: [{ userId: "internal-user-id" }] } },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                };
            }
            return {
                data: { data: [] },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将无法读取 userId 的基础信息响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济人员基础信息服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生详细学籍信息业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            if (config.url?.endsWith("/v2/rt/user/all_info")) {
                return {
                    data: { data: { list: [{ userId: "internal-user-id" }] } },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                };
            }
            return {
                data: { code: 500, message: "upstream business error" },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(
                readToolText(result),
                /同济学生详细学籍信息服务返回异常/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生详细学籍信息上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将学生详细学籍信息上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callStudentDetailedInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(
                readToolText(result),
                /学生详细学籍信息服务暂时不可用/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的成绩查询", async () => {
        const result = await callScoreTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token 并返回上游成绩数据", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            return {
                data: {
                    data: {
                        actualCredit: "143.50000",
                        failingCourseCount: "1",
                        failingCredits: "3.00000",
                        totalGradePoint: "4.11",
                        term: [
                            {
                                averagePoint: "4.49",
                                calName: "20251",
                                creditInfo: [
                                    {
                                        courseCode: "420268",
                                        courseName: "汇编语言",
                                        credit: 2,
                                        gradePoint: 5,
                                        isPass: 1,
                                        isPassName: "是",
                                        publicCoursesName: "必修",
                                        score: "优",
                                        scoreName: "优",
                                        updateTime: "2026-01-07 14:28:20",
                                        year: "2025",
                                        studentId: "2350939",
                                        studentName: "卜天",
                                        id: 20260107177272,
                                        courseNum: "42026801",
                                    },
                                ],
                                termName: "2025-2026学年第1学期",
                                termcode: "120",
                                hiddenField: "ignored",
                            },
                        ],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callScoreTool(
                { accessToken: "access-token-for-test" },
                { calendarId: "118" },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    actualCredit: "143.50000",
                    failingCourseCount: "1",
                    failingCredits: "3.00000",
                    totalGradePoint: "4.11",
                    term: [
                        {
                            averagePoint: "4.49",
                            calName: "20251",
                            creditInfo: [
                                {
                                    courseCode: "420268",
                                    courseName: "汇编语言",
                                    credit: 2,
                                    gradePoint: 5,
                                    isPass: 1,
                                    isPassName: "是",
                                    publicCoursesName: "必修",
                                    score: "优",
                                    scoreName: "优",
                                    updateTime: "2026-01-07 14:28:20",
                                    year: "2025",
                                },
                            ],
                            termName: "2025-2026学年第1学期",
                            termcode: "120",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                calendarId: "118",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空成绩数据标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { term: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callScoreTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: {
                    actualCredit: null,
                    failingCourseCount: null,
                    failingCredits: null,
                    totalGradePoint: null,
                    term: [],
                },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将上游业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callScoreTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济成绩服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callScoreTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callScoreTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /成绩服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });
    it("应拒绝缺失 access token 的竞赛奖励查询", async () => {
        const result = await callCompetitionPrizeTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token 并返回裁剪后的竞赛奖励记录", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            return {
                data: {
                    data: {
                        count: 2,
                        list: [
                            {
                                achievementRecognitionType: "竞赛获奖",
                                awardCategory: "竞赛获奖",
                                awardDate: "2015",
                                awardLevel: "一等奖",
                                competitionLevel: "校级",
                                competitionName: "卓越杯测试选拔赛",
                                credit: 3,
                                deptCode: "000255",
                                deptName: "医学院",
                                id: 10721,
                                name: "测**",
                                schoolYear: "2016-2017",
                                userId: "1*****5",
                            },
                        ],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            awardCategory: "竞赛获奖",
                            awardDate: "2015",
                            awardLevel: "一等奖",
                            competitionLevel: "校级",
                            competitionName: "卓越杯测试选拔赛",
                            deptName: "医学院",
                            name: "测**",
                            schoolYear: "2016-2017",
                        },
                    ],
                },
                source: "Tongji Open Platform",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /achievementRecognitionType|credit|deptCode|id|userId|count|1\*\*\*\*\*5|10721/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空竞赛奖励记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将 list:null 的竞赛奖励记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: null } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将竞赛奖励业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济竞赛奖励服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将竞赛奖励上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将竞赛奖励上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callCompetitionPrizeTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /竞赛奖励服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的荣誉称号查询", async () => {
        const result = await callHonoraryTitleTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token 并返回裁剪后的荣誉称号记录", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            return {
                data: {
                    code: "A00000",
                    data: {
                        count: 3,
                        list: [
                            {
                                deptCode: "000182",
                                deptName: "土木工程学院",
                                honorTitle: "同济大学优生优干",
                                name: "吕**",
                                ratingTerm: null,
                                ratingYear: "2010",
                                rewardLevel: null,
                                updateTime: "2025-04-02T00:00:00",
                                userId: "0*****1",
                                wid: "D8CAE0FC060574DEE040A8C0018420C5",
                            },
                        ],
                        sinceWid: "1******0",
                    },
                    msg: "成功",
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callHonoraryTitleTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            deptName: "土木工程学院",
                            honorTitle: "同济大学优生优干",
                            name: "吕**",
                            ratingYear: "2010",
                        },
                    ],
                },
                source: "Tongji Open Platform",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /count|sinceWid|deptCode|ratingTerm|rewardLevel|updateTime|userId|wid|code|msg|000182|2025-04-02T00:00:00|0\*\*\*\*\*1|D8CAE0FC060574DEE040A8C0018420C5|1\*\*\*\*\*\*0|成功/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空荣誉称号记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: [], sinceWid: "empty-since-wid" } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callHonoraryTitleTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将荣誉称号业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callHonoraryTitleTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济荣誉称号服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将荣誉称号上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callHonoraryTitleTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将荣誉称号上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callHonoraryTitleTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /荣誉称号服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的奖学金查询", async () => {
        const result = await callScholarshipInfoTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token 并返回裁剪后的奖学金记录", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            return {
                data: {
                    data: {
                        count: 3,
                        list: [
                            {
                                amount: "3000",
                                deptCode: "000170",
                                deptName: "机械与能源工程学院",
                                name: "测**",
                                rating: "校内",
                                ratingYear: "2016",
                                scholarshipLevel: "二等奖",
                                scholarshipName: "优秀学生奖学金（本科生）",
                                updateTime: "2025-11-10T00:00:00",
                                userId: "1*****4",
                                wid: "test-wid-001",
                            },
                        ],
                        sinceWid: "0******3",
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    count: 3,
                    list: [
                        {
                            deptName: "机械与能源工程学院",
                            name: "测**",
                            rating: "校内",
                            ratingYear: "2016",
                            scholarshipLevel: "二等奖",
                            scholarshipName: "优秀学生奖学金（本科生）",
                            updateTime: "2025-11-10T00:00:00",
                        },
                    ],
                },
                source: "Tongji Open Platform",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /amount|deptCode|userId|wid|sinceWid|3000|1\*\*\*\*\*4|test-wid-001|0\*\*\*\*\*\*3/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空奖学金记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { count: 0, list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将 list:null 的奖学金记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: null } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { count: 0, list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将奖学金业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济奖学金服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将奖学金上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将奖学金上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callScholarshipInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /奖学金服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的校门通行查询", async () => {
        const result = await callSchoolAccessTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token、传递查询参数并返回裁剪后的校门通行记录", async () => {
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
                        userInfos: [
                            {
                                cardData: "2******6",
                                codeIndex: "0",
                                dataTime: "20**-**-12 18:42:43",
                                deptName: "测试学院",
                                equptId: "2**7",
                                equptName: "测试门西侧道闸-人通道出",
                                job: "01",
                                lctnName: "测试路50号",
                                multiEvent: "0",
                                name: "测**",
                                personnelId: "2****2",
                                portNum: "出门",
                                sex: "男",
                                userId: "1*****1",
                            },
                        ],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callSchoolAccessTool(
                { accessToken: "access-token-for-test" },
                {
                    portNum: "出门",
                    dataStartTime: "2026-07-01 00:00:00",
                    dataEndTime: "2026-07-31 23:59:59",
                },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.deepEqual(params, {
                portNum: "出门",
                dataStartTime: "2026-07-01 00:00:00",
                dataEndTime: "2026-07-31 23:59:59",
            });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    count: 2,
                    userInfos: [
                        {
                            dataTime: "20**-**-12 18:42:43",
                            deptName: "测试学院",
                            equptName: "测试门西侧道闸-人通道出",
                            lctnName: "测试路50号",
                            name: "测**",
                            portNum: "出门",
                            sex: "男",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                portNum: "出门",
                dataStartTime: "2026-07-01 00:00:00",
                dataEndTime: "2026-07-31 23:59:59",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /cardData|codeIndex|equptId|job|multiEvent|personnelId|userId|2\*\*\*\*\*\*6|1\*\*\*\*\*1/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空校门通行记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, userInfos: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callSchoolAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { count: 0, userInfos: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将校门通行业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callSchoolAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济校门通行服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将校门通行上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callSchoolAccessTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将校门通行上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callSchoolAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /校门通行服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的图书馆通行查询", async () => {
        const result = await callLibraryAccessTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token、传递查询参数并返回裁剪后的图书馆通行记录", async () => {
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
                        userInfos: [
                            {
                                deptName: "测试学院",
                                direction: "1",
                                door: "测试图书馆东门",
                                gateNo: "18",
                                libPlace: "嘉定",
                                name: "测**",
                                type: "硕士研究生",
                                userId: "2*****9",
                                visitTime: "2022-12-02 08:19:25.0",
                                visitno: "1*****9",
                            },
                        ],
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callLibraryAccessTool(
                { accessToken: "access-token-for-test" },
                {
                    direction: "1",
                    visitStartTime: "2026-07-01 00:00:00",
                    visitEndTime: "2026-07-31 23:59:59",
                },
            );

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.deepEqual(params, {
                direction: "1",
                visitStartTime: "2026-07-01 00:00:00",
                visitEndTime: "2026-07-31 23:59:59",
            });
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    userInfos: [
                        {
                            deptName: "测试学院",
                            direction: "1",
                            door: "测试图书馆东门",
                            libPlace: "嘉定",
                            name: "测**",
                            type: "硕士研究生",
                            visitTime: "2022-12-02 08:19:25.0",
                        },
                    ],
                },
                source: "Tongji Open Platform",
                direction: "1",
                visitStartTime: "2026-07-01 00:00:00",
                visitEndTime: "2026-07-31 23:59:59",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /count|gateNo|userId|visitno|2\*\*\*\*\*9|1\*\*\*\*\*9/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空图书馆通行记录标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, userInfos: [] } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callLibraryAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { userInfos: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将图书馆通行业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callLibraryAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济图书馆通行服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将图书馆通行上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callLibraryAccessTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将图书馆通行上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callLibraryAccessTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /图书馆通行服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应拒绝缺失 access token 的人员基础信息查询", async () => {
        const result = await callUserBasicInfoTool({});

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /未提供同济账号授权/);
    });

    it("应注入 token 并返回裁剪后的人员基础信息", async () => {
        const previousAdapter = axios.defaults.adapter;
        let authorization: string | undefined;
        axios.defaults.adapter = async (config) => {
            authorization = config.headers?.Authorization as string | undefined;
            return {
                data: {
                    code: "A00000",
                    data: {
                        count: 2,
                        list: [
                            {
                                createTime: "2023-11-06 11:33:53",
                                deptCode: "000033",
                                deptName: "继续教育学院",
                                name: "姚*",
                                statusCode: "0",
                                statusName: "有效",
                                updateTime: "2024-06-26 16:09:48",
                                userId: "21*****7",
                                userTypeCode: "5",
                                userTypeName: "继续教育本科",
                            },
                        ],
                        sincePid: "1*****8",
                    },
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };

        try {
            const result = await callUserBasicInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(authorization, "Bearer access-token-for-test");
            assert.equal(result.isError, undefined);
            assert.deepEqual(result.structuredContent, {
                status: "ok",
                data: {
                    list: [
                        {
                            deptName: "继续教育学院",
                            name: "姚*",
                            statusName: "有效",
                            userTypeName: "继续教育本科",
                        },
                    ],
                },
                source: "Tongji Open Platform",
            });
            assert.doesNotMatch(
                JSON.stringify(result.structuredContent),
                /count|sincePid|createTime|deptCode|statusCode|updateTime|userId|userTypeCode|code|000033|2023-11-06 11:33:53|2024-06-26 16:09:48|21\*\*\*\*\*7|1\*\*\*\*\*8/,
            );
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将空人员基础信息标记为空结果", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { data: { count: 0, list: [], sincePid: "empty-since-pid" } },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callUserBasicInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.deepEqual(result.structuredContent, {
                status: "empty",
                data: { list: [] },
                source: "Tongji Open Platform",
            });
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将人员基础信息业务错误响应归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => ({
            data: { code: 500, message: "upstream business error" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        try {
            const result = await callUserBasicInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /同济人员基础信息服务返回异常/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将人员基础信息上游未授权错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: {},
                status: 401,
                statusText: "Unauthorized",
                headers: {},
                config,
            });
        };

        try {
            const result = await callUserBasicInfoTool({
                accessToken: "expired-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /授权无效或已过期/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });

    it("应将人员基础信息上游不可用错误归一为工具错误", async () => {
        const previousAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async () => {
            throw new Error("upstream unavailable");
        };

        try {
            const result = await callUserBasicInfoTool({
                accessToken: "access-token-for-test",
            });

            assert.equal(result.isError, true);
            assert.match(readToolText(result), /人员基础信息服务暂时不可用/);
        } finally {
            axios.defaults.adapter = previousAdapter;
        }
    });
});

// --- 学期日历工具测试 ---

it("应拒绝缺失 access token 的学期日历查询", async () => {
    const result = await callTermCalendarTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回学期日历数据", async () => {
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
                        weekBenginDay: 2,
                        createdAt: "2019-08-16 10:53:06",
                        updatedAt: "2022-02-21 10:42:57",
                        deleteFlag: 0,
                        ids: null,
                        gradePartOne: "2021",
                        gradePartTwo: "2022",
                        fullName: "2021-2022学年第2学期",
                        currentTermFlag: true,
                        nextTermFlag: false,
                        perTerm: "第2学期",
                        perYear: "2021-2022学年",
                    },
                ],
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };

    try {
        const result = await callTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(authorization, "Bearer access-token-for-test");
        assert.equal(result.isError, undefined);
        assert.deepEqual(result.structuredContent, {
            status: "ok",
            data: {
                terms: [
                    {
                        id: 113,
                        year: 2021,
                        term: 2,
                        beginDay: 1645372800000,
                        endDay: 1661702399000,
                        weekNum: 27,
                        weekBenginDay: 2,
                        gradePartOne: "2021",
                        gradePartTwo: "2022",
                        fullName: "2021-2022学年第2学期",
                        currentTermFlag: true,
                        nextTermFlag: false,
                        perTerm: "第2学期",
                        perYear: "2021-2022学年",
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将空的学期日历数据标记为空结果", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: { terms: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游业务错误响应归一为学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { code: 500, message: "upstream business error" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /同济学期日历服务返回异常/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游未授权错误归一为学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", undefined, config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
        });
    };

    try {
        const result = await callTermCalendarTool({
            accessToken: "expired-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游不可用错误归一为学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };

    try {
        const result = await callTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /学期日历服务暂时不可用/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

// --- 当前学期日历工具测试 ---

it("应拒绝缺失 access token 的当前学期日历查询", async () => {
    const result = await callCurrentTermCalendarTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回当前学期日历数据", async () => {
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
                    simpleName: "2021-2022学年度第2学期",
                    now: "2022年5月",
                    name: "现在是2021-2022学年第2学期第5周，当前学期从2022-02-21到2022-08-28，共27周",
                    hiddenField: "ignored",
                },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(authorization, "Bearer access-token-for-test");
        assert.equal(result.isError, undefined);
        assert.deepEqual(result.structuredContent, {
            status: "ok",
            data: {
                calendarId: 113,
                beginDay: 1645372800000,
                endDay: 1661702399000,
                examWeekEnd: null,
                examWeekStart: null,
                teachingWeekEnd: null,
                teachingWeekStart: null,
                year: 2021,
                term: 2,
                weekNum: 27,
                week: 5,
                simpleName: "2021-2022学年度第2学期",
                now: "2022年5月",
                name: "现在是2021-2022学年第2学期第5周，当前学期从2022-02-21到2022-08-28，共27周",
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将空的当前学期日历对象标记为空结果", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: { schoolCalendar: {} } },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: null,
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游 data:null 响应视为空数据", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: null },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: null,
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游业务错误响应归一为当前学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { code: 500, message: "upstream business error" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /同济当前学期日历服务返回异常/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游未授权错误归一为当前学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", undefined, config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
        });
    };

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "expired-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游不可用错误归一为当前学期日历工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };

    try {
        const result = await callCurrentTermCalendarTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /当前学期日历服务暂时不可用/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

// --- 四六级成绩工具测试 ---

it("应拒绝缺失 access token 的四六级成绩查询", async () => {
    const result = await callCetScoreTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回四六级成绩数据", async () => {
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
                            calendarYearTermCn: "2021-2022学年第1学期",
                            studentId: "205****",
                            studentName: "欧****",
                            title: null,
                            subjectCode: null,
                            competitionType: null,
                            writtenSubjectName: "（2）英语六级笔试",
                            cardNo: "31003121*******",
                            score: "603.00",
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
                            calendarYearTermCn: "2020-2021学年第2学期",
                            studentId: "205****",
                            studentName: "欧****",
                            title: null,
                            subjectCode: null,
                            competitionType: null,
                            writtenSubjectName: "（1）英语四级笔试",
                            cardNo: "31003121*******",
                            score: "599.00",
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
            statusText: "OK",
            headers: {},
            config,
        };
    };

    try {
        const result = await callCetScoreTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(authorization, "Bearer access-token-for-test");
        assert.equal(result.isError, undefined);
        assert.deepEqual(result.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        studentId: "205****",
                        studentName: "欧****",
                        competitionType: null,
                        writtenSubjectName: "（2）英语六级笔试",
                        cardNo: "31003121*******",
                        score: "603.00",
                        scoreRank: null,
                        oralScore: null,
                        examTime: null,
                        cetType: 2,
                    },
                    {
                        studentId: "205****",
                        studentName: "欧****",
                        competitionType: null,
                        writtenSubjectName: "（1）英语四级笔试",
                        cardNo: "31003121*******",
                        score: "599.00",
                        scoreRank: null,
                        oralScore: null,
                        examTime: null,
                        cetType: 1,
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将空的四六级成绩数据标记为空结果", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: { list: [] } },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callCetScoreTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游业务错误响应归一为四六级成绩工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { code: 500, message: "upstream business error" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callCetScoreTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /四六级成绩服务返回异常/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游未授权错误归一为四六级成绩工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", undefined, config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
        });
    };

    try {
        const result = await callCetScoreTool({
            accessToken: "expired-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游不可用错误归一为四六级成绩工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };

    try {
        const result = await callCetScoreTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /四六级成绩服务暂时不可用/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

// --- 图书借阅信息工具测试 ---

it("应拒绝缺失 access token 的图书借阅查询", async () => {
    const result = await callBookLendInfoTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回图书借阅数据", async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
        authorization = config.headers?.Authorization as string | undefined;
        return {
            data: {
                data: [
                    {
                        asbackDate: "",
                        asbackTimes: "0",
                        author: "(日) 东野圭吾著",
                        callNo: "I",
                        callNoName: "文学",
                        countryCode: "CN",
                        countryName: "中国",
                        debtFlag: "0",
                        deptCode: "000182",
                        deptName: "土木工程学院",
                        docTypeCode: "01",
                        docTypeName: "中文图书",
                        isJournal: "否",
                        isbn: "978-7-5448-3396-7",
                        langCode: "CHI",
                        langName: "中文",
                        lendDate: "2021-03-1512:05:39",
                        locationCode: "A2001",
                        locationName: "四平路校区图书馆书库",
                        name: "张三",
                        propNo: "02734098",
                        pubYear: "2014",
                        publisher: "接力出版社",
                        renewDate: "",
                        renewTimes: "0",
                        retDate: "2021-05-1017:59:49",
                        title: "圣女的救赎",
                        totalLendQty: "7",
                        userId: "20**4",
                        internalField: "ignored",
                    },
                ],
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };

    try {
        const result = await callBookLendInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(authorization, "Bearer access-token-for-test");
        assert.equal(result.isError, undefined);
        assert.deepEqual(result.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        asbackDate: "",
                        asbackTimes: 0,
                        author: "(日) 东野圭吾著",
                        callNo: "I",
                        callNoName: "文学",
                        countryCode: "CN",
                        countryName: "中国",
                        debtFlag: 0,
                        deptCode: "000182",
                        deptName: "土木工程学院",
                        docTypeCode: "01",
                        docTypeName: "中文图书",
                        isbn: "978-7-5448-3396-7",
                        langCode: "CHI",
                        langName: "中文",
                        lendDate: "2021-03-1512:05:39",
                        locationCode: "A2001",
                        locationName: "四平路校区图书馆书库",
                        name: "张三",
                        propNo: "02734098",
                        pubYear: "2014",
                        publisher: "接力出版社",
                        renewDate: "",
                        renewTimes: 0,
                        retDate: "2021-05-1017:59:49",
                        title: "圣女的救赎",
                        totalLendQty: 7,
                        userId: "20**4",
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将空的图书借阅数据标记为空结果", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callBookLendInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游业务错误响应归一为图书借阅工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { code: 500, message: "upstream business error" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callBookLendInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /图书借阅服务返回异常/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游未授权错误归一为图书借阅工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", undefined, config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
        });
    };

    try {
        const result = await callBookLendInfoTool({
            accessToken: "expired-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游不可用错误归一为图书借阅工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };

    try {
        const result = await callBookLendInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /图书借阅服务暂时不可用/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

// --- 个人统计数据工具测试 ---

it("应拒绝缺失 access token 的个人统计查询", async () => {
    const result = await callStatisticsInfoTool({});

    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回个人统计数据", async () => {
    const previousAdapter = axios.defaults.adapter;
    let authorization: string | undefined;
    axios.defaults.adapter = async (config) => {
        authorization = config.headers?.Authorization as string | undefined;
        return {
            data: {
                data: [
                    {
                        bookCategory: "中文图书",
                        bookCoun: 11,
                        bookFirst: "大乔小乔",
                        canteenAmount: 1565.64,
                        canteenAmtPercentileRank: 0.2902,
                        canteenCoun: 225,
                        canteenOften: "四平校区学苑饮食广场中点部",
                        canteenOftenPercentileRank: 0.6089,
                        cardPelaceCoun: 3,
                        college: "环*******院",
                        consumMostAmount: 68,
                        consumMostTime: "2019-11-29 19:35:52",
                        consumePlaceOften: "四平校区学苑饮食广场中点部",
                        consumeTotal: 1618.34,
                        consumeTotalPercentileRank: 0.2608,
                        earlistTime: "2021-10-31 07:54:24",
                        entYear: 2018,
                        entranceCoun: 34,
                        firstCardPlaceTime: "2018-11-22 20:06:55",
                        gender: "0",
                        latestTime: "2021-10-31 19:59:04",
                        major: "环**程",
                        marketAmount: 17.7,
                        rechargeTimeSlot: "18:00-20:00",
                        rideCoun: 0,
                        scholarshipCoun: 0,
                        sname: "**轻",
                        stayTime: 173.53,
                        stayTimePercentileRank: 0.4121,
                        stayYear: 4,
                        stuLevel: "1",
                        userId: "1****9",
                        hiddenField: "ignored",
                    },
                ],
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };

    try {
        const result = await callStatisticsInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(authorization, "Bearer access-token-for-test");
        assert.equal(result.isError, undefined);
        assert.deepEqual(result.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        bookCategory: "中文图书",
                        bookCoun: 11,
                        bookFirst: "大乔小乔",
                        canteenAmount: 1565.64,
                        canteenAmtPercentileRank: 0.2902,
                        canteenCoun: 225,
                        canteenOften: "四平校区学苑饮食广场中点部",
                        canteenOftenPercentileRank: 0.6089,
                        cardPelaceCoun: 3,
                        college: "环*******院",
                        consumMostAmount: 68,
                        consumMostTime: "2019-11-29 19:35:52",
                        consumePlaceOften: "四平校区学苑饮食广场中点部",
                        consumeTotal: 1618.34,
                        consumeTotalPercentileRank: 0.2608,
                        earlistTime: "2021-10-31 07:54:24",
                        entYear: 2018,
                        entranceCoun: 34,
                        firstCardPlaceTime: "2018-11-22 20:06:55",
                        gender: "0",
                        latestTime: "2021-10-31 19:59:04",
                        major: "环**程",
                        marketAmount: 17.7,
                        rechargeTimeSlot: "18:00-20:00",
                        rideCoun: 0,
                        scholarshipCoun: 0,
                        sname: "**轻",
                        stayTime: 173.53,
                        stayTimePercentileRank: 0.4121,
                        stayYear: 4,
                        stuLevel: "1",
                        userId: "1****9",
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将空的个人统计数据标记为空结果", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { data: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callStatisticsInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.deepEqual(result.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游业务错误响应归一为个人统计工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
        data: { code: 500, message: "upstream business error" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    try {
        const result = await callStatisticsInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /个人统计服务返回异常/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游未授权错误归一为个人统计工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", undefined, config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
        });
    };

    try {
        const result = await callStatisticsInfoTool({
            accessToken: "expired-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

it("应将上游不可用错误归一为个人统计工具错误", async () => {
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };

    try {
        const result = await callStatisticsInfoTool({
            accessToken: "access-token-for-test",
        });

        assert.equal(result.isError, true);
        assert.match(readToolText(result), /个人统计服务暂时不可用/);
    } finally {
        axios.defaults.adapter = previousAdapter;
    }
});

// --- 助学金信息工具测试 ---

it("应拒绝缺失 access token 的助学金查询", async () => {
    const result = await callStipendInfoTool({});
    assert.equal(result.isError, true);
    assert.match(readToolText(result), /未提供同济账号授权/);
});

it("应注入 token 并返回助学金数据", async () => {
    const prev = axios.defaults.adapter;
    let auth: string | undefined;
    axios.defaults.adapter = async (c) => {
        auth = c.headers?.Authorization as string | undefined;
        return {
            data: {
                data: {
                    count: 1,
                    list: [
                        {
                            amount: 1000,
                            deptCode: "000215",
                            deptName: "材料科学与工程学院",
                            name: "柳**",
                            rankName: "不分等级",
                            ratingTerm: "不分学期",
                            ratingYear: "2020",
                            stipendName: "研究生**使用项",
                            unitAbbreviation: "材料科学与工程学院",
                            updateTime: "2025-09-29T00:00:00",
                            userId: "1*****2",
                            wid: "B8101D5249AB62CDE053647CA8C08EFD",
                            sinceWid: "ignored",
                        },
                    ],
                },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config: c,
        };
    };
    try {
        const r = await callStipendInfoTool({ accessToken: "t" });
        assert.equal(auth, "Bearer t");
        assert.equal(r.isError, undefined);
        assert.deepEqual(r.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        amount: 1000,
                        deptCode: "000215",
                        deptName: "材料科学与工程学院",
                        name: "柳**",
                        rankName: "不分等级",
                        ratingTerm: "不分学期",
                        ratingYear: "2020",
                        stipendName: "研究生**使用项",
                        unitAbbreviation: "材料科学与工程学院",
                        updateTime: "2025-09-29T00:00:00",
                        userId: "1*****2",
                        wid: "B8101D5249AB62CDE053647CA8C08EFD",
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将空的助学金数据标记为空结果", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { data: { list: [] } },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callStipendInfoTool({ accessToken: "t" });
        assert.deepEqual(r.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游业务错误响应归一为助学金工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { code: 500 },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callStipendInfoTool({ accessToken: "t" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /助学金服务返回异常/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游未授权错误归一为助学金工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => {
        throw new AxiosError("Unauthorized", undefined, c, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config: c,
        });
    };
    try {
        const r = await callStipendInfoTool({ accessToken: "expired" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游不可用错误归一为助学金工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("upstream unavailable");
    };
    try {
        const r = await callStipendInfoTool({ accessToken: "t" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /助学金服务暂时不可用/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

// --- 住宿信息工具测试 ---

it("应拒绝缺失 access token 的住宿查询", async () => {
    const r = await callAccommodationInfoTool({});
    assert.equal(r.isError, true);
    assert.match(readToolText(r), /未提供同济账号授权/);
});

it("应注入 token 并返回住宿数据", async () => {
    const prev = axios.defaults.adapter;
    let auth: string | undefined;
    axios.defaults.adapter = async (c) => {
        auth = c.headers?.Authorization as string | undefined;
        return {
            data: {
                data: {
                    list: [
                        {
                            accomBuildingCode: "2622",
                            accomBuildingName: "彰武2号楼（女）",
                            accomRegionCode: "8",
                            accomRegionName: "彰武路校区",
                            deptCode: "000624",
                            deptName: "口腔医学院",
                            floor: "19",
                            name: "朱**",
                            roomNo: "1909",
                            schoolCode: null,
                            schoolName: null,
                            updateTime: "2026-01-04T00:00:00",
                            userId: "21****4",
                            usertypeCode: "3",
                            usertypeName: "硕士研究生",
                            internal: "ignored",
                        },
                    ],
                },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config: c,
        };
    };
    try {
        const r = await callAccommodationInfoTool({ accessToken: "t" });
        assert.equal(auth, "Bearer t");
        assert.equal(r.isError, undefined);
        assert.deepEqual(r.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        accomBuildingCode: "2622",
                        accomBuildingName: "彰武2号楼（女）",
                        accomRegionCode: "8",
                        accomRegionName: "彰武路校区",
                        deptCode: "000624",
                        deptName: "口腔医学院",
                        floor: "19",
                        name: "朱**",
                        roomNo: "1909",
                        userId: "21****4",
                        usertypeCode: "3",
                        usertypeName: "硕士研究生",
                    },
                ],
            },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将空的住宿数据标记为空结果", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { data: { list: [] } },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callAccommodationInfoTool({ accessToken: "t" });
        assert.deepEqual(r.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "Tongji Open Platform",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游业务错误响应归一为住宿工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { code: 500 },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callAccommodationInfoTool({ accessToken: "t" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /住宿信息服务返回异常/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游未授权错误归一为住宿工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => {
        throw new AxiosError("Unauthorized", undefined, c, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config: c,
        });
    };
    try {
        const r = await callAccommodationInfoTool({ accessToken: "expired" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /授权无效或已过期/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游不可用错误归一为住宿工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("unavailable");
    };
    try {
        const r = await callAccommodationInfoTool({ accessToken: "t" });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /住宿信息服务暂时不可用/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

// --- 课程详情工具测试 ---

it("应注入课程ID并返回课程详情与裁剪后的评价", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: {
            id: 12005,
            code: "36002907",
            name: "军事理论",
            credit: 2,
            department: "武装部",
            teacher_id: 2808,
            review_count: 58,
            review_avg: 5,
            search_keywords: "36002907 军事理论",
            is_legacy: 0,
            is_icu: 1,
            teacher_name: "郑义炜",
            semesters: ["2025-2026学年第2学期"],
            reviews: [
                {
                    sqid: "ckJ9",
                    id: 18232,
                    course_id: 12005,
                    semester: "2025-2026学年第1学期",
                    rating: 5,
                    comment: "## 考核方式：\n期末开卷考",
                    score: null,
                    created_at: 1784192109,
                    approve_count: 0,
                    disapprove_count: 0,
                    is_hidden: 0,
                    is_legacy: 0,
                    is_icu: 0,
                    reviewer_name: "",
                    reviewer_avatar: "",
                    like_count: 0,
                    liked: false,
                    can_edit: false,
                },
            ],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callCourseDetailTool({}, { id: 12005 });
        assert.equal(r.isError, undefined);
        assert.deepEqual(r.structuredContent, {
            status: "ok",
            data: {
                id: 12005,
                code: "36002907",
                name: "军事理论",
                credit: 2,
                department: "武装部",
                teacher_id: 2808,
                review_count: 58,
                review_avg: 5,
                search_keywords: "36002907 军事理论",
                teacher_name: "郑义炜",
                semesters: ["2025-2026学年第2学期"],
                reviews: [
                    {
                        id: 18232,
                        course_id: 12005,
                        semester: "2025-2026学年第1学期",
                        rating: 5,
                        comment: "## 考核方式：\n期末开卷考",
                        score: null,
                        created_at: 1784192109,
                        approve_count: 0,
                        disapprove_count: 0,
                        is_hidden: 0,
                        reviewer_name: "",
                        like_count: 0,
                    },
                ],
            },
            source: "YourTJ",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将无课程数据的响应标记为空结果", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => {
        throw new axios.AxiosError("Not Found", undefined, c, undefined, {
            data: {},
            status: 404,
            statusText: "Not Found",
            headers: {},
            config: c,
        });
    };
    try {
        const r = await callCourseDetailTool({}, { id: 99999 });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /未找到指定课程/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游不可用错误归一为课程详情工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("unavailable");
    };
    try {
        const r = await callCourseDetailTool({}, { id: 12005 });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /课程详情服务暂时不可用/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

// --- 课程关联工具测试 ---

it("应注入课程ID并返回关联课程数据", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: {
            teacher_other_courses: [
                {
                    id: 2846,
                    code: "360007",
                    name: "世界大战与局部战争",
                    teacher_name: "郑义炜",
                    review_avg: 5,
                    review_count: 43,
                },
            ],
            same_course_other_teachers: [
                {
                    id: 9258,
                    code: "36002907",
                    name: "军事理论",
                    teacher_name: "袁品仕",
                    review_avg: 0,
                    review_count: 0,
                },
            ],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callCourseRelatedTool({}, { id: 12005 });
        assert.equal(r.isError, undefined);
        assert.deepEqual(r.structuredContent, {
            status: "ok",
            data: {
                teacherOtherCourses: [
                    {
                        id: 2846,
                        code: "360007",
                        name: "世界大战与局部战争",
                        teacher_name: "郑义炜",
                        review_avg: 5,
                        review_count: 43,
                    },
                ],
                sameCourseOtherTeachers: [
                    {
                        id: 9258,
                        code: "36002907",
                        name: "军事理论",
                        teacher_name: "袁品仕",
                        review_avg: 0,
                        review_count: 0,
                    },
                ],
            },
            source: "YourTJ",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将无关联数据的响应标记为空结果", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { teacher_other_courses: [], same_course_other_teachers: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callCourseRelatedTool({}, { id: 12005 });
        assert.deepEqual(r.structuredContent, {
            status: "empty",
            data: null,
            source: "YourTJ",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游不可用错误归一为课程关联工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("unavailable");
    };
    try {
        const r = await callCourseRelatedTool({}, { id: 12005 });
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /课程关联服务暂时不可用/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

// --- 按学期年级查询专业工具测试 ---

it("应注入参数并返回专业列表", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: {
            data: [
                { code: "00304", name: "2024(00304 基础学科拔尖基地(数学))" },
            ],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callFindMajorByGradeTool(
            {},
            { calendarId: 118, grade: 2024 },
        );
        assert.equal(r.isError, undefined);
        assert.deepEqual(r.structuredContent, {
            status: "ok",
            data: {
                records: [
                    {
                        code: "00304",
                        name: "2024(00304 基础学科拔尖基地(数学))",
                    },
                ],
            },
            source: "YourTJ",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将空专业列表标记为空结果", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: { data: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callFindMajorByGradeTool(
            {},
            { calendarId: 118, grade: 2024 },
        );
        assert.deepEqual(r.structuredContent, {
            status: "empty",
            data: { records: [] },
            source: "YourTJ",
        });
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游业务错误响应归一为专业查询工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async (c) => ({
        data: "not json",
        status: 200,
        statusText: "OK",
        headers: {},
        config: c,
    });
    try {
        const r = await callFindMajorByGradeTool(
            {},
            { calendarId: 118, grade: 2024 },
        );
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /专业查询服务返回异常/);
    } finally {
        axios.defaults.adapter = prev;
    }
});

it("应将上游不可用错误归一为专业查询工具错误", async () => {
    const prev = axios.defaults.adapter;
    axios.defaults.adapter = async () => {
        throw new Error("unavailable");
    };
    try {
        const r = await callFindMajorByGradeTool(
            {},
            { calendarId: 118, grade: 2024 },
        );
        assert.equal(r.isError, true);
        assert.match(readToolText(r), /专业查询服务暂时不可用/);
    } finally {
        axios.defaults.adapter = prev;
    }
});
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

// callCourseCatalogTool 通过内存传输调用课程目录查询工具。
const callCourseCatalogTool = async (
    invocation: { accessToken?: string },
    args: {
        page?: number;
        limit?: number;
        q?: string;
    } = {},
) => {
    return callTool(COURSE_CATALOG_TOOL_NAME, invocation, args);
};

// callCalendarListTool 通过内存传输调用学期列表查询工具。
const callCalendarListTool = async (invocation: { accessToken?: string }) => {
    return callTool(CALENDAR_LIST_TOOL_NAME, invocation);
};

// callGradeListTool 通过内存传输调用年级界别列表查询工具。
const callGradeListTool = async (
    invocation: { accessToken?: string },
    args: { calendarId: number },
) => {
    return callTool(GRADE_LIST_TOOL_NAME, invocation, args);
};

// callStudentTimetableTool 通过内存传输调用学生课表查询工具。
const callStudentTimetableTool = async (
    invocation: { accessToken?: string },
    args: { calendarId?: string } = {},
) => {
    return callTool(STUDENT_TIMETABLE_TOOL_NAME, invocation, args);
};

// callStudentDetailedInfoTool 通过内存传输调用学生详细学籍信息查询工具。
const callStudentDetailedInfoTool = async (invocation: {
    accessToken?: string;
}) => {
    return callTool(STUDENT_DETAILED_INFO_TOOL_NAME, invocation);
};

// callCompetitionPrizeTool 通过内存传输调用竞赛奖励查询工具。
const callCompetitionPrizeTool = async (invocation: {
    accessToken?: string;
}) => {
    return callTool(COMPETITION_PRIZE_TOOL_NAME, invocation);
};

// callHonoraryTitleTool 通过内存传输调用荣誉称号查询工具。
const callHonoraryTitleTool = async (invocation: { accessToken?: string }) => {
    return callTool(HONORARY_TITLE_TOOL_NAME, invocation);
};

// callScholarshipInfoTool 通过内存传输调用奖学金查询工具。
const callScholarshipInfoTool = async (invocation: {
    accessToken?: string;
}) => {
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

// callUserBasicInfoTool 通过内存传输调用人员基础信息查询工具。
const callUserBasicInfoTool = async (invocation: { accessToken?: string }) => {
    return callTool(USER_BASIC_INFO_TOOL_NAME, invocation);
};

// callTool 通过内存传输调用指定工具。
const callTool = async (
    name: string,
    invocation: { accessToken?: string },
    args: Record<string, unknown> = {},
) => {
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const text = result.content.find((item) => item.type === "text")?.text;
    return text ?? "";
};

// callTermCalendarTool 通过内存传输调用学期日历查询工具。
const callTermCalendarTool = async (
    invocation: { accessToken?: string },
    args: Record<string, unknown> = {},
) => {
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });

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
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    try {
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        return (await client.callTool({
            name: STIPEND_INFO_TOOL_NAME,
            arguments: args,
        })) as StipendInfoToolCallResult;
    } finally {
        await server.close();
    }
};

// callAccommodationInfoTool 通过内存传输调用住宿信息查询工具。
const callAccommodationInfoTool = async (
    invocation: { accessToken?: string },
    args: Record<string, unknown> = {},
) => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "t", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        return (await client.callTool({
            name: ACCOMMODATION_INFO_TOOL_NAME,
            arguments: args,
        })) as AccommodationInfoToolCallResult;
    } finally {
        await server.close();
    }
};

// callCourseDetailTool 通过内存传输调用课程详情查询工具。
const callCourseDetailTool = async (
    invocation: { accessToken?: string },
    args: { id: number },
) => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "t", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        return (await client.callTool({
            name: COURSE_DETAIL_TOOL_NAME,
            arguments: args,
        })) as CourseDetailToolCallResult;
    } finally {
        await server.close();
    }
};

// callCourseRelatedTool 通过内存传输调用课程关联查询工具。
const callCourseRelatedTool = async (
    invocation: { accessToken?: string },
    args: { id: number },
) => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "t", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        return (await client.callTool({
            name: COURSE_RELATED_TOOL_NAME,
            arguments: args,
        })) as CourseRelatedToolCallResult;
    } finally {
        await server.close();
    }
};

// callFindMajorByGradeTool 通过内存传输调用按学期年级查询专业工具。
const callFindMajorByGradeTool = async (
    invocation: { accessToken?: string },
    args: { calendarId: number; grade: number },
) => {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "t", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        return (await client.callTool({
            name: FIND_MAJOR_BY_GRADE_TOOL_NAME,
            arguments: args,
        })) as FindMajorByGradeToolCallResult;
    } finally {
        await server.close();
    }
};
