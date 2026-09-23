import { z } from "zod";

export const Get_postgraduate_culture_plan_count200ResponseDataItemSchema = z.object({
    children: z.union([z.array(z.number()), z.null()]).nullish().describe("子项（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    credit: z.string().nullish().describe("学分（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    isPass: z.string().nullish().describe("是否通过（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    labelId: z.number().nullish().describe("分类标识（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    labelName: z.string().nullish().describe("分类名称（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    labelNameEn: z.string().nullish().describe("分类英文名称（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    parentId: z.number().nullish().describe("父项标识（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    yearEnd: z.number().nullish().describe("结束学年（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    yearStart: z.number().nullish().describe("开始学年（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
});
