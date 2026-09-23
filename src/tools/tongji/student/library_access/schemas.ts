import { z } from "zod";

export const LIBRARY_ACCESS_RECORD_SCHEMA = z.object({
    deptName: z.string().nullable().describe("通行人所属学院名称。"),
    direction: z
        .string()
        .nullable()
        .describe("图书馆进出方向，1 表示进，2 表示出。"),
    door: z.string().nullable().describe("图书馆出入口名称。"),
    libPlace: z.string().nullable().describe("图书馆通行地点。"),
    name: z.string().nullable().describe("通行人姓名，以上游返回内容为准。"),
    type: z.string().nullable().describe("通行人身份类型。"),
    visitTime: z.string().nullable().describe("图书馆刷卡通行时间。"),
});

export const LIBRARY_ACCESS_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的图书馆通行记录。"),
    data: z.object({
        userInfos: z
            .array(LIBRARY_ACCESS_RECORD_SCHEMA)
            .describe("当前授权学生的图书馆通行记录列表。"),
    }),
    sinceVisitNo: z.string().optional().describe("下一页游标，缺失表示上游没有提供。"),
    source: z.literal("Tongji Open Platform").describe("图书馆通行数据来源。"),
    direction: z.string().optional().describe("本次查询指定的进出方向。"),
    visitStartTime: z.string().optional().describe("本次查询指定的开始时间。"),
    visitEndTime: z.string().optional().describe("本次查询指定的结束时间。"),
});
