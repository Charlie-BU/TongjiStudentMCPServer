import { z } from "zod";

export const Update_user_contact_info200ResponseDataSchema = z.object({
    code: z.string().nullish().describe("状态码"),
    effectRows: z.number().nullish().describe("受影响的记录行数（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
});
