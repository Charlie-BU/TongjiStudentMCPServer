import { z } from "zod";

export const Get_student_counselor_info200ResponseDataListItemSchema = z.object({
    classCode: z.string().nullish().describe("班级代码"),
    className: z.string().nullish().describe("班级名称"),
    counselorId: z.string().nullish().describe("辅导员工号"),
    counselorName: z.string().nullish().describe("辅导员姓名"),
    deptCode: z.string().nullish().describe("学院代码"),
    deptName: z.string().nullish().describe("学院名称"),
    headTeacherId: z.string().nullish().describe("班主任工号"),
    headTeacherName: z.string().nullish().describe("班主任姓名"),
    name: z.string().nullish().describe("姓名"),
});

export const Get_student_counselor_info200ResponseDataSchema = z.object({
    sinceUserId: z.string().nullish().describe("后续查询使用的学工号游标（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    count: z.number().nullish().describe("返回记录数量。"),
    list: z.array(Get_student_counselor_info200ResponseDataListItemSchema).nullish().describe("业务记录列表。"),
});
