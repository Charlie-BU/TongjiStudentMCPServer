// TermCalendarToolStatus 表示学期日历查询的结果状态。
export type TermCalendarToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// TermCalendar 表示单个学期的日历信息。
export interface TermCalendar {
    id: number | null;
    year: number | null;
    term: number | null;
    beginDay: number | null;
    endDay: number | null;
    weekNum: number | null;
    weekBenginDay: number | null;
    gradePartOne: string | null;
    gradePartTwo: string | null;
    fullName: string | null;
    currentTermFlag: boolean | null;
    nextTermFlag: boolean | null;
    perTerm: string | null;
    perYear: string | null;
}

// TermCalendarData 表示学期日历的脱敏业务数据。
export interface TermCalendarData {
    terms: TermCalendar[];
}

// TermCalendarToolResult 表示学期日历查询的结构化结果。
export interface TermCalendarToolResult {
    [key: string]: unknown;
    status: TermCalendarToolStatus;
    data: TermCalendarData;
    source: "Tongji Open Platform";
}
