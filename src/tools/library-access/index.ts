import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getLibraryAccess } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    LibraryAccessData,
    LibraryAccessRecord,
    LibraryAccessToolResult,
} from "./types";

// LIBRARY_ACCESS_TOOL_NAME 表示图书馆通行记录查询工具名称。
export const LIBRARY_ACCESS_TOOL_NAME = "tongji.student.library_access";

// LIBRARY_ACCESS_RECORD_SCHEMA 表示单条图书馆通行记录的 MCP 输出结构。
const LIBRARY_ACCESS_RECORD_SCHEMA = z.object({
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

// LIBRARY_ACCESS_OUTPUT_SCHEMA 表示图书馆通行记录查询的 MCP 输出结构。
const LIBRARY_ACCESS_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的图书馆通行记录。"),
    data: z.object({
        userInfos: z
            .array(LIBRARY_ACCESS_RECORD_SCHEMA)
            .describe("当前授权学生的图书馆通行记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("图书馆通行数据来源。"),
    direction: z.string().optional().describe("本次查询指定的进出方向。"),
    visitStartTime: z.string().optional().describe("本次查询指定的开始时间。"),
    visitEndTime: z.string().optional().describe("本次查询指定的结束时间。"),
});

// registerLibraryAccessTool 注册图书馆通行记录查询工具。
export const registerLibraryAccessTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        LIBRARY_ACCESS_TOOL_NAME,
        {
            title: "查询图书馆通行记录",
            description:
                "查询当前已授权学生在指定时间范围内的图书馆闸机进出记录。",
            inputSchema: {
                direction: z
                    .preprocess(
                        (value) =>
                            typeof value === "number" ? String(value) : value,
                        z.enum(["1", "2"]),
                    )
                    .optional()
                    .describe(
                        "可选的进出方向；支持字符串或整数，1 表示进，2 表示出；不传时查询全部。",
                    ),
                visitStartTime: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe("可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"),
                visitEndTime: z
                    .string()
                    .trim()
                    .min(1)
                    .optional()
                    .describe("可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"),
            },
            outputSchema: LIBRARY_ACCESS_OUTPUT_SCHEMA,
        },
        async ({ direction, visitStartTime, visitEndTime }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getLibraryAccess(
                    { accessToken },
                    direction,
                    visitStartTime,
                    visitEndTime,
                );
                const data = normalizeLibraryAccessData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济图书馆通行服务返回异常，请稍后重试。",
                    );
                }
                const result: LibraryAccessToolResult = {
                    status: data.userInfos.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    ...(direction ? { direction } : {}),
                    ...(visitStartTime ? { visitStartTime } : {}),
                    ...(visitEndTime ? { visitEndTime } : {}),
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "同济图书馆通行服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeLibraryAccessData 裁剪并规范化图书馆通行业务数据。
const normalizeLibraryAccessData = (
    data: unknown,
): LibraryAccessData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.userInfos)) {
        return undefined;
    }
    return {
        userInfos: readArray(data.userInfos).map(normalizeLibraryAccessRecord),
    };
};

// normalizeLibraryAccessRecord 裁剪并规范化单条图书馆通行记录。
const normalizeLibraryAccessRecord = (
    record: unknown,
): LibraryAccessRecord => {
    const source = isRecord(record) ? record : {};
    return {
        deptName: readString(source.deptName),
        direction: readString(source.direction),
        door: readString(source.door),
        libPlace: readString(source.libPlace),
        name: readString(source.name),
        type: readString(source.type),
        visitTime: readString(source.visitTime),
    };
};
