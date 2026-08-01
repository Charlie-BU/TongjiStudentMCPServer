export type CetScoreToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

export interface CetScoreRecord {
    studentId: string | null;
    studentName: string | null;
    competitionType: string | null;
    writtenSubjectName: string | null;
    cardNo: string | null;
    score: string | null;
    scoreRank: string | null;
    oralScore: string | null;
    examTime: string | null;
    cetType: number | null;
}

export interface CetScoreData {
    records: CetScoreRecord[];
}

export interface CetScoreToolResult {
    [key: string]: unknown;
    status: CetScoreToolStatus;
    data: CetScoreData;
    source: "Tongji Open Platform";
}
