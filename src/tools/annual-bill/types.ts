import { ToolStatus } from "../types";

// AnnualBill 表示单条学生年度统计账单记录。
export interface AnnualBill {
    annualBorrowedTopPct: number | null;
    avgDailySpending: number | null;
    booksCount: number | null;
    deptName: string | null;
    earliestEntryTime: string | null;
    latestExitTime: string | null;
    libraryAccessCount: number | null;
    libraryStudyTime: number | null;
    libraryStudyTopPct: number | null;
    maxCumulativeLoc: string | null;
    maxTransactionAmt: number | null;
    maxTransactionLoc: string | null;
    maxTransactionTime: string | null;
    name: string | null;
    shuttleRidesCount: number | null;
    totalEntries: number | null;
    totalSpendingCanteen: number | null;
    year: string | null;
}

// AnnualBillData 表示学生年度统计账单的脱敏业务数据。
export interface AnnualBillData {
    list: AnnualBill[];
}

// AnnualBillToolResult 表示学生年度统计账单查询的结构化结果。
export interface AnnualBillToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: AnnualBillData;
    source: "Tongji Open Platform";
    year: string;
}
