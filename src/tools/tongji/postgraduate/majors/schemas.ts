import { z } from "zod";

export const Get_postgraduate_major_info200ResponseDataItemSchema = z.object({
    SecondLevelDisciplineSchoolCode: z.string().nullish(),
    Type: z.string().nullish(),
    disciplineClassCode: z.string().nullish(),
    disciplineClassName: z.string().nullish(),
    doctorTime: z.string().nullish(),
    firstLevelDisciplineCode: z.string().nullish(),
    firstLevelDisciplineName: z.string().nullish(),
    firstLevelDisciplineSchoolCode: z.string().nullish(),
    id: z.string().nullish(),
    majorCode: z.string().nullish(),
    majorEnName: z.string().nullish(),
    majorName: z.string().nullish(),
    masterTime: z.string().nullish(),
    nationImportant: z.string().nullish(),
    selfMajor: z.string().nullish(),
    status: z.string().nullish(),
});
