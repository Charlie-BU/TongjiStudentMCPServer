import { z } from "zod";

export const Get_undergraduate_summarized_grades200ResponseDataItemSchema = z.object({
    GPA: z.number().nullish().describe("绩点"),
    completedCredit: z.string().nullish().describe("实修学分"),
    hundredMarkScore: z.number().nullish().describe("百分制成绩"),
    requiredCredit: z.number().nullish().describe("修读学分"),
});
