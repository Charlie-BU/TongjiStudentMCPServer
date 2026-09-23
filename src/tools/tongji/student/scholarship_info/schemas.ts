import { z } from "zod";

export const SCHOLARSHIP_INFO_SCHEMA = z.object({
    deptName: z.string().nullable().describe("获奖学生所属学院名称。"),
    name: z.string().nullable().describe("获奖学生姓名，以上游返回内容为准。"),
    rating: z.string().nullable().describe("奖学金评级，例如校内。"),
    ratingYear: z.string().nullable().describe("奖学金评级年度。"),
    scholarshipLevel: z.string().nullable().describe("奖学金获奖等级。"),
    scholarshipName: z.string().nullable().describe("奖学金奖项名称。"),
    updateTime: z.string().nullable().describe("奖学金记录更新时间。"),
});

export const SCHOLARSHIP_INFO_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的奖学金记录。"),
    data: z.object({
        count: z.number().nullable().describe("奖学金获奖数量。"),
        list: z
            .array(SCHOLARSHIP_INFO_SCHEMA)
            .describe("当前授权学生的奖学金记录列表。"),
    }),
    pagination: z.record(z.string()).optional(),
    source: z.literal("Tongji Open Platform").describe("奖学金数据来源。"),
});
