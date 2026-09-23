import { z } from "zod";

export const COMPETITION_PRIZE_SCHEMA = z.object({
    awardCategory: z.string().nullable().describe("奖项类别"),
    awardDate: z.string().nullable().describe("获奖日期"),
    awardLevel: z.string().nullable().describe("奖项等级"),
    competitionLevel: z.string().nullable().describe("竞赛等级"),
    competitionName: z.string().nullable().describe("竞赛名称"),
    deptName: z.string().nullable().describe("所属学院名称"),
    name: z.string().nullable().describe("竞赛获奖学生姓名"),
    schoolYear: z.string().nullable().describe("学年度"),
});

export const COMPETITION_PRIZE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的竞赛奖励记录。"),
    data: z.object({
        list: z
            .array(COMPETITION_PRIZE_SCHEMA)
            .describe("当前授权本科生的竞赛奖励记录列表。"),
    }).describe("业务响应数据。"),
    pagination: z.record(z.string()).optional().describe("分页游标信息；沿用上游返回的游标字段进行后续查询。"),
    source: z.literal("Tongji Open Platform").describe("竞赛奖励数据来源。"),
});
