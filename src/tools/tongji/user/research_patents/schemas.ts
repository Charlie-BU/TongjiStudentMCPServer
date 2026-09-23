import { z } from "zod";

export const Get_research_patent200ResponseDataInfosItemSchema = z.object({
    patentDeptCode: z.string().nullish().describe("专利所属学院代码"),
    patentDeptName: z.string().nullish().describe("专利所属学院名称"),
    patentTitle: z.string().nullish().describe("专利名称"),
    regPublishDate: z.string().nullish().describe("授权公告日"),
    statusCode: z.string().nullish().describe("案件状态代码"),
    statusName: z.string().nullish().describe("案件状态名称"),
    allInventorName: z.string().nullish().describe("所有发明人姓名"),
    allInventorUserId: z.string().nullish().describe("所有发明人学工号"),
    appDate: z.string().nullish().describe("申请日"),
    appNo: z.string().nullish().describe("申请号(专利号)"),
    appTypeCode: z.string().nullish().describe("申请类型代码"),
    appTypeName: z.string().nullish().describe("申请类型名称"),
    countryName: z.string().nullish().describe("是否国际专利"),
    inventorCount: z.number().nullish().describe("发明人总数"),
});

export const Get_research_patent200ResponseDataSchema = z.object({
    count: z.number().nullish().describe("返回记录数量。"),
    infos: z.array(Get_research_patent200ResponseDataInfosItemSchema).nullish().describe("专利记录列表（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
});
