import { z } from "zod";

export const Get_card_spending_summary200ResponseDataItemSchema = z.object({
    last: z.number().nullish().describe("时间"),
    note: z.string().nullish().describe("时间描述"),
    tradeAmt: z.number().nullish().describe("金额总数"),
});
