import { z } from "zod";

export const Get_hardship_allowance200ResponseDataUserInfosItemSchema = z.object({
    deptName: z.string().nullish(),
    hardshipAllowanceName: z.string().nullish(),
    name: z.string().nullish(),
    ratingLevelName: z.string().nullish(),
    ratingTerm: z.string().nullish(),
    ratingYear: z.string().nullish(),
    amount: z.number().nullish(),
    deptCode: z.string().nullish(),
});

export const Get_hardship_allowance200ResponseDataSchema = z.object({
    count: z.number().nullish(),
    userInfos: z.array(Get_hardship_allowance200ResponseDataUserInfosItemSchema).nullish(),
});
