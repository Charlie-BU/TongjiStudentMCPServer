import { z } from "zod";

export const CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的当前学期数据。"),
    data: z.object({
        calendarId: z.number().nullable().describe("当前学期的 calendarId。"),
        beginDay: z.number().nullable().describe("当前学期开始日期的时间戳。"),
        endDay: z.number().nullable().describe("当前学期结束日期的时间戳。"),
        examWeekEnd: z.number().nullable().describe("考试周结束周次。"),
        examWeekStart: z.number().nullable().describe("考试周开始周次。"),
        teachingWeekEnd: z.number().nullable().describe("教学周结束周次。"),
        teachingWeekStart: z.number().nullable().describe("教学周开始周次。"),
        year: z.number().nullable().describe("学年年份。"),
        term: z.number().nullable().describe("学期序号，1 表示第一学期，2 表示第二学期。"),
        weekNum: z.number().nullable().describe("该学期包含的教学周数。"),
        week: z.number().nullable().describe("当前所处的教学周序号。"),
        simpleName: z.string().nullable().describe("学期简称，例如 2021-2022学年度第2学期。"),
        now: z.string().nullable().describe("当前日期所在的月份描述，例如 2022年5月。"),
        name: z.string().nullable().describe("当前学期的完整描述，包含日期与周数。"),
    }).nullable().describe("当前学期日历数据，无数据时为 null。"),
    source: z.literal("Tongji Open Platform").describe("学期日历数据来源。"),
});
