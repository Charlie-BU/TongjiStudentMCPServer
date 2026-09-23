import { LIBRARY_ACCESS_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getLibraryAccess } from "../../../../integration/tongji_openapi";
import { readCursor, isRecord, readArray, readString, unwrapResponseData, } from "../../../utils";
import type { LibraryAccessData, LibraryAccessRecord, } from "./types";
// LIBRARY_ACCESS_TOOL_NAME 表示图书馆通行记录查询工具名称。
export const LIBRARY_ACCESS_TOOL_NAME = "tongji.student.library_access";
// registerLibraryAccessTool 注册图书馆通行记录查询工具。
export const registerLibraryAccessTool = campusTool({
    name: LIBRARY_ACCESS_TOOL_NAME,
    title: "查询图书馆通行记录",
    description: "查询当前已授权学生在指定时间范围内的图书馆闸机进出记录。",
    input: z.object({
        dataStartTime: z.string().trim().min(1).optional().describe("开始时间，yyyy-MM-dd HH:mm:ss；优先使用此字段。"),
        dataEndTime: z.string().trim().min(1).optional().describe("结束时间，yyyy-MM-dd HH:mm:ss；优先使用此字段。"),
        sinceVisitNo: z.string().trim().min(1).optional().describe("上次响应返回的游标，用于查询下一页。"),
        direction: z
            .preprocess((value) => typeof value === "number" ? String(value) : value, z.enum(["1", "2"]))
            .optional()
            .describe("可选的进出方向；支持字符串或整数，1 表示进，2 表示出；不传时查询全部。"),
        visitStartTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"),
        visitEndTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"),
    }).strict(),
    output: LIBRARY_ACCESS_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济图书馆通行服务返回异常，请稍后重试。", upstreamUnavailable: "同济图书馆通行服务暂时不可用，请稍后重试。" },
    validate: ({ dataStartTime, dataEndTime, visitStartTime, visitEndTime }) => (dataStartTime && visitStartTime && dataStartTime !== visitStartTime) || (dataEndTime && visitEndTime && dataEndTime !== visitEndTime)
        ? "新旧时间参数不一致，请只使用 dataStartTime/dataEndTime。" : undefined,
    query: (config, { direction, dataStartTime, dataEndTime, visitStartTime: legacyStart, visitEndTime: legacyEnd, sinceVisitNo }) => {
        const visitStartTime = dataStartTime ?? legacyStart;
        const visitEndTime = dataEndTime ?? legacyEnd;
        return getLibraryAccess(config, direction, visitStartTime, visitEndTime, sinceVisitNo);
    },
    mapResponse: (response, { direction, dataStartTime, dataEndTime, visitStartTime: legacyStart, visitEndTime: legacyEnd, sinceVisitNo }) => {
        const visitStartTime = dataStartTime ?? legacyStart;
        const visitEndTime = dataEndTime ?? legacyEnd;
        const data = normalizeLibraryAccessData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof LIBRARY_ACCESS_OUTPUT_SCHEMA> = {
            status: data.userInfos.length === 0 ? "empty" : "ok",
            data,
            ...readCursor(response, "sinceVisitNo"),
            source: "Tongji Open Platform",
            ...(direction ? { direction } : {}),
            ...(visitStartTime ? { visitStartTime } : {}),
            ...(visitEndTime ? { visitEndTime } : {}),
        };
        return result;
    },
}).register;
// normalizeLibraryAccessData 裁剪并规范化图书馆通行业务数据。
const normalizeLibraryAccessData = (data: unknown): LibraryAccessData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        userInfos: readArray(data.userInfos).map(normalizeLibraryAccessRecord),
    };
};
// normalizeLibraryAccessRecord 裁剪并规范化单条图书馆通行记录。
const normalizeLibraryAccessRecord = (record: unknown): LibraryAccessRecord => {
    const source = isRecord(record) ? record : {};
    return {
        deptName: readString(source.deptName),
        direction: readString(source.direction),
        door: readString(source.door),
        libPlace: readString(source.libPlace),
        name: readString(source.name),
        type: readString(source.type),
        visitTime: readString(source.visitTime),
    };
};
