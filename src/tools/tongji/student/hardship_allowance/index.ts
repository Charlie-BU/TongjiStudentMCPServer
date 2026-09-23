import { z } from "zod";
import { getStudentHardshipAllowance } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerStudentHardshipAllowanceTool = campusTool({
    audience: "student",
    name: "tongji.student.hardship_allowance",
    title: "困难补助",
    description: "根据学号查询学生获得困难补助情况信息",
    input: z.object({
    }),
    data: response.Get_hardship_allowance200ResponseDataSchema,
    query: getStudentHardshipAllowance,
}).register;
