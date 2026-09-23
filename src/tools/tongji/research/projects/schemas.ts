import { z } from "zod";

export const Get_research_projects200ResponseDataUserInfosItemSchema = z.object({
    projNo: z.string().nullish(),
    projSecondLevelCode: z.string().nullish(),
    projSecondLevelName: z.string().nullish(),
    projStartDate: z.string().nullish(),
    projStatusName: z.string().nullish(),
    appropriationCompany: z.string().nullish(),
    closingDate: z.string().nullish(),
    contractAmount: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    id: z.string().nullish(),
    name: z.string().nullish(),
    participationModeCode: z.string().nullish(),
    participationModeName: z.string().nullish(),
    projClassifyCode: z.string().nullish(),
    projClassifyName: z.string().nullish(),
    projEndDate: z.string().nullish(),
    projEstablishmentDate: z.string().nullish(),
    projFirstLevelCode: z.string().nullish(),
    projFirstLevelName: z.string().nullish(),
    projId: z.string().nullish(),
    projName: z.string().nullish(),
});

export const Get_research_projects200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    userInfos: z.array(Get_research_projects200ResponseDataUserInfosItemSchema).nullish(),
});
