import { SCHOLARSHIP_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStudentScholarshipInfo } from "../../../../integration/tongji_openapi";
import { readPagination, isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { ScholarshipInfo, ScholarshipInfoData, } from "./types";
// SCHOLARSHIP_INFO_TOOL_NAME 表示学生奖学金查询工具名称。
export const SCHOLARSHIP_INFO_TOOL_NAME = "tongji.student.scholarship_info";
// registerScholarshipInfoTool 注册学生奖学金查询工具。
export const registerScholarshipInfoTool = campusTool({
    audience: "student",
    name: SCHOLARSHIP_INFO_TOOL_NAME,
    title: "查询学生奖学金记录",
    description: "查询当前已授权学生获得奖学金的情况信息。",
    input: z.object({ sinceWid: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。"), sinceUpdateTime: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。") }).strict(),
    output: SCHOLARSHIP_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济奖学金服务返回异常，请稍后重试。", upstreamUnavailable: "同济奖学金服务暂时不可用，请稍后重试。" },
    query: (config, pagination) => {
        return getStudentScholarshipInfo({ ...config, pagination });
    },
    mapResponse: (response) => {
        const data = normalizeScholarshipInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof SCHOLARSHIP_INFO_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            ...readPagination(response),
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeScholarshipInfoData 裁剪并规范化学生奖学金业务数据。
const normalizeScholarshipInfoData = (data: unknown): ScholarshipInfoData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return {
            count: 0,
            list: [],
        };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    return {
        count: readNumber(data.count),
        list: readArray(data.list).map(normalizeScholarshipInfo),
    };
};
// normalizeScholarshipInfo 裁剪并规范化单条奖学金记录。
const normalizeScholarshipInfo = (info: unknown): ScholarshipInfo => {
    const source = isRecord(info) ? info : {};
    return {
        deptName: readString(source.deptName),
        name: readString(source.name),
        rating: readString(source.rating),
        ratingYear: readString(source.ratingYear),
        scholarshipLevel: readString(source.scholarshipLevel),
        scholarshipName: readString(source.scholarshipName),
        updateTime: readString(source.updateTime),
    };
};
