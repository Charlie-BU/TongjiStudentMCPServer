import { z } from "zod";
import { getPostgraduateGpa } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateGpaTool = campusTool({
    name: "tongji.postgraduate.gpa",
    title: "研究生平均成绩与绩点",
    description: "根据学号查询研究生平均成绩与平均绩点",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_gpa_and_ms200ResponseDataItemSchema),
    query: getPostgraduateGpa,
}).register;
