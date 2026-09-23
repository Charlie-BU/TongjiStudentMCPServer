import { z } from "zod";
import { getPostgraduateScore } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateScoreTool = campusTool({
    name: "tongji.postgraduate.score",
    title: "研究生成绩",
    description: "获取1tongji系统上研究生课程的成绩信息",
    input: z.object({
        calendarId: z.number().int().min(-1).optional().describe("学期编号，为空默认为当前学期编号；通过”查询所有学期日历编号”获取历史学期编号；-1返回所有学期的成绩"),
    }),
    data: response.Postgraduate_score200ResponseDataSchema,
    query: getPostgraduateScore,
}).register;
