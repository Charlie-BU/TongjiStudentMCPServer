import { ANNUAL_BILL_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStatisticsInfoByYear } from "../../../../integration/tongji_openapi";
import { isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { AnnualBill, AnnualBillData, } from "./types";
// ANNUAL_BILL_TOOL_NAME 表示学生年度统计账单查询工具名称。
export const ANNUAL_BILL_TOOL_NAME = "tongji.student.annual_bill";
// registerAnnualBillTool 注册学生年度统计账单查询工具。
export const registerAnnualBillTool = campusTool({
    name: ANNUAL_BILL_TOOL_NAME,
    title: "查询学生年度统计账单",
    description: "查询当前已授权学生指定年份的校园年度统计账单。",
    input: z.object({
        year: z
            .preprocess((value) => typeof value === "number" ? String(value) : value, z.string().trim().min(1))
            .describe("必填的统计年份；支持字符串或整数，例如 2024。"),
    }).strict(),
    output: ANNUAL_BILL_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济年度统计账单服务返回异常，请稍后重试。", upstreamUnavailable: "同济年度统计账单服务暂时不可用，请稍后重试。" },
    query: (config, { year }) => {
        return getStatisticsInfoByYear(config, year);
    },
    mapResponse: (response, { year }) => {
        const data = normalizeAnnualBillData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof ANNUAL_BILL_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
            year,
        };
        return result;
    },
}).register;
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
