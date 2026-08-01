import assert from "node:assert/strict";
import { describe, it } from "node:test";
import axios, { type AxiosRequestConfig } from "axios";
import {
    getAccommodationInfo,
    getAllStudentDetailedInfo,
    getAllTermCalendars,
    getBookLendInfo,
    getCardSpendingFlow,
    getCetScores,
    getCompetitionPrizes,
    getCurrentTermCalendar,
    getLibraryAccess,
    getSchoolAccess,
    getStatisticsInfo,
    getStatisticsInfoByYear,
    getStipendInfo,
    getStudentHonoraryTitles,
    getStudentScholarshipInfo,
    getStudentTimetable,
    getUndergraduateScores,
    getUserBasicInfo,
} from "../../src/integration/tongji_openapi";

const config = {
    accessToken: "test-access-token",
    baseUrl: "https://api.example.test/",
    timeoutMs: 1_234,
};

interface RequestCase {
    name: string;
    request: () => Promise<unknown>;
    url: string;
    method?: string;
    params?: unknown;
    data?: unknown;
}

const requestCases: RequestCase[] = [
    {
        name: "本科成绩",
        request: () => getUndergraduateScores(config, "120"),
        url: "/v1/rt/onetongji/undergraduate_score",
        params: { calendarId: "120" },
    },
    { name: "全部学期日历", request: () => getAllTermCalendars(config), url: "/v1/rt/onetongji/school_calendar_all_term_calendar" },
    { name: "当前学期日历", request: () => getCurrentTermCalendar(config), url: "/v1/rt/onetongji/school_calendar_current_term_calendar" },
    { name: "四六级成绩", request: () => getCetScores(config), url: "/v1/rt/onetongji/cet_score" },
    { name: "图书借阅", request: () => getBookLendInfo(config), url: "/v2/dc/lib/lend_info_all" },
    { name: "个人统计", request: () => getStatisticsInfo(config), url: "/v2/dc/user/user_data_statistics" },
    { name: "助学金", request: () => getStipendInfo(config), url: "/v2/dc/student_work_info/stipend" },
    { name: "住宿", request: () => getAccommodationInfo(config), url: "/v2/dc/sep_auth/student_accommodation_info" },
    { name: "竞赛奖励", request: () => getCompetitionPrizes(config), url: "/v2/dc/student_work_info/competition_winners" },
    { name: "荣誉称号", request: () => getStudentHonoraryTitles(config), url: "/v2/dc/student_work_info/honorary_title" },
    { name: "奖学金", request: () => getStudentScholarshipInfo(config), url: "/v2/dc/student_work_info/scholarship" },
    {
        name: "学生详细信息",
        request: () => getAllStudentDetailedInfo(config, "internal-user-id"),
        url: "/v1/rt/user/all_student",
        method: "post",
        data: { userId: "internal-user-id" },
    },
    { name: "人员基础信息", request: () => getUserBasicInfo(config), url: "/v2/rt/user/all_info" },
    {
        name: "年度统计账单",
        request: () => getStatisticsInfoByYear(config, "2024"),
        url: "/v2/dc/user/user_annual_bill",
        params: { year: "2024" },
    },
    {
        name: "一卡通消费流水",
        request: () => getCardSpendingFlow(config, "2025-05-01 00:00:00", "2025-05-31 23:59:59"),
        url: "/v1/dc/card/card_history_flow",
        params: { tradeStartTime: "2025-05-01 00:00:00", tradeEndTime: "2025-05-31 23:59:59" },
    },
    {
        name: "学生课表",
        request: () => getStudentTimetable(config, "120"),
        url: "/v1/rt/onetongji/student_timetable",
        params: { calendarId: "120" },
    },
    {
        name: "校门通行",
        request: () => getSchoolAccess(config, "出门", "2026-07-01 00:00:00", "2026-07-31 23:59:59"),
        url: "/v1/dc/door/school_access_control",
        params: { portNum: "出门", dataStartTime: "2026-07-01 00:00:00", dataEndTime: "2026-07-31 23:59:59" },
    },
    {
        name: "图书馆通行",
        request: () => getLibraryAccess(config, "1", "2026-07-01 00:00:00", "2026-07-31 23:59:59"),
        url: "/v1/dc/lib/lib_access_control",
        params: { direction: "1", visitStartTime: "2026-07-01 00:00:00", visitEndTime: "2026-07-31 23:59:59" },
    },
];

describe("Tongji OpenAPI integration", () => {
    for (const testCase of requestCases) {
        it(`应构造${testCase.name}请求的地址、参数、认证头与超时`, async () => {
            const previousAdapter = axios.defaults.adapter;
            let capturedConfig: AxiosRequestConfig | undefined;
            axios.defaults.adapter = async (requestConfig) => {
                capturedConfig = requestConfig;
                return { data: { data: [] }, status: 200, statusText: "OK", headers: {}, config: requestConfig };
            };

            try {
                await testCase.request();
                assert.equal(capturedConfig?.url, `${config.baseUrl.slice(0, -1)}${testCase.url}`);
                assert.equal(capturedConfig?.method, testCase.method ?? "get");
                assert.deepEqual(capturedConfig?.params, testCase.params);
                assert.deepEqual(testCase.data === undefined ? capturedConfig?.data : JSON.parse(String(capturedConfig?.data)), testCase.data);
                assert.equal(capturedConfig?.headers?.Authorization, `Bearer ${config.accessToken}`);
                assert.equal(capturedConfig?.timeout, config.timeoutMs);
            } finally {
                axios.defaults.adapter = previousAdapter;
            }
        });
    }
});
