import { z } from "zod";
import { getPostgraduateRequiredCredit } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerPostgraduateRequiredCreditTool = campusTool({
    name: "tongji.postgraduate.required_credit",
    title: "研究生应修学分",
    description: "根据学号查询研究生应修学分",
    input: z.object({
    }),
    data: z.array(response.Get_postgraduate_required_credit200ResponseDataItemSchema),
    query: getPostgraduateRequiredCredit,
}).register;
