import { z } from "zod";

export const Get_teacher_title_info200ResponseDataListItemSchema = z.object({
    titleName: z.string().nullish(),
    updateTime: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    firstTitleDate: z.string().nullish(),
    jobLevelCode: z.string().nullish(),
    jobLevelName: z.string().nullish(),
    jobOfferDate: z.string().nullish(),
    jobTypeCode: z.string().nullish(),
    jobTypeName: z.string().nullish(),
    name: z.string().nullish(),
    partyGovLevelCode: z.string().nullish(),
    partyGovLevelName: z.union([z.string(), z.null()]).nullish(),
    partyJob: z.string().nullish(),
    partyJobDate: z.string().nullish(),
    partyJobFirstDate: z.string().nullish(),
    techJobLevelCode: z.string().nullish(),
    techJobLevelName: z.string().nullish(),
    techJobTypeCode: z.string().nullish(),
    techJobTypeName: z.union([z.string(), z.null()]).nullish(),
    techLevelOfWorkersCode: z.string().nullish(),
    techLevelOfWorkersName: z.union([z.string(), z.null()]).nullish(),
    tenureEndTime: z.string().nullish(),
    tenurePositionCode: z.string().nullish(),
    tenurePositionName: z.union([z.string(), z.null()]).nullish(),
    tenureStartTime: z.string().nullish(),
    titleCode: z.string().nullish(),
    titleDate: z.string().nullish(),
});

export const Get_teacher_title_info200ResponseDataSchema = z.object({
    sinceUserId: z.string().nullish(),
    count: z.number().nullish(),
    list: z.array(Get_teacher_title_info200ResponseDataListItemSchema).nullish(),
});
