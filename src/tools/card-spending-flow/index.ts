import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCardSpendingFlow } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    CardSpendingFlowData,
    CardSpendingFlowRecord,
    CardSpendingFlowToolResult,
} from "./types";

// CARD_SPENDING_FLOW_TOOL_NAME 表示一卡通消费流水查询工具名称。
export const CARD_SPENDING_FLOW_TOOL_NAME =
    "tongji.student.card_spending_flow";

// CARD_SPENDING_FLOW_RECORD_SCHEMA 表示单条一卡通消费流水记录的 MCP 输出结构。
const CARD_SPENDING_FLOW_RECORD_SCHEMA = z.object({
    campusAreaName: z
        .string()
        .nullable()
        .describe("消费发生的校区名称，例如四平校区。"),
    cardBalance: z
        .number()
        .nullable()
        .describe("本次消费完成后的一卡通卡内余额，单位元。"),
    mercName: z.string().nullable().describe("发生消费的具体商户或商铺名称。"),
    mercTypeName: z
        .string()
        .nullable()
        .describe("消费分类名称，例如食堂、超市或店铺。"),
    name: z.string().nullable().describe("消费人员姓名，以上游返回内容为准。"),
    personTypeCode: z.string().nullable().describe("消费人员的人员类型或身份标签。"),
    restaurantName: z
        .string()
        .nullable()
        .describe("餐厅名称；非食堂场景可能返回无。"),
    tradeAmount: z.number().nullable().describe("本次一卡通消费金额，单位元。"),
    tradeDateTime: z
        .string()
        .nullable()
        .describe("完整交易时间戳，用于按时间排序和查看详细账单。"),
});

// CARD_SPENDING_FLOW_OUTPUT_SCHEMA 表示一卡通消费流水查询的 MCP 输出结构。
const CARD_SPENDING_FLOW_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的一卡通消费流水。"),
    data: z.object({
        userInfos: z
            .array(CARD_SPENDING_FLOW_RECORD_SCHEMA)
            .describe("当前授权用户的一卡通消费流水记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("一卡通消费流水数据来源。"),
    tradeStartTime: z.string().optional().describe("本次查询指定的交易开始时间。"),
    tradeEndTime: z.string().optional().describe("本次查询指定的交易结束时间。"),
});

// registerCardSpendingFlowTool 注册一卡通消费流水查询工具。
export const registerCardSpendingFlowTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        CARD_SPENDING_FLOW_TOOL_NAME,
        {
            title: "查询一卡通消费流水",
            description:
                "查询当前已授权用户在指定时间范围内的一卡通历史消费流水信息。",
            inputSchema: {
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
            },
            outputSchema: CARD_SPENDING_FLOW_OUTPUT_SCHEMA,
        },
        async ({ tradeStartTime, tradeEndTime }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getCardSpendingFlow(
                    { accessToken },
                    tradeStartTime,
                    tradeEndTime,
                );
                const data = normalizeCardSpendingFlowData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济一卡通消费流水服务返回异常，请稍后重试。",
                    );
                }
                const result: CardSpendingFlowToolResult = {
                    status: data.userInfos.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    ...(tradeStartTime ? { tradeStartTime } : {}),
                    ...(tradeEndTime ? { tradeEndTime } : {}),
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "同济一卡通消费流水服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeCardSpendingFlowData 裁剪并规范化一卡通消费流水业务数据。
const normalizeCardSpendingFlowData = (
    data: unknown,
): CardSpendingFlowData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        userInfos: readArray(data.userInfos).map(
            normalizeCardSpendingFlowRecord,
        ),
    };
};

// normalizeCardSpendingFlowRecord 裁剪并规范化单条一卡通消费流水记录。
const normalizeCardSpendingFlowRecord = (
    record: unknown,
): CardSpendingFlowRecord => {
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
