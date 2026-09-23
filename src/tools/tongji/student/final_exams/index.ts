import { z } from "zod";
import { getStudentFinalExams } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentFinalExamsTool = campusTool({
    name: "tongji.student.final_exams",
    title: "期末考试安排与缺考情况",
    description: "期末考试时间、地点、应考及缺考情况；userId和calendarId必填，defeat默认否，查询缺考需显式传1。",
    input: z.object({
        calendarId: z.string().regex(/^-?\d+$/).describe("考试学期编号，可通过学生学期日历编号calendarId 获取历史学期编号"),
        defeat: z.enum(["0", "1"]).optional().describe("是否缺考 1 是 0 否 默认否"),
    }),
    data: z.array(response.Get_final_exam_info200ResponseDataItemSchema),
    query: getStudentFinalExams,
}).register;
