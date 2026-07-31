
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBookLendInfo } from "../../integration/tongji_openapi";
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
    BookLendRecord,
    BookLendInfoData,
    BookLendInfoToolResult,
} from "./types";

// BOOK_LEND_INFO_TOOL_NAME 表示图书借阅信息查询工具名称。
export const BOOK_LEND_INFO_TOOL_NAME = "tongji.student.book-lend-info";

// BookLendInfoToolStatus 表示图书借阅信息查询的结果状态。
// BookLendInfoData 表示图书借阅的脱敏业务数据。
// BookLendInfoToolResult 表示图书借阅信息查询的结构化结果。
// BOOK_LEND_RECORD_SCHEMA 表示单条图书借阅记录的 MCP 输出结构。
const BOOK_LEND_RECORD_SCHEMA = z.object({
    asbackDate: z.string().nullable().describe("催还日期。"),
    asbackTimes: z.number().nullable().describe("催还次数。"),
    author: z.string().nullable().describe("责任者（作者）。"),
    callNo: z.string().nullable().describe("图书类别代码。"),
    callNoName: z.string().nullable().describe("图书类别名称。"),
    countryCode: z.string().nullable().describe("书籍国别代码。"),
    countryName: z.string().nullable().describe("书籍国别。"),
    debtFlag: z.number().nullable().describe("欠款状态标识。"),
    deptCode: z.string().nullable().describe("读者所属单位代码。"),
    deptName: z.string().nullable().describe("读者所属单位名称。"),
    docTypeCode: z.string().nullable().describe("文献类型代码。"),
    docTypeName: z.string().nullable().describe("文献类型名称。"),
    isbn: z.string().nullable().describe("ISBN 编号。"),
    langCode: z.string().nullable().describe("书籍语种代码。"),
    langName: z.string().nullable().describe("书籍语种名称。"),
    lendDate: z.string().nullable().describe("借出日期。"),
    locationCode: z.string().nullable().describe("馆藏地代码。"),
    locationName: z.string().nullable().describe("馆藏地名称。"),
    name: z.string().nullable().describe("读者姓名，注意该字段未做脱敏处理，不可在公开输出中直接引用。"),
    propNo: z.string().nullable().describe("财产号。"),
    pubYear: z.string().nullable().describe("出版年份。"),
    publisher: z.string().nullable().describe("出版社名称。"),
    renewDate: z.string().nullable().describe("续借日期。"),
    renewTimes: z.number().nullable().describe("续借次数。"),
    retDate: z.string().nullable().describe("实际还书时间。"),
    title: z.string().nullable().describe("题名（书名）。"),
    totalLendQty: z.number().nullable().describe("累计借书次数。"),
    userId: z.string().nullable().describe("学工号，注意该字段未做脱敏处理，不可在公开输出中直接引用。"),
});

// BOOK_LEND_INFO_OUTPUT_SCHEMA 表示图书借阅信息查询的 MCP 输出结构。
const BOOK_LEND_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的借阅记录。"),
    data: z.object({
        records: z.array(BOOK_LEND_RECORD_SCHEMA).describe("图书借阅记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("图书借阅数据来源。"),
});

// registerBookLendInfoTool 注册图书借阅信息查询工具。
export const registerBookLendInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        BOOK_LEND_INFO_TOOL_NAME,
        {
            title: "查询图书借阅信息",
            description:
                "查询当前已授权学生的图书借阅记录，返回书名、作者、ISBN、借出日期、应还日期、馆藏地等信息。",
            inputSchema: {},
            outputSchema: BOOK_LEND_INFO_OUTPUT_SCHEMA,
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
                const response = await getBookLendInfo(
                    { accessToken },
                );
                const data = normalizeBookLendInfoData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济图书借阅服务返回异常，请稍后重试。",
                    );
                }
                const result: BookLendInfoToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error, { unauthorized: "同济账号授权无效或已过期，请重新完成授权后再试。", upstreamUnavailable: "同济图书借阅服务暂时不可用，请稍后重试。" });
            }
        },
    );
};

// normalizeBookLendInfoData 裁剪并规范化图书借阅业务数据。
const normalizeBookLendInfoData = (data: unknown): BookLendInfoData | undefined => {
    if (data === null) {
        return { records: [] };
    }
    if (!Array.isArray(data)) {
        return undefined;
    }
    const records = (data as unknown[]).map(normalizeBookLendRecord);
    return { records };
};

// normalizeBookLendRecord 裁剪并规范化单条图书借阅记录。
const normalizeBookLendRecord = (item: unknown): BookLendRecord => {
    const source = isRecord(item) ? item : {};
    return {
        asbackDate: readString(source.asbackDate),
        asbackTimes: readNumber(source.asbackTimes),
        author: readString(source.author),
        callNo: readString(source.callNo),
        callNoName: readString(source.callNoName),
        countryCode: readString(source.countryCode),
        countryName: readString(source.countryName),
        debtFlag: readNumber(source.debtFlag),
        deptCode: readString(source.deptCode),
        deptName: readString(source.deptName),
        docTypeCode: readString(source.docTypeCode),
        docTypeName: readString(source.docTypeName),
        isbn: readString(source.isbn),
        langCode: readString(source.langCode),
        langName: readString(source.langName),
        lendDate: readString(source.lendDate),
        locationCode: readString(source.locationCode),
        locationName: readString(source.locationName),
        name: readString(source.name),
        propNo: readString(source.propNo),
        pubYear: readString(source.pubYear),
        publisher: readString(source.publisher),
        renewDate: readString(source.renewDate),
        renewTimes: readNumber(source.renewTimes),
        retDate: readString(source.retDate),
        title: readString(source.title),
        totalLendQty: readNumber(source.totalLendQty),
        userId: readString(source.userId),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: BookLendInfoData): boolean =>
    data.records.length === 0;

