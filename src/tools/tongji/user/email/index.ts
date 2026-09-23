import { z } from "zod";
import { getUserEmail } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerUserEmailTool = campusTool({
    audience: "user",
    name: "tongji.user.email",
    title: "本人同济邮箱与别名",
    description: "查询本人同济邮箱及别名、状态；只传登录用户userId，不开放任意邮箱反查。官方支持userId/email二选一，本工具固定用登录用户userId。",
    input: z.object({
    }),
    data: z.array(response.Get_tongji_email_info200ResponseDataItemSchema),
    query: getUserEmail,
}).register;
