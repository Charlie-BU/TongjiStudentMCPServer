import { z } from "zod";

export const Get_hardship_allowance200ResponseDataUserInfosItemSchema = z.object({
    deptName: z.string().nullish().describe("所属学院名称"),
    hardshipAllowanceName: z.string().nullish().describe("困难补助名称"),
    name: z.string().nullish().describe("获得困难补助学生姓名"),
    ratingLevelName: z.string().nullish().describe("评定等级名称"),
    ratingTerm: z.string().nullish().describe("评定学期"),
    ratingYear: z.string().nullish().describe("评定学年"),
    amount: z.number().nullish().describe("金额"),
    deptCode: z.string().nullish().describe("所属学院代码"),
});

export const Get_hardship_allowance200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    userInfos: z.array(Get_hardship_allowance200ResponseDataUserInfosItemSchema).nullish().describe("人员业务记录。"),
});
