import { COMPETITION_PRIZE_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getCompetitionPrizes } from "../../../../integration/tongji_openapi";
import { readPagination, isRecord, readArray, readString, unwrapResponseData, } from "../../../utils";
import type { CompetitionPrize, CompetitionPrizeData, } from "./types";
// COMPETITION_PRIZE_TOOL_NAME 表示本科生竞赛奖励查询工具名称。
export const COMPETITION_PRIZE_TOOL_NAME = "tongji.bachelor.competition_prize";
// registerCompetitionPrizeTool 注册本科生竞赛奖励查询工具。
export const registerCompetitionPrizeTool = campusTool({
    audience: "bachelor",
    name: COMPETITION_PRIZE_TOOL_NAME,
    title: "查询本科生竞赛奖励记录",
    description: "查询当前已授权本科生的竞赛获奖与奖励记录。",
    input: z.object({ sinceUserId: z.string().trim().min(1).optional().describe("上次结果的分页游标或更新时间，不改变当前用户范围。") }).strict(),
    output: COMPETITION_PRIZE_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济竞赛奖励服务返回异常，请稍后重试。", upstreamUnavailable: "同济竞赛奖励服务暂时不可用，请稍后重试。" },
    query: (config, pagination) => {
        return getCompetitionPrizes({ ...config, pagination });
    },
    mapResponse: (response) => {
        const data = normalizeCompetitionPrizeData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof COMPETITION_PRIZE_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            ...readPagination(response),
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeCompetitionPrizeData 裁剪并规范化本科生竞赛奖励业务数据。
const normalizeCompetitionPrizeData = (data: unknown): CompetitionPrizeData | undefined => {
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
        list: readArray(data.list).map(normalizeCompetitionPrize),
    };
};
// normalizeCompetitionPrize 裁剪并规范化单条竞赛奖励记录。
const normalizeCompetitionPrize = (prize: unknown): CompetitionPrize => {
    const source = isRecord(prize) ? prize : {};
    return {
        awardCategory: readString(source.awardCategory),
        awardDate: readString(source.awardDate),
        awardLevel: readString(source.awardLevel),
        competitionLevel: readString(source.competitionLevel),
        competitionName: readString(source.competitionName),
        deptName: readString(source.deptName),
        name: readString(source.name),
        schoolYear: readString(source.schoolYear),
    };
};
