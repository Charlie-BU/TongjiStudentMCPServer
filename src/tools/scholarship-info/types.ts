import { ToolStatus } from "../types";

// ScholarshipInfo 表示单条学生奖学金记录。
export interface ScholarshipInfo {
    deptName: string | null;
    name: string | null;
    rating: string | null;
    ratingYear: string | null;
    scholarshipLevel: string | null;
    scholarshipName: string | null;
    updateTime: string | null;
}

// ScholarshipInfoData 表示学生奖学金记录的脱敏业务数据。
export interface ScholarshipInfoData {
    count: number | null;
    list: ScholarshipInfo[];
}

// ScholarshipInfoToolResult 表示学生奖学金查询的结构化结果。
export interface ScholarshipInfoToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: ScholarshipInfoData;
    source: "Tongji Open Platform";
}
