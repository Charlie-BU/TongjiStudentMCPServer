import { z } from "zod";

export const Get_teacher_current_term_timetable200ResponseDataSchema = z.object({
    userInfos: z.unknown().nullish().describe("人员业务记录。"),
});
