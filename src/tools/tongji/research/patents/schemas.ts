import { z } from "zod";

export const Get_research_patent200ResponseDataInfosItemSchema = z.object({
    patentDeptCode: z.string().nullish(),
    patentDeptName: z.string().nullish(),
    patentTitle: z.string().nullish(),
    regPublishDate: z.string().nullish(),
    statusCode: z.string().nullish(),
    statusName: z.string().nullish(),
    allInventorName: z.string().nullish(),
    allInventorUserId: z.string().nullish(),
    appDate: z.string().nullish(),
    appNo: z.string().nullish(),
    appTypeCode: z.string().nullish(),
    appTypeName: z.string().nullish(),
    countryName: z.string().nullish(),
    inventorCount: z.number().nullish(),
});

export const Get_research_patent200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    infos: z.array(Get_research_patent200ResponseDataInfosItemSchema).nullish(),
});
