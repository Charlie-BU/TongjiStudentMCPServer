import { SCORE_TOOL_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getUndergraduateScores } from "../../../../integration/tongji_openapi";
import type { CourseScore, TermScore, UndergraduateScoreData, } from "./types";
import { isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
// UNDERGRADUATE_SCORE_TOOL_NAME 表示本科生成绩查询工具名称。
export const UNDERGRADUATE_SCORE_TOOL_NAME = "tongji.bachelor.score";
// registerUndergraduateScoreTool 注册本科生成绩查询工具。
export const registerUndergraduateScoreTool = campusTool({
    audience: "bachelor",
    name: UNDERGRADUATE_SCORE_TOOL_NAME,
    title: "查询本科生成绩",
    description: "查询当前已授权本科生在指定学期的成绩；不传 calendarId 时查询当前学期。",
    input: z.object({
        calendarId: z
            .preprocess((value) => typeof value === "number" ? String(value) : value, z.string().trim().regex(/^-?\d+$/))
            .optional()
            .describe("可选的学期编号；支持字符串或整数，不传时由同济开放平台查询当前学期。"),
    }).strict(),
    output: SCORE_TOOL_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济成绩服务返回异常，请稍后重试。", upstreamUnavailable: "同济成绩服务暂时不可用，请稍后重试。" },
    query: (config, { calendarId }) => {
        return getUndergraduateScores(config, calendarId);
    },
    mapResponse: (response, { calendarId }) => {
        const data = normalizeScoreData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof SCORE_TOOL_OUTPUT_SCHEMA> = {
            status: isTermDataEmpty(data) ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
            ...(calendarId ? { calendarId } : {}),
        };
        return result;
    },
}).register;
// normalizeScoreData 裁剪并规范化本科成绩业务数据。
const normalizeScoreData = (data: unknown): UndergraduateScoreData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.term === null) {
        return {
            actualCredit: null,
            failingCourseCount: null,
            failingCredits: null,
            totalGradePoint: null,
            term: [],
        };
    }
    if (!Array.isArray(data.term)) {
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
// isTermDataEmpty 判断业务数据是否为空。
const isTermDataEmpty = (data: UndergraduateScoreData): boolean => data.term.length === 0;
