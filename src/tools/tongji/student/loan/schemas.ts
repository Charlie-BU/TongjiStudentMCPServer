import { z } from "zod";

export const Get_student_loan200ResponseDataUserInfosItemSchema = z.object({
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    loanAmount: z.number().nullish(),
    loanCode: z.string().nullish(),
    loanType: z.string().nullish(),
    loanYear: z.string().nullish(),
    name: z.string().nullish(),
    repaymentYear: z.string().nullish(),
});

export const Get_student_loan200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    userInfos: z.array(Get_student_loan200ResponseDataUserInfosItemSchema).nullish(),
});
