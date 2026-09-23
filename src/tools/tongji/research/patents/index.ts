import { z } from "zod";
import { getResearchPatents } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerResearchPatentsTool = campusTool({
    name: "tongji.research.patents",
    title: "本人科研专利",
    description: "根据学工号或专利号查询科研专利情况",
    input: z.object({
        appNo: z.string().trim().min(1).max(500).optional().describe("专利号"),
    }),
    data: response.Get_research_patent200ResponseDataSchema,
    query: getResearchPatents,
}).register;
