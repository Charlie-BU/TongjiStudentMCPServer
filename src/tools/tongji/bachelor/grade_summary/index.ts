import { z } from "zod";
import { getStudentGradeSummary } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentGradeSummaryTool = campusTool({
    audience: "bachelor",
    name: "tongji.bachelor.grade_summary",
    title: "本科生绩点与学分汇总",
    description: "根据学号查询本科生绩点、百分制成绩、修读学分、实修学分",
    input: z.object({
    }),
    data: z.array(response.Get_undergraduate_summarized_grades200ResponseDataItemSchema),
    query: getStudentGradeSummary,
}).register;
