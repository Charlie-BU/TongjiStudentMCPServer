import { z } from "zod";

export const Get_undergraduate_summarized_grades200ResponseDataItemSchema = z.object({
    GPA: z.number().nullish(),
    completedCredit: z.string().nullish(),
    hundredMarkScore: z.number().nullish(),
    requiredCredit: z.number().nullish(),
});
