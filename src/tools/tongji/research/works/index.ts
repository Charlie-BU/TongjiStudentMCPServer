import { z } from "zod";
import { getResearchWorks } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerResearchWorksTool = campusTool({
    name: "tongji.research.works",
    title: "本人科研著作",
    description: "根据学工号查询科研著作情况",
    input: z.object({
    }),
    data: response.Get_research_works200ResponseDataSchema,
    query: getResearchWorks,
}).register;
