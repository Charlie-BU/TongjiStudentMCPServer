import { z } from "zod";

export const CET_SCORE_RECORD_SCHEMA = z.object({
    studentId: z.string().nullable().describe("学生ID，已由上游做脱敏处理，不可用于身份验证。"),
    studentName: z.string().nullable().describe("学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    competitionType: z.string().nullable().describe("竞赛类型。"),
    writtenSubjectName: z.string().nullable().describe("考试科目名称，例如（2）英语六级笔试。"),
    cardNo: z.string().nullable().describe("准考证号，已由上游做脱敏处理，不可用于身份验证。"),
    score: z.string().nullable().describe("笔试成绩。"),
    scoreRank: z.string().nullable().describe("分数排名。"),
    oralScore: z.string().nullable().describe("口语成绩。"),
    examTime: z.string().nullable().describe("考试时间。"),
    cetType: z.number().nullable().describe("CET 类型，1 表示四级，2 表示六级。"),
});

export const CET_SCORE_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的四六级成绩。"),
    data: z.object({
        records: z.array(CET_SCORE_RECORD_SCHEMA).describe("四六级考试成绩记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("四六级成绩数据来源。"),
});
