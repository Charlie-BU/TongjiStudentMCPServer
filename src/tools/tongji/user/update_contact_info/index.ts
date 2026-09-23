import { z } from "zod";
import { TongjiBusinessError, updateUserContactInfo } from "../../../../integration/tongji_openapi";
import { isRecord } from "../../../utils";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerUserUpdateContactInfoTool = campusTool({
    audience: "user",
    name: "tongji.user.update_contact_info",
    title: "修改本人联系方式",
    description: "通过学号修改用户联系方式",
    input: z.object({
        email: z.string().trim().email().max(254).optional(),
        phone: z.string().trim().regex(/^\+?[0-9 -]{5,30}$/).optional(),
    }),
    data: z.union([response.Update_user_contact_info200ResponseDataSchema, z.null()]),
    write: true,
    validate: input => !input.phone && !input.email ? "至少提供手机号或邮箱。" : undefined,
    query: async (config, input) => {
        const result = await updateUserContactInfo(config, input);
        // 外层成功仅表示请求被处理；必须确认内层业务成功且实际更新了记录。
        // 空结果、失败状态或零更新均不能向用户承诺修改成功，也不自动重试。
        const data = isRecord(result) ? result.data : undefined;
        if (!isRecord(data) || data.code !== "A00000"
            || typeof data.effectRows !== "number" || !Number.isSafeInteger(data.effectRows)
            || data.effectRows <= 0) {
            throw new TongjiBusinessError();
        }
        return result;
    },
}).register;
