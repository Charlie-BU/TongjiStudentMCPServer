import { z } from "zod";

export const CARD_SPENDING_FLOW_RECORD_SCHEMA = z.object({
    campusAreaName: z
        .string()
        .nullable()
        .describe("所属校区"),
    cardBalance: z
        .number()
        .nullable()
        .describe("卡内余额"),
    mercName: z.string().nullable().describe("商铺名称"),
    mercTypeName: z
        .string()
        .nullable()
        .describe("商铺类别"),
    name: z.string().nullable().describe("姓名"),
    personTypeCode: z.string().nullable().describe("人员类别代码"),
    restaurantName: z
        .string()
        .nullable()
        .describe("所属食堂"),
    tradeAmount: z.number().nullable().describe("交易金额"),
    tradeDateTime: z
        .string()
        .nullable()
        .describe("交易时间（年月日时分秒）"),
});

export const CARD_SPENDING_FLOW_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的一卡通消费流水。"),
    data: z.object({
        userInfos: z
            .array(CARD_SPENDING_FLOW_RECORD_SCHEMA)
            .describe("当前授权用户的一卡通消费流水记录列表。"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("一卡通消费流水数据来源。"),
    tradeStartTime: z.string().optional().describe("本次查询指定的交易开始时间。"),
    tradeEndTime: z.string().optional().describe("本次查询指定的交易结束时间。"),
});
