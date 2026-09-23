import { z } from "zod";

export const STIPEND_RECORD_SCHEMA = z.object({
    amount: z.number().nullable().describe("金额"),
    deptCode: z.string().nullable().describe("所属学院代码"),
    deptName: z.string().nullable().describe("所属学院名称"),
    name: z.string().nullable().describe("获得助学金学生姓名 获得助学金学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    rankName: z.string().nullable().describe("等级名称"),
    ratingTerm: z.string().nullable().describe("评定学期"),
    ratingYear: z.string().nullable().describe("评定学年"),
    stipendName: z.string().nullable().describe("助学金名称"),
    unitAbbreviation: z.string().nullable().describe("单位简称"),
    updateTime: z.string().nullable().describe("记录更新时间。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    userId: z.string().nullable().describe("获得助学金学生学号 获得助学金学生学号，已由上游做脱敏处理，不可用于身份验证。"),
    wid: z.string().nullable().describe("wid"),
});

export const STIPEND_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的助学金记录。"),
    data: z.object({
        records: z.array(STIPEND_RECORD_SCHEMA).describe("助学金记录列表。"),
    }).describe("业务响应数据。"),
    pagination: z.record(z.string()).optional().describe("分页游标信息；沿用上游返回的游标字段进行后续查询。"),
    source: z.literal("Tongji Open Platform").describe("助学金数据来源。"),
});
