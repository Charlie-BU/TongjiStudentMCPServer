import { z } from "zod";
import { getPostgraduateDegreeCredit } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateDegreeCreditTool = campusTool({
    audience: "postgraduate",
    name: "tongji.postgraduate.degree_credit",
    title: "研究生学位课总学分",
    description: "根据学号查询研究生学位课总学分",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_degree_course_credit200ResponseDataItemSchema),
    query: getPostgraduateDegreeCredit,
}).register;
