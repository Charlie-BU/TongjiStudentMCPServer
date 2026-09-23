import { z } from "zod";

export const Get_card_balance200ResponseDataItemSchema = z.object({
    balance: z.number().nullish(),
});
