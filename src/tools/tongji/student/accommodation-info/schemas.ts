import { z } from "zod";

export const ACCOMMODATION_RECORD_SCHEMA = z.object({
    accomBuildingCode: z.string().nullable().describe("宿舍楼代码。"),
    accomBuildingName: z.string().nullable().describe("宿舍楼名称。"),
    accomRegionCode: z.string().nullable().describe("宿舍区代码。"),
    accomRegionName: z.string().nullable().describe("宿舍区名称。"),
    deptCode: z.string().nullable().describe("所属部门/学院代码。"),
    deptName: z.string().nullable().describe("所属部门/学院名称。"),
    floor: z.string().nullable().describe("楼层。"),
    name: z.string().nullable().describe("学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    roomNo: z.string().nullable().describe("房间号。"),
    userId: z.string().nullable().describe("学号，已由上游做脱敏处理，不可用于身份验证。"),
    usertypeCode: z.string().nullable().describe("人员类型代码。"),
    usertypeName: z.string().nullable().describe("人员类型名称，例如硕士研究生。"),
});

export const ACCOMMODATION_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的住宿记录。"),
    data: z.object({
        records: z.array(ACCOMMODATION_RECORD_SCHEMA).describe("住宿记录列表。"),
    }),
    pagination: z.record(z.string()).optional(),
    source: z.literal("Tongji Open Platform").describe("住宿数据来源。"),
});
