export type FindMajorByGradeToolStatus = "ok" | "empty" | "upstream_unavailable";

export interface MajorEntry {
    code: string | null;
    name: string | null;
}

export interface FindMajorByGradeData {
    records: MajorEntry[];
}

export interface FindMajorByGradeToolResult {
    [key: string]: unknown;
    status: FindMajorByGradeToolStatus;
    data: FindMajorByGradeData;
    source: "YourTJ";
}
