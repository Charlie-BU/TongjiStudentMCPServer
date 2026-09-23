import { z } from "zod";

export const Get_user_contact_info200ResponseDataItemSchema = z.object({
    name: z.string().nullish().describe("姓名"),
    phone: z.string().nullish().describe("手机号"),
    deptCode: z.string().nullish().describe("部门/学院代码"),
    deptName: z.string().nullish().describe("部门/学院姓名"),
    email: z.string().nullish().describe("邮箱"),
});
