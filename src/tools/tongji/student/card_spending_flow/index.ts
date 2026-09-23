import { CARD_SPENDING_FLOW_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getCardSpendingFlow } from "../../../../integration/tongji_openapi";
import { isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { CardSpendingFlowData, CardSpendingFlowRecord, } from "./types";
// CARD_SPENDING_FLOW_TOOL_NAME 表示一卡通消费流水查询工具名称。
export const CARD_SPENDING_FLOW_TOOL_NAME = "tongji.student.card_spending_flow";
// registerCardSpendingFlowTool 注册一卡通消费流水查询工具。
export const registerCardSpendingFlowTool = campusTool({
    name: CARD_SPENDING_FLOW_TOOL_NAME,
    title: "查询一卡通消费流水",
    description: "查询当前已授权用户在指定时间范围内的一卡通历史消费流水信息。",
    input: z.object({
        tradeStartTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的交易开始时间，格式为 yyyy-MM-dd HH:mm:ss。"),
        tradeEndTime: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe("可选的交易结束时间，格式为 yyyy-MM-dd HH:mm:ss。"),
    }).strict(),
    output: CARD_SPENDING_FLOW_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济一卡通消费流水服务返回异常，请稍后重试。", upstreamUnavailable: "同济一卡通消费流水服务暂时不可用，请稍后重试。" },
    query: (config, { tradeStartTime, tradeEndTime }) => {
        return getCardSpendingFlow(config, tradeStartTime, tradeEndTime);
    },
    mapResponse: (response, { tradeStartTime, tradeEndTime }) => {
        const data = normalizeCardSpendingFlowData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof CARD_SPENDING_FLOW_OUTPUT_SCHEMA> = {
            status: data.userInfos.length === 0 ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
            ...(tradeStartTime ? { tradeStartTime } : {}),
            ...(tradeEndTime ? { tradeEndTime } : {}),
        };
        return result;
    },
}).register;
// normalizeCardSpendingFlowData 裁剪并规范化一卡通消费流水业务数据。
const normalizeCardSpendingFlowData = (data: unknown): CardSpendingFlowData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        userInfos: readArray(data.userInfos).map(normalizeCardSpendingFlowRecord),
    };
};
// normalizeCardSpendingFlowRecord 裁剪并规范化单条一卡通消费流水记录。
const normalizeCardSpendingFlowRecord = (record: unknown): CardSpendingFlowRecord => {
    const source = isRecord(record) ? record : {};
    return {
        campusAreaName: readString(source.campusAreaName),
        cardBalance: readNumber(source.cardBalance),
        mercName: readString(source.mercName),
        mercTypeName: readString(source.mercTypeName),
        name: readString(source.name),
        personTypeCode: readString(source.personTypeCode),
        restaurantName: readString(source.restaurantName),
        tradeAmount: readNumber(source.tradeAmount),
        tradeDateTime: readString(source.tradeDateTime),
    };
};
