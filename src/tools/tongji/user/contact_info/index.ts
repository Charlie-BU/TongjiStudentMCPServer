import { z } from "zod";
import { getUserContactInfo } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerUserContactInfoTool = campusTool({
    name: "tongji.user.contact_info",
    title: "本人联系方式",
    description: "根据学工号查询人员联系方式，包括电话号码和邮箱",
    input: z.object({
        systemCode: z.string().trim().min(1).max(500).optional().describe("系统编号，可传入多个(使用英文逗号分割)，传all：获取全部"),
    }),
    data: z.array(response.Get_user_contact_info200ResponseDataItemSchema),
    query: getUserContactInfo,
}).register;
