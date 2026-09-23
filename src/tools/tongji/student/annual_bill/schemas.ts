import { z } from "zod";

export const ANNUAL_BILL_SCHEMA = z.object({
    annualBorrowedTopPct: z
        .number()
        .nullable()
        .describe("一年中的总借书数是全校师生的前X%"),
    avgDailySpending: z.number().nullable().describe("平均每次消费金额（食堂里），单位：元"),
    booksCount: z.number().nullable().describe("一年中的总借书数"),
    deptName: z.string().nullable().describe("学院代码名称"),
    earliestEntryTime: z.string().nullable().describe("最早进入图书馆的具体时间（精确到秒）"),
    latestExitTime: z.string().nullable().describe("最晚出校门的准确时间（精确到秒）"),
    libraryAccessCount: z.number().nullable().describe("进出图书馆次数"),
    libraryStudyTime: z
        .number()
        .nullable()
        .describe("在图书馆学习时长，单位：小时"),
    libraryStudyTopPct: z
        .number()
        .nullable()
        .describe("在图书馆学习时间位于全校师生前X%"),
    maxCumulativeLoc: z
        .string()
        .nullable()
        .describe("累计消费最多的地点（食堂名）"),
    maxTransactionAmt: z
        .number()
        .nullable()
        .describe("单次消费最多金额，单位：元"),
    maxTransactionLoc: z.string().nullable().describe("单次消费最多的地点（食堂名）"),
    maxTransactionTime: z.string().nullable().describe("单次消费最多的时间（年月日）"),
    name: z.string().nullable().describe("姓名"),
    shuttleRidesCount: z.number().nullable().describe("校车乘坐次数（年度）"),
    totalEntries: z.number().nullable().describe("进出校门总数"),
    totalSpendingCanteen: z
        .number()
        .nullable()
        .describe("全年消费总金额（食堂里），单位：元"),
    year: z.string().nullable().describe("年份"),
});

export const ANNUAL_BILL_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的年度统计账单。"),
    data: z.object({
        list: z.array(ANNUAL_BILL_SCHEMA).describe("当前授权学生的年度统计账单列表。"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("年度统计账单数据来源。"),
    year: z.string().describe("年份"),
});
