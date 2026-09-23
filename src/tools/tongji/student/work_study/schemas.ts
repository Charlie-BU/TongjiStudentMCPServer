import { z } from "zod";

export const Get_work_study200ResponseDataUserInfosItemSchema = z.object({
    applicationNo: z.string().nullish(),
    companyName: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    jobName: z.string().nullish(),
    name: z.string().nullish(),
    paid: z.number().nullish(),
    workEndDate: z.string().nullish(),
    workStartDate: z.string().nullish(),
});

export const Get_work_study200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    userInfos: z.array(Get_work_study200ResponseDataUserInfosItemSchema).nullish(),
});
