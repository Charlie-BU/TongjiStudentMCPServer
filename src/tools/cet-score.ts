import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCetScores } from "../integration/tongji_openapi";
import type { ToolRegistrationContext } from "./registry";

// CET_SCORE_TOOL_NAME 表示四六级成绩查询工具名称。
export const CET_SCORE_TOOL_NAME = "tongji.student.cet-score";

// CetScoreToolStatus 表示四六级成绩查询的结果状态。
type CetScoreToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// CetScoreRecord 表示单条四六级考试成绩。
interface CetScoreRecord {
    studentId: string | null;
    studentName: string | null;
    competitionType: string | null;
    writtenSubjectName: string | null;
    cardNo: string | null;
    score: string | null;
    scoreRank: string | null;
    oralScore: string | null;
    examTime: string | null;
    cetType: number | null;
}

// CetScoreData 表示四六级成绩的脱敏业务数据。
interface CetScoreData {
    records: CetScoreRecord[];
}

// CetScoreToolResult 表示四六级成绩查询的结构化结果。
interface CetScoreToolResult {
    [key: string]: unknown;
    status: CetScoreToolStatus;
    data: CetScoreData;
    source: "Tongji Open Platform";
}

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
                return toErrorResult(error);
            }
        },
    );
};

// unwrapResponseData 提取上游响应中的业务数据。
const unwrapResponseData = (response: unknown): unknown => {
    if (isRecord(response) && "data" in response) {
        return response.data;
    }
    return response;
};

// normalizeCetScoreData 裁剪并规范化四六级成绩业务数据。
const normalizeCetScoreData = (data: unknown): CetScoreData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.list)) {
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

// readString 读取字符串字段。
const readString = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return null;
};

// readNumber 读取数值字段。
const readNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }
    return null;
};

// toErrorResult 将上游错误转换为 MCP 工具错误结果。
const toErrorResult = (error: unknown) => {
    if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
    ) {
        return createErrorResult(
            "unauthorized",
            "同济账号授权无效或已过期，请重新完成授权后再试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        "同济四六级成绩服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果。
const createErrorResult = (
    status: Exclude<CetScoreToolStatus, "ok" | "empty">,
    message: string,
) => ({
    isError: true,
    content: [
        { type: "text" as const, text: JSON.stringify({ status, message }) },
    ],
});

// isRecord 判断值是否为对象记录。
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
