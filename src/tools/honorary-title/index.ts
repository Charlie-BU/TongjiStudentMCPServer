import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStudentHonoraryTitles } from "../../integration/tongji_openapi";
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
    HonoraryTitle,
    HonoraryTitleData,
    HonoraryTitleToolResult,
} from "./types";

// HONORARY_TITLE_TOOL_NAME 表示学生荣誉称号查询工具名称。
export const HONORARY_TITLE_TOOL_NAME = "tongji.student.honorary_title";

// HONORARY_TITLE_SCHEMA 表示单条学生荣誉称号记录的 MCP 输出结构。
const HONORARY_TITLE_SCHEMA = z.object({
    deptName: z.string().nullable().describe("获奖人所属学院或部门名称。"),
    honorTitle: z.string().nullable().describe("荣誉称号或奖项名称。"),
    name: z.string().nullable().describe("获奖人姓名，以上游返回内容为准。"),
    ratingYear: z.string().nullable().describe("荣誉称号或奖项的评定年份。"),
});

// HONORARY_TITLE_OUTPUT_SCHEMA 表示学生荣誉称号查询的 MCP 输出结构。
const HONORARY_TITLE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的荣誉称号记录。"),
    data: z.object({
        list: z
            .array(HONORARY_TITLE_SCHEMA)
            .describe("当前授权学生的荣誉称号记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("荣誉称号数据来源。"),
});

// registerHonoraryTitleTool 注册学生荣誉称号查询工具。
export const registerHonoraryTitleTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        HONORARY_TITLE_TOOL_NAME,
        {
            title: "查询学生荣誉称号记录",
            description: "查询当前已授权学生获得荣誉称号的情况信息。",
            inputSchema: {},
            outputSchema: HONORARY_TITLE_OUTPUT_SCHEMA,
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
                const response = await getStudentHonoraryTitles({
                    accessToken,
                });
                const data = normalizeHonoraryTitleData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济荣誉称号服务返回异常，请稍后重试。",
                    );
                }
                const result: HonoraryTitleToolResult = {
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
                    "同济荣誉称号服务暂时不可用，请稍后重试。",
                );
            }
        },
    );
};

// normalizeHonoraryTitleData 裁剪并规范化学生荣誉称号业务数据。
const normalizeHonoraryTitleData = (
    data: unknown,
): HonoraryTitleData => {
    if (!isRecord(data) || !Array.isArray(data.list)) {
        return { list: [] };
    }
    return {
        list: readArray(data.list).map(normalizeHonoraryTitle),
    };
};

// normalizeHonoraryTitle 裁剪并规范化单条荣誉称号记录。
const normalizeHonoraryTitle = (title: unknown): HonoraryTitle => {
    const source = isRecord(title) ? title : {};
    return {
        deptName: readString(source.deptName),
        honorTitle: readString(source.honorTitle),
        name: readString(source.name),
        ratingYear: readString(source.ratingYear),
    };
};
