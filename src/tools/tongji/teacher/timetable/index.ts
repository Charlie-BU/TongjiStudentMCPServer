import { z } from "zod";
import { getTeacherTimetable } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerTeacherTimetableTool = campusTool({
    name: "tongji.teacher.timetable",
    title: "教职工本学期课表",
    description: "根据学工号查询教职工本学期课表情况",
    input: z.object({
    }),
    data: response.Get_teacher_current_term_timetable200ResponseDataSchema,
    query: getTeacherTimetable,
}).register;
