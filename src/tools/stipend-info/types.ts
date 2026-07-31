export type StipendInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

export interface StipendRecord {
    amount: number | null;
    deptCode: string | null;
    deptName: string | null;
    name: string | null;
    rankName: string | null;
    ratingTerm: string | null;
    ratingYear: string | null;
    stipendName: string | null;
    unitAbbreviation: string | null;
    updateTime: string | null;
    userId: string | null;
    wid: string | null;
}

export interface StipendInfoData {
    records: StipendRecord[];
}

export interface StipendInfoToolResult {
    [key: string]: unknown;
    status: StipendInfoToolStatus;
    data: StipendInfoData;
    source: "Tongji Open Platform";
}
