import { z } from "zod";
import { getPostgraduatePlanProgress } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduatePlanProgressTool = campusTool({
    name: "tongji.postgraduate.plan_progress",
    title: "研究生培养计划完成统计",
    description: "获取1tongji系统上研究生培养计划完成情况统计信息",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_culture_plan_count200ResponseDataItemSchema),
    query: getPostgraduatePlanProgress,
}).register;
