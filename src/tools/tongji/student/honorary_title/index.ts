import { HONORARY_TITLE_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStudentHonoraryTitles } from "../../../../integration/tongji_openapi";
import { readPagination, isRecord, readArray, readString, unwrapResponseData, } from "../../../utils";
import type { HonoraryTitle, HonoraryTitleData, } from "./types";
// HONORARY_TITLE_TOOL_NAME 表示学生荣誉称号查询工具名称。
export const HONORARY_TITLE_TOOL_NAME = "tongji.student.honorary_title";
// registerHonoraryTitleTool 注册学生荣誉称号查询工具。
export const registerHonoraryTitleTool = campusTool({
    audience: "student",
    name: HONORARY_TITLE_TOOL_NAME,
    title: "查询学生荣誉称号记录",
    description: "查询当前已授权学生获得荣誉称号的情况信息。",
    input: z.object({ sinceWid: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。"), sinceUpdateTime: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。") }).strict(),
    output: HONORARY_TITLE_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济荣誉称号服务返回异常，请稍后重试。", upstreamUnavailable: "同济荣誉称号服务暂时不可用，请稍后重试。" },
    query: (config, pagination) => {
        return getStudentHonoraryTitles({ ...config, pagination });
    },
    mapResponse: (response) => {
        const data = normalizeHonoraryTitleData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof HONORARY_TITLE_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            ...readPagination(response),
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeHonoraryTitleData 裁剪并规范化学生荣誉称号业务数据。
const normalizeHonoraryTitleData = (data: unknown): HonoraryTitleData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return {
            list: [],
        };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    return {
        list: readArray(data.list).map(normalizeHonoraryTitle),
    };
};
// normalizeHonoraryTitle 裁剪并规范化单条荣誉称号记录。
const normalizeHonoraryTitle = (title: unknown): HonoraryTitle => {
    const source = isRecord(title) ? title : {};
    return {
        deptName: readString(source.deptName),
        honorTitle: readString(source.honorTitle),
        name: readString(source.name),
        ratingYear: readString(source.ratingYear),
    };
};
