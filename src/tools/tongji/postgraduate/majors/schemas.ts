import { z } from "zod";

export const Get_postgraduate_major_info200ResponseDataItemSchema = z.object({
    SecondLevelDisciplineSchoolCode: z.string().nullish().describe("二级学科校标代码"),
    Type: z.string().nullish().describe("专业类型"),
    disciplineClassCode: z.string().nullish().describe("学科门类代码"),
    disciplineClassName: z.string().nullish().describe("学科门类名称"),
    doctorTime: z.string().nullish().describe("博士点批准时间"),
    firstLevelDisciplineCode: z.string().nullish().describe("一级学科代码"),
    firstLevelDisciplineName: z.string().nullish().describe("一级学科名称"),
    firstLevelDisciplineSchoolCode: z.string().nullish().describe("一级学科校标代码"),
    id: z.string().nullish().describe("序号"),
    majorCode: z.string().nullish().describe("专业代码"),
    majorEnName: z.string().nullish().describe("专业英文名称"),
    majorName: z.string().nullish().describe("专业名称"),
    masterTime: z.string().nullish().describe("硕士点批准时间"),
    nationImportant: z.string().nullish().describe("是否国家重点学科：1，是；0，否"),
    selfMajor: z.string().nullish().describe("自设专业标识（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    status: z.string().nullish().describe("是否在用：1，在用；0，不在用"),
});
