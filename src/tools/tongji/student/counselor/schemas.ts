import { z } from "zod";

export const Get_student_counselor_info200ResponseDataListItemSchema = z.object({
    classCode: z.string().nullish(),
    className: z.string().nullish(),
    counselorId: z.string().nullish(),
    counselorName: z.string().nullish(),
    deptCode: z.string().nullish(),
    deptName: z.string().nullish(),
    headTeacherId: z.string().nullish(),
    headTeacherName: z.string().nullish(),
    name: z.string().nullish(),
});

export const Get_student_counselor_info200ResponseDataSchema = z.object({
    sinceUserId: z.string().nullish(),
    count: z.number().nullish(),
    list: z.array(Get_student_counselor_info200ResponseDataListItemSchema).nullish(),
});
