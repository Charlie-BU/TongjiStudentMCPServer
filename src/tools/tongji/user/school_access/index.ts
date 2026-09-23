import { SCHOOL_ACCESS_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getSchoolAccess } from "../../../../integration/tongji_openapi";
import { readCursor, isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { SchoolAccessData, SchoolAccessRecord, } from "./types";
// SCHOOL_ACCESS_TOOL_NAME 表示校门通行记录查询工具名称。
export const SCHOOL_ACCESS_TOOL_NAME = "tongji.user.school_access";
// registerSchoolAccessTool 注册校门通行记录查询工具。
export const registerSchoolAccessTool = campusTool({
    audience: "user",
    name: SCHOOL_ACCESS_TOOL_NAME,
    title: "查询校门通行记录",
    description: "查询当前已授权用户在指定时间范围内的校门进出通行记录。",
    input: z.object({
        sinceCardRecordID: z.string().trim().min(1).optional().describe("上次响应返回的游标，用于查询下一页。"),
        portNum: z
            .enum(["1", "2", "入门", "出门"])
            .optional()
            .describe("可选的进出状态；不传时查询全部通行记录。"),
        dataStartTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"),
        dataEndTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"),
    }).strict(),
    output: SCHOOL_ACCESS_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济校门通行服务返回异常，请稍后重试。", upstreamUnavailable: "同济校门通行服务暂时不可用，请稍后重试。" },
    query: (config, { portNum, dataStartTime, dataEndTime, sinceCardRecordID }) => {
        return getSchoolAccess(config, portNum, dataStartTime, dataEndTime, sinceCardRecordID);
    },
    mapResponse: (response, { portNum, dataStartTime, dataEndTime, sinceCardRecordID }) => {
        const data = normalizeSchoolAccessData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof SCHOOL_ACCESS_OUTPUT_SCHEMA> = {
            status: data.userInfos.length === 0 ? "empty" : "ok",
            data,
            ...readCursor(response, "sinceCardRecordID"),
            source: "Tongji Open Platform",
            ...(portNum ? { portNum } : {}),
            ...(dataStartTime ? { dataStartTime } : {}),
            ...(dataEndTime ? { dataEndTime } : {}),
        };
        return result;
    },
}).register;
// normalizeSchoolAccessData 裁剪并规范化校门通行业务数据。
const normalizeSchoolAccessData = (data: unknown): SchoolAccessData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        count: readNumber(data.count),
        userInfos: readArray(data.userInfos).map(normalizeSchoolAccessRecord),
    };
};
// normalizeSchoolAccessRecord 裁剪并规范化单条校门通行记录。
const normalizeSchoolAccessRecord = (record: unknown): SchoolAccessRecord => {
    const source = isRecord(record) ? record : {};
    return {
        dataTime: readString(source.recordTime ?? source.dataTime),
        deptName: readString(source.deptName),
        equptName: readString(source.equptName),
        lctnName: readString(source.lctnName),
        name: readString(source.name),
        portNum: readString(source.portNum),
        sex: readString(source.sex),
    };
};
