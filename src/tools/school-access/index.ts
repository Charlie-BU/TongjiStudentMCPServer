import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSchoolAccess } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    SchoolAccessData,
    SchoolAccessRecord,
    SchoolAccessToolResult,
} from "./types";

// SCHOOL_ACCESS_TOOL_NAME 表示校门通行记录查询工具名称。
export const SCHOOL_ACCESS_TOOL_NAME = "tongji.student.school_access";

// SCHOOL_ACCESS_RECORD_SCHEMA 表示单条校门通行记录的 MCP 输出结构。
const SCHOOL_ACCESS_RECORD_SCHEMA = z.object({
    dataTime: z.string().nullable().describe("校门通行时间。"),
    deptName: z.string().nullable().describe("通行人所属学院名称。"),
    equptName: z.string().nullable().describe("校门通行点或设备名称。"),
    lctnName: z.string().nullable().describe("校门通行位置名称。"),
    name: z.string().nullable().describe("通行人姓名，以上游返回内容为准。"),
    portNum: z.string().nullable().describe("进出状态，例如入门或出门。"),
    sex: z.string().nullable().describe("通行人性别。"),
});

// SCHOOL_ACCESS_OUTPUT_SCHEMA 表示校门通行记录查询的 MCP 输出结构。
const SCHOOL_ACCESS_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的校门通行记录。"),
    data: z.object({
        count: z.number().nullable().describe("校门通行记录次数。"),
        userInfos: z
            .array(SCHOOL_ACCESS_RECORD_SCHEMA)
            .describe("当前授权学生的校门通行记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("校门通行数据来源。"),
    portNum: z.string().optional().describe("本次查询指定的进出状态。"),
    dataStartTime: z.string().optional().describe("本次查询指定的开始时间。"),
    dataEndTime: z.string().optional().describe("本次查询指定的结束时间。"),
});

// registerSchoolAccessTool 注册校门通行记录查询工具。
export const registerSchoolAccessTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        SCHOOL_ACCESS_TOOL_NAME,
        {
            title: "查询校门通行记录",
            description:
                "查询当前已授权学生在指定时间范围内的校门进出通行记录。",
            inputSchema: {
                portNum: z
                    .enum(["入门", "出门"])
                    .optional()
                    .describe("可选的进出状态；不传时查询全部通行记录。"),
                dataStartTime: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe("可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"),
                dataEndTime: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe("可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"),
            },
            outputSchema: SCHOOL_ACCESS_OUTPUT_SCHEMA,
        },
        async ({ portNum, dataStartTime, dataEndTime }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getSchoolAccess(
                    { accessToken },
                    portNum,
                    dataStartTime,
                    dataEndTime,
                );
                const data = normalizeSchoolAccessData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济校门通行服务返回异常，请稍后重试。",
                    );
                }
                const result: SchoolAccessToolResult = {
                    status: data.userInfos.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    ...(portNum ? { portNum } : {}),
                    ...(dataStartTime ? { dataStartTime } : {}),
                    ...(dataEndTime ? { dataEndTime } : {}),
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "同济校门通行服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeSchoolAccessData 裁剪并规范化校门通行业务数据。
const normalizeSchoolAccessData = (
    data: unknown,
): SchoolAccessData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        count: readNumber(data.count),
        userInfos: readArray(data.userInfos).map(normalizeSchoolAccessRecord),
    };
};

// normalizeSchoolAccessRecord 裁剪并规范化单条校门通行记录。
const normalizeSchoolAccessRecord = (
    record: unknown,
): SchoolAccessRecord => {
    const source = isRecord(record) ? record : {};
    return {
        dataTime: readString(source.dataTime),
        deptName: readString(source.deptName),
        equptName: readString(source.equptName),
        lctnName: readString(source.lctnName),
        name: readString(source.name),
        portNum: readString(source.portNum),
        sex: readString(source.sex),
    };
};
