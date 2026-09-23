import { ACCOMMODATION_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getAccommodationInfo } from "../../../../integration/tongji_openapi";
import { readPagination, isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { AccommodationRecord, AccommodationInfoData, } from "./types";
// ACCOMMODATION_INFO_TOOL_NAME 表示住宿信息查询工具名称。
export const ACCOMMODATION_INFO_TOOL_NAME = "tongji.student.accommodation-info";
// registerAccommodationInfoTool 注册住宿信息查询工具。
export const registerAccommodationInfoTool = campusTool({
    name: ACCOMMODATION_INFO_TOOL_NAME,
    title: "查询住宿信息",
    description: "查询当前已授权学生的住宿信息，返回宿舍楼、宿舍区、楼层、房间号及所属学院等信息。",
    input: z.object({ sinceUserId: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。"), sinceUpdateTime: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。") }).strict(),
    output: ACCOMMODATION_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济住宿信息服务返回异常，请稍后重试。", upstreamUnavailable: "同济住宿信息服务暂时不可用，请稍后重试。" },
    query: (config, pagination) => {
        return getAccommodationInfo({ ...config, pagination });
    },
    mapResponse: (response) => {
        const data = normalizeAccommodationInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof ACCOMMODATION_INFO_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            ...readPagination(response),
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeAccommodationInfoData 裁剪并规范化住宿业务数据。
const normalizeAccommodationInfoData = (data: unknown): AccommodationInfoData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return { records: [] };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    const records = (data.list as unknown[]).map(normalizeAccommodationRecord);
    return { records };
};
// normalizeAccommodationRecord 裁剪并规范化单条住宿记录。
const normalizeAccommodationRecord = (item: unknown): AccommodationRecord => {
    const source = isRecord(item) ? item : {};
    return {
        accomBuildingCode: readString(source.accomBuildingCode),
        accomBuildingName: readString(source.accomBuildingName),
        accomRegionCode: readString(source.accomRegionCode),
        accomRegionName: readString(source.accomRegionName),
        deptCode: readString(source.deptCode),
        deptName: readString(source.deptName),
        floor: readString(source.floor),
        name: readString(source.name),
        roomNo: readString(source.roomNo),
        userId: readString(source.userId),
        usertypeCode: readString(source.usertypeCode),
        usertypeName: readString(source.usertypeName),
    };
};
// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: AccommodationInfoData): boolean => data.records.length === 0;
