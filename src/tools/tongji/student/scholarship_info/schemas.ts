import { z } from "zod";

export const SCHOLARSHIP_INFO_SCHEMA = z.object({
    deptName: z.string().nullable().describe("所属学院名称"),
    name: z.string().nullable().describe("获得奖学金学生姓名"),
    rating: z.string().nullable().describe("评定等级"),
    ratingYear: z.string().nullable().describe("评定学年"),
    scholarshipLevel: z.string().nullable().describe("奖学金级别"),
    scholarshipName: z.string().nullable().describe("奖学金名称"),
    updateTime: z.string().nullable().describe("奖学金记录更新时间。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
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
    }).describe("业务响应数据。"),
    pagination: z.record(z.string()).optional().describe("分页游标信息；沿用上游返回的游标字段进行后续查询。"),
    source: z.literal("Tongji Open Platform").describe("奖学金数据来源。"),
});
