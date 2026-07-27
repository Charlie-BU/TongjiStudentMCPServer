import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUndergraduateScores } from "../integration/tongji_openapi";
import type { ToolRegistrationContext } from "./registry";

// UNDERGRADUATE_SCORE_TOOL_NAME 表示本科生成绩查询工具名称。
export const UNDERGRADUATE_SCORE_TOOL_NAME = "tongji.student.score";

// ScoreToolStatus 表示本科生成绩查询的结果状态。
type ScoreToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// CourseScore 表示单门课程的成绩信息。
interface CourseScore {
    courseCode: string | null;
    courseName: string | null;
    credit: number | null;
    gradePoint: number | null;
    isPass: number | null;
    isPassName: string | null;
    publicCoursesName: string | null;
    score: string | null;
    scoreName: string | null;
    updateTime: string | null;
    year: string | null;
}

// TermScore 表示单个学期的成绩汇总。
interface TermScore {
    averagePoint: string | null;
    calName: string | null;
    creditInfo: CourseScore[];
    termName: string | null;
    termcode: string | null;
}

// UndergraduateScoreData 表示本科成绩的脱敏业务数据。
interface UndergraduateScoreData {
    actualCredit: string | null;
    failingCourseCount: string | null;
    failingCredits: string | null;
    totalGradePoint: string | null;
    term: TermScore[];
}

// ScoreToolResult 表示本科生成绩查询的结构化结果。
interface ScoreToolResult {
    [key: string]: unknown;
    status: ScoreToolStatus;
    data: UndergraduateScoreData;
    source: "Tongji Open Platform";
    calendarId?: string;
}

// COURSE_SCORE_SCHEMA 表示单门课程成绩的 MCP 输出结构。
const COURSE_SCORE_SCHEMA = z.object({
    courseCode: z.string().nullable().describe("课程代码。"),
    courseName: z.string().nullable().describe("课程名称。"),
    credit: z.number().nullable().describe("课程学分。"),
    gradePoint: z.number().nullable().describe("课程绩点。"),
    isPass: z.number().nullable().describe("是否及格，1 表示及格。"),
    isPassName: z.string().nullable().describe("是否及格的文字说明。"),
    publicCoursesName: z.string().nullable().describe("课程类型，例如必修。"),
    score: z.string().nullable().describe("课程成绩等级。"),
    scoreName: z.string().nullable().describe("课程成绩名称。"),
    updateTime: z.string().nullable().describe("成绩记录更新时间。"),
    year: z.string().nullable().describe("成绩所属学年。"),
});

// TERM_SCORE_SCHEMA 表示单个学期成绩的 MCP 输出结构。
const TERM_SCORE_SCHEMA = z.object({
    averagePoint: z.string().nullable().describe("本学期平均绩点。"),
    calName: z.string().nullable().describe("学期名称或编号。"),
    creditInfo: z.array(COURSE_SCORE_SCHEMA).describe("本学期课程成绩列表。"),
    termName: z.string().nullable().describe("学期完整名称。"),
    termcode: z.string().nullable().describe("学期代码，可作为 calendarId 使用。"),
});

// SCORE_TOOL_OUTPUT_SCHEMA 表示本科生成绩查询的 MCP 输出结构。
const SCORE_TOOL_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的学期成绩。"),
    data: z.object({
        actualCredit: z.string().nullable().describe("全部学期已修总学分。"),
        failingCourseCount: z.string().nullable().describe("全部学期不及格课程总数量。"),
        failingCredits: z.string().nullable().describe("全部学期不及格课程总学分。"),
        totalGradePoint: z.string().nullable().describe("全部学期平均绩点。"),
        term: z.array(TERM_SCORE_SCHEMA).describe("按学期分组的成绩数据。"),
    }),
    source: z.literal("Tongji Open Platform").describe("成绩数据来源。"),
    calendarId: z.string().optional().describe("本次查询指定的学期编号。"),
});

// registerUndergraduateScoreTool 注册本科生成绩查询工具。
export const registerUndergraduateScoreTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        UNDERGRADUATE_SCORE_TOOL_NAME,
        {
            title: "查询本科生成绩",
            description:
                "查询当前已授权本科生在指定学期的成绩；不传 calendarId 时查询当前学期。",
            inputSchema: {
                calendarId: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe(
                        "可选的学期编号；不传时由同济开放平台查询当前学期。",
                    ),
            },
            outputSchema: SCORE_TOOL_OUTPUT_SCHEMA,
        },
        async ({ calendarId }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getUndergraduateScores(
                    { accessToken },
                    calendarId,
                );
                const data = normalizeScoreData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济成绩服务返回异常，请稍后重试。",
                    );
                }
                const result: ScoreToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    ...(calendarId ? { calendarId } : {}),
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

// normalizeScoreData 裁剪并规范化本科成绩业务数据。
const normalizeScoreData = (data: unknown): UndergraduateScoreData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.term)) {
        return undefined;
    }
    const source = data;
    return {
        actualCredit: readString(source.actualCredit),
        failingCourseCount: readString(source.failingCourseCount),
        failingCredits: readString(source.failingCredits),
        totalGradePoint: readString(source.totalGradePoint),
        term: readArray(source.term).map(normalizeTermScore),
    };
};

// normalizeTermScore 裁剪并规范化单个学期成绩。
const normalizeTermScore = (term: unknown): TermScore => {
    const source = isRecord(term) ? term : {};
    return {
        averagePoint: readString(source.averagePoint),
        calName: readString(source.calName),
        creditInfo: readArray(source.creditInfo).map(normalizeCourseScore),
        termName: readString(source.termName),
        termcode: readString(source.termcode),
    };
};

// normalizeCourseScore 裁剪并规范化单门课程成绩。
const normalizeCourseScore = (course: unknown): CourseScore => {
    const source = isRecord(course) ? course : {};
    return {
        courseCode: readString(source.courseCode),
        courseName: readString(source.courseName),
        credit: readNumber(source.credit),
        gradePoint: readNumber(source.gradePoint),
        isPass: readNumber(source.isPass),
        isPassName: readString(source.isPassName),
        publicCoursesName: readString(source.publicCoursesName),
        score: readString(source.score),
        scoreName: readString(source.scoreName),
        updateTime: readString(source.updateTime),
        year: readString(source.year),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: UndergraduateScoreData): boolean =>
    data.term.length === 0;

// readArray 读取数组字段。
const readArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];

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
        "同济成绩服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果。
const createErrorResult = (
    status: Exclude<ScoreToolStatus, "ok" | "empty">,
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
