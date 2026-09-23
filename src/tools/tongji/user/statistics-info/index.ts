import { STATISTICS_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStatisticsInfo } from "../../../../integration/tongji_openapi";
import { isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { StatisticsRecord, StatisticsInfoData, } from "./types";
// STATISTICS_INFO_TOOL_NAME 表示个人统计数据查询工具名称。
export const STATISTICS_INFO_TOOL_NAME = "tongji.user.statistics-info";
// registerStatisticsInfoTool 注册个人统计数据查询工具。
export const registerStatisticsInfoTool = campusTool({
    audience: "user",
    name: STATISTICS_INFO_TOOL_NAME,
    title: "查询个人统计数据",
    description: "查询当前已授权用户的校园生活统计数据，包括图书馆使用、食堂消费、校车乘坐、超市购物、奖学金及校园卡使用等维度。",
    input: z.object({}).strict(),
    output: STATISTICS_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济个人统计服务返回异常，请稍后重试。", upstreamUnavailable: "同济个人统计服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getStatisticsInfo(config);
    },
    mapResponse: (response) => {
        const data = normalizeStatisticsInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof STATISTICS_INFO_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeStatisticsInfoData 裁剪并规范化个人统计业务数据。
const normalizeStatisticsInfoData = (data: unknown): StatisticsInfoData | undefined => {
    if (data === null) {
        return { records: [] };
    }
    if (!Array.isArray(data)) {
        return undefined;
    }
    const records = (data as unknown[]).map(normalizeStatisticsRecord);
    return { records };
};
// normalizeStatisticsRecord 裁剪并规范化单条个人统计记录。
const normalizeStatisticsRecord = (item: unknown): StatisticsRecord => {
    const source = isRecord(item) ? item : {};
    return {
        bookCategory: readString(source.bookCategory),
        bookCoun: readNumber(source.bookCoun),
        bookFirst: readString(source.bookFirst),
        canteenAmount: readNumber(source.canteenAmount),
        canteenAmtPercentileRank: readNumber(source.canteenAmtPercentileRank),
        canteenCoun: readNumber(source.canteenCoun),
        canteenOften: readString(source.canteenOften),
        canteenOftenPercentileRank: readNumber(source.canteenOftenPercentileRank),
        cardPelaceCoun: readNumber(source.cardPelaceCoun),
        college: readString(source.college),
        consumMostAmount: readNumber(source.consumMostAmount),
        consumMostTime: readString(source.consumMostTime),
        consumePlaceOften: readString(source.consumePlaceOften),
        consumeTotal: readNumber(source.consumeTotal),
        consumeTotalPercentileRank: readNumber(source.consumeTotalPercentileRank),
        earlistTime: readString(source.earlistTime),
        entYear: readNumber(source.entYear),
        entranceCoun: readNumber(source.entranceCoun),
        firstCardPlaceTime: readString(source.firstCardPlaceTime),
        gender: readString(source.gender),
        latestTime: readString(source.latestTime),
        major: readString(source.major),
        marketAmount: readNumber(source.marketAmount),
        rechargeTimeSlot: readString(source.rechargeTimeSlot),
        rideCoun: readNumber(source.rideCoun),
        scholarshipCoun: readNumber(source.scholarshipCoun),
        sname: readString(source.sname),
        stayTime: readNumber(source.stayTime),
        stayTimePercentileRank: readNumber(source.stayTimePercentileRank),
        stayYear: readNumber(source.stayYear),
        stuLevel: readString(source.stuLevel),
        userId: readString(source.userId),
    };
};
// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: StatisticsInfoData): boolean => data.records.length === 0;
