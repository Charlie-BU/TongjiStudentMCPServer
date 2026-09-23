import { z } from "zod";

export const HONORARY_TITLE_SCHEMA = z.object({
    deptName: z.string().nullable().describe("获奖人所属学院或部门名称。"),
    honorTitle: z.string().nullable().describe("荣誉称号或奖项名称。"),
    name: z.string().nullable().describe("获奖人姓名，以上游返回内容为准。"),
    ratingYear: z.string().nullable().describe("荣誉称号或奖项的评定年份。"),
});

export const HONORARY_TITLE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的荣誉称号记录。"),
    data: z.object({
        list: z
            .array(HONORARY_TITLE_SCHEMA)
            .describe("当前授权学生的荣誉称号记录列表。"),
    }),
    pagination: z.record(z.string()).optional(),
    source: z.literal("Tongji Open Platform").describe("荣誉称号数据来源。"),
});
