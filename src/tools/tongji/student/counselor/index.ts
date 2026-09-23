import { z } from "zod";
import { getStudentCounselor } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentCounselorTool = campusTool({
    audience: "student",
    name: "tongji.student.counselor",
    title: "本人班主任与辅导员",
    description: "查本人班主任、辅导员姓名与工号；本接口不返回联系方式，不应承诺直接查询电话。",
    input: z.object({
        sinceUserId: z.string().trim().min(1).max(500).optional().describe("游标的起始位置，请把响应中的同字段传入，获取下一页，循环往复获取全量数据"),
    }),
    data: response.Get_student_counselor_info200ResponseDataSchema,
    query: getStudentCounselor,
}).register;
