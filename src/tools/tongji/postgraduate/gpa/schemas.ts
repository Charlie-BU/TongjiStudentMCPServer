import { z } from "zod";

export const Get_postgraduate_gpa_and_ms200ResponseDataItemSchema = z.object({
    GPA: z.number().nullish().describe("平均绩点"),
    MS: z.number().nullish().describe("平均成绩"),
});
