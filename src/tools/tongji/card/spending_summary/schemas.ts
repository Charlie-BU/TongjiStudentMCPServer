import { z } from "zod";

export const Get_card_spending_summary200ResponseDataItemSchema = z.object({
    last: z.number().nullish(),
    note: z.string().nullish(),
    tradeAmt: z.number().nullish(),
});
