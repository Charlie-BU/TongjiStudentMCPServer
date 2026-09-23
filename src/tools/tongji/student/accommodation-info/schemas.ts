import { z } from "zod";

export const ACCOMMODATION_RECORD_SCHEMA = z.object({
    accomBuildingCode: z.string().nullable().describe("宿舍楼；码表：types"),
    accomBuildingName: z.string().nullable().describe("宿舍楼名称"),
    accomRegionCode: z.string().nullable().describe("宿舍区；码表：types"),
    accomRegionName: z.string().nullable().describe("宿舍区名称"),
    deptCode: z.string().nullable().describe("部门/学院代码"),
    deptName: z.string().nullable().describe("部门/学院名称"),
    floor: z.string().nullable().describe("楼层"),
    name: z.string().nullable().describe("姓名 学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    roomNo: z.string().nullable().describe("房间号"),
    userId: z.string().nullable().describe("学号 学号，已由上游做脱敏处理，不可用于身份验证。"),
    usertypeCode: z.string().nullable().describe("人员类型代码。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
    usertypeName: z.string().nullable().describe("人员类型名称，例如硕士研究生。（沿用现有工具定义；官网未提供该字段的明确说明。）"),
});

export const ACCOMMODATION_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的住宿记录。"),
    data: z.object({
        records: z.array(ACCOMMODATION_RECORD_SCHEMA).describe("住宿记录列表。"),
    }).describe("业务响应数据。"),
    pagination: z.record(z.string()).optional().describe("分页游标信息；沿用上游返回的游标字段进行后续查询。"),
    source: z.literal("Tongji Open Platform").describe("住宿数据来源。"),
});
