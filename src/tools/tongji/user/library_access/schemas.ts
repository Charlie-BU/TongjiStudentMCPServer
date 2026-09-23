import { z } from "zod";

export const LIBRARY_ACCESS_RECORD_SCHEMA = z.object({
    deptName: z.string().nullable().describe("院系"),
    direction: z
        .string()
        .nullable()
        .describe("进出模式，1-进，2-出"),
    door: z.string().nullable().describe("所属区域"),
    libPlace: z.string().nullable().describe("所属校区"),
    name: z.string().nullable().describe("姓名"),
    type: z.string().nullable().describe("类型"),
    visitTime: z.string().nullable().describe("刷卡时间"),
});

export const LIBRARY_ACCESS_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的图书馆通行记录。"),
    data: z.object({
        userInfos: z
            .array(LIBRARY_ACCESS_RECORD_SCHEMA)
            .describe("当前授权用户的图书馆通行记录列表。"),
    }).describe("业务响应数据。"),
    sinceVisitNo: z.string().optional().describe("下一页游标，缺失表示上游没有提供。"),
    source: z.literal("Tongji Open Platform").describe("图书馆通行数据来源。"),
    direction: z.string().optional().describe("进出模式，1-进，2-出"),
    visitStartTime: z.string().optional().describe("本次查询指定的开始时间。"),
    visitEndTime: z.string().optional().describe("本次查询指定的结束时间。"),
});
