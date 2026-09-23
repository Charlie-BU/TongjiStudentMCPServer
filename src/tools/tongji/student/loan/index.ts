import { z } from "zod";
import { getStudentLoan } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentLoanTool = campusTool({
    audience: "student",
    name: "tongji.student.loan",
    title: "助学贷款",
    description: "根据学号查询学生获得助学贷款情况信息",
    input: z.object({
    }),
    data: response.Get_student_loan200ResponseDataSchema,
    query: getStudentLoan,
}).register;
