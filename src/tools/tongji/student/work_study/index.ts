import { z } from "zod";
import { getStudentWorkStudy } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentWorkStudyTool = campusTool({
    name: "tongji.student.work_study",
    title: "勤工助学",
    description: "根据学号查询学生勤功助学情况信息",
    input: z.object({
    }),
    data: response.Get_work_study200ResponseDataSchema,
    query: getStudentWorkStudy,
}).register;
