import { z } from "zod";

export const Get_postgraduate_culture_plan_count200ResponseDataItemSchema = z.object({
    children: z.union([z.array(z.number()), z.null()]).nullish(),
    credit: z.string().nullish(),
    isPass: z.string().nullish(),
    labelId: z.number().nullish(),
    labelName: z.string().nullish(),
    labelNameEn: z.string().nullish(),
    parentId: z.number().nullish(),
    yearEnd: z.number().nullish(),
    yearStart: z.number().nullish(),
});
