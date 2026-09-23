import { z } from "zod";
import { getTeacherTitle } from "../../../../integration/tongji_openapi";
import * as response from "./schemas";
import { campusTool } from "../../campus-tool";

export const registerTeacherTitleTool = campusTool({
    audience: "teacher",
    name: "tongji.teacher.title",
    title: "教职工职称与岗位",
    description: "根据工号查询教职工职称与岗位信息",
    input: z.object({
        sinceUserId: z.string().trim().min(1).max(500).optional().describe("游标的起始位置，请把响应中的同字段传入，获取下一页，循环往复获取全量数据"),
        sinceUpdateTime: z.string().trim().min(1).max(500).optional().describe("更新时间，获取该时间点之后信息有更改的数据，此字段格式支持YYYY-MM-DD HH:mm:ss 和 unix时间戳"),
    }),
    data: response.Get_teacher_title_info200ResponseDataSchema,
    query: getTeacherTitle,
}).register;
