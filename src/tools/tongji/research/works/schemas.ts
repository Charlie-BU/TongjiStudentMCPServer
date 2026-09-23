import { z } from "zod";

export const Get_research_works200ResponseDataUserInfosItemSchema = z.object({
    bookCategoryCode: z.string().nullish(),
    bookCategoryName: z.string().nullish(),
    bookName: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    name: z.string().nullish(),
    publicationYear: z.string().nullish(),
    publishHouseName: z.string().nullish(),
    seqNo: z.number().nullish(),
    totalWords: z.number().nullish(),
});

export const Get_research_works200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    userInfos: z.array(Get_research_works200ResponseDataUserInfosItemSchema).nullish(),
});
