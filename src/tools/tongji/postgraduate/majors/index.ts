import { z } from "zod";
import { getPostgraduateMajors } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateMajorsTool = campusTool({
    name: "tongji.postgraduate.majors",
    title: "研究生学位专业目录",
    description: "获取1系统上的研究生学位专业信息",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_major_info200ResponseDataItemSchema),
    query: getPostgraduateMajors,
}).register;
