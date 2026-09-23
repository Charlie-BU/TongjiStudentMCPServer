import { z } from "zod";

export const Get_postgraduate_degree_course_ms200ResponseDataItemSchema = z.object({
    degreeCourseMS: z.union([z.number(), z.null()]).nullish().describe("学位课平均分"),
});
