import { ToolStatus } from "../types";

// HonoraryTitle 表示单条学生荣誉称号记录。
export interface HonoraryTitle {
    deptName: string | null;
    honorTitle: string | null;
    name: string | null;
    ratingYear: string | null;
}

// HonoraryTitleData 表示学生荣誉称号记录的脱敏业务数据。
export interface HonoraryTitleData {
    list: HonoraryTitle[];
}

// HonoraryTitleToolResult 表示学生荣誉称号查询的结构化结果。
export interface HonoraryTitleToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: HonoraryTitleData;
    source: "Tongji Open Platform";
}
