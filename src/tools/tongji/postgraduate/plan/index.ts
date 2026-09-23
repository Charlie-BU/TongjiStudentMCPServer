import { z } from "zod";
import { getPostgraduatePlan } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduatePlanTool = campusTool({
    audience: "postgraduate",
    name: "tongji.postgraduate.plan",
    title: "研究生培养计划",
    description: "获取1tongji系统上研究生的培养计划，根据学号查询培养计划",
    input: z.object({
    }),
    data: response.Get_postgraduate_culture_plan200ResponseDataSchema,
    query: getPostgraduatePlan,
}).register;
