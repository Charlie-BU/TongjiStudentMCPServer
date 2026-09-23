import { BOOK_LEND_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getBookLendInfo } from "../../../../integration/tongji_openapi";
import { isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { BookLendRecord, BookLendInfoData, } from "./types";
// BOOK_LEND_INFO_TOOL_NAME 表示图书借阅信息查询工具名称。
export const BOOK_LEND_INFO_TOOL_NAME = "tongji.user.book-lend-info";
// registerBookLendInfoTool 注册图书借阅信息查询工具。
export const registerBookLendInfoTool = campusTool({
    audience: "user",
    name: BOOK_LEND_INFO_TOOL_NAME,
    title: "查询图书借阅信息",
    description: "查询当前已授权用户的图书借阅记录，返回书名、作者、ISBN、借出日期、应还日期、馆藏地等信息。",
    input: z.object({}).strict(),
    output: BOOK_LEND_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济图书借阅服务返回异常，请稍后重试。", upstreamUnavailable: "同济图书借阅服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getBookLendInfo(config);
    },
    mapResponse: (response) => {
        const data = normalizeBookLendInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof BOOK_LEND_INFO_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
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
const isEmptyData = (data: BookLendInfoData): boolean => data.records.length === 0;
