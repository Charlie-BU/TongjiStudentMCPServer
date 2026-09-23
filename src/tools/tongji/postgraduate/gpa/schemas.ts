import { z } from "zod";

export const Get_postgraduate_gpa_and_ms200ResponseDataItemSchema = z.object({
    GPA: z.number().nullish(),
    MS: z.number().nullish(),
});
