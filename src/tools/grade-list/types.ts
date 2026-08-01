import { ToolStatus } from "../types";

// GradeListData 表示指定学期可用的年级/界别列表。
export interface GradeListData {
    gradeList: number[];
}

// GradeListToolResult 表示年级/界别列表查询的结构化结果。
export interface GradeListToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: GradeListData;
    source: "YourTJ";
    calendarId: number;
}
