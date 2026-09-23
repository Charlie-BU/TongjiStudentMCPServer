import { z } from "zod";

export const Get_postgraduate_required_credit200ResponseDataItemSchema = z.object({
    requiredCredit: z.number().nullish().describe("应修学分"),
});
