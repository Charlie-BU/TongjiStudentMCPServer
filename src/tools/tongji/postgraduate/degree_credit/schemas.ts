import { z } from "zod";

export const Get_postgraduate_degree_course_credit200ResponseDataItemSchema = z.object({
    degreeCourseCredit: z.number().nullish().describe("学位课总学分"),
});
