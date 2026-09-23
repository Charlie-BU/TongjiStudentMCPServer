import { z } from "zod";

export const COMPETITION_PRIZE_SCHEMA = z.object({
    awardCategory: z.string().nullable().describe("奖励类别，例如竞赛获奖。"),
    awardDate: z.string().nullable().describe("获奖时间。"),
    awardLevel: z.string().nullable().describe("奖项等级，例如一等奖。"),
    competitionLevel: z.string().nullable().describe("比赛等级，例如校级。"),
    competitionName: z.string().nullable().describe("比赛名称。"),
    deptName: z.string().nullable().describe("获奖记录所属部门名称。"),
    name: z.string().nullable().describe("获奖人姓名，以上游返回内容为准。"),
    schoolYear: z.string().nullable().describe("获奖记录所属学年。"),
});

export const COMPETITION_PRIZE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的竞赛奖励记录。"),
    data: z.object({
        list: z
            .array(COMPETITION_PRIZE_SCHEMA)
            .describe("当前授权本科生的竞赛奖励记录列表。"),
    }),
    pagination: z.record(z.string()).optional(),
    source: z.literal("Tongji Open Platform").describe("竞赛奖励数据来源。"),
});
