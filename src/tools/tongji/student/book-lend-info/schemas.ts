import { z } from "zod";

export const BOOK_LEND_RECORD_SCHEMA = z.object({
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

export const BOOK_LEND_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的借阅记录。"),
    data: z.object({
        records: z.array(BOOK_LEND_RECORD_SCHEMA).describe("图书借阅记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("图书借阅数据来源。"),
});
