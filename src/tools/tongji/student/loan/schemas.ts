import { z } from "zod";

export const Get_student_loan200ResponseDataUserInfosItemSchema = z.object({
    deptCode: z.string().nullish().describe("所属学院代码"),
    deptName: z.string().nullish().describe("所属学院名称"),
    loanAmount: z.number().nullish().describe("贷款金额"),
    loanCode: z.string().nullish().describe("贷款编码"),
    loanType: z.string().nullish().describe("贷款类型"),
    loanYear: z.string().nullish().describe("贷款学年"),
    name: z.string().nullish().describe("获得助学贷款学生姓名"),
    repaymentYear: z.string().nullish().describe("应还款学年"),
});

export const Get_student_loan200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    userInfos: z.array(Get_student_loan200ResponseDataUserInfosItemSchema).nullish().describe("人员业务记录。"),
});
