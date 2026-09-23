import { z } from "zod";

export const Get_postgraduate_completed_credit200ResponseDataItemSchema = z.object({
    completedCredit: z.number().nullish().describe("已修学分"),
});
