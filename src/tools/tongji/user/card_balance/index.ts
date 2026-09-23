import { z } from "zod";
import { getCardBalance } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerCardBalanceTool = campusTool({
    audience: "user",
    name: "tongji.user.card_balance",
    title: "一卡通实时余额",
    description: "根据学工号查询人员一卡通实时余额",
    input: z.object({
    }),
    data: z.array(response.Get_card_balance200ResponseDataItemSchema),
    query: getCardBalance,
}).register;
