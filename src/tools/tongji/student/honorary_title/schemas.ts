import { z } from "zod";

export const HONORARY_TITLE_SCHEMA = z.object({
    deptName: z.string().nullable().describe("所属学院名称"),
    honorTitle: z.string().nullable().describe("荣誉称号"),
    name: z.string().nullable().describe("获得荣誉称号学生姓名"),
    ratingYear: z.string().nullable().describe("评定学年"),
});

export const HONORARY_TITLE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的荣誉称号记录。"),
    data: z.object({
        list: z
            .array(HONORARY_TITLE_SCHEMA)
            .describe("当前授权学生的荣誉称号记录列表。"),
    }).describe("业务响应数据。"),
    pagination: z.record(z.string()).optional().describe("分页游标信息；沿用上游返回的游标字段进行后续查询。"),
    source: z.literal("Tongji Open Platform").describe("荣誉称号数据来源。"),
});
