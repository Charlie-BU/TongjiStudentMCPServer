import { CET_SCORE_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getCetScores } from "../../../../integration/tongji_openapi";
import { isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { CetScoreRecord, CetScoreData, } from "./types";
// CET_SCORE_TOOL_NAME 表示四六级成绩查询工具名称。
export const CET_SCORE_TOOL_NAME = "tongji.student.cet-score";
// registerCetScoreTool 注册四六级成绩查询工具。
export const registerCetScoreTool = campusTool({
    name: CET_SCORE_TOOL_NAME,
    title: "查询四六级成绩",
    description: "查询当前已授权学生的全国大学英语四六级考试成绩（CET-4 / CET-6），返回考试科目、准考证号、笔试成绩、口语成绩和考试时间。",
    input: z.object({}).strict(),
    output: CET_SCORE_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济四六级成绩服务返回异常，请稍后重试。", upstreamUnavailable: "同济四六级成绩服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getCetScores(config);
    },
    mapResponse: (response) => {
        const data = normalizeCetScoreData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof CET_SCORE_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
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
const isEmptyData = (data: CetScoreData): boolean => data.records.length === 0;
