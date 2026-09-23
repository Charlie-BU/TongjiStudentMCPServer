import { z } from "zod";

export const SCHOOL_ACCESS_RECORD_SCHEMA = z.object({
    dataTime: z.string().nullable().describe("记录时间；由上游 recordTime 映射为 dataTime。"),
    deptName: z.string().nullable().describe("部门名称"),
    equptName: z.string().nullable().describe("设备名称"),
    lctnName: z.string().nullable().describe("安装位置名称"),
    name: z.string().nullable().describe("姓名"),
    portNum: z.string().nullable().describe("录端口号,1-入门，2-出门"),
    sex: z.string().nullable().describe("性别"),
});

export const SCHOOL_ACCESS_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的校门通行记录。"),
    data: z.object({
        count: z.number().nullable().describe("校门通行记录次数。"),
        userInfos: z
            .array(SCHOOL_ACCESS_RECORD_SCHEMA)
            .describe("当前授权学生的校门通行记录列表。"),
    }).describe("业务响应数据。"),
    sinceCardRecordID: z.string().optional().describe("下一页游标，缺失表示上游没有提供。"),
    source: z.literal("Tongji Open Platform").describe("校门通行数据来源。"),
    portNum: z.string().optional().describe("本次查询指定的进出状态。"),
    dataStartTime: z.string().optional().describe("本次查询指定的开始时间。"),
    dataEndTime: z.string().optional().describe("本次查询指定的结束时间。"),
});
