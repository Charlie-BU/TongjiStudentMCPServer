import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStudentScholarshipInfo } from "../../integration/tongji_openapi";
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
    ScholarshipInfo,
    ScholarshipInfoData,
    ScholarshipInfoToolResult,
} from "./types";

// SCHOLARSHIP_INFO_TOOL_NAME 表示学生奖学金查询工具名称。
export const SCHOLARSHIP_INFO_TOOL_NAME = "tongji.student.scholarship_info";

// SCHOLARSHIP_INFO_SCHEMA 表示单条奖学金记录的 MCP 输出结构。
const SCHOLARSHIP_INFO_SCHEMA = z.object({
    deptName: z.string().nullable().describe("获奖学生所属学院名称。"),
    name: z.string().nullable().describe("获奖学生姓名，以上游返回内容为准。"),
    rating: z.string().nullable().describe("奖学金评级，例如校内。"),
    ratingYear: z.string().nullable().describe("奖学金评级年度。"),
    scholarshipLevel: z.string().nullable().describe("奖学金获奖等级。"),
    scholarshipName: z.string().nullable().describe("奖学金奖项名称。"),
    updateTime: z.string().nullable().describe("奖学金记录更新时间。"),
});

// SCHOLARSHIP_INFO_OUTPUT_SCHEMA 表示学生奖学金查询的 MCP 输出结构。
const SCHOLARSHIP_INFO_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的奖学金记录。"),
    data: z.object({
        count: z.number().nullable().describe("奖学金获奖数量。"),
        list: z
            .array(SCHOLARSHIP_INFO_SCHEMA)
            .describe("当前授权学生的奖学金记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("奖学金数据来源。"),
});

// registerScholarshipInfoTool 注册学生奖学金查询工具。
export const registerScholarshipInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        SCHOLARSHIP_INFO_TOOL_NAME,
        {
            title: "查询学生奖学金记录",
            description: "查询当前已授权学生获得奖学金的情况信息。",
            inputSchema: {},
            outputSchema: SCHOLARSHIP_INFO_OUTPUT_SCHEMA,
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
                const response = await getStudentScholarshipInfo({
                    accessToken,
                });
                const data = normalizeScholarshipInfoData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济奖学金服务返回异常，请稍后重试。",
                    );
                }
                const result: ScholarshipInfoToolResult = {
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
                    { upstreamUnavailable: "同济奖学金服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeScholarshipInfoData 裁剪并规范化学生奖学金业务数据。
const normalizeScholarshipInfoData = (
    data: unknown,
): ScholarshipInfoData | undefined => {
    if (!isRecord(data) || !Array.isArray(data.list)) {
        return undefined;
    }
    return {
        count: readNumber(data.count),
        list: readArray(data.list).map(normalizeScholarshipInfo),
    };
};

// normalizeScholarshipInfo 裁剪并规范化单条奖学金记录。
const normalizeScholarshipInfo = (info: unknown): ScholarshipInfo => {
    const source = isRecord(info) ? info : {};
    return {
        deptName: readString(source.deptName),
        name: readString(source.name),
        rating: readString(source.rating),
        ratingYear: readString(source.ratingYear),
        scholarshipLevel: readString(source.scholarshipLevel),
        scholarshipName: readString(source.scholarshipName),
        updateTime: readString(source.updateTime),
    };
};
