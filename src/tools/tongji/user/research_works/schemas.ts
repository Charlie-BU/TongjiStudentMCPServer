import { z } from "zod";

export const Get_research_works200ResponseDataUserInfosItemSchema = z.object({
    bookCategoryCode: z.string().nullish().describe("著作类别代码"),
    bookCategoryName: z.string().nullish().describe("著作类别名称"),
    bookName: z.string().nullish().describe("著作名称"),
    deptCode: z.string().nullish().describe("人员所属学院代码"),
    deptName: z.string().nullish().describe("人员所属学院名称"),
    name: z.string().nullish().describe("姓名"),
    publicationYear: z.string().nullish().describe("出版时间"),
    publishHouseName: z.string().nullish().describe("出版社名称"),
    seqNo: z.number().nullish().describe("作者排名"),
    totalWords: z.number().nullish().describe("总字数（万）"),
});

export const Get_research_works200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    userInfos: z.array(Get_research_works200ResponseDataUserInfosItemSchema).nullish().describe("人员业务记录。"),
});
