import { z } from "zod";

export const Get_user_contact_info200ResponseDataItemSchema = z.object({
    name: z.string().nullish(),
    phone: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    email: z.string().nullish(),
});
