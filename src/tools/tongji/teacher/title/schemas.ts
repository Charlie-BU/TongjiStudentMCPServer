import { z } from "zod";

export const Get_teacher_title_info200ResponseDataListItemSchema = z.object({
    titleName: z.string().nullish().describe("聘任专业技术职务名称"),
    updateTime: z.string().nullish().describe("更新时间（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    deptCode: z.string().nullish().describe("部门/学院代码"),
    deptName: z.string().nullish().describe("部门/学院名称"),
    firstTitleDate: z.string().nullish().describe("初次聘任职称级别时间"),
    jobLevelCode: z.string().nullish().describe("岗位等级代码；码表：tech_post_level_code"),
    jobLevelName: z.string().nullish().describe("岗位等级名称"),
    jobOfferDate: z.string().nullish().describe("岗位聘任时间"),
    jobTypeCode: z.string().nullish().describe("岗位类别代码；码表：types"),
    jobTypeName: z.string().nullish().describe("岗位类别名称"),
    name: z.string().nullish().describe("姓名"),
    partyGovLevelCode: z.string().nullish().describe("党政职务等级代码"),
    partyGovLevelName: z.union([z.string(), z.null()]).nullish().describe("党政职务等级名称"),
    partyJob: z.string().nullish().describe("党政职务"),
    partyJobDate: z.string().nullish().describe("党政职务任职年月"),
    partyJobFirstDate: z.string().nullish().describe("党政职务级别初任时间"),
    techJobLevelCode: z.string().nullish().describe("专业技术职务级别代码；码表：types"),
    techJobLevelName: z.string().nullish().describe("专业技术职务级别名称"),
    techJobTypeCode: z.string().nullish().describe("专技岗分类代码"),
    techJobTypeName: z.union([z.string(), z.null()]).nullish().describe("专技岗分类名称"),
    techLevelOfWorkersCode: z.string().nullish().describe("工人技术等级代码；码表：types"),
    techLevelOfWorkersName: z.union([z.string(), z.null()]).nullish().describe("工人技术等级名称"),
    tenureEndTime: z.string().nullish().describe("长聘协议结束时间"),
    tenurePositionCode: z.string().nullish().describe("长聘体系职务代码"),
    tenurePositionName: z.union([z.string(), z.null()]).nullish().describe("长聘体系职务名称"),
    tenureStartTime: z.string().nullish().describe("长聘协议开始时间"),
    titleCode: z.string().nullish().describe("聘任专业技术职务代码；码表：types"),
    titleDate: z.string().nullish().describe("聘任专业技术职务年月"),
});

export const Get_teacher_title_info200ResponseDataSchema = z.object({
    sinceUserId: z.string().nullish().describe("后续查询使用的学工号游标（依据字段名及返回示例解释；官网未明确说明，具体单位和枚举以接口为准。）"),
    count: z.number().nullish().describe("返回记录数量。"),
    list: z.array(Get_teacher_title_info200ResponseDataListItemSchema).nullish().describe("业务记录列表。"),
});
