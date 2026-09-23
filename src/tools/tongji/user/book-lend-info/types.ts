export type BookLendInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

export interface BookLendRecord {
    asbackDate: string | null;
    asbackTimes: number | null;
    author: string | null;
    callNo: string | null;
    callNoName: string | null;
    countryCode: string | null;
    countryName: string | null;
    debtFlag: number | null;
    deptCode: string | null;
    deptName: string | null;
    docTypeCode: string | null;
    docTypeName: string | null;
    isbn: string | null;
    langCode: string | null;
    langName: string | null;
    lendDate: string | null;
    locationCode: string | null;
    locationName: string | null;
    name: string | null;
    propNo: string | null;
    pubYear: string | null;
    publisher: string | null;
    renewDate: string | null;
    renewTimes: number | null;
    retDate: string | null;
    title: string | null;
    totalLendQty: number | null;
    userId: string | null;
}

export interface BookLendInfoData {
    records: BookLendRecord[];
}

export interface BookLendInfoToolResult {
    [key: string]: unknown;
    status: BookLendInfoToolStatus;
    data: BookLendInfoData;
    source: "Tongji Open Platform";
}
