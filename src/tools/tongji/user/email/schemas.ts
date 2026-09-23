import { z } from "zod";

export const Get_tongji_email_info200ResponseDataItemSchema = z.object({
    delFlag: z.string().nullish().describe("删除标识；码表：1-正常，0-失效，2-删除，3-锁定"),
    email: z.string().nullish().describe("邮箱地址（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    type: z.string().nullish().describe("邮箱类型（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
});
