import { z } from "zod";

export const TERM_CALENDAR_SCHEMA = z.object({
    id: z.number().nullable().describe("学期记录ID。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    year: z.number().nullable().describe("学年起始年份。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    term: z.number().nullable().describe("学期编号，1 表示第一学期，2 表示第二学期。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    beginDay: z.number().nullable().describe("学期开始日期（Unix 时间戳，毫秒）。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    endDay: z.number().nullable().describe("学期结束日期（Unix 时间戳，毫秒）。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    weekNum: z.number().nullable().describe("该学期包含的教学周数。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    weekBenginDay: z.number().nullable().describe("每周起始日（1=周日，2=周一）。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    gradePartOne: z.string().nullable().describe("学年第一部分，例如 2021。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    gradePartTwo: z.string().nullable().describe("学年第二部分，例如 2022。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    fullName: z.string().nullable().describe("学期完整名称，例如 2021-2022学年第2学期。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    currentTermFlag: z.boolean().nullable().describe("是否为当前学期标识，true 表示是。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    nextTermFlag: z.boolean().nullable().describe("是否为下一学期标识，false 表示否。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    perTerm: z.string().nullable().describe("学期部分名称，例如 第2学期。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    perYear: z.string().nullable().describe("学年部分名称，例如 2021-2022学年。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
});

export const TERM_CALENDAR_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的学期日历。"),
    data: z.object({
        terms: z.array(TERM_CALENDAR_SCHEMA).describe("全部学期日历列表。"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("学期日历数据来源。"),
});
