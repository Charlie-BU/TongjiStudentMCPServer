import { z } from "zod";

export const Get_research_projects200ResponseDataUserInfosItemSchema = z.object({
    projNo: z.string().nullish().describe("项目编号"),
    projSecondLevelCode: z.string().nullish().describe("纵向项目二级类别代码"),
    projSecondLevelName: z.string().nullish().describe("纵向项目二级类别名称"),
    projStartDate: z.string().nullish().describe("开始日期"),
    projStatusName: z.string().nullish().describe("项目状态名称"),
    appropriationCompany: z.string().nullish().describe("资助单位名称"),
    closingDate: z.string().nullish().describe("完成日期"),
    contractAmount: z.string().nullish().describe("合同经费"),
    deptCode: z.string().nullish().describe("人员所属学院代码"),
    deptName: z.string().nullish().describe("人员所属学院名称"),
    id: z.string().nullish().describe("主键"),
    name: z.string().nullish().describe("项目负责人姓名"),
    participationModeCode: z.string().nullish().describe("项目性质代码"),
    participationModeName: z.string().nullish().describe("项目性质名称"),
    projClassifyCode: z.string().nullish().describe("项目分类代码"),
    projClassifyName: z.string().nullish().describe("项目分类名称"),
    projEndDate: z.string().nullish().describe("结束日期"),
    projEstablishmentDate: z.string().nullish().describe("立项日期"),
    projFirstLevelCode: z.string().nullish().describe("纵向项目类别代码"),
    projFirstLevelName: z.string().nullish().describe("纵向项目类别名称"),
    projId: z.string().nullish().describe("项目id"),
    projName: z.string().nullish().describe("项目名称"),
});

export const Get_research_projects200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    userInfos: z.array(Get_research_projects200ResponseDataUserInfosItemSchema).nullish().describe("人员业务记录。"),
});
