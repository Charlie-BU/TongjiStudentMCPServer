
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStipendInfo } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    StipendRecord,
    StipendInfoData,
    StipendInfoToolResult,
} from "./types";

// STIPEND_INFO_TOOL_NAME 表示助学金信息查询工具名称。
export const STIPEND_INFO_TOOL_NAME = "tongji.student.stipend-info";

// StipendInfoToolStatus 表示助学金信息查询的结果状态。
// StipendInfoData 表示助学金的脱敏业务数据。
// StipendInfoToolResult 表示助学金信息查询的结构化结果。
// STIPEND_RECORD_SCHEMA 表示单条助学金记录的 MCP 输出结构。
const STIPEND_RECORD_SCHEMA = z.object({
    amount: z.number().nullable().describe("助学金金额。"),
    deptCode: z.string().nullable().describe("所属学院代码。"),
    deptName: z.string().nullable().describe("所属学院名称。"),
    name: z.string().nullable().describe("获得助学金学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    rankName: z.string().nullable().describe("助学金等级名称。"),
    ratingTerm: z.string().nullable().describe("评定学期。"),
    ratingYear: z.string().nullable().describe("评定学年。"),
    stipendName: z.string().nullable().describe("助学金名称。"),
    unitAbbreviation: z.string().nullable().describe("所属单位简称。"),
    updateTime: z.string().nullable().describe("记录更新时间。"),
    userId: z.string().nullable().describe("获得助学金学生学号，已由上游做脱敏处理，不可用于身份验证。"),
    wid: z.string().nullable().describe("助学金记录唯一标识。"),
});

// STIPEND_INFO_OUTPUT_SCHEMA 表示助学金信息查询的 MCP 输出结构。
const STIPEND_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的助学金记录。"),
    data: z.object({
        records: z.array(STIPEND_RECORD_SCHEMA).describe("助学金记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("助学金数据来源。"),
});

// registerStipendInfoTool 注册助学金信息查询工具。
export const registerStipendInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        STIPEND_INFO_TOOL_NAME,
        {
            title: "查询助学金信息",
            description:
                "查询当前已授权学生获得的助学金记录，返回助学金名称、金额、等级、评定学年及学期等信息。",
            inputSchema: {},
            outputSchema: STIPEND_INFO_OUTPUT_SCHEMA,
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
                const response = await getStipendInfo(
                    { accessToken },
                );
                const data = normalizeStipendInfoData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济助学金服务返回异常，请稍后重试。",
                    );
                }
                const result: StipendInfoToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error, { unauthorized: "同济账号授权无效或已过期，请重新完成授权后再试。", upstreamUnavailable: "同济助学金服务暂时不可用，请稍后重试。" });
            }
        },
    );
};

// normalizeStipendInfoData 裁剪并规范化助学金业务数据。
const normalizeStipendInfoData = (data: unknown): StipendInfoData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return { records: [] };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    const records = (data.list as unknown[]).map(normalizeStipendRecord);
    return { records };
};

// normalizeStipendRecord 裁剪并规范化单条助学金记录。
const normalizeStipendRecord = (item: unknown): StipendRecord => {
    const source = isRecord(item) ? item : {};
    return {
        amount: readNumber(source.amount),
        deptCode: readString(source.deptCode),
        deptName: readString(source.deptName),
        name: readString(source.name),
        rankName: readString(source.rankName),
        ratingTerm: readString(source.ratingTerm),
        ratingYear: readString(source.ratingYear),
        stipendName: readString(source.stipendName),
        unitAbbreviation: readString(source.unitAbbreviation),
        updateTime: readString(source.updateTime),
        userId: readString(source.userId),
        wid: readString(source.wid),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: StipendInfoData): boolean =>
    data.records.length === 0;

