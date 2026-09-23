import { z } from "zod";

export const CARD_SPENDING_FLOW_RECORD_SCHEMA = z.object({
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

export const CARD_SPENDING_FLOW_OUTPUT_SCHEMA = z.object({
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
