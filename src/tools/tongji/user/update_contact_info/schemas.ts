import { z } from "zod";

export const Update_user_contact_info200ResponseDataSchema = z.object({
    code: z.string().nullish(),
    effectRows: z.number().nullish(),
});
