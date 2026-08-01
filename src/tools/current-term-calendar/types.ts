export type CurrentTermCalendarToolStatus = "ok" | "empty" | "upstream_unavailable";

export interface CurrentTermCalendar {
    year: number | null;
    term: number | null;
    weekNum: number | null;
    week: number | null;
    simpleName: string | null;
    now: string | null;
    name: string | null;
}

export interface CurrentTermCalendarToolResult {
    [key: string]: unknown;
    status: CurrentTermCalendarToolStatus;
    data: CurrentTermCalendar | null;
    source: "Tongji Open Platform";
}
