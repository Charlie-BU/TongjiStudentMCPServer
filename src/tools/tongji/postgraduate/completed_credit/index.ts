import { z } from "zod";
import { getPostgraduateCompletedCredit } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateCompletedCreditTool = campusTool({
    audience: "postgraduate",
    name: "tongji.postgraduate.completed_credit",
    title: "研究生已修学分",
    description: "根据学号查询研究生已修学分",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_completed_credit200ResponseDataItemSchema),
    query: getPostgraduateCompletedCredit,
}).register;
