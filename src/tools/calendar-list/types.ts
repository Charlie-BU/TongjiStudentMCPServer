import { ToolStatus } from "../types";

// CalendarListItem 表示单个学期选项。
export interface CalendarListItem {
    calendarId: number | null;
    calendarName: string | null;
}

// CalendarListData 表示学期列表查询的脱敏业务数据。
export interface CalendarListData {
    list: CalendarListItem[];
}

// CalendarListToolResult 表示学期列表查询的结构化结果。
export interface CalendarListToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: CalendarListData;
    source: "YourTJ";
}
