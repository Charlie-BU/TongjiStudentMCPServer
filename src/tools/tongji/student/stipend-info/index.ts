import { STIPEND_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStipendInfo } from "../../../../integration/tongji_openapi";
import { readPagination, isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { StipendRecord, StipendInfoData, } from "./types";
// STIPEND_INFO_TOOL_NAME 表示助学金信息查询工具名称。
export const STIPEND_INFO_TOOL_NAME = "tongji.student.stipend-info";
// registerStipendInfoTool 注册助学金信息查询工具。
export const registerStipendInfoTool = campusTool({
    audience: "student",
    name: STIPEND_INFO_TOOL_NAME,
    title: "查询助学金信息",
    description: "查询当前已授权学生获得的助学金记录，返回助学金名称、金额、等级、评定学年及学期等信息。",
    input: z.object({ sinceWid: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。"), sinceUpdateTime: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。") }).strict(),
    output: STIPEND_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济助学金服务返回异常，请稍后重试。", upstreamUnavailable: "同济助学金服务暂时不可用，请稍后重试。" },
    query: (config, pagination) => {
        return getStipendInfo({ ...config, pagination });
    },
    mapResponse: (response) => {
        const data = normalizeStipendInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof STIPEND_INFO_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            ...readPagination(response),
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeStipendInfoData 裁剪并规范化助学金业务数据。
const normalizeStipendInfoData = (data: unknown): StipendInfoData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return { records: [] };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    const records = (data.list as unknown[]).map(normalizeStipendRecord);
    return { records };
};
// normalizeStipendRecord 裁剪并规范化单条助学金记录。
const normalizeStipendRecord = (item: unknown): StipendRecord => {
    const source = isRecord(item) ? item : {};
    return {
        amount: readNumber(source.amount),
        deptCode: readString(source.deptCode),
        deptName: readString(source.deptName),
        name: readString(source.name),
        rankName: readString(source.rankName),
        ratingTerm: readString(source.ratingTerm),
        ratingYear: readString(source.ratingYear),
        stipendName: readString(source.stipendName),
        unitAbbreviation: readString(source.unitAbbreviation),
        updateTime: readString(source.updateTime),
        userId: readString(source.userId),
        wid: readString(source.wid),
    };
};
// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: StipendInfoData): boolean => data.records.length === 0;
