import { z } from "zod";

export const Get_work_study200ResponseDataUserInfosItemSchema = z.object({
    applicationNo: z.string().nullish().describe("申请编号"),
    companyName: z.string().nullish().describe("勤工单位名称"),
    deptCode: z.string().nullish().describe("学生学院代码"),
    deptName: z.string().nullish().describe("学生学院名称"),
    jobName: z.string().nullish().describe("勤工岗位名称"),
    name: z.string().nullish().describe("勤工助学学生姓名"),
    paid: z.number().nullish().describe("已获薪酬"),
    workEndDate: z.string().nullish().describe("工作结束日期"),
    workStartDate: z.string().nullish().describe("工作开始日期"),
});

export const Get_work_study200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    userInfos: z.array(Get_work_study200ResponseDataUserInfosItemSchema).nullish().describe("人员业务记录。"),
});
