import { z } from "zod";
import { getResearchProjects } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerResearchProjectsTool = campusTool({
    audience: "user",
    name: "tongji.user.research_projects",
    title: "本人科研项目",
    description: "根据学工号查询以第一申请人申请科研项目情况",
    input: z.object({
        projClassifyCode: z.string().regex(/^[135](?:,[135])*$/).optional().describe("项目分类代码，1-纵向项目，3-横向项目，5-专利转化，不传参默认获取全部，可以单独传入一个类别，也可以同时传入多个类别，用英文逗号分隔即可"),
    }),
    data: response.Get_research_projects200ResponseDataSchema,
    query: getResearchProjects,
}).register;
