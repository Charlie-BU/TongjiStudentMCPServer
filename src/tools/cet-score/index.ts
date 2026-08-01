
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCetScores } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    CetScoreRecord,
    CetScoreData,
    CetScoreToolResult,
} from "./types";

// CET_SCORE_TOOL_NAME 表示四六级成绩查询工具名称。
export const CET_SCORE_TOOL_NAME = "tongji.student.cet-score";

// CetScoreToolStatus 表示四六级成绩查询的结果状态。
// CetScoreData 表示四六级成绩的脱敏业务数据。
// CetScoreToolResult 表示四六级成绩查询的结构化结果。
// CET_SCORE_RECORD_SCHEMA 表示单条四六级成绩的 MCP 输出结构。
const CET_SCORE_RECORD_SCHEMA = z.object({
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

// CET_SCORE_OUTPUT_SCHEMA 表示四六级成绩查询的 MCP 输出结构。
const CET_SCORE_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的四六级成绩。"),
    data: z.object({
        records: z.array(CET_SCORE_RECORD_SCHEMA).describe("四六级考试成绩记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("四六级成绩数据来源。"),
});

// registerCetScoreTool 注册四六级成绩查询工具。
export const registerCetScoreTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        CET_SCORE_TOOL_NAME,
        {
            title: "查询四六级成绩",
            description:
                "查询当前已授权学生的全国大学英语四六级考试成绩（CET-4 / CET-6），返回考试科目、准考证号、笔试成绩、口语成绩和考试时间。",
            inputSchema: {},
            outputSchema: CET_SCORE_OUTPUT_SCHEMA,
        },
        async () => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getCetScores(
                    { accessToken },
                );
                const data = normalizeCetScoreData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济四六级成绩服务返回异常，请稍后重试。",
                    );
                }
                const result: CetScoreToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error, { unauthorized: "同济账号授权无效或已过期，请重新完成授权后再试。", upstreamUnavailable: "同济四六级成绩服务暂时不可用，请稍后重试。" });
            }
        },
    );
};

// normalizeCetScoreData 裁剪并规范化四六级成绩业务数据。
const normalizeCetScoreData = (data: unknown): CetScoreData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return { records: [] };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    const records = (data.list as unknown[]).map(normalizeCetScoreRecord);
    return { records };
};

// normalizeCetScoreRecord 裁剪并规范化单条四六级成绩。
const normalizeCetScoreRecord = (item: unknown): CetScoreRecord => {
    const source = isRecord(item) ? item : {};
    return {
        studentId: readString(source.studentId),
        studentName: readString(source.studentName),
        competitionType: readString(source.competitionType),
        writtenSubjectName: readString(source.writtenSubjectName),
        cardNo: readString(source.cardNo),
        score: readString(source.score),
        scoreRank: readString(source.scoreRank),
        oralScore: readString(source.oralScore),
        examTime: readString(source.examTime),
        cetType: readNumber(source.cetType),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: CetScoreData): boolean =>
    data.records.length === 0;

