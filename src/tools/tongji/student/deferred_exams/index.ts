import { z } from "zod";
import { getStudentDeferredExams } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentDeferredExamsTool = campusTool({
    name: "tongji.student.deferred_exams",
    title: "重缓考安排与状态",
    description: "重缓考时间、地点与状态；userId和calendarId必填，defeat不传查询所有类型。",
    input: z.object({
        calendarId: z.string().regex(/^-?\d+$/).describe("考试学期编号，可通过学生学期日历编号calendarId 获取历史学期编号"),
        defeat: z.enum(["0", "1"]).optional().describe("是否缺考，1是0否，不传为所有类型"),
    }),
    data: z.array(response.Get_deferred_exam_info200ResponseDataItemSchema),
    query: getStudentDeferredExams,
}).register;
