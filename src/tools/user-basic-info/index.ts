import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUserBasicInfo } from "../../integration/tongji_openapi";
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
    UserBasicInfo,
    UserBasicInfoData,
    UserBasicInfoToolResult,
} from "./types";

// USER_BASIC_INFO_TOOL_NAME 表示人员基础信息查询工具名称。
export const USER_BASIC_INFO_TOOL_NAME = "tongji.user.basic_info";

// USER_BASIC_INFO_SCHEMA 表示单条人员基础信息的 MCP 输出结构。
const USER_BASIC_INFO_SCHEMA = z.object({
    deptName: z.string().nullable().describe("人员所属学院或部门名称。"),
    name: z.string().nullable().describe("人员姓名，以上游返回内容为准。"),
    statusName: z
        .string()
        .nullable()
        .describe("学籍或账号状态，例如有效、毕业或冻结。"),
    userTypeName: z
        .string()
        .nullable()
        .describe("人员或身份类型，例如本科生、硕士研究生或教职工。"),
});

// USER_BASIC_INFO_OUTPUT_SCHEMA 表示人员基础信息查询的 MCP 输出结构。
const USER_BASIC_INFO_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的人员基础信息。"),
    data: z.object({
        list: z
            .array(USER_BASIC_INFO_SCHEMA)
            .describe("当前授权用户可见的人员基础信息记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("人员基础信息数据来源。"),
});

// registerUserBasicInfoTool 注册人员基础信息查询工具。
export const registerUserBasicInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        USER_BASIC_INFO_TOOL_NAME,
        {
            title: "查询人员基础信息",
            description: "查询当前已授权用户可见的人员基础信息。",
            inputSchema: {},
            outputSchema: USER_BASIC_INFO_OUTPUT_SCHEMA,
        },
        async () => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getUserBasicInfo({ accessToken });
                const data = normalizeUserBasicInfoData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济人员基础信息服务返回异常，请稍后重试。",
                    );
                }
                const result: UserBasicInfoToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    "同济人员基础信息服务暂时不可用，请稍后重试。",
                );
            }
        },
    );
};

// normalizeUserBasicInfoData 裁剪并规范化人员基础信息业务数据。
const normalizeUserBasicInfoData = (
    data: unknown,
): UserBasicInfoData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.list)) {
        return undefined;
    }
    return {
        list: readArray(data.list).map(normalizeUserBasicInfo),
    };
};

// normalizeUserBasicInfo 裁剪并规范化单条人员基础信息。
const normalizeUserBasicInfo = (info: unknown): UserBasicInfo => {
    const source = isRecord(info) ? info : {};
    return {
        deptName: readString(source.deptName),
        name: readString(source.name),
        statusName: readString(source.statusName),
        userTypeName: readString(source.userTypeName),
    };
};
