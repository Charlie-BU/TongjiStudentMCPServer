import { z } from "zod";
import { getCardSpendingSummary } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerCardSpendingSummaryTool = campusTool({
    name: "tongji.card.spending_summary",
    title: "一卡通消费汇总",
    description: "按日期区间、近n周或近n月返回消费总额，避免分页拉流水后在模型中计算；cycle为week/month时n必填。cycle=date时，起止时间均不传默认最近一个月；只传开始时间查询其后30天，只传结束时间查询其前30天；两者都传按指定区间，n不影响。",
    input: z.object({
        cycle: z.enum(["date", "week", "month"]).describe("周期：date、week、month"),
        tradeStartTime: z.string().trim().min(1).max(500).optional().describe("开始时间"),
        tradeEndTime: z.string().trim().min(1).max(500).optional().describe("结束时间"),
        n: z.number().int().positive().optional().describe("近n个自然周/月；cycle=week或month时必须提供。"),
    }),
    data: z.union([z.array(response.Get_card_spending_summary200ResponseDataItemSchema), z.null()]),
    validate: input => input.cycle !== "date" && input.n === undefined ? "按周/月汇总时必须提供正整数 n。" : undefined,
    query: getCardSpendingSummary,
}).register;
