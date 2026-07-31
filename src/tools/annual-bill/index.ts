import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStatisticsInfoByYear } from "../../integration/tongji_openapi";
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
    AnnualBill,
    AnnualBillData,
    AnnualBillToolResult,
} from "./types";

// ANNUAL_BILL_TOOL_NAME 表示学生年度统计账单查询工具名称。
export const ANNUAL_BILL_TOOL_NAME = "tongji.student.annual_bill";

// ANNUAL_BILL_SCHEMA 表示单条年度统计账单的 MCP 输出结构。
const ANNUAL_BILL_SCHEMA = z.object({
    annualBorrowedTopPct: z
        .number()
        .nullable()
        .describe("借阅图书数量超越全校学生的百分比。"),
    avgDailySpending: z.number().nullable().describe("日均消费金额，单位元。"),
    booksCount: z.number().nullable().describe("年度借阅图书数量。"),
    deptName: z.string().nullable().describe("学生所属学院或部门名称。"),
    earliestEntryTime: z.string().nullable().describe("年度最早入校时间。"),
    latestExitTime: z.string().nullable().describe("年度最晚出校或夜归时间。"),
    libraryAccessCount: z.number().nullable().describe("年度图书馆入馆总次数。"),
    libraryStudyTime: z
        .number()
        .nullable()
        .describe("年度在图书馆学习的总时长，单位小时。"),
    libraryStudyTopPct: z
        .number()
        .nullable()
        .describe("图书馆学习时长超越全校学生的百分比。"),
    maxCumulativeLoc: z
        .string()
        .nullable()
        .describe("年度最常去或累计消费最多的地点。"),
    maxTransactionAmt: z
        .number()
        .nullable()
        .describe("年度单笔最高消费金额，单位元。"),
    maxTransactionLoc: z.string().nullable().describe("年度单笔最高消费地点。"),
    maxTransactionTime: z.string().nullable().describe("年度单笔最高消费发生日期。"),
    name: z.string().nullable().describe("学生姓名，以上游返回内容为准。"),
    shuttleRidesCount: z.number().nullable().describe("跨校区班车乘坐次数。"),
    totalEntries: z.number().nullable().describe("年度进出校总次数。"),
    totalSpendingCanteen: z
        .number()
        .nullable()
        .describe("年度食堂总消费金额，单位元。"),
    year: z.string().nullable().describe("统计年份。"),
});

// ANNUAL_BILL_OUTPUT_SCHEMA 表示学生年度统计账单查询的 MCP 输出结构。
const ANNUAL_BILL_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的年度统计账单。"),
    data: z.object({
        list: z.array(ANNUAL_BILL_SCHEMA).describe("当前授权学生的年度统计账单列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("年度统计账单数据来源。"),
    year: z.string().describe("本次查询指定的统计年份。"),
});

// registerAnnualBillTool 注册学生年度统计账单查询工具。
export const registerAnnualBillTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        ANNUAL_BILL_TOOL_NAME,
        {
            title: "查询学生年度统计账单",
            description: "查询当前已授权学生指定年份的校园年度统计账单。",
            inputSchema: {
                year: z
                    .string()
                    .trim()
                    .min(1)
                    .describe("必填的统计年份，例如 2024。"),
            },
            outputSchema: ANNUAL_BILL_OUTPUT_SCHEMA,
        },
        async ({ year }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getStatisticsInfoByYear(
                    { accessToken },
                    year,
                );
                const data = normalizeAnnualBillData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济年度统计账单服务返回异常，请稍后重试。",
                    );
                }
                const result: AnnualBillToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    year,
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    "同济年度统计账单服务暂时不可用，请稍后重试。",
                );
            }
        },
    );
};

// normalizeAnnualBillData 裁剪并规范化学生年度统计账单业务数据。
const normalizeAnnualBillData = (data: unknown): AnnualBillData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeAnnualBill),
    };
};

// normalizeAnnualBill 裁剪并规范化单条学生年度统计账单。
const normalizeAnnualBill = (bill: unknown): AnnualBill => {
    const source = isRecord(bill) ? bill : {};
    return {
        annualBorrowedTopPct: readNumber(source.annualBorrowedTopPct),
        avgDailySpending: readNumber(source.avgDailySpending),
        booksCount: readNumber(source.booksCount),
        deptName: readString(source.deptName),
        earliestEntryTime: readString(source.earliestEntryTime),
        latestExitTime: readString(source.latestExitTime),
        libraryAccessCount: readNumber(source.libraryAccessCount),
        libraryStudyTime: readNumber(source.libraryStudyTime),
        libraryStudyTopPct: readNumber(source.libraryStudyTopPct),
        maxCumulativeLoc: readString(source.maxCumulativeLoc),
        maxTransactionAmt: readNumber(source.maxTransactionAmt),
        maxTransactionLoc: readString(source.maxTransactionLoc),
        maxTransactionTime: readString(source.maxTransactionTime),
        name: readString(source.name),
        shuttleRidesCount: readNumber(source.shuttleRidesCount),
        totalEntries: readNumber(source.totalEntries),
        totalSpendingCanteen: readNumber(source.totalSpendingCanteen),
        year: readString(source.year),
    };
};
