import { z } from "zod";

export const Get_tongji_email_info200ResponseDataItemSchema = z.object({
    delFlag: z.string().nullish(),
    email: z.string().nullish(),
    type: z.string().nullish(),
});
