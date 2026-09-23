import { z } from "zod";

export const COURSE_SCORE_SCHEMA = z.object({
    courseCode: z.string().nullable().describe("课程代码。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    courseName: z.string().nullable().describe("课程名称。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    credit: z.number().nullable().describe("课程学分。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    gradePoint: z.number().nullable().describe("课程绩点。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    isPass: z.number().nullable().describe("是否及格，1 表示及格。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    isPassName: z.string().nullable().describe("是否及格的文字说明。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    publicCoursesName: z.string().nullable().describe("课程类型，例如必修。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    score: z.string().nullable().describe("课程成绩等级。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    scoreName: z.string().nullable().describe("课程成绩名称。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    updateTime: z.string().nullable().describe("成绩记录更新时间。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    year: z.string().nullable().describe("成绩所属学年。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
});

export const TERM_SCORE_SCHEMA = z.object({
    averagePoint: z.string().nullable().describe("本学期平均绩点。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    calName: z.string().nullable().describe("学期名称或编号。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    creditInfo: z.array(COURSE_SCORE_SCHEMA).describe("本学期课程成绩列表。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    termName: z.string().nullable().describe("学期完整名称。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    termcode: z
        .string()
        .nullable()
        .describe("学期代码，可作为 calendarId 使用。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
});

export const SCORE_TOOL_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的学期成绩。"),
    data: z.object({
        actualCredit: z.string().nullable().describe("全部学期已修总学分。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
        failingCourseCount: z
            .string()
            .nullable()
            .describe("全部学期不及格课程总数量。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
        failingCredits: z
            .string()
            .nullable()
            .describe("全部学期不及格课程总学分。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
        totalGradePoint: z.string().nullable().describe("全部学期平均绩点。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
        term: z.array(TERM_SCORE_SCHEMA).describe("按学期分组的成绩数据。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("成绩数据来源。"),
    calendarId: z.string().optional().describe("本次查询指定的学期编号。"),
});
