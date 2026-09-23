import { z } from "zod";

export const ANNUAL_BILL_SCHEMA = z.object({
    annualBorrowedTopPct: z
        .number()
        .nullable()
        .describe("借阅图书数量超越全校学生的百分比。"),
    avgDailySpending: z.number().nullable().describe("日均消费金额，单位元。"),
    booksCount: z.number().nullable().describe("年度借阅图书数量。"),
    deptName: z.string().nullable().describe("学生所属学院或部门名称。"),
    earliestEntryTime: z.string().nullable().describe("年度最早入校时间。"),
    latestExitTime: z.string().nullable().describe("年度最晚出校或夜归时间。"),
    libraryAccessCount: z.number().nullable().describe("年度图书馆入馆总次数。"),
    libraryStudyTime: z
        .number()
        .nullable()
        .describe("年度在图书馆学习的总时长，单位小时。"),
    libraryStudyTopPct: z
        .number()
        .nullable()
        .describe("图书馆学习时长超越全校学生的百分比。"),
    maxCumulativeLoc: z
        .string()
        .nullable()
        .describe("年度最常去或累计消费最多的地点。"),
    maxTransactionAmt: z
        .number()
        .nullable()
        .describe("年度单笔最高消费金额，单位元。"),
    maxTransactionLoc: z.string().nullable().describe("年度单笔最高消费地点。"),
    maxTransactionTime: z.string().nullable().describe("年度单笔最高消费发生日期。"),
    name: z.string().nullable().describe("学生姓名，以上游返回内容为准。"),
    shuttleRidesCount: z.number().nullable().describe("跨校区班车乘坐次数。"),
    totalEntries: z.number().nullable().describe("年度进出校总次数。"),
    totalSpendingCanteen: z
        .number()
        .nullable()
        .describe("年度食堂总消费金额，单位元。"),
    year: z.string().nullable().describe("统计年份。"),
});

export const ANNUAL_BILL_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的年度统计账单。"),
    data: z.object({
        list: z.array(ANNUAL_BILL_SCHEMA).describe("当前授权学生的年度统计账单列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("年度统计账单数据来源。"),
    year: z.string().describe("本次查询指定的统计年份。"),
});
