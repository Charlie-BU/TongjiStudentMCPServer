import { z } from "zod";
import { getPostgraduateDegreeAverage } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateDegreeAverageTool = campusTool({
    audience: "postgraduate",
    name: "tongji.postgraduate.degree_average",
    title: "研究生学位课平均分",
    description: "根据学号查询研究生学位课平均分",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_degree_course_ms200ResponseDataItemSchema),
    query: getPostgraduateDegreeAverage,
}).register;
